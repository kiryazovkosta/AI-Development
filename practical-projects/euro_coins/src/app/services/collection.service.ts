import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Denomination } from '../models/coin.models';
import { generateCoinId, generateSeriesId, isSeriesId } from '../utils/coin.utils';
import { AuthService } from './auth.service';
import { CoinCatalogService } from './coin-catalog.service';
import { CoinDataService } from './coin-data.service';
import { SupabaseService } from './supabase.service';

/** Changes are saved this long after the last toggle */
export const SAVE_DEBOUNCE_MS = 500;
/** Waits between attempts when loading the collection fails */
export const LOAD_RETRY_DELAYS_MS = [1000, 2000, 4000];

/** 'load': the collection could not be read. 'save': the latest changes are not stored yet. */
export type SyncError = 'load' | 'save';

interface PendingSave {
  uid: string;
  coins: Set<string>;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly authService = inject(AuthService);
  private readonly coinDataService = inject(CoinDataService);
  private readonly catalogService = inject(CoinCatalogService);
  private readonly document = inject(DOCUMENT);

  private readonly countries = computed(() => this.coinDataService.countries());
  private readonly denominations = computed(() => this.coinDataService.denominations());

  // The set holds "BE-1e" for a coin (country + denomination) and "BE-1e@2" for one series
  // of a coin that has several. Single-series coins have no series entry: owning the coin
  // means owning its only series.
  private readonly ownedCoinsSet = signal<Set<string>>(new Set());

  /**
   * The user whose collection was read from Supabase. Nothing is saved, and the collection
   * can't be edited, until this matches the signed-in user: saving before a successful load
   * would overwrite the stored collection with an empty one.
   */
  private readonly loadedUid = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly syncErrorSignal = signal<SyncError | null>(null);

  /** What Supabase holds for a user, so unchanged collections aren't written again */
  private lastSaved: { uid: string; snapshot: string } | null = null;
  private pendingSave: PendingSave | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** Saves run one at a time, so an older snapshot can never land after a newer one */
  private saveQueue: Promise<void> = Promise.resolve();
  /** Bumped on every login and logout; a load that finds it changed has been superseded */
  private loadGeneration = 0;

  readonly isReady = computed(() => {
    const user = this.authService.currentUser();
    return user !== null && this.loadedUid() === user.uid;
  });
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();
  readonly syncError = this.syncErrorSignal.asReadonly();

  readonly totalCoins = computed(() => this.countries().length * this.denominations().length);

  readonly collectedCount = computed(
    () => Array.from(this.ownedCoinsSet()).filter((id) => !isSeriesId(id)).length
  );

  // Rounded down, so the bar never reads 100% while a coin is still missing
  readonly collectionProgress = computed(() => percent(this.collectedCount(), this.totalCoins()));

  /** Every series of every coin; falls back to one per coin until the catalog is loaded */
  readonly totalSeries = computed(() => {
    const coins = this.catalogService.coins();
    return coins.length
      ? coins.reduce((sum, coin) => sum + coin.series.length, 0)
      : this.totalCoins();
  });

  readonly collectedSeriesCount = computed(() =>
    this.catalogService
      .coins()
      .reduce((sum, coin) => sum + this.countOwnedSeries(coin.countryCode, coin.denomination), 0)
  );

