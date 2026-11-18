import { Denomination } from '../models/coin.models';

export function generateCoinId(countryCode: string, denomination: Denomination): string {
  return `${countryCode}-${denomination}`;
}

export function parseCoinId(coinId: string): { countryCode: string; denomination: Denomination } {
  const [countryCode, denomination] = coinId.split('-');
  return { countryCode, denomination: denomination as Denomination };
}

/** Ownership of one series of a multi-series coin, e.g. "BE-1e@2" */
export function generateSeriesId(countryCode: string, denomination: Denomination, seriesNo: number): string {
  return `${generateCoinId(countryCode, denomination)}@${seriesNo}`;
}

export function isSeriesId(id: string): boolean {
  return id.includes('@');
}
