import { Component, inject, input, computed } from '@angular/core';
import { Country } from '../../models/coin.models';
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

  protected readonly denominations = computed(() => this.coinDataService.denominations());

  protected readonly collectedForCountry = computed(() => {
    return this.coinDataService.denominations().filter(d =>
      this.collectionService.hasCoin(this.country().code, d.value)
    ).length;
  });
}
