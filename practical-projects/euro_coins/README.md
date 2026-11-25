# Euro Coin Collection Tracker

## Idea

A web application for numismatic hobbyists to track their personal Euro coin collection. Since the Eurozone was established, each participating country mints 8 denominations (1¢, 2¢, 5¢, 10¢, 20¢, 50¢, €1, €2), with unique national designs per country. With 25 countries in scope, a complete collection totals **200 coins**.

The application was **fully built using [Claude Code](https://claude.ai/code)** — Anthropic's AI-powered CLI tool — as a practical demonstration of AI-assisted software development. The entire codebase was produced through an iterative conversation with Claude Code.

Each registered user maintains their **own independent collection**. After logging in, a user sees only their personal checklist — coins they own are tracked separately from every other user's data. The collection is permanently stored in the cloud under the user's account, so it survives logout, browser close, session expiry, or switching devices.

---

## Functional Requirements

| # | Requirement |
|---|---|
| FR-1 | Users must register and log in via email/password before accessing their collection |
| FR-2 | Each user's collection is fully isolated — no user can see or modify another's data |
| FR-3 | The collection displays all 25 countries, each with 8 denomination cards |
| FR-4 | Each coin card shows a coin image, denomination label, and owned/not-owned state |
| FR-5 | Clicking a coin card toggles ownership; changes are automatically saved to the cloud so the collection is preserved across logout, browser close, and device changes |
| FR-6 | A statistics bar shows total coins owned, collection percentage, and a progress bar |
| FR-7 | A country navigation dropdown scrolls the view to any country section |
| FR-8 | A back-to-top button appears during scroll for quick navigation |
| FR-9 | Country flags are displayed per section for quick visual identification |
| FR-10 | Logging out does not affect the user's collection — it is safely stored in the cloud and restored automatically on next login |

---

## Non-Functional Requirements

| # | Requirement |
|---|---|
| NFR-1 | **Performance** — The UI responds instantly to interactions with no perceptible lag |
| NFR-2 | **Persistence** — Changes are saved to the cloud automatically. The collection survives logout, browser close, session expiry, or switching devices |
| NFR-3 | **Security** — Only authenticated users can access their collection; unauthenticated visitors are redirected to login |
| NFR-4 | **Responsiveness** — The application is usable on both desktop and mobile viewports |
| NFR-5 | **Reliability** — The app remains functional even if the cloud service is temporarily unavailable |

---

## Coin images and details

Coin pictures and texts come from the European Central Bank's euro coin pages.

- `public/assets/coins/<iso>/<denomination>/s<n>.webp` is the 540×540 image of series *n*, and `s<n>-thumb.webp` a 160×160 thumbnail used in the grid.
- Some countries have more than one series for a denomination (Belgium, France, Monaco, Netherlands, San Marino, Spain, Vatican City). The grid shows the newest series with a badge giving the number of series; clicking a coin opens a dialog with the full-size image, every series (thumbnail strip, arrows or ←/→ keys), the design description and the issuer text.
- Ownership is tracked at two levels. "Unique coins" counts country + denomination (200); "All series" counts every design separately (295). Single-series coins are marked with the checkbox under the card, as before. Multi-series coins are marked per series in the details dialog only (the card checkbox opens the dialog); their badge shows owned/total series, the card's checkbox is partly filled while some series are owned, and the card turns bright only when every series is owned. A coin counts in "Unique coins" once any of its series is owned. Series are stored in the same `owned_coins` array as `"BE-1e@2"`, so no schema change is needed; coins marked before series tracking keep counting until a series is chosen.
- The catalog lives in Supabase (`coin_issuers`, `coin_designs`, `coin_series`; migration in `supabase/migrations/`). Until that migration is applied, or if Supabase is unreachable, the app reads the bundled `public/assets/coins/catalog.json`.
- Regenerate everything from a new ECB export with `python scripts/build-coin-catalog.py <EuroCoins dir> . supabase/coin_catalog_schema.sql supabase/migrations/<timestamp>_coin_catalog.sql`.

---

## €2 commemorative coins

- Signed-in users get a second menu, "€2 Commemorative coins" (`/commemoratives`): every commemorative coin grouped by year, newest first, with a year picker, overall and per-year progress, an owned checkbox on each coin and a details dialog.
- Each country's version of a joint issue is its own coin. The two newest 2025 coins (Lithuania – Lithuanian Minor, Slovenia – Miki Muster) are left out on purpose for now (`SKIP` in the build script).
- Data and images are bundled in `public/assets/commemoratives/` (`catalog.json` + `<year>/<id>.webp` and `-thumb.webp`). Regenerate from the ECB export with `python scripts/build-commemorative-catalog.py <EuroCoins/Commemorative dir> .`.
- Each user's owned coins are stored in the `owned_commemoratives` table (migration `supabase/migrations/20261125120000_owned_commemoratives.sql`, row-level security: own row only). Run the migration before using the menu.

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Language | TypeScript |
| Authentication | Supabase Auth |
| Cloud Database | Supabase (Postgres) |
| Development Tool | Claude Code |

---

## Development

```bash
# Start dev server at localhost:4200
ng serve

# Production build to dist/
ng build

# Run unit tests
ng test

# Development build with watch mode
npm run watch
```
