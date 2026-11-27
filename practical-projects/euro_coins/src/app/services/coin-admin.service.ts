import { Injectable, inject } from '@angular/core';
import { Denomination } from '../models/coin.models';
import { prepareCoinImages } from '../utils/coin-image.utils';
import { CoinCatalogService } from './coin-catalog.service';
import { SupabaseService } from './supabase.service';

export const COIN_IMAGES_BUCKET = 'coin-images';

export interface NewCoinSeries {
  countryCode: string;
  denomination: Denomination;
  seriesNo: number;
  years: string;
  startYear: number;
  design: string;
  image: File;
  /** Year range to give the previous series, e.g. "2006–2024"; null leaves it unchanged */
  previousSeriesYears: string | null;
}

/** An error with a message that can be shown to the administrator as it is */
export class CoinAdminError extends Error {
  constructor(
    message: string,
    readonly field: 'image' | 'seriesNo' | null = null
  ) {
    super(message);
  }
}

/**
 * Adds national-side coin series. The server enforces the admin role: the Storage bucket and the
 * coin_series table only accept writes from users for whom public.is_admin() is true.
 */
@Injectable({
  providedIn: 'root',
})
export class CoinAdminService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly catalog = inject(CoinCatalogService);

  async addSeries(coin: NewCoinSeries): Promise<void> {
    let images;
    try {
      images = await prepareCoinImages(coin.image);
    } catch (error) {
      console.error('Failed to read the coin image:', error);
      throw new CoinAdminError('This file could not be read as an image.', 'image');
    }

    // A unique name per upload, so a CDN or browser never serves an older picture
    const base = `${coin.countryCode.toLowerCase()}/${coin.denomination}/s${coin.seriesNo}-${Date.now()}`;
    const imagePath = `${base}.${images.extension}`;
    const thumbPath = `${base}-thumb.${images.extension}`;
    const bucket = this.supabase.storage.from(COIN_IMAGES_BUCKET);

    const uploads = await Promise.all([
      bucket.upload(imagePath, images.image, { contentType: images.contentType, upsert: false }),
      bucket.upload(thumbPath, images.thumb, { contentType: images.contentType, upsert: false }),
    ]);
    const uploadError = uploads.find((result) => result.error)?.error;
    if (uploadError) {
      await this.removeQuietly([imagePath, thumbPath]);
      throw toAdminError(uploadError);
    }

    const { error: insertError } = await this.supabase.from('coin_series').insert({
      country_code: coin.countryCode,
      denomination: coin.denomination,
      series_no: coin.seriesNo,
      years: coin.years,
      start_year: coin.startYear,
      design: coin.design,
      image_path: bucket.getPublicUrl(imagePath).data.publicUrl,
      thumb_path: bucket.getPublicUrl(thumbPath).data.publicUrl,
    });
    if (insertError) {
      await this.removeQuietly([imagePath, thumbPath]);
      throw toAdminError(insertError);
    }

    if (coin.previousSeriesYears && coin.seriesNo > 1) {
      const { error } = await this.supabase
        .from('coin_series')
        .update({ years: coin.previousSeriesYears })
        .match({
          country_code: coin.countryCode,
          denomination: coin.denomination,
          series_no: coin.seriesNo - 1,
        });
      // The new series is saved; only the old one's year range is left as it was
      if (error) {
        console.error('Failed to update the previous series:', error);
        await this.catalog.reload();
        throw new CoinAdminError(
          'The coin was added, but the years of the previous series could not be updated.'
        );
      }
    }

    await this.catalog.reload();
  }

  private async removeQuietly(paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage.from(COIN_IMAGES_BUCKET).remove(paths);
    if (error) console.warn('Failed to remove uploaded coin images:', error);
  }
}

function toAdminError(error: { message?: string; code?: string; statusCode?: string }): CoinAdminError {
  const text = `${error.code ?? ''} ${error.statusCode ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (error.code === '23505') {
    return new CoinAdminError('This series number already exists for this coin.', 'seriesNo');
  }
  if (error.code === '42501' || text.includes('row-level security') || text.includes('403')) {
    return new CoinAdminError('Only administrators can add coins.');
  }
  if (text.includes('bucket not found')) {
    return new CoinAdminError(
      'Image storage is not set up yet. Run the latest Supabase migration first.'
    );
  }
  if (text.includes('failed to fetch') || text.includes('network')) {
    return new CoinAdminError('No connection to the server. Check the internet and try again.');
  }
  return new CoinAdminError(error.message || 'The coin could not be saved.');
}
