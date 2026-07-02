# Loop 012 — Local Mock API Route Layer

## Goal

Add a thin route/API mock layer matching the RPC signatures so the admin UI can call local Next.js route handlers before those are swapped for Supabase RPCs.

## Files created/updated

- `apps/admin/lib/mock-dpt-rpc.ts`
- `apps/admin/app/api/dpt/[rpc]/route.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/tests/mock-dpt-rpc.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/012-local-api-rpc-layer.md`

## What changed

Added a route/API layer:

```text
POST /api/dpt/[rpc]
GET  /api/dpt/[rpc]
```

Supported mock RPC names include:

- `dpt_check_in_player`
- `dpt_add_tournament_addon`
- `dpt_eliminate_player`
- `dpt_undo_player_stat`
- `dpt_recalculate_manual_ranks`
- `dpt_advance_flight_players`
- `dpt_undo_flight_advancement`
- `dpt_materialize_tournament_payouts`
- `dpt_get_toc_qualifiers`
- `set_flight_carryover_mode`
- `get_prize_pool`
- `get_last_display_score`

The UI action buttons now call local route handlers with `fetch('/api/dpt/<rpc>')` instead of directly invoking service functions.

Current architecture:

```text
Next.js UI
  -> local Next.js route handler /api/dpt/[rpc]
  -> mock RPC dispatcher
  -> mock DPT service layer
  -> @dpt/tournament-engine
```

Future architecture target:

```text
Next.js UI
  -> Supabase RPC/client service
  -> Supabase transaction / Edge Function / server logic
```

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl -s http://127.0.0.1:3000/api/dpt/dpt_check_in_player
curl -s -X POST -H 'content-type: application/json' -d '{}' http://127.0.0.1:3000/api/dpt/dpt_check_in_player
curl -s http://127.0.0.1:3000
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  2 passed (2)
Tests       10 passed (10)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

Next build route output includes:
ƒ /api/dpt/[rpc]

GET /api/dpt/dpt_check_in_player includes:
No Supabase connection
dpt_add_tournament_addon
dpt_check_in_player

POST /api/dpt/dpt_check_in_player includes:
"ok":true
"totalBuyInAmount":240
"totalChips":40000
dpt_check_in_player

Page HTML includes:
Local API route layer
Supabase disconnected
Tournament Desk Command Center
local Next.js route handlers
```

## Known issues

- This is still stateless/mock route handling; state is sent by the client and returned by the route.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain a pre-deployment item.

## Next recommended loop

Add route/API integration tests around the actual Next route handler responses, then optionally add a small client-side API utility module to centralize fetch/error handling before Supabase replacement.
