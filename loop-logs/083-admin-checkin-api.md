# Loop 083 — Authenticated Tournament Check-In Vertical Slice

## Scope

Begin the first backend-first operational slice in authoritative `apps/site`:

- consume the tested `@dpt/tournament-engine` package;
- require authenticated/authorized DPT admin context;
- resolve the operator's domain profile UUID;
- calculate check-in totals server-side;
- persist the check-in through one atomic Supabase RPC;
- write immutable before/after audit evidence.

## Delivered

- `POST /api/admin/tournaments/[id]/entries/[entryId]/check-in`
- `public.dpt_admin_check_in_entry(...)`
- `public.dpt_admin_audit_log`
- authenticated-only RPC execution;
- anonymous execution explicitly revoked;
- RLS-protected audit reads;
- database-level value/invariant checks;
- API tests covering fail-closed authorization, invalid add-ons, engine totals and RPC payload.

## Verification

- Site tests: 24 passed before final invariant test; targeted check-in tests: 4 passed after strengthening.
- Tournament engine: 31 passed.
- Site typecheck: passed.
- Next production build: passed and included the new dynamic API route.
- Full embedded Supabase migration chain: 13 migrations passed.
- Security assertions: audit RLS/policy present; anon cannot call check-in; authenticated can call check-in.

## Explicitly not complete

This loop does not yet deliver the tournament desk UI or the remaining operations: player registration, standalone add-ons, elimination, payouts, flights, undo/reset, and audit-history display. It establishes the first real authenticated mutation boundary those workflows will use.
