import { Injectable, inject } from '@angular/core';
import { Country, DenominationInfo, Denomination } from '../models/coin.models';
import { EURO_COUNTRIES, DENOMINATIONS } from '../data/euro-countries.data';
import { SupabaseService } from './supabase.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, from, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoinDataService {
  private readonly supabase = inject(SupabaseService).client;
  readonly countries = toSignal(
    from(this.supabase.from('countries').select('id, code, name, joinYear:join_year')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        // Tables start empty; fall back to the bundled data until they are seeded
        return data?.length ? (data as Country[]) : EURO_COUNTRIES;
      }),
      map(countries => [...countries].sort((a, b) => a.name.localeCompare(b.name))),
      catchError((err) => {
        return of(EURO_COUNTRIES);
      })
    ),
    { initialValue: EURO_COUNTRIES }
  );
  readonly denominations = toSignal(
    from(
      this.supabase
        .from('denomination_info')
        .select('id, value, label, sortOrder:sort_order, valueInCents:value_in_cents')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data?.length ? (data as DenominationInfo[]) : DENOMINATIONS;
      }),
      map(denoms => [...denoms].sort((a, b) => a.sortOrder - b.sortOrder)),
      catchError((err) => {
        return of(DENOMINATIONS);
      })
    ),
    { initialValue: DENOMINATIONS }
  )

  getCoinImageUrl(countryCode: string, denomination: Denomination): string {
    return `assets/coins/${countryCode.toLowerCase()}/${denomination}.png`;
  }

  getPlaceholderImageUrl(denomination: Denomination): string {
    return `assets/coins/placeholder.svg`;
  }

  getCountryFlagUrl(countryCode: string): string {
    if (!countryCode) return '';
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  }

  getCountryByCode(code: string): Country | undefined {
    return EURO_COUNTRIES.find(c => c.code === code);
  }

  getDenominationByValue(value: Denomination): DenominationInfo | undefined {
    return this.denominations().find(d => d.value === value);
  }
}
