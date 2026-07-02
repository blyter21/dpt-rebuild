# DPT Supabase RPC Signatures Draft

Draft only. These signatures document server-side transactional operations for the Supabase rebuild. They should call the tested tournament-engine rules from the app layer where practical, or mirror those formulas in PL/pgSQL only after tests are ported.

## Principles

- Mutating tournament operations should be server-side and transactional.
- RPCs must enforce role/permission checks before mutating rows.
- RPCs should return changed rows or a structured JSON summary for auditability.
- Production credentials/live Supabase should not be used until Brook explicitly approves.

## RPC overview

| Operation | Proposed function | Return |
|---|---|---|
| Player pre-registration | `dpt_pre_register_player` | `tournament_entries` row |
| Admin check-in | `dpt_check_in_player` | `tournament_entries` row |
| Add-on/rebuy | `dpt_add_tournament_addon` | updated `tournament_entries` row |
| Close/open registration | `dpt_set_registration_closed` | updated `tournaments` row |
| Materialize payout rows | `dpt_materialize_tournament_payouts` | setof `tournament_payouts` |
| Eliminate player | `dpt_eliminate_player` | updated `tournament_entries` row |
| Undo player stat | `dpt_undo_player_stat` | updated `tournament_entries` row |
| Manual rank update | `dpt_recalculate_manual_ranks` | setof `tournament_entries` |
| Advance flight | `dpt_advance_flight_players` | JSON summary |
| Undo flight advancement | `dpt_undo_flight_advancement` | JSON summary |
| TOC qualifiers | `dpt_get_toc_qualifiers` | JSON or table rows |

## Detailed signatures

### `dpt_pre_register_player`

```sql
public.dpt_pre_register_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_submitted_initial_buyin integer,
  p_include_addons boolean default false,
  p_total_addon_buyin integer default 0,
  p_no_of_addons integer default 0
) returns public.tournament_entries
```

Expected behavior:

- reject if registration window has ended
- reject if entry already exists
- calculate buy-in/chips from tournament configuration
- insert `pre_registered = true`, `checked_in = false` or keep semantic distinction from Laravel’s confusing `checked_in = 1` pre-reg behavior

### `dpt_check_in_player`

```sql
public.dpt_check_in_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_submitted_initial_buyin integer,
  p_initial_chips_count integer,
  p_include_addons boolean default false,
  p_total_addon_buyin integer default 0,
  p_no_of_addons integer default 0,
  p_checked_in_by uuid default auth.uid()
) returns public.tournament_entries
```

Expected behavior:

- reject duplicate entry unless converting pre-registration
- subtract dealer fee for non-freerolls
- calculate add-on totals and chips
- write entry and optional add-on ledger row

### `dpt_add_tournament_addon`

```sql
public.dpt_add_tournament_addon(
  p_tournament_entry_id bigint,
  p_addon_buy_in_amount integer,
  p_addon_count integer,
  p_created_by uuid default auth.uid()
) returns public.tournament_entries
```

Expected behavior:

- insert `tournament_entry_addons` row
- update entry totals: total buy-in, add-on count, total add-on chips, total chips

### `dpt_set_registration_closed`

```sql
public.dpt_set_registration_closed(
  p_tournament_id bigint,
  p_closed boolean,
  p_actor uuid default auth.uid()
) returns public.tournaments
```

Expected behavior:

- set `registration_closed`
- when closing, set `registration_closed_by` and `registration_closed_at`

### `dpt_materialize_tournament_payouts`

```sql
public.dpt_materialize_tournament_payouts(
  p_tournament_id bigint,
  p_payout_template_id bigint,
  p_total_distribution_amount integer default null
) returns setof public.tournament_payouts
```

Expected behavior:

- delete/replace existing tournament payout rows
- materialize template percentages or static/free-roll points/prize rows
- optionally recalculate already-ranked entries

### `dpt_eliminate_player`

```sql
public.dpt_eliminate_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_actor uuid default auth.uid()
) returns public.tournament_entries
```

Expected behavior:

- determine tournament type
- compute rank from remaining non-pre-registered players
- apply DPT/Satellite/Freeroll/Flight branch behavior
- set winnings, score, eliminated, sequence, final table as appropriate

### `dpt_undo_player_stat`

```sql
public.dpt_undo_player_stat(
  p_tournament_id bigint,
  p_player_id uuid,
  p_actor uuid default auth.uid()
) returns public.tournament_entries
```

Expected behavior:

- clear rank/score/winnings/eliminated/sequence/final table
- if flight, restore chips from initial chips + add-on chips

### `dpt_recalculate_manual_ranks`

```sql
public.dpt_recalculate_manual_ranks(
  p_tournament_id bigint,
  p_rank_edits jsonb,
  p_actor uuid default auth.uid()
) returns setof public.tournament_entries
```

`p_rank_edits` draft shape:

```json
[
  {"player_id":"uuid", "rank":1, "total_buy_in_amount":300, "bounty":25, "total_chips":0}
]
```

Expected behavior:

- apply admin corrections
- recalculate winnings/score/final table
- permit duplicate ranks when admin intentionally creates ties

### `dpt_advance_flight_players`

```sql
public.dpt_advance_flight_players(
  p_flight_tournament_id bigint,
  p_actor uuid default auth.uid()
) returns jsonb
```

Expected behavior:

- find main tournament from flight
- mark remaining flight players qualified
- create/update main tournament entries
- insert `flight_advancements` ledger rows
- handle `highest` vs `sum` chip carryover
- mark/rank flight survivors

### `dpt_undo_flight_advancement`

```sql
public.dpt_undo_flight_advancement(
  p_flight_tournament_id bigint,
  p_actor uuid default auth.uid()
) returns jsonb
```

Expected behavior:

- mark matching `flight_advancements.undone_at`
- recalculate/remove main entries for affected players
- reset flight player qualified/eliminated/rank state

### `dpt_get_toc_qualifiers`

```sql
public.dpt_get_toc_qualifiers(
  p_tournament_id bigint
) returns table (
  tournament_id bigint,
  player_id uuid,
  rank integer,
  tournament_type public.tournament_type_code,
  tournament_end_at timestamptz
)
```

Expected behavior:

- read TOC selectors from `toc_qualified_types` and `toc_qualified_tournaments`
- return rank-1, non-pre-registered players
- sort newest tournament first

## Open implementation decisions

- Whether RPCs should be pure PL/pgSQL or thin wrappers around app/server logic.
- Exact permission helper shape: `public.has_role(auth.uid(), 'admin')` etc.
- Whether `checked_in` should be false for pre-registered players in the rebuild, improving Laravel semantics.
- Whether manual rank recalculation should store display score separately or continue storing score without bounty.
