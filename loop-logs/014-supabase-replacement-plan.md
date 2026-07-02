# Loop 014 — Supabase Replacement Plan for Admin API Boundary

## Goal

Add a Supabase replacement plan for the API client boundary, mapping each local mock RPC to Supabase `rpc()`, Edge Function, or server transaction, with required auth/RLS checks.

## Files created/updated

- `supabase/SUPABASE_REPLACEMENT_PLAN.md`
- `supabase/README.md`
- `GOAL.md`
- `loop-logs/014-supabase-replacement-plan.md`

## What changed

Created the replacement plan:

```text
supabase/SUPABASE_REPLACEMENT_PLAN.md
```

The plan maps the current local architecture:

```text
Next.js UI
  -> admin-api-client.ts
  -> /api/dpt/[rpc]
  -> mock RPC dispatcher
  -> mock DPT service layer
  -> @dpt/tournament-engine
```

to the future Supabase architecture:

```text
Next.js UI
  -> admin-api-client.ts
  -> Supabase client rpc() OR Next server route OR Edge Function
  -> Postgres transaction / RPC / service-role server logic
  -> tested tournament rules
```

## RPCs mapped

- `dpt_check_in_player`
- `dpt_add_tournament_addon`
- `dpt_eliminate_player`
- `dpt_undo_player_stat`
- `dpt_recalculate_manual_ranks`
- `dpt_advance_flight_players`
- `dpt_undo_flight_advancement`
- `dpt_materialize_tournament_payouts`
- `dpt_get_toc_qualifiers`
- `set_flight_carryover_mode`
- `get_prize_pool`
- `get_last_display_score`

## Key decisions captured

- Keep `admin-api-client.ts` as the only UI-facing API boundary.
- Use direct Supabase reads only for simple public/authorized read flows.
- Use Postgres RPCs for transactional admin operations when the logic is manageable in SQL.
- Use Edge Function or Next server transaction first for highly complex workflows like flight advance/undo.
- Require `public.is_admin_operator()` for most tournament desk mutations.
- Reserve `super_admin`/`admin` for role grants and high-risk/manual rank operations if needed.
- Avoid sending full UI state once Supabase is active; real calls should use IDs and operation payloads.

## Verification commands run

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
python3 markdown/doc check
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
```

## Known blockers before real Supabase swap

- Docker/local Supabase unavailable in current environment.
- Seed profiles are not real `auth.users` rows yet.
- Host/manager tournament assignment model is not designed yet.
- Audit/tournament-update process needs final shape.
- Next/PostCSS advisories remain pre-deployment work.

## Next recommended loop

Create shared TypeScript contract types for all admin API calls so the UI, mock route layer, future Supabase transport, and tests share one input/output schema before any real Supabase connection.
