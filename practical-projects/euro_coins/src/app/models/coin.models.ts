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
