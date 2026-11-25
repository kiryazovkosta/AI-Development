export type Denomination = '1c' | '2c' | '5c' | '10c' | '20c' | '50c' | '1e' | '2e';

export interface DenominationInfo {
  id: string,
  value: Denomination;
  label: string;
  sortOrder: number;
  valueInCents: number;
}

export interface Country {
  id: string,
  code: string;
  name: string;
  joinYear: number;
}

export interface CollectionState {
  ownedCoins: string[];
  lastUpdated: string;
}

export interface CollectedCoins {
  country: string;
  coins: string[];
}

export interface OwnedCoins {
  collected: CollectedCoins[];
}

export interface CoinSeries {
  seriesNo: number;
  years: string;
  startYear: number;
  design: string;
  image: string;
  thumb: string;
}

export interface CoinDetail {
  label: string;
  value: string;
}

export interface CoinInfo {
  countryCode: string;
  denomination: Denomination;
  description: string | null;
  details: CoinDetail[];
  /** Ordered oldest to newest */
  series: CoinSeries[];
}

export interface CoinCatalog {
  issuers: Record<string, string | null>;
  coins: CoinInfo[];
}

export interface SelectedCoin {
  countryCode: string;
  denomination: Denomination;
}

/** One €2 commemorative coin. Each country's version of a joint issue is its own coin. */
export interface CommemorativeCoin {
  /** Stable id stored in the user's collection, e.g. "2025-mc-marquisat-des-baux" */
  id: string;
  year: number;
  countryCode: string;
  country: string;
  feature: string;
  issuingDate: string | null;
  issuingVolume: string | null;
  description: string | null;
  joint: boolean;
  image: string;
  thumb: string;
}

export interface CommemorativeCatalog {
  coins: CommemorativeCoin[];
}

export interface CommemorativeYear {
  year: number;
  coins: CommemorativeCoin[];
}
