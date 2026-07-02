# DPT Rebuild Reports Bundle

Generated: 20260627-121805Z


---

# PROJECT_STATUS.md

# DPT Rebuild — Business Impact Status

Audience: Brook / Nacho  
Updated: 2026-06-27

## Executive summary

The DPT rebuild has moved from “unknown legacy app” to a tested local modernization lab. The most important tournament-desk rules have been extracted into a standalone TypeScript engine, protected by tests, and wrapped in a mock Next.js admin/API layer that is shaped like the future Supabase boundary.

This means the rebuild is no longer just a visual redesign. It now has a tested foundation for the tournament operations that matter: check-in math, add-ons, scoring, payouts, eliminations, manual rank edits, flight advance/undo, satellite winner behavior, and Tournament of Champions qualification.

## What has been proven

| Area | Status | Business impact |
|---|---|---|
| Legacy understanding | Proven enough for backend rebuild planning | We have mapped the hidden Laravel tournament behavior into reusable docs and tests. |
| Tournament rules | 31 pure engine tests passing | Core poker/tournament math is protected before touching UI/cloud. |
| Admin workflow prototype | Running locally | Tournament desk workflow can be demoed without production data. |
| API boundary | Local `/api/dpt` index, diagnostics, and mock RPC routes working | Future Supabase replacement has a clear seam. |
| Transport safety | `mock-route` default with explicit two-step Supabase opt-in | A future agent cannot accidentally turn on Supabase/cloud by setting one env var. |
| Handoff quality | `HANDOFF.md`, `API.md`, `ENVIRONMENT.md`, loop logs | Nacho/Pedro/future agents can continue without replaying every prior decision. |

## Current verified test counts

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports/config/diagnostics/routes | 10 | 36 |
| **Total** | **16** | **67** |

Latest verified commands include:

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

## Current local demo

Run from `/home/hermes/projects/dpt-rebuild-lab`:

```bash
npm --workspace apps/admin run dev
```

Open:

```text
http://127.0.0.1:3000
```

Current active process at handoff:

```text
proc_9a934ecd4b94
```

Expected on the page:

```text
Tournament Desk Command Center
Transport: mock-route
Safe local mode
Supabase disconnected
Transport Diagnostics
```

## Where future agents should start

| File | Why it matters |
|---|---|
| `HANDOFF.md` | Current architecture, tests, commands, blockers, and next loops. |
| `apps/admin/API.md` | `/api/dpt`, diagnostics route, mock RPC route pattern, supported RPC list. |
| `apps/admin/ENVIRONMENT.md` | Exact transport env vars and why Supabase cannot enable accidentally. |
| `supabase/SUPABASE_REPLACEMENT_PLAN.md` | How to replace the local mock API boundary with Supabase RPC/Edge/server logic. |
| `packages/tournament-engine/ENGINE_RULE_MAPPING.md` | Trace from modern engine helpers back to Laravel behavior. |

## What remains blocked before real Supabase

1. Docker/local Supabase is not available in this environment.
2. `psql` is not available.
3. Supabase migrations/RLS/seed have not been executed against a real database.
4. Seed users/profiles are not linked to real `auth.users` rows.
5. Host/manager tournament assignment model still needs final design.
6. Admin mutation audit/tournament-update logging still needs final production shape.
7. Next/PostCSS advisories remain unresolved until a pre-deployment dependency upgrade pass.
8. Browser screenshot QA is blocked locally by missing Chromium dependency `libnspr4.so`; HTTP/content/build checks are being used instead.

## Recommended next investment

### Best next technical investment

Enable local Supabase execution when Docker is available, then run the existing migrations/seed/RLS locally and start with one read-only query/RPC path.

Why: this converts the current safe mock boundary into a real database proof without touching production.

### Best next product investment

Keep polishing the admin tournament desk around actual operator workflows: registration, add-ons, eliminations, payout correction, flight movement, and audit trail.

Why: this is the highest-value internal workflow and gives Brook/Nacho a practical replacement target before public-site work.

### Best next risk-reduction investment

