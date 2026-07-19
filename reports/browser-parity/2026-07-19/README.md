# DPT authenticated browser parity evidence — 2026-07-19

Viewport: `1440 × 1000` using the dedicated Windows Chrome profile `PedroChromeDebug` over CDP.

## Session status

- Production `https://dakotapokertour.com/admin`: authenticated owner/admin session confirmed; zero 403/login redirects across captured modules.
- Rebuild `https://dpt-rebuild-site.vercel.app/admin`: fail-closed login page confirmed. Authenticated rebuild captures wait for the user to complete the application login directly in the existing debug tab.
- Production interactions were read-only GET navigation and DOM/screenshot capture. No production mutations were performed.

## Production captures

| Module | Screenshot | DOM inventory | Observed table columns/controls |
|---|---|---|---|
| Dashboard | `production/dashboard.png` | `production/dashboard.json` | Full owner sidebar, notifications, sign-out |
| Tournaments | `production/tournaments.png` | `production/tournaments.json` | Year/Event/Type/Status filters, copy, add, search, pagination |
| Events | `production/events.png` | `production/events.json` | #, Name, Season, Start, End, Status, Edit/View/Delete |
| Seasons | `production/seasons.png` | `production/seasons.json` | #, Name, League, Start, End, Status, Edit/View/Delete |
| Leagues | `production/leagues.png` | `production/leagues.json` | #, Name, Status, Edit/View/Delete |
| Venues | `production/venues.png` | `production/venues.json` | #, Name, Address, City, State, Zip, Status, actions |
| Blind Structures | `production/blinds.png` | `production/blinds.json` | Select/copy/add, #, Name, Status, Edit/View/Delete |
| Payout Templates | `production/payouts.png` | `production/payouts.json` | Select/copy/add, Name, Type, Assigned Tournament, conditional actions |

## Production create forms

- `production/events-create.*`: status, season, venue, name, description, logo, banner, dates, Facebook URL, rules.
- `production/seasons-create.*`: status, league, name, description, default, logo, banner, dates.
- `production/leagues-create.*`: status, name, description.
- `production/venues-create.*`: status, name, address/city/state/zip/phone, logo/banner, social URLs, website, map location.

## Rebuild boundary capture

- `rebuild/admin-login.png`
- `rebuild/admin-login.json`

The configuration implementation was based on these observed screens and fields, not on a mock specification. Authenticated rebuild screenshots and side-by-side comparison artifacts will be added after the existing debug-tab application login is completed.
