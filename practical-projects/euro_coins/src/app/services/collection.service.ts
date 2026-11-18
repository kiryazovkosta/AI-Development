import { CoinDataService } from './coin-data.service';
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Denomination } from '../models/coin.models';
import { generateCoinId, generateSeriesId, isSeriesId } from '../utils/coin.utils';
import { CoinCatalogService } from './coin-catalog.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly authService = inject(AuthService);

  readonly coinDataService = inject(CoinDataService);
  private readonly catalogService = inject(CoinCatalogService);
  private countries = computed(() => this.coinDataService.countries());
  private denominations = computed(() => this.coinDataService.denominations());

  private readonly ownedCoinsSet = signal<Set<string>>(new Set());
  private readonly syncingSignal = signal<boolean>(false);

  private remoteUnsubscribe: (() => void) | null = null;
  private isLoadingRemote = signal<boolean>(false);

  readonly ownedCoins = computed(() => Array.from(this.ownedCoinsSet()));

  readonly totalCoins = computed(() => this.countries().length * this.denominations().length);

  // The set holds "BE-1e" for a coin (country + denomination) and "BE-1e@2" for one series
  // of a coin that has several. Single-series coins have no series entry: owning the coin
  // means owning its only series.
  readonly collectedCount = computed(
    () => Array.from(this.ownedCoinsSet()).filter((id) => !isSeriesId(id)).length
  );

  readonly collectionProgress = computed(() =>
    Math.round((this.collectedCount() / this.totalCoins()) * 100)
  );

  readonly isSyncing = computed(() => this.syncingSignal());

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
    this.totalSeries() ? Math.round((this.collectedSeriesCount() / this.totalSeries()) * 100) : 0
  );

  readonly countryProgress = computed(() => {
    const owned = this.ownedCoinsSet();
    return this.countries().map((country) => ({
      country,
      collected: this.denominations().filter((d) =>
        owned.has(generateCoinId(country.code, d.value))
      ).length,
      total: this.denominations().length,
      collectedSeries: this.denominations().reduce(
        (sum, d) => sum + this.countOwnedSeries(country.code, d.value),
        0
      ),
      totalSeries: this.denominations().reduce(
        (sum, d) => sum + this.seriesCount(country.code, d.value),
        0
      ),
    }));
  });

  readonly countriesNames = computed(() => this.coinDataService.countries().map(c => c.name));

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.onUserLogin(user.uid);
      } else if (!this.authService.isLoading()) {
        this.onUserLogout();
      }
    });
  
    effect((onCleanup) => {
      const coins = this.ownedCoinsSet();
      const user = this.authService.currentUser();
      if (!this.isLoadingRemote() && user) {
        const timeout = setTimeout(() => this.saveCollection(coins, user.uid), 500);
        onCleanup(() => clearTimeout(timeout));
      }
    });
  }

  hasCoin(countryCode: string, denomination: Denomination): boolean {
    return this.ownedCoinsSet().has(generateCoinId(countryCode, denomination));
  }

  toggleCoin(countryCode: string, denomination: Denomination): void {
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

  // setCoinOwned(countryCode: string, denomination: Denomination, owned: boolean): void {
  //   const coinId = generateCoinId(countryCode, denomination);
  //   this.ownedCoinsSet.update((set) => {
  //     const newSet = new Set(set);
  //     if (owned) {
  //       newSet.add(coinId);
  //     } else {
  //       newSet.delete(coinId);
  //     }
  //     return newSet;
  //   });
  // }

  // clearCollection(): void {
  //   this.ownedCoinsSet.set(new Set());
  // }

  private async onUserLogin(uid: string): Promise<void> {
    this.syncingSignal.set(true);
    this.isLoadingRemote.set(true);
    this.unsubscribeRemote();

    try {
      const { data, error } = await this.supabase
        .from('owned_coins')
        .select('owned_coins')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        this.ownedCoinsSet.set(new Set((data.owned_coins as string[] | null) ?? []));
      }
    } catch (error) {
      console.error('Failed to sync collection with Supabase:', error);
    } finally {
      this.isLoadingRemote.set(false);
      this.syncingSignal.set(false);
    }
  }
  
  private onUserLogout(): void {
    this.unsubscribeRemote();
    this.ownedCoinsSet.set(new Set());
  }

  private unsubscribeRemote(): void {
    if (this.remoteUnsubscribe) {
      this.remoteUnsubscribe();
      this.remoteUnsubscribe = null;
    }
  }

  private async saveCollection(coins: Set<string>, uid: string): Promise<void> {
    try {
      this.syncingSignal.set(true);
      const { error } = await this.supabase.from('owned_coins').upsert({
        user_id: uid,
        owned_coins: Array.from(coins),
        last_updated: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to save collection to Supabase:', error);
    } finally {
      this.syncingSignal.set(false);
    }
  }
}
