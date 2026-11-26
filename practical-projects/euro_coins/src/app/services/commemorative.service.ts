import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  CommemorativeCatalog,
  CommemorativeCoin,
  CommemorativeYear,
} from '../models/coin.models';
import { AuthService } from './auth.service';
import { LOAD_RETRY_DELAYS_MS, SAVE_DEBOUNCE_MS, SyncError } from './collection.service';
import { SupabaseService } from './supabase.service';

interface PendingSave {
  uid: string;
  coins: Set<string>;
}

const CATALOG_URL = 'assets/commemoratives/catalog.json';

/**
 * €2 commemorative coins: the bundled catalog (grouped by year, newest first) and the signed-in
 * user's own collection, stored as one row per user in the owned_commemoratives table.
 */
@Injectable({
  providedIn: 'root',
})
export class CommemorativeService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  private readonly catalog = signal<CommemorativeCoin[]>([]);
  private readonly ownedSet = signal<Set<string>>(new Set());
  private readonly selectedId = signal<string | null>(null);

  /** The user whose collection is in ownedSet; null until it has loaded */
  private loadedFor = signal<string | null>(null);
  private readonly syncError = signal<SyncError | null>(null);

  /** The latest change not stored yet: waiting for the debounce, or its save failed */
  private pending: PendingSave | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** Saves run one at a time, so an older snapshot can never land after a newer one */
  private saveQueue: Promise<void> = Promise.resolve();
  /** Bumped on every login, logout and retry; a load that finds it changed was superseded */
  private loadGeneration = 0;

  readonly coins = this.catalog.asReadonly();
  readonly error = this.syncError.asReadonly();
  readonly isLoaded = computed(() => this.loadedFor() !== null);

  /** Years newest first; coins keep the ECB order within a year (newest issue first) */
  readonly years = computed<CommemorativeYear[]>(() => {
    const byYear = new Map<number, CommemorativeCoin[]>();
    for (const coin of this.catalog()) {
      const list = byYear.get(coin.year) ?? [];
      list.push(coin);
      byYear.set(coin.year, list);
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, coins]) => ({ year, coins }));
  });

  readonly totalCount = computed(() => this.catalog().length);

  /** Only ids still in the catalog count, so a removed coin never inflates the numbers */
  readonly ownedCount = computed(() => {
    const owned = this.ownedSet();
    return this.catalog().filter((c) => owned.has(c.id)).length;
  });

  readonly progress = computed(() =>
    this.totalCount() ? Math.round((this.ownedCount() / this.totalCount()) * 100) : 0
  );

  readonly selectedCoin = computed(() => {
    const id = this.selectedId();
    return id ? this.catalog().find((c) => c.id === id) : undefined;
  });

  constructor() {
    this.loadCatalog();

    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => void this.loadCollection(user.uid));
      } else if (!this.authService.isLoading()) {
        untracked(() => this.reset());
      }
    });

    // Store the last changes before signing out, and when the app goes to the background
    // (it may never return). Coming back, or back online, tries again what failed.
    this.authService.onBeforeSignOut(() => this.flush());
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') void this.flush();
      else this.retry();
    });
    this.document.defaultView?.addEventListener('online', () => this.retry());
  }

  isOwned(id: string): boolean {
    return this.ownedSet().has(id);
  }

  ownedInYear(year: CommemorativeYear): number {
    const owned = this.ownedSet();
    return year.coins.filter((c) => owned.has(c.id)).length;
  }

  toggle(id: string): void {
    const uid = this.loadedFor();
    // Never write before the user's saved collection has loaded, or it would be overwritten
    if (!uid) return;
    const next = new Set(this.ownedSet());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.ownedSet.set(next);
    this.scheduleSave(uid, next);
  }

  open(id: string): void {
    this.selectedId.set(id);
  }

  close(): void {
    this.selectedId.set(null);
  }

  /** Saves any change still waiting and resolves once every save is done */
  flush(): Promise<void> {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    const pending = this.pending;
    this.pending = null;
    if (pending) this.saveQueue = this.saveQueue.then(() => this.save(pending));
    return this.saveQueue;
  }

  /** Tries a failed load or save again */
  retry(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    if (this.syncError() === 'load') void this.loadCollection(user.uid);
    else if (this.syncError() === 'save') void this.flush();
  }

  private scheduleSave(uid: string, coins: Set<string>): void {
    this.pending = { uid, coins };
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DEBOUNCE_MS);
  }

  private async save(change: PendingSave): Promise<void> {
    try {
      const { error } = await this.supabase.from('owned_commemoratives').upsert({
        user_id: change.uid,
        coin_ids: Array.from(change.coins),
        last_updated: new Date().toISOString(),
      });
      if (error) throw error;
      if (this.loadedFor() === change.uid) this.syncError.set(null);
    } catch (error) {
      console.error('Failed to save commemorative coins:', error);
      if (this.loadedFor() !== change.uid) return;
      // Kept for the next try, unless a newer change already waits
      this.pending ??= change;
      this.syncError.set('save');
    }
  }

  private async loadCollection(uid: string): Promise<void> {
    if (this.loadedFor() === uid) return;
    this.reset();
    const generation = this.loadGeneration;
    for (let attempt = 0; ; attempt++) {
      try {
        const { data, error } = await this.supabase
          .from('owned_commemoratives')
          .select('coin_ids')
          .eq('user_id', uid)
          .maybeSingle();
        if (error) throw error;
        if (generation !== this.loadGeneration) return;
        this.ownedSet.set(new Set((data?.coin_ids as string[] | null | undefined) ?? []));
        this.loadedFor.set(uid);
        return;
      } catch (error) {
        if (generation !== this.loadGeneration) return;
        console.error('Failed to load commemorative coins:', error);
        if (attempt >= LOAD_RETRY_DELAYS_MS.length) {
          this.syncError.set('load');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_DELAYS_MS[attempt]));
        if (generation !== this.loadGeneration) return;
      }
    }
  }

  private reset(): void {
    this.loadGeneration++;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.pending = null;
    this.loadedFor.set(null);
    this.ownedSet.set(new Set());
    this.selectedId.set(null);
    this.syncError.set(null);
  }

  private async loadCatalog(): Promise<void> {
    try {
      const response = await fetch(CATALOG_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.catalog.set(((await response.json()) as CommemorativeCatalog).coins);
    } catch (error) {
      console.error('Failed to load the commemorative coins catalog:', error);
    }
  }
}
