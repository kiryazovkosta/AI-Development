import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DENOMINATIONS, EURO_COUNTRIES } from '../data/euro-countries.data';
import { CoinInfo, Denomination } from '../models/coin.models';
import { AuthService, AuthUser } from './auth.service';
import { CoinCatalogService } from './coin-catalog.service';
import { CoinDataService } from './coin-data.service';
import { CollectionService, LOAD_RETRY_DELAYS_MS, SAVE_DEBOUNCE_MS } from './collection.service';
import { SupabaseService } from './supabase.service';

interface LoadResult {
  data: { owned_coins: string[] } | null;
  error: unknown;
}
interface UpsertRow {
  user_id: string;
  owned_coins: string[];
}
interface UpsertResult {
  error: unknown;
}

const USER: AuthUser = { uid: 'user-1', email: 'collector@example.com' };

// Belgium's €1 has three series; every other coin has one
const BE_1E: CoinInfo = {
  countryCode: 'BE',
  denomination: '1e',
  description: null,
  details: [],
  series: [1, 2, 3].map((n) => ({
    seriesNo: n,
    years: '',
    startYear: 2000 + n,
    design: '',
    image: '',
    thumb: '',
  })),
};

/** Lets pending promise callbacks run; jasmine.clock() only fakes timers */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe('CollectionService', () => {
  let service: CollectionService;
  let currentUser: WritableSignal<AuthUser | null>;
  let load: jasmine.Spy<() => Promise<LoadResult>>;
  let upsert: jasmine.Spy<(row: UpsertRow) => Promise<UpsertResult>>;
  let beforeSignOut: (() => Promise<void>) | undefined;

  beforeEach(() => {
    jasmine.clock().install();
    spyOn(console, 'error');

    currentUser = signal<AuthUser | null>(null);
    load = jasmine.createSpy('load').and.resolveTo({ data: null, error: null });
    upsert = jasmine.createSpy('upsert').and.resolveTo({ error: null });
    beforeSignOut = undefined;

    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => load() }) }),
        upsert: (row: UpsertRow) => upsert(row),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SupabaseService, useValue: { client } },
        {
          provide: AuthService,
          useValue: {
            currentUser,
            isLoading: signal(false),
            onBeforeSignOut: (task: () => Promise<void>) => (beforeSignOut = task),
          },
        },
        {
          provide: CoinDataService,
          useValue: { countries: signal(EURO_COUNTRIES), denominations: signal(DENOMINATIONS) },
        },
        {
          provide: CoinCatalogService,
          useValue: {
            coins: signal([BE_1E]),
            getCoin: (countryCode: string, denomination: Denomination) =>
              countryCode === 'BE' && denomination === '1e' ? BE_1E : undefined,
          },
        },
      ],
    });
    service = TestBed.inject(CollectionService);
  });

  afterEach(() => jasmine.clock().uninstall());

  async function signIn(): Promise<void> {
    currentUser.set(USER);
    TestBed.tick();
    await settle();
  }

  /** Runs effects, then lets the save debounce run out */
  async function afterDebounce(): Promise<void> {
    TestBed.tick();
    jasmine.clock().tick(SAVE_DEBOUNCE_MS);
    await settle();
  }

  function lastSavedCoins(): string[] {
    return [...upsert.calls.mostRecent().args[0].owned_coins].sort();
  }

  describe('loading', () => {
    it('never saves, and blocks edits, when the collection cannot be loaded', async () => {
      load.and.resolveTo({ data: null, error: new Error('network down') });

      await signIn();
      for (const ms of LOAD_RETRY_DELAYS_MS) {
        jasmine.clock().tick(ms);
        await settle();
      }

      expect(load).toHaveBeenCalledTimes(LOAD_RETRY_DELAYS_MS.length + 1);
      expect(service.syncError()).toBe('load');
      expect(service.isReady()).toBeFalse();

      service.toggleCoin('AT', '1c');
      await afterDebounce();

      expect(service.hasCoin('AT', '1c')).toBeFalse();
      expect(upsert).not.toHaveBeenCalled();
    });

    it('retries a failed load and recovers', async () => {
      load.and.returnValues(
        Promise.resolve({ data: null, error: new Error('blip') }),
        Promise.resolve({ data: { owned_coins: ['AT-1c'] }, error: null })
      );

      await signIn();
      expect(service.isReady()).toBeFalse();

      jasmine.clock().tick(LOAD_RETRY_DELAYS_MS[0]);
      await settle();

      expect(service.isReady()).toBeTrue();
      expect(service.syncError()).toBeNull();
      expect(service.hasCoin('AT', '1c')).toBeTrue();
    });

    it('does not write back the collection it just loaded', async () => {
      load.and.resolveTo({ data: { owned_coins: ['AT-1c', 'BE-1e@2'] }, error: null });

      await signIn();
      await afterDebounce();

      expect(service.isReady()).toBeTrue();
      expect(upsert).not.toHaveBeenCalled();
    });

    it('clears the collection on sign-out', async () => {
      load.and.resolveTo({ data: { owned_coins: ['AT-1c'] }, error: null });
      await signIn();

      currentUser.set(null);
      TestBed.tick();

      expect(service.isReady()).toBeFalse();
      expect(service.hasCoin('AT', '1c')).toBeFalse();
    });
  });

  describe('saving', () => {
    it('saves changes once, after the debounce', async () => {
      await signIn();

      service.toggleCoin('AT', '1c');
      service.toggleCoin('AT', '2c');
      TestBed.tick();
      jasmine.clock().tick(SAVE_DEBOUNCE_MS - 1);
      await settle();
      expect(upsert).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      await settle();
      expect(upsert).toHaveBeenCalledTimes(1);
      expect(upsert.calls.mostRecent().args[0].user_id).toBe(USER.uid);
      expect(lastSavedCoins()).toEqual(['AT-1c', 'AT-2c']);
    });

    it('saves a pending change right away before sign-out', async () => {
      await signIn();

      service.toggleCoin('AT', '1c');
      TestBed.tick();
      expect(beforeSignOut).toBeDefined();
      await beforeSignOut!();

      expect(upsert).toHaveBeenCalledTimes(1);
      expect(lastSavedCoins()).toEqual(['AT-1c']);
    });

    it('never has two saves in flight, and the newest state lands last', async () => {
      let finishFirst!: (result: UpsertResult) => void;
      upsert.and.returnValues(
        new Promise<UpsertResult>((resolve) => (finishFirst = resolve)),
        Promise.resolve({ error: null })
      );
      await signIn();

      service.toggleCoin('AT', '1c');
      await afterDebounce();
      service.toggleCoin('AT', '2c');
      await afterDebounce();
      expect(upsert).toHaveBeenCalledTimes(1);

      finishFirst({ error: null });
      await settle();

      expect(upsert).toHaveBeenCalledTimes(2);
      expect(lastSavedCoins()).toEqual(['AT-1c', 'AT-2c']);
    });

    it('reports a failed save and saves again on retry', async () => {
      upsert.and.returnValues(
        Promise.resolve({ error: new Error('down') }),
        Promise.resolve({ error: null })
      );
      await signIn();

      service.toggleCoin('AT', '1c');
      await afterDebounce();
      expect(service.syncError()).toBe('save');

      service.retry();
      await settle();

      expect(upsert).toHaveBeenCalledTimes(2);
      expect(lastSavedCoins()).toEqual(['AT-1c']);
      expect(service.syncError()).toBeNull();
    });
  });

  describe('series', () => {
    it('unmarking a coin unmarks every series of it', async () => {
      load.and.resolveTo({ data: { owned_coins: ['BE-1e', 'BE-1e@1', 'BE-1e@3'] }, error: null });
      await signIn();
      expect(service.countOwnedSeries('BE', '1e')).toBe(2);

      service.toggleCoin('BE', '1e');

      expect(service.hasCoin('BE', '1e')).toBeFalse();
      expect(service.countOwnedSeries('BE', '1e')).toBe(0);
    });

    it('counts a coin as owned while any of its series is owned', async () => {
      await signIn();

      service.toggleSeries('BE', '1e', 2);
      expect(service.hasCoin('BE', '1e')).toBeTrue();
      expect(service.hasSeries('BE', '1e', 2)).toBeTrue();
      expect(service.hasSeries('BE', '1e', 1)).toBeFalse();
      expect(service.collectedSeriesCount()).toBe(1);

      service.toggleSeries('BE', '1e', 2);
      expect(service.hasCoin('BE', '1e')).toBeFalse();
    });
  });

  describe('progress', () => {
    it('rounds down, so 199 of 200 coins is 99%', async () => {
      const allCoins = EURO_COUNTRIES.flatMap((c) => DENOMINATIONS.map((d) => `${c.code}-${d.value}`));
      load.and.resolveTo({ data: { owned_coins: allCoins.slice(0, 199) }, error: null });

      await signIn();

      expect(service.totalCoins()).toBe(200);
      expect(service.collectedCount()).toBe(199);
      expect(service.collectionProgress()).toBe(99);
    });
  });
});
