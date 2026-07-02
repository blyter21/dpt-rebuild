# Loop 021 — Diagnostics Endpoint and Panel

## Goal

Add a lightweight diagnostics endpoint or panel that reports active transport, supported RPC names, test mode status, and Supabase-disabled reason without exposing secrets.

## Files created/updated

- `apps/admin/lib/admin-diagnostics.ts`
- `apps/admin/app/api/dpt/diagnostics/route.ts`
- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/tests/admin-diagnostics.test.ts`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/021-diagnostics-endpoint-panel.md`

## What changed

Created diagnostics helper:

```text
apps/admin/lib/admin-diagnostics.ts
```

Created endpoint:

```text
GET /api/dpt/diagnostics
```

Added a Tournament Desk panel:

```text
Transport Diagnostics
```

The diagnostics report:

- active transport
- safe mode flag
- safe-mode reason
- supported RPC names/count
- mock-route vs supabase-rpc selected status
- Supabase transport readiness
- booleans for URL/key presence
- `exposesSecrets: false`

## Secret safety

The diagnostics output intentionally reports only booleans for Supabase config presence:

```text
hasProjectUrl: boolean
hasAnonKey: boolean
exposesSecrets: false
```

It does not return actual Supabase URL or anon key values.

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl http://127.0.0.1:3000/api/dpt/diagnostics
curl http://127.0.0.1:3000
npm audit --omit=dev
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  9 passed (9)
Tests       35 passed (35)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

Next build route output includes:
ƒ /api/dpt/diagnostics

GET /api/dpt/diagnostics includes:
"activeTransport":"mock-route"
"rpcCount":12
"supabaseTransportReady":false
"exposesSecrets":false

Page HTML includes:
Transport Diagnostics
Active transport
Supported RPCs
Secrets exposed
Supabase disabled reason
Transport: mock-route
Safe local mode
```

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add a `/api/dpt` index route that returns supported RPC names and diagnostics links without requiring a specific `[rpc]` path, then update README/API docs to point future agents to the route index.
