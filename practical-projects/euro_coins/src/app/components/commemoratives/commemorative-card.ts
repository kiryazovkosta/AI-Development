import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommemorativeCoin } from '../../models/coin.models';
import { CoinDataService } from '../../services/coin-data.service';
import { CommemorativeService } from '../../services/commemorative.service';

/** A commemorative coin in the year grid: image opens the details, the checkbox marks it owned */
@Component({
  selector: 'app-commemorative-card',
  standalone: true,
  templateUrl: './commemorative-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../coin-card/coin-card.css', './commemorative-card.css'],
})
export class CommemorativeCardComponent {
  readonly coin = input.required<CommemorativeCoin>();

  private readonly service = inject(CommemorativeService);
  private readonly coinDataService = inject(CoinDataService);

  protected readonly isOwned = computed(() => this.service.isOwned(this.coin().id));
  protected readonly canToggle = this.service.isLoaded;

  protected readonly altText = computed(
    () => `${this.coin().country} €2 ${this.coin().year}: ${this.coin().feature}`
  );

  protected onToggle(): void {
    this.service.toggle(this.coin().id);
  }

  protected onOpen(): void {
    this.service.open(this.coin().id);
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = this.coinDataService.getPlaceholderImageUrl();
    if (!img.src.endsWith(placeholder)) img.src = placeholder;
  }
}
