# Loop 028 — Visual Brand + Public/Admin View Toggle

## Goal

Make the replica shell feel more like DakotaPokerTour.com by adding a public/admin view toggle, DPT-style header/footer, event cards, leaderboard/player cards, and clearer current-vs-rebuilt status badges on every module.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/028-visual-brand-view-toggle.md
```

## What changed

Added a top-level view toggle:

```text
Admin View
Public View
```

Admin View keeps the browser-backed admin replica shell:

```text
Dashboard
Public Site Preview
Tournaments
Events
Players
Venues
Articles / Live Updates
Notifications
Live Tournament Manager
```

Public View now renders a DPT-style public shell:

```text
DPT logo mark
Dakota Poker Tour header
Home / Events / Calendar / News / Videos / Venues / Leaderboard / Players / Champions / Live Updates nav
DPT-style public preview cards
Footer with FPN Gaming / quick-link context
```

Added current-vs-rebuilt module badges to every reusable panel:

```text
Current: Captured
Rebuilt: Mock UI
Next: Needs data
```

## Browser verification

Admin View verified:

```text
DPT Admin/Public Replica Shell
Admin View
Public View
Current: Captured
Rebuilt: Mock UI
Public Site Preview
Live Tournament Manager
```

Public View verified:

```text
View: Public site replica
DPT
Modern replica preview · public site mode
Dakota Poker Tour fan-facing replica
Home / Events / Calendar / News / Videos / Venues / Leaderboard / Players / Champions / Live Updates
Basim Habib leads the 2026 standings
Footer replica target: FPNGaming.com, social links, old website link, and quick links
```

## Verification commands

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
```

## Result

The shell is still mock-data, but it now looks and reads more like a DPT takeover/migration proof-of-concept instead of a generic engineering admin page.

## Next recommended loop

```text
continue next DPT rebuild loop: add realistic create/edit detail screens for Events, Tournaments, Venues, and Players using fields captured from the authenticated admin forms, while keeping all actions mock-only and clearly labeled
```
