# Loop 016 — Disabled Placeholder Supabase Transport

## Goal

Add a placeholder Supabase transport module `admin-api-supabase.ts` that conforms to the new contracts but stays disabled until Supabase credentials/local DB are available.

## Files created/updated

- `apps/admin/lib/admin-api-supabase.ts`
- `apps/admin/tests/admin-api-supabase.test.ts`
- `apps/admin/README.md`
- `supabase/SUPABASE_REPLACEMENT_PLAN.md`
- `GOAL.md`
- `loop-logs/016-placeholder-supabase-transport.md`

## What changed

Created:

```text
apps/admin/lib/admin-api-supabase.ts
```

Exports:

- `SUPABASE_TRANSPORT_ENABLED`
- `SupabaseTransportDisabledError`
- `SupabaseRpcAdapter`
- `SupabaseTransportConfig`
- `getSupabaseTransportStatus`
- `callSupabaseAdminRpc`
- `callSupabaseStateRpc`

The module imports and conforms to shared contracts from:

```text
apps/admin/lib/admin-api-contracts.ts
```

## Safety behavior

The transport is explicitly disabled by default:

```ts
export const SUPABASE_TRANSPORT_ENABLED = false as const;
```

Without an explicit adapter/config it throws:

```text
SupabaseTransportDisabledError
```

No Supabase package, credentials, cloud project, or local DB connection was added.

## Tests added

Created:

```text
apps/admin/tests/admin-api-supabase.test.ts
```

Covers:

- default disabled status
- typed disabled error
- contract-conforming injected adapter path
- readiness status requiring enabled flag, project URL, anon key, and adapter

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
Test Files  6 passed (6)
Tests       23 passed (23)

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
| Admin service/API/client/contracts/Supabase placeholder | 6 | 23 |
| **Total** | **12** | **54** |

## Known issues

- Supabase transport is intentionally disabled until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add transport-selection plumbing to `admin-api-client.ts` so it can choose between `mock-route` and the disabled `supabase-rpc` placeholder through a typed config, while keeping the default as safe local mock-route.
