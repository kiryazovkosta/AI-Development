import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CoinDataService } from '../../services/coin-data.service';
import { CommemorativeService } from '../../services/commemorative.service';

/** Full-size view of one commemorative coin with its ECB details and the owned toggle */
@Component({
  selector: 'app-commemorative-dialog',
  standalone: true,
  templateUrl: './commemorative-dialog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../coin-dialog/coin-dialog.css', './commemorative-dialog.css'],
})
export class CommemorativeDialogComponent {
  protected readonly service = inject(CommemorativeService);
  private readonly coinDataService = inject(CoinDataService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly coin = this.service.selectedCoin;
  protected readonly imageLoaded = signal(false);

  protected readonly flagUrl = computed(() =>
    this.coinDataService.getCountryFlagUrl(this.coin()?.countryCode ?? '')
  );

  protected readonly isOwned = computed(() => {
    const coin = this.coin();
    return coin ? this.service.isOwned(coin.id) : false;
  });

  constructor() {
    effect(() => {
      const coin = this.coin();
      const dialog = this.dialog().nativeElement;
      if (coin) {
        this.imageLoaded.set(false);
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected toggleOwned(): void {
    const coin = this.coin();
    if (coin) this.service.toggle(coin.id);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected close(): void {
    this.service.close();
  }
}
