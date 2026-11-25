import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommemorativeYear } from '../../models/coin.models';
import { CommemorativeService } from '../../services/commemorative.service';
import { BackToTop } from '../back-to-top/back-to-top';
import { CommemorativeCardComponent } from './commemorative-card';
import { CommemorativeDialogComponent } from './commemorative-dialog';

/** €2 commemorative coins grouped by year, newest first, with the user's own collection */
@Component({
  selector: 'app-commemorative-page',
  standalone: true,
  imports: [CommemorativeCardComponent, CommemorativeDialogComponent, BackToTop],
  templateUrl: './commemorative-page.html',
  styleUrls: [
    '../collection-stats/collection-stats.css',
    '../collection-grid/collection-grid.css',
    '../country-section/country-section.css',
    './commemorative-page.css',
  ],
})
export class CommemorativePageComponent {
  protected readonly service = inject(CommemorativeService);
  private readonly router = inject(Router);

  /** The year picked in the select; the newest year until the user picks one */
  private readonly pickedYear = signal<number | null>(null);

  protected readonly selectedYear = computed<CommemorativeYear | undefined>(
    () => this.service.years().find((y) => y.year === this.pickedYear()) ?? this.service.years().at(0)
  );

  protected readonly selectedYearOwned = computed(() => {
    const year = this.selectedYear();
    return year ? this.service.ownedInYear(year) : 0;
  });

  protected readonly selectedYearProgress = computed(() => {
    const year = this.selectedYear();
    return year?.coins.length
      ? Math.round((this.selectedYearOwned() / year.coins.length) * 100)
      : 0;
  });

  protected onYearSelect(value: string): void {
    const year = Number(value);
    this.pickedYear.set(year);
    this.router.navigate([], { fragment: this.anchor(year) });
  }

  protected anchor(year: number): string {
    return `year-${year}`;
  }
}
