import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  form,
  max,
  maxLength,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Denomination } from '../../models/coin.models';
import { CoinAdminError, CoinAdminService } from '../../services/coin-admin.service';
import { CoinCatalogService } from '../../services/coin-catalog.service';
import { CoinDataService } from '../../services/coin-data.service';
import { MAX_SOURCE_IMAGE_BYTES } from '../../utils/coin-image.utils';

interface AddCoinModel {
  countryCode: string;
  denomination: Denomination | '';
  startYear: number;
  /** Empty means "<start year>–present" */
  years: string;
  design: string;
  image: File | null;
  /** End the previous series' year range the year before this one starts */
  closePrevious: boolean;
}

const FIRST_EURO_YEAR = 1999;
const LATEST_YEAR = new Date().getFullYear() + 2;

function emptyModel(): AddCoinModel {
  return {
    countryCode: '',
    denomination: '',
    startYear: new Date().getFullYear(),
    years: '',
    design: '',
    image: null,
    closePrevious: true,
  };
}

/** Admin-only form that adds a new national-side series to a country's coin */
@Component({
  selector: 'app-add-coin',
  standalone: true,
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './add-coin.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './add-coin.css',
})
export class AddCoinComponent {
  private readonly catalog = inject(CoinCatalogService);
  private readonly coinAdmin = inject(CoinAdminService);
  protected readonly coinData = inject(CoinDataService);

  private readonly model = signal<AddCoinModel>(emptyModel());
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  /** The coin the new series belongs to, once a country and a denomination are chosen */
  protected readonly existingCoin = computed(() => {
    const { countryCode, denomination } = this.model();
    return countryCode && denomination ? this.catalog.getCoin(countryCode, denomination) : undefined;
  });

  protected readonly previousSeries = computed(() => this.existingCoin()?.series.at(-1));
  protected readonly nextSeriesNo = computed(() => (this.previousSeries()?.seriesNo ?? 0) + 1);
  protected readonly catalogReady = computed(() => this.catalog.coins().length > 0);

  protected readonly yearsPlaceholder = computed(() => `${this.model().startYear || 'YYYY'}–present`);

  /** What the previous series' years become, or null when it needs no change */
  protected readonly previousSeriesYears = computed(() => {
    const previous = this.previousSeries();
    const start = this.model().startYear;
    if (!previous || !this.model().closePrevious || !start || start <= previous.startYear) return null;
    const end = start - 1;
    const years = end === previous.startYear ? `${end}` : `${previous.startYear}–${end}`;
    return years === previous.years ? null : years;
  });

  protected readonly serverError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  protected readonly addCoinForm = form(
    this.model,
    (p) => {
      required(p.countryCode, { message: 'Choose a country.' });
      required(p.denomination, { message: 'Choose a denomination.' });
      validate(p.denomination, ({ value, valueOf }) =>
        value() && valueOf(p.countryCode) && this.catalogReady() && !this.existingCoin()
          ? { kind: 'unknownCoin', message: 'This coin is not in the catalog.' }
          : undefined
      );

      required(p.startYear, { message: 'Enter the year the series starts.' });
      min(p.startYear, FIRST_EURO_YEAR, { message: `The year can't be before ${FIRST_EURO_YEAR}.` });
      max(p.startYear, LATEST_YEAR, { message: `The year can't be after ${LATEST_YEAR}.` });
      validate(p.startYear, ({ value }) => {
        const previous = this.previousSeries();
        return previous && value() <= previous.startYear
          ? {
              kind: 'beforePrevious',
              message: `Series ${previous.seriesNo} starts in ${previous.startYear}; the new one must start later.`,
            }
          : undefined;
      });

      maxLength(p.years, 40, { message: 'Keep the years under 40 characters.' });
      validate(p.years, ({ value }) =>
        value().trim() && !/^\d{4}/.test(value().trim())
          ? { kind: 'yearsFormat', message: 'Start with the first year, e.g. "2025–present".' }
          : undefined
      );

      required(p.design, { message: 'Describe the design.' });
      maxLength(p.design, 200, { message: 'Keep the description under 200 characters.' });

      required(p.image, { message: 'Choose a picture of the coin.' });
      validate(p.image, ({ value }) => {
        const file = value();
        if (!file) return undefined;
        if (!file.type.startsWith('image/')) {
          return { kind: 'imageType', message: 'The file must be an image (JPEG, PNG or WebP).' };
        }
        if (file.size > MAX_SOURCE_IMAGE_BYTES) {
          return { kind: 'imageSize', message: 'The image must be smaller than 15 MB.' };
        }
        return undefined;
      });
    },
    {
      submission: {
        action: async (f) => this.save(f),
      },
    }
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.setPreview(null));
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const field = this.addCoinForm.image();
    field.value.set(file);
    field.markAsTouched();
    this.setPreview(file && file.type.startsWith('image/') ? file : null);
  }

  /** The messages to show under a field: after it was visited, or after a submit attempt */
  protected errorsOf(field: FieldTree<unknown>): string[] {
    const state = field();
    if (!state.touched() || !state.invalid()) return [];
    return state.errors().map((error) => error.message ?? 'This value is not valid.');
  }

  protected hasErrors(field: FieldTree<unknown>): boolean {
    return this.errorsOf(field).length > 0;
  }

  private async save(f: FieldTree<AddCoinModel>) {
    this.serverError.set(null);
    this.successMessage.set(null);
    const value = f().value();
    const coin = this.existingCoin();
    if (!coin || !value.image || !value.denomination) return undefined;

    const seriesNo = this.nextSeriesNo();
    const country =
      this.coinData.countries().find((c) => c.code === value.countryCode)?.name ?? value.countryCode;
    try {
      await this.coinAdmin.addSeries({
        countryCode: value.countryCode,
        denomination: value.denomination,
        seriesNo,
        years: value.years.trim() || `${value.startYear}–present`,
        startYear: value.startYear,
        design: value.design.trim(),
        image: value.image,
        previousSeriesYears: this.previousSeriesYears(),
      });
    } catch (error) {
      const adminError =
        error instanceof CoinAdminError ? error : new CoinAdminError('The coin could not be saved.');
      if (adminError.field === 'image') {
        return { fieldTree: f.image, kind: 'server', message: adminError.message };
      }
      this.serverError.set(adminError.message);
      return undefined;
    }

    const label = this.coinData.getDenominationByValue(value.denomination)?.label ?? value.denomination;
    this.successMessage.set(`Series ${seriesNo} of ${country} ${label} was added.`);
    this.model.set(emptyModel());
    f().reset();
    this.setPreview(null);
    const input = this.imageInput()?.nativeElement;
    if (input) input.value = '';
    return undefined;
  }

  private setPreview(file: File | null): void {
    const current = this.imagePreview();
    if (current) URL.revokeObjectURL(current);
    this.imagePreview.set(file ? URL.createObjectURL(file) : null);
  }
}
