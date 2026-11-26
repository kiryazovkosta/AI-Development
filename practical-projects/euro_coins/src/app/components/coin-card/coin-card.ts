import { Component, inject, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { Denomination } from '../../models/coin.models';
import { CoinCatalogService } from '../../services/coin-catalog.service';
import { CoinDataService } from '../../services/coin-data.service';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-coin-card',
  standalone: true,
  templateUrl: './coin-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './coin-card.css',
})
export class CoinCardComponent {
  readonly countryCode = input.required<string>();
  readonly countryName = input<string>('');
  readonly denomination = input.required<Denomination>();

  private readonly coinDataService = inject(CoinDataService);
  private readonly catalogService = inject(CoinCatalogService);
  private readonly collectionService = inject(CollectionService);

  /** Toggles stay off until the collection is loaded, so nothing can overwrite it */
  protected readonly canEdit = this.collectionService.isReady;

  protected readonly hasManySeries = computed(() => this.seriesCount() > 1);

  /** Some series owned, or the coin was marked before series were tracked */
  protected readonly hasAnySeries = computed(() =>
    this.collectionService.hasCoin(this.countryCode(), this.denomination())
  );

  /** Multi-series coins look owned only once every series is owned */
  protected readonly isOwned = computed(() =>
    this.hasManySeries()
      ? this.ownedSeries() === this.seriesCount()
      : this.collectionService.hasCoin(this.countryCode(), this.denomination())
  );

  protected readonly seriesCount = computed(
    () => this.catalogService.getCoin(this.countryCode(), this.denomination())?.series.length ?? 0
  );

  protected readonly ownedSeries = computed(() =>
    this.collectionService.countOwnedSeries(this.countryCode(), this.denomination())
  );

  protected readonly imageUrl = computed(
    () =>
      this.catalogService.getLatestSeries(this.countryCode(), this.denomination())?.thumb ??
      this.coinDataService.getPlaceholderImageUrl()
  );

  protected readonly denominationLabel = computed(() => {
    const info = this.coinDataService.getDenominationByValue(this.denomination());
    return info?.label ?? this.denomination();
  });

  protected readonly altText = computed(
    () => `${this.countryName() || this.countryCode()} ${this.denominationLabel()} coin`
  );

  protected onToggle(event: Event): void {
    if (this.hasManySeries()) {
      // Series are chosen in the details dialog
      event.preventDefault();
      this.onOpen();
      return;
    }
    this.collectionService.toggleCoin(this.countryCode(), this.denomination());
  }

  protected onOpen(): void {
    this.catalogService.open(this.countryCode(), this.denomination());
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = this.coinDataService.getPlaceholderImageUrl();
    if (!img.src.endsWith(placeholder)) img.src = placeholder;
  }
}
