# Loop 013 — Route Integration Tests + Admin API Client

## Goal

Add route/API integration tests around the actual Next route handler responses, then centralize client-side fetch/error handling in a small admin API client module.

## Files created/updated

- `apps/admin/lib/admin-api-client.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/tests/api-route.test.ts`
- `apps/admin/tests/admin-api-client.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/013-route-tests-admin-api-client.md`

## What changed

### Centralized client fetch/error handling

Created:

```text
apps/admin/lib/admin-api-client.ts
```

Exports:

- `AdminApiError`
- `callAdminRpc`
- `callStateRpc`

The UI now calls `callStateRpc(...)` instead of manually handling `fetch`, JSON parsing, unsupported RPC errors, and read-style RPC errors inline.

### Actual route handler integration tests

Created:

```text
apps/admin/tests/api-route.test.ts
```

These tests import and exercise the real Next route handler functions:

- `GET()`
- `POST(request, { params: { rpc } })`

They verify:

- GET returns supported RPC names and local-only note
- POST `dpt_check_in_player` returns updated state
- POST unsupported RPC returns 404 JSON

### Admin API client tests

Created:

```text
apps/admin/tests/admin-api-client.test.ts
```

Covers:

- success path with injectable fetcher
- typed error for unsupported RPC response
- typed error when a read-style RPC is used where mutable state is expected

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
curl -s -X POST -H 'content-type: application/json' -d '{}' http://127.0.0.1:3000/api/dpt/dpt_check_in_player
curl -s http://127.0.0.1:3000
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  4 passed (4)
Tests       16 passed (16)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

Next build route output includes:
ƒ /api/dpt/[rpc]

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

- `npm audit --omit=dev` still reports 2 Next/PostCSS advisories; force fix would upgrade to Next 16 and remains a pre-deployment task.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- API route layer is intentionally stateless and mock-only; client sends current state and receives updated state.

## Next recommended loop

Add a small Supabase replacement plan for the API client boundary: define which local RPCs will map to Supabase `rpc()` calls, which need server-side transactions/Edge Functions, and what auth/RLS checks each call requires.
