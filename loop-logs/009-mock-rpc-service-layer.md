# Loop 009 — Mock Service Layer Mirroring Supabase RPC Boundaries

## Goal

Add app-layer mock service modules that mirror future Supabase RPC boundaries so UI event handlers call services instead of direct tournament-engine functions.

## Files created/updated

- `apps/admin/lib/mock-dpt-services.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/009-mock-rpc-service-layer.md`

## What changed

### Service layer added

Created:

```text
apps/admin/lib/mock-dpt-services.ts
```

This module wraps tournament-engine functions behind RPC-shaped service names:

- `dptCheckInPlayer`
- `dptAddTournamentAddon`
- `dptEliminatePlayer`
- `dptUndoPlayerStat`
- `dptRecalculateManualRanks`
- `dptAdvanceFlightPlayers`
- `dptUndoFlightAdvancement`
- `dptMaterializeTournamentPayouts`
- `dptGetTocQualifiers`

### UI refactor

`apps/admin/app/admin-simulator.tsx` now calls the mock service functions instead of importing/calling engine functions directly.

This makes the UI closer to the future Supabase architecture:

```text
UI event handler -> service/RPC boundary -> tournament engine/domain logic
```

## Verification commands run

```bash
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
npm --workspace apps/admin run dev
curl -s -I --max-time 10 http://127.0.0.1:3000
curl -s --max-time 10 http://127.0.0.1:3000 | grep key service text
```

## Actual verification output

```text
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

Verified page HTML includes:
RPC-shaped services
Supabase disconnected
dpt_advance_flight_players
dpt_check_in_player
service state
```

## Known issues

- `npm audit --omit=dev` still reports Next/PostCSS advisories. This remains documented as a local-only prototype risk before deployment.
- Browser screenshot tooling still blocked by missing Chromium dependency `libnspr4.so`; HTTP/content checks are passing.

## Current local server

A Next.js dev server is running locally:

```text
http://127.0.0.1:3000
```

Process session:

```text
proc_8ff9c9dcb138
```

## Next recommended loop

Add a mock service test suite for the new service layer so UI-facing state transitions are covered separately from the pure tournament-engine tests. After that, the next bigger step is either local Supabase execution once Docker is available or a more polished admin UX pass.
