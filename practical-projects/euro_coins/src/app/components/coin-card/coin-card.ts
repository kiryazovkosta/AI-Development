import { Component, inject, input, computed } from '@angular/core';
import { Denomination } from '../../models/coin.models';
import { CoinDataService } from '../../services/coin-data.service';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-coin-card',
  standalone: true,
  templateUrl: './coin-card.html',
  styleUrl: './coin-card.css'
})
export class CoinCardComponent {
  readonly countryCode = input.required<string>();
  readonly denomination = input.required<Denomination>();

  private readonly coinDataService = inject(CoinDataService);
  private readonly collectionService = inject(CollectionService);

  protected readonly isOwned = computed(() =>
    this.collectionService.hasCoin(this.countryCode(), this.denomination())
  );

  protected readonly imageUrl = computed(() =>
    this.coinDataService.getCoinImageUrl(this.countryCode(), this.denomination())
  );

  protected readonly altText = computed(() =>
    `${this.countryCode()} ${this.denomination()} coin`
  );

  protected readonly denominationLabel = computed(() => {
    const info = this.coinDataService.getDenominationByValue(this.denomination());
    return info?.label ?? this.denomination();
  });

  protected onToggle(): void {
    this.collectionService.toggleCoin(this.countryCode(), this.denomination());
  }

  protected onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/coins/placeholder.svg';
  }
}
