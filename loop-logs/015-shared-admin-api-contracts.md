# Loop 015 — Shared Admin API Contract Types

## Goal

Create shared TypeScript contract types for all admin API calls so the UI, mock route layer, future Supabase transport, and tests share one input/output schema.

## Files created/updated

- `apps/admin/lib/admin-api-contracts.ts`
- `apps/admin/lib/admin-api-client.ts`
- `apps/admin/lib/mock-dpt-rpc.ts`
- `apps/admin/lib/mock-dpt-services.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/tests/admin-api-contracts.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/015-shared-admin-api-contracts.md`

## What changed

Created canonical contract module:

```text
apps/admin/lib/admin-api-contracts.ts
```

It now owns shared definitions for:

- `AdminEntry`
- `AdminFlightEntry`
- `AdminTournamentState`
- `AdminMutationResult`
- `TocQualifierContract`
- `adminRpcNames`
- `AdminRpcName`
- RPC-specific input types
- `AdminRpcInputMap`
- `AdminRpcOutputMap`
- `AdminRpcBody`
- `AdminRpcResponse`
- `isAdminRpcName`

## Refactor result

The replaceable layers now share one schema:

```text
UI
  -> admin-api-client.ts
  -> /api/dpt/[rpc]
  -> mock-dpt-rpc.ts
  -> mock-dpt-services.ts
  -> @dpt/tournament-engine
```

Shared contracts are ready for a later Supabase transport:

```text
admin-api-supabase.ts
  -> supabase.rpc(...)
```

## Tests added

Created:

```text
apps/admin/tests/admin-api-contracts.test.ts
```

Covers:

- canonical RPC name list
- RPC name guard
- shared body/state contract shape
- success/error response contract shape

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl -s -X POST -H 'content-type: application/json' -d '{}' http://127.0.0.1:3000/api/dpt/dpt_check_in_player
curl -s http://127.0.0.1:3000
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  5 passed (5)
Tests       19 passed (19)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

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

## Current test totals

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts layer | 5 | 19 |
| **Total** | **11** | **50** |

## Known issues

- Browser screenshot tooling still blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.
- Supabase local execution still blocked by Docker availability.

## Next recommended loop

Add a placeholder Supabase transport module (`admin-api-supabase.ts`) that conforms to the new contracts but stays disabled until Supabase credentials/local DB are available. This lets us prove the adapter shape without touching cloud services.
