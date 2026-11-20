# Euro Coin Collection Tracker

## Idea

A web application for numismatic hobbyists to track their personal Euro coin collection. Since the Eurozone was established, each participating country mints 8 denominations (1¢, 2¢, 5¢, 10¢, 20¢, 50¢, €1, €2), with unique national designs per country. With 25 countries in scope, a complete collection totals **200 coins**.

The application was **fully built using [Claude Code](https://claude.ai/code)** — Anthropic's AI-powered CLI tool — as a practical demonstration of AI-assisted software development. The entire codebase was produced through an iterative conversation with Claude Code.

Each registered user maintains their **own independent collection**. After logging in, a user sees only their personal checklist — coins they own are tracked separately from every other user's data. The collection is permanently stored in the cloud under the user's account, so it survives logout, browser close, session expiry, or switching devices.

---

## Functional Requirements

| # | Requirement |
|---|---|
| FR-1 | Users log in with email and password before accessing their collection. There is no self-registration: an Administrator creates accounts on the **Create user** page, which calls the `create-user` Supabase Edge Function (`supabase/functions/create-user`) |
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
| NFR-5 | **Reliability** — If the cloud service is temporarily unavailable, the app says so and offers Retry. It never overwrites the stored collection: nothing is saved, and coins can't be marked, until the collection has loaded. Changes are saved one at a time, and pending changes are saved before sign-out and when the app goes to the background |

---

## Coin images and details

Coin pictures and texts come from the European Central Bank's euro coin pages.

- `public/assets/coins/<iso>/<denomination>/s<n>.webp` is the 540×540 image of series *n*, and `s<n>-thumb.webp` a 160×160 thumbnail used in the grid.
- Some countries have more than one series for a denomination (Belgium, France, Monaco, Netherlands, San Marino, Spain, Vatican City). The grid shows the newest series with a badge giving the number of series; clicking a coin opens a dialog with the full-size image, every series (thumbnail strip, arrows or ←/→ keys), the design description and the issuer text.
- Ownership is tracked at two levels. "Unique coins" counts country + denomination (200); "All series" counts every design separately (295). Single-series coins are marked with the checkbox under the card, as before. Multi-series coins are marked per series in the details dialog only (the card checkbox opens the dialog); their badge shows owned/total series, the card's checkbox is partly filled while some series are owned, and the card turns bright only when every series is owned. A coin counts in "Unique coins" once any of its series is owned. Series are stored in the same `owned_coins` array as `"BE-1e@2"`, so no schema change is needed; coins marked before series tracking keep counting until a series is chosen.
- The catalog lives in Supabase (`coin_issuers`, `coin_designs`, `coin_series`; migration in `supabase/migrations/`). Until that migration is applied, or if Supabase is unreachable, the app reads the bundled `public/assets/coins/catalog.json`.
- Regenerate everything from a new ECB export with `python scripts/build-coin-catalog.py <EuroCoins dir> . supabase/coin_catalog_schema.sql supabase/migrations/<timestamp>_coin_catalog.sql`.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Language | TypeScript |
| Authentication | Supabase Auth |
| Cloud Database | Supabase (Postgres) |
| Installable app | Angular service worker (PWA) |
| Mobile apps | Capacitor (Android, iOS) |
| Hosting | Vercel (`vercel.json`) |
| Development Tool | Claude Code |

---

## Setup

```bash
npm install

# Supabase settings are not committed. Copy the template and fill in the project URL and anon key
# (Supabase: Project Settings → API).
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

### Database schema

Only the coin catalog is versioned (`supabase/migrations/`). The rest of the schema was set up in the Supabase dashboard and is not in this repository:

- the tables `owned_coins`, `profiles`, `user_roles`, `roles`, `countries` and `denomination_info`, with their row level security policies
- the `is_admin()` function used by the Edge Function
- the `on_auth_user_created` trigger

Those policies are what keep each user's collection private (FR-2). To bring them under version control, export the live schema into a migration:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db pull
```

## Development

```bash
# Start dev server at localhost:4200
ng serve

# Production build to dist/
ng build

# Run unit tests once in headless Chrome (drop the flags to keep watching)
ng test --watch=false --browsers=ChromeHeadless

# Development build with watch mode
npm run watch
```

## Mobile apps (Android and iOS)

The app is packaged as a native Android and iOS app with [Capacitor](https://capacitorjs.com/) (`capacitor.config.ts`, native projects in `android/` and `ios/`). Step-by-step guides:

- [BUILD_ANDROID.md](BUILD_ANDROID.md): build an APK with Android Studio and install it on a phone
- [BUILD_IOS.md](BUILD_IOS.md): build with Xcode on a Mac and install on an iPhone (free Apple ID works)
- [BUILD_IOS_DEVICE.md](BUILD_IOS_DEVICE.md): build, sign and install on an iPhone from the terminal only (`npm run ios:device`), including a Mac without admin rights

```bash
npm run android    # ng build + cap sync android + open Android Studio
npm run ios        # ng build + cap sync ios + open Xcode (macOS only)
npm run ios:device # ng build + cap sync ios + sign, install and launch on a USB-connected iPhone
npm run cap:sync   # after any web change: rebuild and copy into both native projects
npm run cap:assets # regenerate app icons and splash screens from assets/
```
