# Loop 018 — Mock Route Transport Adapter Extraction

## Goal

Add a minimal `admin-api-mock-route.ts` transport adapter file so mock-route is isolated behind the same adapter interface as `admin-api-supabase.ts`, keeping `admin-api-client.ts` even thinner.

## Files created/updated

- `apps/admin/lib/admin-api-mock-route.ts`
- `apps/admin/lib/admin-api-client.ts`
- `apps/admin/tests/admin-api-mock-route.test.ts`
- `apps/admin/README.md`
- `supabase/SUPABASE_REPLACEMENT_PLAN.md`
- `GOAL.md`
- `loop-logs/018-mock-route-transport-adapter.md`

## What changed

Created:

```text
apps/admin/lib/admin-api-mock-route.ts
```

Exports:

- `MockRouteTransportConfig`
- `AdminApiError`
- `callMockRouteAdminRpc`
- `callMockRouteStateRpc`

Refactored:

```text
apps/admin/lib/admin-api-client.ts
```

The client now only:

1. normalizes config/fetcher shorthand
2. chooses `mock-route` vs `supabase-rpc`
3. delegates to the matching adapter

Current adapter shape:

```text
admin-api-client.ts
  -> admin-api-mock-route.ts
  -> admin-api-supabase.ts
```

## Tests added

Created:

```text
apps/admin/tests/admin-api-mock-route.test.ts
```

Covers:

- successful local route POST adapter call
- route error payload converted to `AdminApiError`
- read-style RPC result rejected when mutable state is required

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
curl local API/page smoke checks
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  7 passed (7)
Tests       29 passed (29)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed
```

## Current test totals

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports | 7 | 29 |
| **Total** | **13** | **60** |

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add a small UI indicator showing which transport is active (`mock-route` vs `supabase-rpc`) and add a config contract that can later read from environment without enabling Supabase by accident.
