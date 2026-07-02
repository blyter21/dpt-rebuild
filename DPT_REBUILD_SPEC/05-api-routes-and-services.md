# 05 — API Routes and Services

## Current API surface

Current Laravel `routes/api.php` exposes public `register`/`login`, then Sanctum-protected CRUD/list routes for events, leagues, seasons, tournaments, and venues.

The web/admin controller appears more current than the API controller for core tournament logic.

## Proposed service layer

### Pure domain package

`packages/tournament-engine` should contain pure functions with no database dependency:

- buy-in/add-on/chip calculations
- prize pool calculations
- score calculations
- satellite rank calculation
- flight advancement planning

### Server-side app services

Next.js API routes or Supabase RPC functions should wrap the pure logic and enforce transactions/security:

- `TournamentService`
- `TournamentEntryService`
- `PayoutService`
- `EliminationService`
- `FlightAdvancementService`
- `TocQualificationService`

## Route/API candidates

| Operation | API/RPC |
|---|---|
| Public tournament list/detail | query published rows |
| Player pre-registration | `pre_register_player` |
| Admin check-in | `check_in_player` |
| Admin add-on | `add_tournament_addon` |
| Close/open registration | `set_registration_closed` |
| Materialize payout rows | `materialize_tournament_payouts` |
| Single elimination | `eliminate_player` |
| Edit elimination/rank | `update_eliminated_ranks` |
| Flight stop/advance | `advance_flight_players` |
| Undo flight advance | `undo_flight_advancement` |
| TOC qualified players | query winners/rank 1 by configured selectors |

## Compatibility question

Before launch we must confirm whether any existing mobile/admin client depends on the current Sanctum API. If yes, either preserve a compatibility layer or version the new API.
