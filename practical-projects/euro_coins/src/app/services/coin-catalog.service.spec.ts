import { CoinCatalog } from '../models/coin.models';
import { preferBundledImages } from './coin-catalog.service';

const STORAGE = 'https://x.supabase.co/storage/v1/object/public/coin-images/mc/1c';

function catalog(series: { seriesNo: number; image: string }[]): CoinCatalog {
  return {
    issuers: {},
    coins: [
      {
        countryCode: 'MC',
        denomination: '1c',
        description: null,
        details: [],
        series: series.map((s) => ({
          seriesNo: s.seriesNo,
          years: '2025–present',
          startYear: 2025,
          design: 'Online design',
          image: s.image,
          thumb: s.image.replace('.webp', '-thumb.webp'),
        })),
      },
    ],
  };
}

describe('preferBundledImages', () => {
  it('uses the bundled copy of a series added online, keeping the online text', () => {
    const online = catalog([
      { seriesNo: 2, image: 'assets/coins/mc/1c/s2.webp' },
      { seriesNo: 3, image: `${STORAGE}/s3-1.webp` },
    ]);
    const bundled = catalog([
      { seriesNo: 2, image: 'assets/coins/mc/1c/s2.webp' },
      { seriesNo: 3, image: 'assets/coins/mc/1c/s3.webp' },
    ]);
    bundled.coins[0].series[1].design = 'Old text';

    const series = preferBundledImages(online, bundled).coins[0].series[1];
    expect(series.image).toBe('assets/coins/mc/1c/s3.webp');
    expect(series.thumb).toBe('assets/coins/mc/1c/s3-thumb.webp');
    expect(series.design).toBe('Online design');
  });

  it('keeps the Storage URL until the series has been bundled', () => {
    const online = catalog([{ seriesNo: 3, image: `${STORAGE}/s3-1.webp` }]);
    const bundled = catalog([]);
    expect(preferBundledImages(online, bundled).coins[0].series[0].image).toBe(`${STORAGE}/s3-1.webp`);
    expect(preferBundledImages(online, null)).toBe(online);
  });
});
