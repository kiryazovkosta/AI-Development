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