Resolve the Next/PostCSS audit issue and browser dependency issue before any hosted preview.

Why: these do not block local proof-of-concept work, but they should be cleared before Vercel/public preview.

## Recommended sequencing

1. Keep current mock-route admin app as the demo baseline.
2. When Docker/local Supabase is available, run Supabase migrations and seed locally.
3. Swap one simple read-only route from mock data to Supabase under the existing transport boundary.
4. Add transaction-backed admin mutations one at a time: check-in, add-on, elimination, undo, flight advance.
5. Only after local DB proof: consider Vercel/Supabase cloud preview with non-production data.

## Bottom line

The rebuild has a credible tested core and a safe local admin prototype. The next meaningful spend is not more reverse engineering; it is getting local Supabase running and proving the first real DB-backed slice while keeping production credentials/data untouched.


---

# HANDOFF.md

# DPT Rebuild Lab — Handoff Summary

Last updated: `2026-06-27T11:51:26Z`

This is the current working handoff for the Dakota Poker Tour rebuild lab. It is intended for Pedro/future agents picking up the local rebuild without rereading every loop log.

## Safety boundaries

- Legacy Laravel reference repo: `/home/hermes/projects/dpt-web`
- Laravel app root: `/home/hermes/projects/dpt-web/src`
- Rebuild lab: `/home/hermes/projects/dpt-rebuild-lab`
- Do **not** push to GitHub without Brook's explicit request.
- Do **not** deploy to Vercel/Supabase production.
- Do **not** use production credentials in this lab.
- Treat the Laravel repo as read-only reference except local reports/spec files.

## Current architecture

```text
apps/admin Next.js UI
  -> apps/admin/lib/admin-api-client.ts
  -> apps/admin/lib/admin-api-config.ts
  -> apps/admin/lib/admin-api-contracts.ts
  -> apps/admin/lib/admin-api-mock-route.ts
  -> /api/dpt and /api/dpt/[rpc]
  -> apps/admin/lib/mock-dpt-rpc.ts
  -> apps/admin/lib/mock-dpt-services.ts
  -> packages/tournament-engine
```

Future disabled path:

```text
apps/admin/lib/admin-api-supabase.ts
  -> future Supabase rpc()/Edge/server transaction transport
```

The active/default transport remains:

```text
mock-route
```

Supabase is not connected.

## Current packages/apps

| Path | Purpose |
|---|---|
| `packages/tournament-engine` | Pure tested TypeScript domain logic extracted from Laravel behavior. |
| `apps/admin` | Mock-data Next.js Tournament Desk prototype. |
| `supabase` | Draft migrations, seed data, RLS helpers, RPC signatures, local setup docs, replacement plan. |
| `DPT_REBUILD_SPEC` | Entity maps, business rules, schema drafts, migration/RLS/API/test plans. |
| `loop-logs` | Evidence logs for each loop. |

## Current local app

Run:

```bash
npm --workspace apps/admin run dev
```

Current dev server process at handoff:

```text
proc_9a934ecd4b94
```

URL:

```text
http://127.0.0.1:3000
```

Expected UI indicators:

```text
Tournament Desk Command Center
Transport: mock-route
Safe local mode
Supabase disconnected
Transport Diagnostics
```

## API/docs map

Primary docs:

| File | Purpose |
|---|---|
| `apps/admin/API.md` | Local mock API route index, diagnostics, and RPC usage. |
| `apps/admin/ENVIRONMENT.md` | Exact env vars and safety behavior for transport selection. |
| `supabase/SUPABASE_REPLACEMENT_PLAN.md` | Mapping from local mock API boundary to future Supabase RPC/Edge/server implementation. |
| `packages/tournament-engine/ENGINE_RULE_MAPPING.md` | Mapping between engine functions and Laravel behavior. |
| `GOAL.md` | Running milestone checklist. |
| `PROJECT_STATUS.md` | Concise business-impact status summary for Brook/Nacho. |

Routes:

