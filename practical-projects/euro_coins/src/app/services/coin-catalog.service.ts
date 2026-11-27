import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CoinCatalog,
  CoinInfo,
  CoinSeries,
  Denomination,
  SelectedCoin,
} from '../models/coin.models';
import { generateCoinId } from '../utils/coin.utils';
import { SupabaseService } from './supabase.service';

const FALLBACK_CATALOG_URL = 'assets/coins/catalog.json';

/** Images uploaded from the admin form live in Supabase Storage and have absolute URLs */
const isRemote = (path: string): boolean => /^https?:\/\//i.test(path);

interface SeriesRow {
  series_no: number;
  years: string;
  start_year: number;
  design: string;
  image_path: string;
  thumb_path: string;
}

interface DesignRow {
  country_code: string;
  denomination: Denomination;
  description: string | null;
  details: CoinInfo['details'] | null;
  coin_series: SeriesRow[] | null;
}

/**
 * Coin descriptions and every national-side series per country and denomination.
 * Reads the coin_designs / coin_series / coin_issuers tables and falls back to the
 * bundled catalog.json until the migration has been applied (or if Supabase is down).
 *
 * Series added from the admin form point at Supabase Storage. Once scripts/sync-coin-images.mjs
 * has copied them into the bundle, the bundled file is used instead, so they also show offline.
 */
@Injectable({
  providedIn: 'root',
})
export class CoinCatalogService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly catalog = signal<CoinCatalog | null>(null);
  private readonly selectedSignal = signal<SelectedCoin | null>(null);

  private readonly coinsById = computed(() => {
    const map = new Map<string, CoinInfo>();
    for (const coin of this.catalog()?.coins ?? []) {
      map.set(generateCoinId(coin.countryCode, coin.denomination), coin);
    }
    return map;
  });

  readonly coins = computed(() => this.catalog()?.coins ?? []);

  /** The coin shown in the details dialog, or null when it is closed */
  readonly selected = this.selectedSignal.asReadonly();

  readonly selectedCoin = computed(() => {
    const selected = this.selectedSignal();
    return selected ? this.getCoin(selected.countryCode, selected.denomination) : undefined;
  });

  constructor() {
    this.load();
  }

  getCoin(countryCode: string, denomination: Denomination): CoinInfo | undefined {
    return this.coinsById().get(generateCoinId(countryCode, denomination));
  }

  /** The newest series, used as the coin's picture in the grid */
  getLatestSeries(countryCode: string, denomination: Denomination): CoinSeries | undefined {
    return this.getCoin(countryCode, denomination)?.series.at(-1);
  }

  getIssuerDescription(countryCode: string): string | null {
    return this.catalog()?.issuers[countryCode] ?? null;
  }

  open(countryCode: string, denomination: Denomination): void {
    this.selectedSignal.set({ countryCode, denomination });
  }

  close(): void {
    this.selectedSignal.set(null);
  }

  /** Loads the catalog again, e.g. after an administrator added a series */
  reload(): Promise<void> {
    return this.load();
  }

  private async load(): Promise<void> {
    const bundled = this.loadBundled();
    try {
      const catalog = await this.loadFromSupabase();
      if (catalog) {
        this.catalog.set(preferBundledImages(catalog, await bundled.catch(() => null)));
        return;
      }
    } catch (error) {
      console.warn('Coin catalog unavailable in Supabase, using the bundled copy:', error);
    }
    try {
      this.catalog.set(await bundled);
    } catch (error) {
      console.error('Failed to load the coin catalog:', error);
    }
  }

  private async loadBundled(): Promise<CoinCatalog> {
    const response = await fetch(FALLBACK_CATALOG_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as CoinCatalog;
  }

  private async loadFromSupabase(): Promise<CoinCatalog | null> {
    const [designs, issuers] = await Promise.all([
      this.supabase
        .from('coin_designs')
        .select(
          'country_code, denomination, description, details, coin_series(series_no, years, start_year, design, image_path, thumb_path)'
        ),
      this.supabase.from('coin_issuers').select('country_code, description'),
    ]);
    if (designs.error) throw designs.error;
    if (issuers.error) throw issuers.error;
    // Tables start empty until the migration's seed has run
    if (!designs.data?.length) return null;

    return {
      issuers: Object.fromEntries(
        (issuers.data ?? []).map((row) => [row.country_code as string, row.description as string | null])
      ),
      coins: (designs.data as DesignRow[]).map((row) => ({
        countryCode: row.country_code,
        denomination: row.denomination,
        description: row.description,
        details: row.details ?? [],
        series: [...(row.coin_series ?? [])]
          .sort((a, b) => a.series_no - b.series_no)
          .map((s) => ({
            seriesNo: s.series_no,
            years: s.years,
            startYear: s.start_year,
            design: s.design,
            image: s.image_path,
            thumb: s.thumb_path,
          })),
      })),
    };
  }
}

/** Swaps Storage URLs for the bundled copies of the same series, where the bundle has them */
export function preferBundledImages(catalog: CoinCatalog, bundled: CoinCatalog | null): CoinCatalog {
  if (!bundled) return catalog;
  const local = new Map<string, CoinSeries>();
  for (const coin of bundled.coins) {
    for (const s of coin.series) {
      if (!isRemote(s.image)) local.set(`${coin.countryCode}-${coin.denomination}@${s.seriesNo}`, s);
    }
  }
  return {
    ...catalog,
    coins: catalog.coins.map((coin) => ({
      ...coin,
      series: coin.series.map((s) => {
        const copy = isRemote(s.image)
          ? local.get(`${coin.countryCode}-${coin.denomination}@${s.seriesNo}`)
          : undefined;
        return copy ? { ...s, image: copy.image, thumb: copy.thumb } : s;
      }),
    })),
  };
}
