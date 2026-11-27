// Copies coin series added from the admin form into the bundled catalog, so the mobile app (and
// the web site when Supabase is unreachable) shows them offline too.
//
// For every row in coin_series:
//   * the years and design in public/assets/coins/catalog.json are updated;
//   * if its images are in Supabase Storage, they are downloaded to
//     public/assets/coins/<iso>/<denom>/s<n>.<ext> and s<n>-thumb.<ext>, and the catalog points there.
// The rows in Supabase keep their Storage URLs; the app prefers the bundled copy when it has one.
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Project Settings -> API), either in the
// environment or in a .env file next to package.json (copy .env.example; .env is git-ignored).
// Values already set in the environment win over the file.
// The service role key bypasses row level security: keep it out of git and out of the app.
// Without them the script prints a warning and leaves everything as it is, so builds still work.
//
// Run: npm run coins:sync   (the cap:sync, android and ios scripts run it first)

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(projectDir, 'public');
const catalogFile = path.join(publicDir, 'assets/coins/catalog.json');

try {
  process.loadEnvFile(path.join(projectDir, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn(
    'coins:sync skipped: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env, see .env.example)' +
      ' to bundle coins added online.'
  );
  process.exit(0);
}

const isRemote = (p) => /^https?:\/\//i.test(p);

async function fetchRows() {
  const columns = 'country_code,denomination,series_no,years,start_year,design,image_path,thumb_path';
  const response = await fetch(`${url}/rest/v1/coin_series?select=${columns}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    throw new Error(`Reading coin_series failed: HTTP ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** Downloads a Storage image and returns its path relative to public/ */
async function download(source, relWithoutExt) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Downloading ${source} failed: HTTP ${response.status}`);
  const ext = path.extname(new URL(source).pathname) || '.webp';
  const rel = `${relWithoutExt}${ext}`;
  const target = path.join(publicDir, rel);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  return rel;
}

const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
const coins = new Map(catalog.coins.map((c) => [`${c.countryCode}-${c.denomination}`, c]));

let updated = 0;
let downloaded = 0;
for (const row of await fetchRows()) {
  const coin = coins.get(`${row.country_code}-${row.denomination}`);
  if (!coin) {
    console.warn(`Skipping ${row.country_code} ${row.denomination}: not in catalog.json`);
    continue;
  }
  let series = coin.series.find((s) => s.seriesNo === row.series_no);
  const before = JSON.stringify(series ?? null);
  if (!series) {
    series = { seriesNo: row.series_no };
    coin.series.push(series);
    coin.series.sort((a, b) => a.seriesNo - b.seriesNo);
  }
  series.years = row.years;
  series.startYear = row.start_year;
  series.design = row.design;

  const hasLocalCopy = series.image && !isRemote(series.image);
  if (isRemote(row.image_path) && !hasLocalCopy) {
    const base = `assets/coins/${row.country_code.toLowerCase()}/${row.denomination}/s${row.series_no}`;
    series.image = await download(row.image_path, base);
    series.thumb = await download(row.thumb_path, `${base}-thumb`);
    downloaded++;
  } else if (!isRemote(row.image_path)) {
    series.image = row.image_path;
    series.thumb = row.thumb_path;
  }
  if (JSON.stringify(series) !== before) updated++;
}

if (updated) {
  await writeFile(catalogFile, JSON.stringify(catalog));
}
console.log(
  `coins:sync: ${updated} series updated in catalog.json, ${downloaded} downloaded from Storage.`
);