| Route | Purpose |
|---|---|
| `GET /api/dpt` | Route index: supported RPC names and links. |
| `GET /api/dpt/diagnostics` | Active transport, supported RPCs, safe-mode/Supabase-disabled status without secrets. |
| `POST /api/dpt/[rpc]` | Mock RPC execution endpoint. |

Supported RPC names:

```text
dpt_check_in_player
dpt_add_tournament_addon
dpt_eliminate_player
dpt_undo_player_stat
dpt_recalculate_manual_ranks
dpt_advance_flight_players
dpt_undo_flight_advancement
dpt_materialize_tournament_payouts
dpt_get_toc_qualifiers
set_flight_carryover_mode
get_prize_pool
get_last_display_score
```

## Transport/env behavior

Safe defaults:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

Supabase **does not enable accidentally**. Setting only:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

keeps the app on `mock-route`. Selecting the placeholder Supabase path requires:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, `admin-api-supabase.ts` is only a disabled/testable placeholder unless explicit adapter/config is supplied.

## Current verification status

### Current test totals

Latest verified commands:

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

Latest known test counts:

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports/config/diagnostics/routes | 10 | 36 |
| **Total** | **16** | **67** |

Latest actual test output excerpt:

```text
@dpt/admin-prototype test:
Test Files  10 passed (10)
Tests       36 passed (36)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)
```

## Current known blockers before real Supabase

1. Docker/local Supabase is unavailable in the current environment.
2. `psql` is unavailable in the current environment.
3. Supabase migrations/RLS/seed have not yet been executed against a real local DB.
4. Seed profiles are not linked to real `auth.users` rows yet.
5. Host/manager tournament assignment model is not designed yet.
6. Audit/tournament-update process needs final shape before production-like admin mutation logging.
7. Next/PostCSS audit advisories remain unresolved; `npm audit --omit=dev` reports 2 vulnerabilities and suggests a breaking Next 16 upgrade.
8. Browser screenshot tooling is blocked by missing Chromium dependency `libnspr4.so`; use build output, HTTP status, and content checks until fixed.

## Common commands

```bash
# Engine tests
npm --workspace packages/tournament-engine test

# Admin tests
npm --workspace apps/admin test

# Admin typecheck/build
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build

# Full current verification pattern
npm --workspace apps/admin test \
  && npm --workspace packages/tournament-engine test \
  && npm --workspace apps/admin run typecheck \
  && npm --workspace apps/admin run build

# API smoke checks, with dev server running
curl -s http://127.0.0.1:3000/api/dpt
curl -s http://127.0.0.1:3000/api/dpt/diagnostics
curl -s -X POST -H 'content-type: application/json' -d '{}' \
  http://127.0.0.1:3000/api/dpt/dpt_check_in_player
```

## Dev server caveat

After adding/changing route files, the Next dev server has sometimes returned fallback/error HTML for new route smoke checks. If this happens, restart the tracked dev process and rerun the same curl check before assuming the route code is broken.

## Next recommended loop

A good next loop is one of:

1. Add or maintain `PROJECT_STATUS.md` if Brook/Nacho need a fresh executive summary.
2. Add initial Supabase contract implementation stubs in SQL/TypeScript for the simplest read-only query path.
3. Prepare Docker/local Supabase execution steps, but only if Docker becomes available.
4. Start a public-site mock prototype after the admin/API boundary stabilizes.


---

# apps/admin/API.md

# DPT Admin Local API

This API is local/mock-only. It is designed to make the future Supabase RPC boundary visible before any Supabase connection is enabled.

## Route index

```text
GET /api/dpt
```

Returns:

- active transport
- safe mode flag
- supported RPC names
- route links
- diagnostics link
- Supabase readiness booleans
- no secrets

Use this route first when inspecting the local admin API.

## Diagnostics

```text
GET /api/dpt/diagnostics
```

Returns transport diagnostics:

- `activeTransport`
- `safeMode`
- `reason`
- `supportedRpcs`
- `rpcCount`
- `testMode.mockRoute`
- `testMode.supabaseRpcSelected`
- `testMode.supabaseTransportReady`
- `supabase.disabledReason`
- `supabase.hasProjectUrl`
- `supabase.hasAnonKey`
- `supabase.exposesSecrets`

