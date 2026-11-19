import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CoinCatalogService } from '../../services/coin-catalog.service';
import { CoinDataService } from '../../services/coin-data.service';
import { CollectionService } from '../../services/collection.service';

/**
 * Full-size view of one coin: every series as a selectable strip, the series' years and
 * design, the ECB description and the owned toggle. Uses the native <dialog> element, which
 * gives focus trapping, Esc to close and a backdrop for free.
 */
@Component({
  selector: 'app-coin-dialog',
  standalone: true,
  templateUrl: './coin-dialog.html',
  styleUrl: './coin-dialog.css',
})
export class CoinDialogComponent {
  private readonly catalogService = inject(CoinCatalogService);
  private readonly coinDataService = inject(CoinDataService);
  private readonly collectionService = inject(CollectionService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly coin = this.catalogService.selectedCoin;
  protected readonly selectedIndex = signal(0);
  protected readonly imageLoaded = signal(false);

  protected readonly series = computed(() => this.coin()?.series ?? []);
  protected readonly current = computed(() => this.series()[this.selectedIndex()]);
  protected readonly hasManySeries = computed(() => this.series().length > 1);

  protected readonly country = computed(() => {
    const code = this.coin()?.countryCode;
    return code ? this.coinDataService.countries().find((c) => c.code === code) : undefined;
  });

  protected readonly flagUrl = computed(() =>
    this.coinDataService.getCountryFlagUrl(this.coin()?.countryCode ?? '')
  );

  protected readonly denominationLabel = computed(() => {
    const value = this.coin()?.denomination;
    return value ? (this.coinDataService.getDenominationByValue(value)?.label ?? value) : '';
  });

  protected readonly issuerDescription = computed(() =>
    this.catalogService.getIssuerDescription(this.coin()?.countryCode ?? '')
  );

  /** Toggles stay off until the collection is loaded, so nothing can overwrite it */
  protected readonly canEdit = this.collectionService.isReady;

  protected readonly isOwned = computed(() => {
    const coin = this.coin();
    return coin ? this.collectionService.hasCoin(coin.countryCode, coin.denomination) : false;
  });

  constructor() {
    // Open/close the native dialog when a coin is selected, starting on the newest series
    effect(() => {
      const coin = this.coin();
      const dialog = this.dialog().nativeElement;
      if (coin) {
        untracked(() => this.select(coin.series.length - 1));
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected select(index: number): void {
    const count = this.series().length;
    if (!count) return;
    const next = (index + count) % count;
    if (next !== this.selectedIndex()) this.imageLoaded.set(false);
    this.selectedIndex.set(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.hasManySeries()) return;
    // Leave arrow keys alone inside the description text and form controls
    const target = event.target as HTMLElement;
    if (target.closest('input, summary')) return;
    if (event.key === 'ArrowRight') {
      this.select(this.selectedIndex() + 1);
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.select(this.selectedIndex() - 1);
      event.preventDefault();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    // A click on the <dialog> itself (not its content) is a click on the backdrop
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected readonly ownedSeriesCount = computed(() => {
    const coin = this.coin();
    return coin ? this.collectionService.countOwnedSeries(coin.countryCode, coin.denomination) : 0;
  });

  protected readonly isCurrentSeriesOwned = computed(() => {
    const coin = this.coin();
    const current = this.current();
    return coin && current
      ? this.collectionService.hasSeries(coin.countryCode, coin.denomination, current.seriesNo)
      : false;
  });

  protected isSeriesOwned(seriesNo: number): boolean {
    const coin = this.coin();
    return coin
      ? this.collectionService.hasSeries(coin.countryCode, coin.denomination, seriesNo)
      : false;
  }

  /** Single-series coins toggle the coin; otherwise the series currently shown */
  protected toggleOwned(): void {
    const coin = this.coin();
    const current = this.current();
    if (coin && current) {
      this.collectionService.toggleSeries(coin.countryCode, coin.denomination, current.seriesNo);
    }
  }

  /** Runs for the close button and for Esc (the dialog's own "close" event) */
  protected close(): void {
    this.catalogService.close();
  }

  protected paragraphs(text: string | null | undefined): string[] {
    return text ? text.split(/\n\s*\n/) : [];
  }
}
