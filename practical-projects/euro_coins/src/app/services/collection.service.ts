import { CoinDataService } from './coin-data.service';
import { Injectable, signal, computed, inject, effect, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Denomination } from '../models/coin.models';
import { generateCoinId } from '../utils/coin.utils';
import { AuthService } from './auth.service';
import { Firestore, doc, getDoc, setDoc, Unsubscribe } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(EnvironmentInjector);

  readonly coinDataService = inject(CoinDataService);
  private countries = computed(() => this.coinDataService.countries());
  private denominations = computed(() => this.coinDataService.denominations());

  private readonly ownedCoinsSet = signal<Set<string>>(new Set());
  private readonly syncingSignal = signal<boolean>(false);

  private firestoreUnsubscribe: Unsubscribe | null = null;
  private isLoadingFromFirestore = signal<boolean>(false);

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
      if (!this.isLoadingFromFirestore() && user) {
        const timeout = setTimeout(() => this.saveToFirestore(coins, user.uid), 500);
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
    this.isLoadingFromFirestore.set(true);
    this.unsubscribeFirestore();

    try {
      const userDocRef = runInInjectionContext(this.injector, () =>
        doc(this.firestore, 'owned-coins', uid)
      );
      const snapshot = await runInInjectionContext(this.injector, () =>
        getDoc(userDocRef)
      );

      if (snapshot.exists()) {
        const data = snapshot.data() as { ownedCoins?: string[] };
        this.ownedCoinsSet.set(new Set(data['ownedCoins'] ?? []));
      }
    } catch (error) {
      console.error('Failed to sync collection with Firestore:', error);
    } finally {
      this.isLoadingFromFirestore.set(false);
      this.syncingSignal.set(false);
    }
  }
  
  private onUserLogout(): void {
    this.unsubscribeFirestore();
    this.ownedCoinsSet.set(new Set());
  }
  
  private unsubscribeFirestore(): void {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }
  }
  
  private async saveToFirestore(coins: Set<string>, uid: string): Promise<void> {
    try {
      this.syncingSignal.set(true);
      const userDocRef = runInInjectionContext(this.injector, () =>
        doc(this.firestore, 'owned-coins', uid)
      );
      await runInInjectionContext(this.injector, () =>
        setDoc(userDocRef, {
          ownedCoins: Array.from(coins),
          lastUpdated: new Date(),
        })
      );
    } catch (error) {
      console.error('Failed to save collection to Firestore:', error);
    } finally {
      this.syncingSignal.set(false);
    }
  }
}