The diagnostics endpoint intentionally exposes only booleans for Supabase URL/key presence, never actual values.

## RPC route pattern

```text
POST /api/dpt/[rpc]
```

Example:

```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -d '{}' \
  http://127.0.0.1:3000/api/dpt/dpt_check_in_player
```

Current local route pattern sends mock state and receives updated mock state. Future Supabase calls should send IDs/payloads, not whole UI state.

## Supported RPCs

Current supported names are sourced from `apps/admin/lib/admin-api-contracts.ts`:

```text
dpt_check_in_player
dpt_add_tournament_addon
dpt_eliminate_player
dpt_undo_player_stat
dpt_recalculate_manual_ranks
dpt_advance_flight_players
dpt_undo_flight_advancement
dpt_materialize_tournament_payouts
dpt_get_toc_qualifiers
set_flight_carryover_mode
get_prize_pool
get_last_display_score
```

## Safety

- No production data.
- No Supabase connection by default.
- `mock-route` remains active unless Supabase is explicitly enabled through the two-step environment opt-in documented in `ENVIRONMENT.md`.
- Do not add production credentials to local files.


---

# apps/admin/ENVIRONMENT.md

# Admin Prototype Environment & Transport Config

This app is intentionally safe-by-default. The admin desk uses local mock data and the local Next.js route layer unless Supabase is explicitly enabled with a two-step opt-in.

## Default behavior

With no environment variables set, the active transport is:

```text
mock-route
```

Meaning:

```text
Next.js UI
  -> admin-api-client.ts
  -> /api/dpt/[rpc]
  -> mock RPC dispatcher
  -> mock service layer
  -> @dpt/tournament-engine
```

The UI indicator should show:

```text
Transport: mock-route
Safe local mode
```

## Exact environment variables

| Variable | Default | Purpose | Safe behavior |
|---|---|---|---|
| `NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT` | unset / `mock-route` | Requested admin API transport. Supported values today: `mock-route`, `supabase-rpc`. | Unknown/unset values fall back to `mock-route`. |
| `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT` | unset / not `true` | Second explicit opt-in required before selecting `supabase-rpc`. | Supabase is ignored unless this is exactly `true`. |
| `NEXT_PUBLIC_SUPABASE_URL` | unset | Future Supabase project/local URL. | Not used unless Supabase transport is explicitly enabled. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | unset | Future public anon key for Supabase client calls. | Not used unless Supabase transport is explicitly enabled. |

## Safe local example

Recommended current config:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
# NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

This keeps all admin actions local and mock-backed.

## Supabase does not enable accidentally

If someone sets only:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

then `readAdminApiRuntimeConfig()` intentionally returns:

```text
activeTransport: mock-route
safeMode: true
reason: Supabase RPC was requested but ignored because NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT is not true.
```

To even select the disabled placeholder transport, both values are required:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, the current `admin-api-supabase.ts` transport is a placeholder and still requires explicit adapter/config before it can make a real call.

## Future Supabase/local DB example

Only after local Supabase or cloud credentials are intentionally available:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-local-dev-anon-key
```

Do not add production Supabase credentials to this local rebuild lab without explicit approval.

## Testing the disabled transport safely

The safe way to test the placeholder is with an injected adapter in unit tests, not real credentials:

```ts
import { callSupabaseStateRpc } from './admin-api-supabase';

