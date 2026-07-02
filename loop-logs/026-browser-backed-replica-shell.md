# Loop 026 — Browser-Backed DPT Replica Shell

## Goal

Use the browser-backed DPT feature map to rebuild the Next.js prototype into a recognizable DPT admin/public replica shell with modules for Dashboard, Tournaments, Events, Players, Venues, Articles, Notifications, and a live tournament manager that supports selecting a player from a player database, adding them to a tournament, selecting a live player, and eliminating/undoing them.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/026-browser-backed-replica-shell.md
```

## What changed

The old isolated Tournament Desk screen was replaced with a broader DPT replica shell:

```text
DPT Admin/Public Replica Shell
├─ Dashboard
├─ Tournaments
├─ Events
├─ Players
├─ Venues
├─ Articles / Live Updates
├─ Notifications
└─ Live Tournament Manager
```

The Live Tournament Manager now models the two workflows Brook immediately identified as missing:

1. Player database → selected tournament
2. Selected live player → eliminate / undo / edit ranks

## Browser-backed current-platform alignment

The shell is based on `DPT_CURRENT_PLATFORM_MAP.md`, which was captured from:

```text
https://dakotapokertour.com
https://dakotapokertour.com/admin
```

Authenticated admin modules represented in the new shell:

```text
Dashboard
Tournaments
Events
Players
Venues
Articles / Live Updates
Notifications
Live Tournament Manager
```

Still not production-complete:

```text
Payout template CRUD
Blind structure CRUD
Duplicate-player merge implementation
Real notification send
Real Supabase/database connection
Real migrated data
Roles/RLS
```

## Verification

```text
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
browser local UI check
/api/dpt route check
```

## Browser evidence

Visible shell verified at:

```text
http://127.0.0.1:3000
```

Visible labels verified:

```text
DPT Admin/Public Replica Shell
Player database → tournament
Live tournament player list
Eliminate selected player
Undo selected player stat
Articles / Live Updates
Notifications
```

Selected-player elimination path was exercised against the local mock RPC:

```text
Bob -> eliminated
rank -> 3
score -> 600
action log -> /api/dpt/dpt_eliminate_player
```

The demo was reset afterward.

## Next recommended loop

```text
continue next DPT rebuild loop: improve the DPT replica shell by adding a public-site preview side with Home, Events, Leaderboard, Players, and Tournament detail pages using mock data from the browser crawl, while keeping admin/live manager intact
```
