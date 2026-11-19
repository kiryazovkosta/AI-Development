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