await callSupabaseStateRpc('dpt_check_in_player', state, {}, {
  enabled: true,
  projectUrl: 'http://localhost:54321',
  anonKey: 'test-anon-key',
  adapter: async (rpc, body) => ({
    ok: true,
    rpc,
    result: {
      state,
      message: 'test adapter ok'
    }
  })
});
```

The existing test file demonstrates this pattern:

```text
apps/admin/tests/admin-api-supabase.test.ts
```

## Verification commands

Use these after config changes:

```bash
npm --workspace apps/admin test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl -s http://127.0.0.1:3000 | grep -E 'Transport|Safe local mode|Supabase disconnected'
```

## Safety checklist before real Supabase use

- [ ] Docker/local Supabase or approved cloud project is available.
- [ ] No production credentials are committed to files.
- [ ] `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true` is intentionally set.
- [ ] RLS helpers/policies have been applied and smoke-tested.
- [ ] At least one read-only RPC/query is swapped and tested before mutations.
- [ ] Mutating tournament operations remain transactional and role-gated.


---

# supabase/SUPABASE_REPLACEMENT_PLAN.md

# Supabase Replacement Plan for Admin API Boundary

This plan maps the current local mock RPC/API boundary to the future Supabase-backed implementation.

Current local path:

```text
Next.js UI
  -> apps/admin/lib/admin-api-client.ts
  -> /api/dpt/[rpc]
  -> apps/admin/lib/mock-dpt-rpc.ts
  -> apps/admin/lib/mock-dpt-services.ts
  -> @dpt/tournament-engine
```

Target path, introduced incrementally:

```text
Next.js UI
  -> apps/admin/lib/admin-api-client.ts
  -> Supabase client rpc() OR Next server route OR Edge Function
  -> Postgres transaction / RPC / service-role server logic
  -> tested tournament rules
