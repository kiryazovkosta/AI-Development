import { CoinDataService } from './coin-data.service';
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Denomination } from '../models/coin.models';
import { generateCoinId } from '../utils/coin.utils';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly authService = inject(AuthService);

  readonly coinDataService = inject(CoinDataService);
  private countries = computed(() => this.coinDataService.countries());
  private denominations = computed(() => this.coinDataService.denominations());

  private readonly ownedCoinsSet = signal<Set<string>>(new Set());
  private readonly syncingSignal = signal<boolean>(false);

  private remoteUnsubscribe: (() => void) | null = null;
  private isLoadingRemote = signal<boolean>(false);

  readonly ownedCoins = computed(() => Array.from(this.ownedCoinsSet()));

  readonly totalCoins = computed(() => this.countries().length * this.denominations().length);

  readonly collectedCount = computed(() => this.ownedCoinsSet().size);

  readonly collectionProgress = computed(() =>
    Math.round((this.collectedCount() / this.totalCoins()) * 100)
  );

  readonly isSyncing = computed(() => this.syncingSignal());

  readonly countryProgress = computed(() => {
    const owned = this.ownedCoinsSet();
    return this.countries().map((country) => ({
      country,
      collected: this.denominations().filter((d) =>
        owned.has(generateCoinId(country.code, d.value))
      ).length,
      total: this.denominations().length,
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
        newSet.delete(coinId);
      } else {
        newSet.add(coinId);
      }
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
