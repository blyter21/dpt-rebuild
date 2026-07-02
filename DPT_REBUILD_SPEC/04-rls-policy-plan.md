# 04 — RLS Policy Plan

Draft security model for Supabase. This should be reviewed before any live project.

## Roles

| Role | Purpose |
|---|---|
| `super_admin` | Full access. |
| `admin` | Tournament/event/player operations. |
| `manager` | Scoped access to assigned tournaments/events, future rule. |
| `host` | Check-in/elimination operations for assigned events/tournaments, future rule. |
| `player` | Own profile and own tournament registration rows. |
| `anon` | Public published read access only. |

## Initial RLS principles

1. Anonymous users can read only published public objects: active venues/events/tournaments/results.
2. Players can read public data and manage only their own profile/pre-registration rows.
3. Admin/operator roles can mutate tournament operations.
4. Destructive operations require explicit admin roles and should be soft-delete where possible.
5. Flight advancement, add-ons, elimination, and payout materialization should be performed through server-side RPC/service functions so multi-row changes are transactional.

## Tables needing policies first

- `profiles`
- `venues`
- `events`
- `tournaments`
- `tournament_entries`
- `tournament_entry_addons`
- `flight_advancements`
- `payout_templates`
- `tournament_payouts`

## RPC/service functions to consider

- `check_in_player()`
- `pre_register_player()`
- `approve_pre_registration()`
- `add_tournament_addon()`
- `close_registration()`
- `materialize_tournament_payouts()`
- `eliminate_player()`
- `undo_player_stat()`
- `advance_flight_players()`
- `undo_flight_advancement()`

These functions should verify caller role and operate transactionally.
