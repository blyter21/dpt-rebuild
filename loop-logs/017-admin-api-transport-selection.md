# Loop 017 — Admin API Transport Selection Plumbing

## Goal

Add transport-selection plumbing to `admin-api-client.ts` so it can choose between `mock-route` and disabled `supabase-rpc` through a typed config, while keeping the default as safe local mock-route.

## Files updated

- `apps/admin/lib/admin-api-client.ts`
- `apps/admin/tests/admin-api-client.test.ts`
- `apps/admin/README.md`
- `supabase/SUPABASE_REPLACEMENT_PLAN.md`
- `GOAL.md`
- `loop-logs/017-admin-api-transport-selection.md`

## What changed

`admin-api-client.ts` now supports:

```ts
type AdminApiTransport = 'mock-route' | 'supabase-rpc';
```

Default behavior remains safe local mock-route:

```ts
callStateRpc('dpt_check_in_player', state);
```

Explicit Supabase selection exists but stays disabled unless configured:

```ts
callStateRpc('dpt_check_in_player', state, {}, { transport: 'supabase-rpc' });
```

## New exported client config types

- `AdminApiTransport`
- `MockRouteTransportConfig`
- `SupabaseRpcTransportConfig`
- `AdminApiClientConfig`
- `defaultAdminApiClientConfig`

## Backward compatibility

Existing tests can still inject a fetch function directly:

```ts
callStateRpc('dpt_check_in_player', state, {}, fetcher);
```

The new typed equivalent is:

```ts
callStateRpc('dpt_check_in_player', state, {}, { transport: 'mock-route', fetcher });
```

## Tests updated

`apps/admin/tests/admin-api-client.test.ts` now covers:

- default safe `mock-route` transport
- backward-compatible fetcher shorthand
- mock-route error handling
- read-style RPC misuse error handling
- disabled `supabase-rpc` typed selection
- future injected Supabase adapter path

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
Tests       26 passed (26)

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
| Admin service/API/client/contracts/Supabase placeholder | 6 | 26 |
| **Total** | **12** | **57** |

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add a minimal `admin-api-mock-route.ts` transport adapter file so the mock-route transport is isolated behind the same adapter interface as `admin-api-supabase.ts`, keeping `admin-api-client.ts` even thinner.
