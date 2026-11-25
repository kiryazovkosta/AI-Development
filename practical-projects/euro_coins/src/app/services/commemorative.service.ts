import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  CommemorativeCatalog,
  CommemorativeCoin,
  CommemorativeYear,
} from '../models/coin.models';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

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

  private readonly catalog = signal<CommemorativeCoin[]>([]);
  private readonly ownedSet = signal<Set<string>>(new Set());
  private readonly selectedId = signal<string | null>(null);

  /** The user whose collection is in ownedSet; null until it has loaded */
  private loadedFor = signal<string | null>(null);
  private readonly syncError = signal<string | null>(null);

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
        untracked(() => this.loadCollection(user.uid));
      } else if (!this.authService.isLoading()) {
        this.loadedFor.set(null);
        this.ownedSet.set(new Set());
        this.selectedId.set(null);
      }
    });
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

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleSave(uid: string, coins: Set<string>): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(uid, coins), 500);
  }

  private async save(uid: string, coins: Set<string>): Promise<void> {
    const { error } = await this.supabase.from('owned_commemoratives').upsert({
      user_id: uid,
      coin_ids: Array.from(coins),
      last_updated: new Date().toISOString(),
    });
    if (error) {
      console.error('Failed to save commemorative coins:', error);
      this.syncError.set('Your changes could not be saved. Please try again later.');
    } else {
      this.syncError.set(null);
    }
  }

  private async loadCollection(uid: string): Promise<void> {
    if (this.loadedFor() === uid) return;
    const { data, error } = await this.supabase
      .from('owned_commemoratives')
      .select('coin_ids')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) {
      console.error('Failed to load commemorative coins:', error);
      this.syncError.set('Your commemorative coins could not be loaded.');
      return;
    }
    this.syncError.set(null);
    this.ownedSet.set(new Set((data?.coin_ids as string[] | null) ?? []));
    this.loadedFor.set(uid);
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
