import { Component, inject, input, computed } from '@angular/core';
import { Country } from '../../models/coin.models';
import { CoinCatalogService } from '../../services/coin-catalog.service';
import { CoinDataService } from '../../services/coin-data.service';
import { CollectionService } from '../../services/collection.service';
import { CoinCardComponent } from '../coin-card/coin-card';

@Component({
  selector: 'app-country-section',
  standalone: true,
  imports: [CoinCardComponent],
  templateUrl: './country-section.html',
  styleUrl: './country-section.css'
})
export class CountrySectionComponent {
  readonly country = input.required<Country>();

  protected readonly coinDataService = inject(CoinDataService);
  private readonly collectionService = inject(CollectionService);
  private readonly catalogService = inject(CoinCatalogService);

  protected readonly denominations = computed(() => this.coinDataService.denominations());

  protected readonly collectedForCountry = computed(() => {
    return this.coinDataService.denominations().filter(d =>
      this.collectionService.hasCoin(this.country().code, d.value)
    ).length;
  });

  protected readonly seriesProgress = computed(() => {
    const code = this.country().code;
    let collected = 0;
    let total = 0;
    for (const d of this.coinDataService.denominations()) {
      collected += this.collectionService.countOwnedSeries(code, d.value);
      total += this.catalogService.getCoin(code, d.value)?.series.length ?? 1;
    }
    return { collected, total };
  });
}
