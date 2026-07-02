# Loop 022 — `/api/dpt` Route Index and API Docs

## Goal

Add a `/api/dpt` index route that returns supported RPC names and diagnostics links without requiring a specific `[rpc]` path, then update README/API docs to point future agents to the route index.

## Files created/updated

- `apps/admin/app/api/dpt/route.ts`
- `apps/admin/tests/api-index-route.test.ts`
- `apps/admin/API.md`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/022-api-index-route-docs.md`

## What changed

Created route index:

```text
GET /api/dpt
```

It returns:

- API name
- active transport
- safe mode flag
- supported RPC names
- RPC count
- route links
- diagnostics link
- Supabase readiness booleans
- `exposesSecrets: false`

Created API docs:

```text
apps/admin/API.md
```

This points future agents to:

- `GET /api/dpt`
- `GET /api/dpt/diagnostics`
- `POST /api/dpt/[rpc]`

## Tests added

Created:

```text
apps/admin/tests/api-index-route.test.ts
```

Covers:

- route returns status 200
- route returns supported RPC names
- route returns diagnostics link
- route does not expose Supabase anon key env var name/value

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl http://127.0.0.1:3000/api/dpt
curl http://127.0.0.1:3000/api/dpt/diagnostics
npm audit --omit=dev
```

## Actual verification output

```text
@dpt/admin-prototype test:
Test Files  10 passed (10)
Tests       36 passed (36)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

Next build route output includes:
ƒ /api/dpt
ƒ /api/dpt/diagnostics
ƒ /api/dpt/[rpc]

GET /api/dpt includes:
"name":"DPT Admin Mock API"
"index":"/api/dpt"
"diagnostics":"/api/dpt/diagnostics"
"rpcPattern":"/api/dpt/[rpc]"
"rpcCount":12
"exposesSecrets":false

GET /api/dpt/diagnostics includes:
"activeTransport":"mock-route"
"rpcCount":12
"exposesSecrets":false

Page HTML includes:
Transport Diagnostics
Tournament Desk Command Center
Transport: mock-route
Safe local mode
```

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add a short handoff summary document at the rebuild-lab root that lists current architecture, test counts, how to run the local app, where API docs live, and what is still blocked before real Supabase.