  readonly seriesProgress = computed(() =>
    percent(this.collectedSeriesCount(), this.totalSeries())
  );

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => this.onUserLogin(user.uid));
      } else if (!this.authService.isLoading()) {
        untracked(() => this.onUserLogout());
      }
    });

    effect(() => {
      const coins = this.ownedCoinsSet();
      const user = this.authService.currentUser();
      if (user && this.loadedUid() === user.uid) {
        untracked(() => this.scheduleSave({ uid: user.uid, coins }));
      }
    });

    // Store the last changes before signing out...
    this.authService.onBeforeSignOut(() => this.flush());
    // ...and when the tab, browser or native app goes to the background (it may never return)
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') void this.flush();
    });
  }

  hasCoin(countryCode: string, denomination: Denomination): boolean {
    return this.ownedCoinsSet().has(generateCoinId(countryCode, denomination));
  }

  toggleCoin(countryCode: string, denomination: Denomination): void {
    if (!this.isReady()) return;
    const coinId = generateCoinId(countryCode, denomination);
    this.ownedCoinsSet.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(coinId)) {
        // Not owning the coin means owning none of its series
        newSet.delete(coinId);
        for (const id of set) {
          if (id.startsWith(coinId + '@')) newSet.delete(id);
        }
      } else {
        newSet.add(coinId);
      }
      return newSet;
    });
  }

  seriesCount(countryCode: string, denomination: Denomination): number {
    return this.catalogService.getCoin(countryCode, denomination)?.series.length ?? 1;
  }

  hasSeries(countryCode: string, denomination: Denomination, seriesNo: number): boolean {
    if (this.seriesCount(countryCode, denomination) <= 1) {
      return this.hasCoin(countryCode, denomination);
    }
    return this.ownedCoinsSet().has(generateSeriesId(countryCode, denomination, seriesNo));
  }

  countOwnedSeries(countryCode: string, denomination: Denomination): number {
    const count = this.seriesCount(countryCode, denomination);
    if (count <= 1) return this.hasCoin(countryCode, denomination) ? 1 : 0;
    let owned = 0;
    for (let n = 1; n <= count; n++) {
      if (this.ownedCoinsSet().has(generateSeriesId(countryCode, denomination, n))) owned++;
    }
    return owned;
  }

  /**
   * Multi-series coins are marked per series, from the details dialog only. The coin itself
   * ("BE-1e") counts as owned while at least one of its series is owned.
   */
  toggleSeries(countryCode: string, denomination: Denomination, seriesNo: number): void {
    if (!this.isReady()) return;
    const count = this.seriesCount(countryCode, denomination);
    if (count <= 1) {
      this.toggleCoin(countryCode, denomination);
      return;
    }
    const coinId = generateCoinId(countryCode, denomination);
    const seriesId = generateSeriesId(countryCode, denomination, seriesNo);
    this.ownedCoinsSet.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      let anyOwned = false;
      for (let n = 1; n <= count; n++) {
        if (newSet.has(generateSeriesId(countryCode, denomination, n))) anyOwned = true;
      }
      if (anyOwned) newSet.add(coinId);
      else newSet.delete(coinId);
      return newSet;
    });
  }

  /** Saves any change still waiting for the debounce and resolves once every save is done */
  flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const pending = this.pendingSave;
    this.pendingSave = null;
    if (pending) {
      this.saveQueue = this.saveQueue.then(() => this.save(pending));
    }
    return this.saveQueue;
  }

  /** Tries the failed load or save again */
  retry(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    if (this.syncErrorSignal() === 'load') {
      void this.onUserLogin(user.uid);
    } else if (this.syncErrorSignal() === 'save' && this.isReady()) {
      this.pendingSave = { uid: user.uid, coins: this.ownedCoinsSet() };
      void this.flush();
    }
  }

  private async onUserLogin(uid: string): Promise<void> {
    const generation = ++this.loadGeneration;
    this.cancelPendingSave();
    this.loadedUid.set(null);
    this.ownedCoinsSet.set(new Set());
    this.syncErrorSignal.set(null);
    this.loadingSignal.set(true);

    for (let attempt = 0; ; attempt++) {
      try {
        const { data, error } = await this.supabase
          .from('owned_coins')
          .select('owned_coins')
          .eq('user_id', uid)
          .maybeSingle();
        if (error) throw error;
        if (generation !== this.loadGeneration) return;

        // No row yet means a new user with an empty collection
        const coins = new Set((data?.owned_coins as string[] | null | undefined) ?? []);
        this.lastSaved = { uid, snapshot: snapshotOf(coins) };
        this.ownedCoinsSet.set(coins);
        this.loadedUid.set(uid);
        this.loadingSignal.set(false);
        return;
      } catch (error) {
        if (generation !== this.loadGeneration) return;
        console.error('Failed to load the collection from Supabase:', error);
        if (attempt >= LOAD_RETRY_DELAYS_MS.length) {
          this.syncErrorSignal.set('load');
          this.loadingSignal.set(false);
          return;
        }
        await delay(LOAD_RETRY_DELAYS_MS[attempt]);
        if (generation !== this.loadGeneration) return;
      }
    }
  }

  private onUserLogout(): void {
    this.loadGeneration++;
    this.cancelPendingSave();
    this.loadedUid.set(null);
    this.ownedCoinsSet.set(new Set());
    this.lastSaved = null;
    this.syncErrorSignal.set(null);
    this.loadingSignal.set(false);
  }

  private scheduleSave(pending: PendingSave): void {
    this.pendingSave = pending;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DEBOUNCE_MS);
  }

  private cancelPendingSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.pendingSave = null;
  }

  private async save({ uid, coins }: PendingSave): Promise<void> {
    const snapshot = snapshotOf(coins);
    if (this.lastSaved?.uid === uid && this.lastSaved.snapshot === snapshot) return;

    this.savingSignal.set(true);
    try {
      const { error } = await this.supabase.from('owned_coins').upsert({
        user_id: uid,
        owned_coins: Array.from(coins),
        last_updated: new Date().toISOString(),
      });
      if (error) throw error;
      this.lastSaved = { uid, snapshot };
      if (this.syncErrorSignal() === 'save') this.syncErrorSignal.set(null);
    } catch (error) {
      console.error('Failed to save the collection to Supabase:', error);
      // Only report it while that user is still signed in
      if (this.authService.currentUser()?.uid === uid) this.syncErrorSignal.set('save');
    } finally {
      this.savingSignal.set(false);
    }
  }
}

function snapshotOf(coins: Set<string>): string {
  return Array.from(coins).sort().join(',');
}

function percent(part: number, total: number): number {
  return total ? Math.floor((part / total) * 100) : 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
