import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CoinInfo, Denomination } from '../../models/coin.models';
import { CoinAdminError, CoinAdminService } from '../../services/coin-admin.service';
import { CoinCatalogService } from '../../services/coin-catalog.service';
import { CoinDataService } from '../../services/coin-data.service';
import { DENOMINATIONS, EURO_COUNTRIES } from '../../data/euro-countries.data';
import { AddCoinComponent } from './add-coin';

const MONACO_1C: CoinInfo = {
  countryCode: 'MC',
  denomination: '1c',
  description: null,
  details: [],
  series: [
    { seriesNo: 1, years: '2001–2005', startYear: 2001, design: 'Rainier', image: 'a', thumb: 'a' },
    { seriesNo: 2, years: '2006–present', startYear: 2006, design: 'Albert', image: 'b', thumb: 'b' },
  ],
};

describe('AddCoinComponent', () => {
  let fixture: ComponentFixture<AddCoinComponent>;
  let addSeries: jasmine.Spy;
  const coins = signal<CoinInfo[]>([MONACO_1C]);

  const root = () => fixture.nativeElement as HTMLElement;
  const el = <T extends HTMLElement>(selector: string) => root().querySelector<T>(selector)!;
  const errors = (id: string) =>
    [...root().querySelectorAll(`#${id}-errors li`)].map((li) => li.textContent!.trim());

  const setValue = async (selector: string, value: string) => {
    const input = el<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selector);
    input.value = value;
    // Like a real browser: a select fires both, text fields fire input
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };

  const chooseImage = async (file: File) => {
    const input = el<HTMLInputElement>('#image');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const submit = async () => {
    el<HTMLButtonElement>('button[type="submit"]').click();
    await fixture.whenStable();
  };

  const fillValid = async () => {
    await setValue('#countryCode', 'MC');
    await setValue('#denomination', '1c');
    await setValue('#startYear', '2025');
    await setValue('#design', 'Prince Albert II, frontal portrait');
    await chooseImage(new File([new Uint8Array(10)], 'coin.png', { type: 'image/png' }));
  };

  beforeEach(async () => {
    addSeries = jasmine.createSpy('addSeries').and.resolveTo();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: CoinAdminService, useValue: { addSeries } },
        {
          provide: CoinCatalogService,
          useValue: {
            coins,
            getCoin: (code: string, denomination: Denomination) =>
              coins().find((c) => c.countryCode === code && c.denomination === denomination),
          },
        },
        {
          provide: CoinDataService,
          useValue: {
            countries: signal(EURO_COUNTRIES),
            denominations: signal(DENOMINATIONS),
            getDenominationByValue: (value: Denomination) =>
              DENOMINATIONS.find((d) => d.value === value),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(AddCoinComponent);
    await fixture.whenStable();
  });

  it('shows no errors before the user has touched anything', () => {
    expect(root().querySelectorAll('.field-errors li').length).toBe(0);
  });

  it('shows every missing field after a submit attempt and saves nothing', async () => {
    await submit();
    expect(errors('countryCode')).toEqual(['Choose a country.']);
    expect(errors('denomination')).toEqual(['Choose a denomination.']);
    expect(errors('design')).toEqual(['Describe the design.']);
    expect(errors('image')).toEqual(['Choose a picture of the coin.']);
    expect(el('#design').getAttribute('aria-invalid')).toBe('true');
    expect(addSeries).not.toHaveBeenCalled();
  });

  it('rejects a start year that is not after the current series', async () => {
    await setValue('#countryCode', 'MC');
    await setValue('#denomination', '1c');
    await setValue('#startYear', '2006');
    expect(errors('startYear')).toEqual([
      'Series 2 starts in 2006; the new one must start later.',
    ]);
  });

  it('rejects files that are not images', async () => {
    await chooseImage(new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(errors('image')).toEqual(['The file must be an image (JPEG, PNG or WebP).']);
  });

  it('adds the next series and ends the previous one the year before', async () => {
    await fillValid();
    expect(el('.series-info').textContent).toContain('series 3');
    await submit();

    expect(addSeries).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        countryCode: 'MC',
        denomination: '1c',
        seriesNo: 3,
        startYear: 2025,
        years: '2025–present',
        design: 'Prince Albert II, frontal portrait',
        previousSeriesYears: '2006–2024',
      })
    );
    expect(el('.success-message').textContent).toContain('Series 3 of Monaco 1 cent was added.');
    expect(el<HTMLSelectElement>('#countryCode').value).toBe('');
  });

  it('leaves the previous series alone when asked to', async () => {
    await fillValid();
    el<HTMLInputElement>('.checkbox input').click();
    await fixture.whenStable();
    await submit();
    expect(addSeries).toHaveBeenCalledOnceWith(jasmine.objectContaining({ previousSeriesYears: null }));
  });

  it('shows a server error and keeps what was typed', async () => {
    addSeries.and.rejectWith(new CoinAdminError('Only administrators can add coins.'));
    await fillValid();
    await submit();
    expect(el('.error-message').textContent!.trim()).toBe('Only administrators can add coins.');
    expect(el<HTMLTextAreaElement>('#design').value).toBe('Prince Albert II, frontal portrait');
  });

  it('shows an image problem from the server under the picture', async () => {
    addSeries.and.rejectWith(new CoinAdminError('This file could not be read as an image.', 'image'));
    await fillValid();
    await submit();
    expect(errors('image')).toEqual(['This file could not be read as an image.']);
  });
});
