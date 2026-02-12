import { Denomination } from '../models/coin.models';

export function generateCoinId(countryCode: string, denomination: Denomination): string {
  return `${countryCode}-${denomination}`;
}

export function parseCoinId(coinId: string): { countryCode: string; denomination: Denomination } {
  const [countryCode, denomination] = coinId.split('-');
  return { countryCode, denomination: denomination as Denomination };
}