```

## Replacement principles

1. Keep `admin-api-client.ts` as the only UI-facing API boundary.
2. Swap transport behind the client one RPC at a time.
3. Mutating tournament operations must be transactional.
4. RLS protects direct table access; RPCs add explicit operation-level checks.
5. Public reads may use anonymous Supabase reads when covered by RLS.
6. Admin desk writes require authenticated users with `super_admin`, `admin`, `manager`, or `host` role.
7. High-risk multi-table writes should be implemented as `security definer` Postgres RPCs or Edge/Next server functions using service role, never direct client table mutations.
8. Preserve existing tests at every layer while swapping implementations.

## Role/RLS vocabulary

Draft helpers already exist in:

```text
supabase/migrations/20260626221000_rls_helpers_and_policies.sql
```

Important helpers:

```sql
public.has_app_role(role)
public.has_any_app_role(roles[])
public.is_admin_operator()
public.is_super_admin()
```

Suggested role meanings:

| Role | Intended access |
|---|---|
| `super_admin` | all setup, roles, system config, sensitive repairs |
| `admin` | all tournament/admin operations except role grants/system-only setup |
| `manager` | league/event/tournament desk operations |
| `host` | limited tournament desk operations for assigned/active events |
| normal authenticated player | self profile, own pre-registration, own add-on/read views |
| anonymous | public active tournaments, venues, payout summaries, standings |

## RPC replacement map

| Local mock RPC | Current caller | Supabase target | Why | Required auth/RLS checks | Notes |
|---|---|---|---|---|---|
| `dpt_check_in_player` | Registration Desk | Postgres RPC `public.dpt_check_in_player(...)` or Next server action calling RPC | single entry write + optional add-on ledger must be transactional | `public.is_admin_operator()`; tournament active; registration not closed unless admin override; host assignment later | Should return updated `tournament_entries` row plus summary JSON for UI log. |
| `dpt_add_tournament_addon` | Registration Desk | Postgres RPC `public.dpt_add_tournament_addon(...)` | insert add-on ledger + update entry totals atomically | `public.is_admin_operator()`; entry belongs to active tournament; add-ons allowed | Avoid direct client updates to `tournament_entries`. |
| `dpt_eliminate_player` | Eliminations panel | Postgres RPC or Edge Function if logic becomes too complex for SQL | rank/winnings/score/final-table changes depend on current tournament state | `public.is_admin_operator()`; tournament active; player entry exists; not already eliminated unless idempotent behavior designed | Initial implementation can be PL/pgSQL mirroring tested engine formulas; complex branches may move to Edge/Next server function. |
| `dpt_undo_player_stat` | Eliminations panel | Postgres RPC `public.dpt_undo_player_stat(...)` | correction operation must atomically clear result state | `public.is_admin_operator()`; tournament active; audit actor present | Should write tournament update/audit row when audit table is finalized. |
| `dpt_recalculate_manual_ranks` | Corrections panel | Postgres RPC or Edge Function + service role transaction | batch updates across several entries | `admin` or `super_admin` preferred; maybe `manager` with assignment; reject anonymous/player | Because duplicate ranks are allowed, validation should focus on shape/scope rather than unique ranks. |
| `dpt_materialize_tournament_payouts` | Payout panel | Postgres RPC `public.dpt_materialize_tournament_payouts(...)` | replace payout rows from template in transaction | `public.is_admin_operator()`; payout template readable; tournament active | Could also recalc ranked entries after payout changes. |
| `dpt_advance_flight_players` | Flight Controls | Edge Function or Next server route wrapping transaction, later possibly Postgres RPC | creates/updates main entries, marks flight entries, inserts ledger rows | `public.is_admin_operator()`; flight tournament linked to main tournament; carryover mode valid | High complexity; prefer server/Edge transaction with service role after local tests. |
| `dpt_undo_flight_advancement` | Flight Controls | Edge Function or Next server route wrapping transaction | ledger undo + main-entry recalculation/removal | `public.is_admin_operator()`; previous advancement exists and not already undone | Needs idempotency and audit trail. |
| `set_flight_carryover_mode` | Flight Controls | Postgres RPC `public.dpt_set_flight_carryover_mode(...)` or admin update service | updates tournament config, not just UI state | `admin`/`manager`; tournament not locked after start unless override | Current mock only changes local state; real version must persist to `tournaments.chip_carryover_mode`. |
| `dpt_get_toc_qualifiers` | TOC/Audit panel | Supabase `rpc('dpt_get_toc_qualifiers')` or view | read query with selector joins | public read could be allowed for published TOC; admin sees drafts | If public route, ensure selectors/tournaments are active/published under RLS. |
| `get_prize_pool` | Scoreboard | Client-derived from already-authorized rows or SQL view/RPC | read-only summary | public or authenticated depending page; RLS must only expose active/public data | Admin desk can use richer admin summary RPC later. |
| `get_last_display_score` | Scoreboard | Client-derived or server summary RPC | read-only derived display value | follows entry visibility rules | Do not store display score unless product decision changes. |

## Direct Supabase client vs RPC vs Edge/server guidance

| Operation type | Preferred implementation |
|---|---|
| public active tournament lists | direct Supabase `select` with RLS |
| public standings/payout reads | direct `select` or read-only view/RPC |
| player self pre-registration | Postgres RPC with RLS/auth checks, or direct insert only if RLS policy is exact |
| admin check-in/add-on/eliminate/undo/manual rank | Postgres RPC / Edge Function / Next server route transaction |
| flight advance/undo | Edge Function or Next server route transaction first; possible RPC later after SQL confidence |
| role grants/profile role edits | server-only route with service role; `super_admin` only |

## Proposed `admin-api-client.ts` evolution

Current shape:

```ts
callStateRpc(rpc, state, extraBody)
```

Phase 1 Supabase-ready shape:

```ts
callAdminMutation('dpt_check_in_player', input)
callAdminQuery('dpt_get_toc_qualifiers', input)
```

Phase 2 transport adapter:

```ts
type AdminApiTransport = 'mock-route' | 'supabase-rpc';

