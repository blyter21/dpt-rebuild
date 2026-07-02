# Loop 027 — Public-Site Preview Side

## Goal

Improve the DPT replica shell by adding a public-site preview side with Home, Events, Leaderboard, Players, and Tournament detail pages using mock data from the browser crawl, while keeping admin/live manager intact.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/027-public-site-preview-side.md
```

## What changed

Added a new left-nav module:

```text
Public Site Preview
```

It contains a fan-facing preview shell with tabs:

```text
Home
Events
Leaderboard
Players
Tournament Detail
```

The preview is backed by the same browser crawl targets captured in:

```text
browser-audit/public-pages.json
```

## Public preview content

### Home

Models the live homepage surface:

```text
Player of the Year
Past Events
Videos / News positioning
FPN footer context
```

### Events

Models event cards from:

```text
/events
/upcomingEvents
/pastEvents
```

### Leaderboard

Models the public Player of the Year leaderboard using mock player records.

### Players

Models public player-directory cards using the same mock player database used by admin.

### Tournament Detail

Models the live tournament/results page surface:

```text
Pre-Registration Details
Description
Rules
Tournament Results
Payouts
Venue
News
```

## Preservation

The previous admin/live-manager work remains intact:

```text
Dashboard
Tournaments
Events
Players
Venues
Articles / Live Updates
Notifications
Live Tournament Manager
Player database → tournament
Selected-player elimination / undo
```

## Verification

Commands run:

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

Browser/HTTP checks verified:

```text
HTTP/1.1 200 OK
DPT Admin/Public Replica Shell
Public Site Preview
Live Tournament Manager
Articles / Live Updates
/api/dpt -> DPT Admin Mock API
```

Browser interaction verified:

```text
Public Site Preview opens
Home tab shows Basim Habib Player of the Year preview
Tournament Detail tab shows Black Chip Bounty
Tournament Detail tab shows Pre-Registration Details
Tournament Detail tab shows Tournament Results
```

## Next recommended loop

```text
continue next DPT rebuild loop: make the replica shell feel more like the actual DakotaPokerTour.com visual brand by adding a public/admin view toggle, DPT-style header/footer, event cards, leaderboard cards, and clearer current-vs-rebuilt status badges on every module
```
