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
