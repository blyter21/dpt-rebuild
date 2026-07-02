# Loop 020 — Environment/Transport Config Documentation

## Goal

Add an environment/config documentation section explaining the exact env vars for transport selection, why Supabase does not enable accidentally, and how to safely test the disabled transport with an injected adapter.

## Files created/updated

- `apps/admin/ENVIRONMENT.md`
- `apps/admin/.env.example`
- `apps/admin/README.md`
- `supabase/SUPABASE_REPLACEMENT_PLAN.md`
- `GOAL.md`
- `loop-logs/020-environment-transport-docs.md`

## What changed

Created admin environment docs:

```text
apps/admin/ENVIRONMENT.md
```

Created safe example env file:

```text
apps/admin/.env.example
```

Documented exact variables:

- `NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT`
- `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Safety rule documented

Setting only this is **not enough** to enable Supabase:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

The app stays on safe local `mock-route` unless this is also exactly true:

```dotenv
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, `admin-api-supabase.ts` remains a placeholder unless a config/adapter is provided.

## Injected adapter test pattern documented

`ENVIRONMENT.md` includes the safe unit-test pattern for testing the disabled Supabase transport with an injected adapter rather than real credentials.

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
python3 doc/env checks
curl local page/API smoke checks
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

doc/env checks passed

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

## Known issues

- Supabase transport remains disabled by design until Docker/local Supabase or credentials are available.
- Browser screenshot tooling remains blocked by missing Chromium dependency `libnspr4.so`.
- Next/PostCSS audit advisories remain pre-deployment work.

## Next recommended loop

Add a small transport/config section to the UI action log or diagnostics area that shows the exact config reason and active transport, then optionally add a route for `/api/dpt` that exposes supported RPCs without requiring a specific `[rpc]` path.
