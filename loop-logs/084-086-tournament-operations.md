# Loops 084–086 — Tournament Registration, Add-ons, and Elimination

## Loop 084 — Player registration

Delivered:

- authenticated `POST /api/admin/tournaments/[id]/entries`;
- atomic `dpt_admin_register_entry(...)` transaction;
- active tournament/player validation;
- production-compatible duplicate/re-entry support;
- audit record with actor and created entry;
- anonymous RPC execution revoked.

## Loop 085 — Add-ons/rebuys

Delivered:

- authenticated add-on endpoint;
- tournament-engine `applyAddon()` calculation;
- database-side recalculation and invariant checks;
- serialized entry update;
- add-on ledger row;
- before/after audit record;
- only checked-in, non-eliminated entries accepted.

## Loop 086 — Elimination and scoring

Delivered:

- authenticated elimination endpoint;
- DPT and freeroll rank/payout/score calculations;
- serialized elimination using a tournament advisory transaction lock;
- database verification of rank, payout, score, sequence, and final-table state;
- before/after audit record;
- forward correction so check-in clears `pre_registered`;
- satellite/flight flows fail closed until their dedicated implementations exist.

## Verification

- Site tests: 34 passed.
- Tournament engine tests: 31 passed.
- Full migration chain: 16 migrations passed.
- Site typecheck: passed.
- Clean production Next build with no ignored engine `dist/`: passed.
- Anonymous execution denied for registration, add-on, check-in, and elimination RPCs.

## Remaining tournament milestone work

- tournament desk read model/UI;
- player search and registration UI;
- check-in/add-on/elimination forms;
- payout template materialization and registration close;
- satellite winners;
- flight advancement;
- undo/reset;
- audit-history UI;
- authenticated browser mutation QA against staging fixtures/real imported core data.
