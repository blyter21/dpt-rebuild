# Loops 087–089 — Tournament Desk UI and Corrections

## Loop 087 — Authenticated tournament desk

Delivered:

- `GET /api/admin/tournaments/[id]/desk` read model;
- joined tournament configuration, entries/players, add-ons, payouts, live updates and audit history;
- derived registered/check-in/remaining/eliminated/buy-in/add-on metrics;
- protected `/admin/tournaments/[id]` browser route;
- Manage links from the tournament list;
- responsive desk, player table, configuration and payout panels;
- accurate staging-only operational safety messaging.

## Loop 088 — Operator controls

Delivered:

- authenticated player name/nickname search;
- browser player selection and registration;
- check-in form wired to the atomic check-in API;
- add-on form wired to engine + database validation;
- elimination confirmation wired to rank/payout/score transaction;
- automatic desk reload and operation messages;
- mobile-responsive forms and action controls.

## Loop 089 — Undo and audit history

Delivered:

- engine-backed `undoPlayerStat()` API;
- atomic `dpt_admin_undo_entry_result(...)` transaction;
- flight chip restoration validation;
- rank/winnings/score/elimination/final-table reset;
- before/after audit entry;
- Undo Result action for completed entries;
- 50-entry tournament audit-history panel;
- anonymous RPC execution revoked.

## Verification

- Full migration chain: 17 migrations passed.
- New desk/search/undo/UI tests passed.
- Site typecheck passed.
- Clean production build passed with tournament desk, search, registration, check-in, add-on, elimination and undo routes.

## Remaining blockers/gaps

- Full private operational core dataset is not yet loaded into Supabase staging, so most production-derived tournament IDs will show `Operational tournament not found` in the staging desk.
- No authenticated staging browser mutation has been performed yet.
- Registration open/close, payout materialization, satellite winners, flight advancement, bulk rank editing and full tournament reset remain.
- Public production remains read-only and untouched.
