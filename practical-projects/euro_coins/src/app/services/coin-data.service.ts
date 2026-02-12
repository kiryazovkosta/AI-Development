import { Injectable, inject } from '@angular/core';
import { Country, DenominationInfo, Denomination } from '../models/coin.models';
import { EURO_COUNTRIES, DENOMINATIONS } from '../data/euro-countries.data';
import { collection, collectionData, CollectionReference, Firestore } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoinDataService {
  private readonly firestore = inject(Firestore);
  private readonly countriesCollection = collection(this.firestore, 'countries') as CollectionReference<Country>;
  private readonly denominationsCollection = collection(this.firestore, 'denomination-info') as CollectionReference<DenominationInfo>;
  readonly countries = toSignal(
    collectionData(this.countriesCollection, { idField: 'id' }).pipe(
      map(countries => [...countries].sort((a, b) => a.name.localeCompare(b.name))),
      catchError((err) => {
        return of(EURO_COUNTRIES);
      })
    ),
    { initialValue: EURO_COUNTRIES }
  );
  readonly denominations = toSignal(
    collectionData(this.denominationsCollection, { idField: 'id' }).pipe(
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
