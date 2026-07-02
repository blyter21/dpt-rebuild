# Loop 019 — Transport Indicator + Safe Runtime Config Contract

## Goal

Add a small UI indicator showing which transport is active (`mock-route` vs `supabase-rpc`), and add a config contract that can later read from environment without enabling Supabase by accident.

## Files created/updated

- `apps/admin/lib/admin-api-config.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/tests/admin-api-config.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/019-transport-indicator-safe-config.md`

## What changed

Created safe runtime config contract:

```text
apps/admin/lib/admin-api-config.ts
```

Exports:

- `AdminApiRuntimeConfig`
- `AdminApiEnvironment`
- `readAdminApiRuntimeConfig`
- `adminApiRuntimeConfig`

## Safety behavior

Default is always safe local mock-route:

```text
activeTransport: mock-route
safeMode: true
```

If someone sets only:

```text
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

Supabase is **not** enabled. The config ignores it unless this is also set:

```text
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, the current Supabase transport remains placeholder/disabled unless adapter/credentials are properly supplied.

## UI indicator

The Tournament Desk status stack now displays:

```text
Transport: mock-route
Safe local mode
```

and shows the reason:

```text
Safe local mock-route transport is active by default.
```

## Tests added

Created:

```text
apps/admin/tests/admin-api-config.test.ts
```

Covers:

- default safe mock-route config
- ignored Supabase request without explicit enable flag
- explicit supabase-rpc selection shape for future use

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
Test Files  8 passed (8)
Tests       32 passed (32)

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
Transport: mock-route
Safe local mode
Tournament Desk Command Center
Supabase disconnected
```

## Current test totals

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports/config | 8 | 32 |
| **Total** | **14** | **63** |

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add an environment/config documentation page or section that explains the exact env vars for transport selection, why Supabase does not enable accidentally, and how to safely test the disabled transport with an injected adapter.
