# Loop 005 — Supabase Initial Migration, Seed Data, RPC Signatures

## Goal

Convert the Supabase schema draft into an initial migration, add local seed data matching the tournament-engine test concepts, and draft RPC signatures for the core tournament operations.

## Files created/updated

- `supabase/migrations/20260626220600_initial_schema.sql`
- `supabase/seed.sql`
- `supabase/RPC_SIGNATURES.md`
- `supabase/rpc_signatures.sql`
- `supabase/README.md`
- `GOAL.md`
- `loop-logs/005-supabase-migration-seed-rpc.md`

## Migration created

Created the initial dev schema migration with:

- profile/role tables
- leagues/seasons/venues/events
- tournament types
- blind structures
- tournaments
- qualifier and TOC selector join tables
- tournament entries
- add-on ledger table
- payout templates/template rows/tournament payouts
- flight advancements ledger
- tournament updates
- indexes
- updated-at triggers
- RLS enabled on primary tables

File:

```text
supabase/migrations/20260626220600_initial_schema.sql
```

## Seed data created

Created local/dev seed data for:

- tournament types: DPT Standard, Satellite, Freeroll, Flight
- test players matching engine fixtures
- league/season/venue/event
- blind structure
- DPT, Satellite, Freeroll, Main Event, and Flight tournaments
- payout templates/template rows
- tournament entries matching buy-in/score/rank concepts
- one sample flight advancement

File:

```text
supabase/seed.sql
```

## RPC signatures drafted

Human-readable contract:

```text
supabase/RPC_SIGNATURES.md
```

SQL stub signatures:

```text
supabase/rpc_signatures.sql
```

The SQL stubs intentionally raise `not implemented` exceptions so nobody mistakes them for production-ready functions.

Drafted RPCs:

- `dpt_pre_register_player`
- `dpt_check_in_player`
- `dpt_add_tournament_addon`
- `dpt_set_registration_closed`
- `dpt_materialize_tournament_payouts`
- `dpt_eliminate_player`
- `dpt_undo_player_stat`
- `dpt_recalculate_manual_ranks`
- `dpt_advance_flight_players`
- `dpt_undo_flight_advancement`
- `dpt_get_toc_qualifiers`

## Commands run

```bash
python3 SQL file-level checks
npm --workspace packages/tournament-engine test
npm --workspace packages/tournament-engine run typecheck
npm --workspace packages/tournament-engine run build
npm audit --omit=dev
```

## Actual verification output

```text
supabase/migrations/20260626220600_initial_schema.sql: lines=320 chars=13025 semicolons=61 dollar_quotes=2
supabase/seed.sql: lines=94 chars=7894 semicolons=13 dollar_quotes=0
supabase/rpc_signatures.sql: lines=146 chars=3854 semicolons=33 dollar_quotes=22
SQL file-level checks passed

Test Files  6 passed (6)
Tests       31 passed (31)

tsc --noEmit passed

tsc build passed

npm audit --omit=dev
found 0 vulnerabilities
```

## Limitations / blockers

- The current environment does not have the Supabase CLI or `psql` installed, so SQL was not executed against a local database in this loop.
- RPCs are contracts/stubs, not implementations.
- RLS is enabled but no policies are written yet; policy design remains a future loop.

## Next recommended loop

Before UI, do one local Supabase readiness loop:

1. Install/use Supabase CLI or Docker-backed local Supabase if approved.
2. Run the migration and seed locally.
3. Fix any SQL execution issues.
4. Draft initial RLS policies and helper functions like `has_role()`.
5. Keep cloud Supabase/Vercel off until Brook explicitly approves.
