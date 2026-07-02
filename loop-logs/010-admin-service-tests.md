# Loop 010 — Mock Admin Service-Layer Test Suite

## Goal

Add a mock service test suite for the admin service layer so UI-facing state transitions are covered separately from pure tournament-engine tests.

## Files created/updated

- `apps/admin/package.json`
- `apps/admin/vitest.config.ts`
- `apps/admin/tests/mock-dpt-services.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/010-admin-service-tests.md`

## Tests added

Created service-layer tests for:

- `dptCheckInPlayer`
- `dptAddTournamentAddon`
- `dptEliminatePlayer`
- `dptUndoPlayerStat`
- `dptRecalculateManualRanks`
- `dptMaterializeTournamentPayouts`
- `dptGetTocQualifiers`
- `dptAdvanceFlightPlayers`
- `dptUndoFlightAdvancement`
- `setFlightCarryoverMode`

These tests cover the UI-facing service boundary:

```text
admin UI -> mock service -> tournament engine
```

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
curl -s --max-time 10 http://127.0.0.1:3000 | grep key service text
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  1 passed (1)
Tests       6 passed (6)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

Verified page HTML includes:
RPC-shaped services
Supabase disconnected
dpt_advance_flight_players
dpt_check_in_player
service state
```

## Known issues

`npm audit --omit=dev` still reports 2 vulnerabilities in Next/PostCSS dependency chain. The suggested force fix upgrades to Next 16, which is a breaking change from the current Node 18/Next 14 prototype. This remains a documented pre-deployment item.

## Next recommended loop

The UI/service/engine layers are now split and tested. Recommended next options:

1. Add a thin route/API mock layer matching the RPC signatures, or
2. Add a polished workflow screen for one complete tournament operation path, or
3. Set up Docker/Supabase local execution once Docker is available, then replace mock services incrementally.