callStateRpc('dpt_check_in_player', state); // safe default: mock-route
callStateRpc('dpt_check_in_player', state, {}, { transport: 'supabase-rpc' }); // disabled until configured
```

Suggested module split:

```text
apps/admin/lib/admin-api-client.ts        # UI-facing transport selection and errors
apps/admin/lib/admin-api-mock-route.ts    # local /api/dpt/[rpc] transport adapter
apps/admin/lib/admin-api-supabase.ts      # disabled placeholder future Supabase transport
apps/admin/lib/admin-api-contracts.ts     # shared input/output contracts
```

## Input/output contract recommendations

Avoid sending full mutable UI state once Supabase is active. Real calls should send IDs and operation payloads:

```ts
await checkInPlayer({
  tournamentId,
  playerId,
  submittedInitialBuyin,
  initialChipsCount,
  includeAddons,
  totalAddonBuyin,
  noOfAddons
});
```

Responses should be structured for UI and logs:

```ts
type AdminMutationResult<T> = {
  ok: true;
  rpc: string;
  data: T;
  message: string;
  auditId?: number;
};
```

Error shape:

```ts
type AdminApiErrorPayload = {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
};
```

## Auth/RLS checklist by operation

### Mutating desk operations

- [ ] require `auth.uid()` not null
- [ ] require `public.is_admin_operator()` or stricter role
- [ ] verify tournament exists and is not deleted
- [ ] verify tournament/event/venue assignment once assignment tables exist
- [ ] reject closed/locked state unless override is explicit
- [ ] write audit/tournament update row with actor, operation, before/after summary
- [ ] return changed rows or JSON summary

### Player self-service operations

- [ ] require `player_id = auth.uid()`
- [ ] only permit pre-registration/self-owned changes
- [ ] enforce registration window and tournament status
- [ ] prevent player from changing rank/score/winnings/admin fields

### Public reads

- [ ] only active/published tournaments and venues
- [ ] hide deleted/private/test data
- [ ] avoid exposing private profile fields

## Migration sequence

1. Keep all current mock route tests passing.
2. Add shared input/output contract types for each RPC.
3. Add Supabase client dependency/config only when ready.
4. Implement read-only Supabase query path first (`dpt_get_toc_qualifiers` or public tournament list).
5. Implement simplest mutation RPC (`dpt_add_tournament_addon` or `dpt_undo_player_stat`) in local Supabase.
6. Run migration/seed locally once Docker is available.
7. Add RLS tests or SQL smoke checks for role behavior.
8. Swap one admin API client function from mock-route to Supabase transport.
9. Keep mock transport for fallback/demo mode until production cutover.

## Blockers before real Supabase swap

- Docker/local Supabase still unavailable in current environment.
- Seed profiles are not real `auth.users` rows yet.
- Host/manager tournament assignment model is not designed yet.
- Audit table/process needs final shape.
- Next/PostCSS audit advisories must be addressed before deployment.

## Immediate next implementation candidate

Before real Supabase use, keep transport config documented and contract-tested. The current admin app includes:

```text
apps/admin/ENVIRONMENT.md
apps/admin/.env.example
```

These document why `mock-route` remains active by default and why `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true` is required before `supabase-rpc` can even be selected.


---

# packages/tournament-engine/ENGINE_RULE_MAPPING.md

# DPT Tournament Engine Rule Mapping

This document maps the standalone TypeScript tournament-engine functions back to the current Laravel behaviors they were extracted from.

Primary Laravel references:

```text
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Admin/TournamentController.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Site/TournamentController.php
/home/hermes/projects/dpt-web/src/app/Models/Tournament.php
/home/hermes/projects/dpt-web/src/app/Models/TournamentPlayer.php
```

## Calculation functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `calculateInitialBuyIn()` | Non-freeroll check-in subtracts dealer fee from submitted buy-in. Freeroll money values become zero. | `Admin/TournamentController.php` check-in/pre-reg flows around `pre_reg_edit_checkIn()` and `checkIn()` |
| `calculateCheckInTotals()` | Computes initial buy-in, total buy-in, add-on count, total add-on chips, and total chips during check-in/pre-registration. | `Admin/TournamentController.php` `checkIn()`; `Site/TournamentController.php` `preRegisteredPlayer()` |
| `applyAddon()` | Adds post-check-in rebuy/add-on amount net of rebuy fee, increments add-on count, recalculates total add-on chips and total chips. | `Admin/TournamentController.php` `addonBuyIn()` |
| `calculatePrizePool()` | Running prize pool = sum player buy-ins minus tournament fee plus bounty. Closed registration can use saved distribution amount plus bounty. | `Tournament.php` `manageTournamentInfo()` |
| `calculateDptStoredScore()` | DPT score = total buy-in + winnings, optionally multiplied. | `Admin/TournamentController.php` payout/update/elimination flows |
| `calculateDptDisplayScore()` | Public result display adds bounty separately; multiplier applies to bounty before display add. | `Site/TournamentController.php` `getPayoutsList()` score column |
| `calculateFreerollScore()` | Freeroll score = winnings + payout points + participation bonus, optionally multiplied. | `Admin/TournamentController.php` `updateFreerollEliminationDetails()` and manual rank update flow |
| `calculateSatelliteRank()` | Satellite winners receive rank `1`; optional remainder receives rank `2`; non-winners use normal remaining-player count. | `Admin/TournamentController.php` `calSatelliteRank()` |

## Elimination and result functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `countRemainingEntries()` | Counts non-pre-registered, non-eliminated players to assign finishing rank. | `Admin/TournamentController.php` `singleEliminate()` / `bulkEliminate()` |
| `eliminateDptPlayer()` | Assigns rank from remaining player count, applies payout amount, computes DPT score, sets eliminated and sequence. | `Admin/TournamentController.php` `eliminateForDpt()` + `updateEliminationDetails()` |
| `eliminateFreerollPlayer()` | Assigns rank, applies freeroll payout/points/bonus, computes freeroll score, sets eliminated and sequence. | `Admin/TournamentController.php` `eliminateForFreeroll()` + `updateFreerollEliminationDetails()` |
| `applyFinalTableFlags()` | Marks ranks `1..players_at_final_table` as final table, except satellite normal flow does not use final-table count. | `Admin/TournamentController.php` `updatePlayeratFinalTable()` and rank update flows |
| `makeSatelliteWinners()` | When make-winners flag is set, remaining satellite players are marked winners; clicked player is processed first; remainder rank is handled specially. | `Admin/TournamentController.php` `makeWinners()` and `eliminateForSatellite()` |
| `undoPlayerStat()` | Clears score, winnings, rank, eliminated state, sequence, final table; restores flight chips from initial chips + add-on chips. | `Admin/TournamentController.php` `undoPlayerStat()` |
| `recalculateManualRanks()` | Admin manual rank edit updates buy-in, bounty, chips, recalculates payout/winnings/score, eliminated state, and final table flags. | `Admin/TournamentController.php` `updateEliminatedRanks()` |

## Flight functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `rankByChipsDescending()` | Flight survivors are ranked by total chips; ties share rank. | `Admin/TournamentController.php` `stop_advance_player()` |
| `advanceFlightPlayers()` | Remaining flight players advance into main tournament. Highest-stack mode keeps max stack; accumulator/sum mode sums stacks. Flight survivors are marked qualified and eliminated. | `Admin/TournamentController.php` `stop_advance_player()` |
| `undoFlightAdvancement()` | Undo removes player from main if no other qualified flights; otherwise subtracts chips in accumulator mode or resets to highest remaining stack in highest mode. Flight player qualification/elimination/rank reset. | `Admin/TournamentController.php` `redo_advance_player()` |

## Payout functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `materializePayouts()` | Converts reusable payout template rows into tournament-specific payout rows. Percentage rows calculate amount from total distribution. Freeroll/static rows preserve prize description and points. | `Admin/TournamentController.php` `savePayoutStructures()` and `saveSatellitePayoutStructures()` |

## Tournament of Champions functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `getTournamentOfChampionsQualifiers()` | Returns rank-1, non-pre-registered players from configured tournament types and/or explicit tournament IDs, sorted newest tournament first. | `Site/TournamentController.php` `getQualifiedPlayers()` and `TournamentPlayer::tournamentsOFChampion()` |

## Known intentional differences in the engine

- The engine is pure and database-free; Laravel currently performs direct DB updates inside controllers.
- The engine uses normalized identifiers and arrays instead of CSV/text relationship fields.
- Flight advancement undo is modeled as advancement records, matching the proposed rebuild ledger approach rather than only mutating player rows.
- Bounty remains separate from stored DPT score, matching public display behavior where bounty is added later.

## Next mapping improvements

- Add exact Laravel line ranges after the reference repo stabilizes or after creating code anchors.
- Add examples comparing one Laravel tournament snapshot to engine inputs/outputs once sanitized production/sample data is available.

