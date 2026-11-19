import { ViewportScroller } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CoinDataService } from '../../services/coin-data.service';
import { CollectionService } from '../../services/collection.service';

@Component({
  selector: 'app-collection-stats',
  standalone: true,
  templateUrl: './collection-stats.html',
  styleUrl: './collection-stats.css',
})
export class CollectionStatsComponent {
  protected readonly collectionService = inject(CollectionService);
  protected readonly coinDataService = inject(CoinDataService);
  private readonly viewportScroller = inject(ViewportScroller);

  protected onCountrySelect(select: HTMLSelectElement): void {
    if (select.value) this.viewportScroller.scrollToAnchor(select.value);
    // Back to the placeholder, so picking the same country again still jumps there
    select.value = '';
  }
}
