# 06 — Migration Plan

## Stage 0 — Local lab

- Build specs and tournament engine locally.
- Use fake/sanitized seed data.
- No cloud credentials or production data.

## Stage 1 — Dev Supabase

- Create `dpt-rebuild-dev` Supabase project.
- Apply draft schema.
- Seed fake tournaments, players, flights, payouts.
- Validate RLS with local/dev users.

## Stage 2 — Data inventory

Need from current production:

- MySQL schema dump
- sanitized sample rows
- media inventory for logos/banners/avatars/articles
- active admin roles/users
- current integrations actually in use

## Stage 3 — Migration scripts

Map current tables to new schema:

| Current | Target |
|---|---|
| `users` | `profiles` + roles |
| `dpt_leagues` | `leagues` |
| `dpt_seasons` | `seasons` |
| `dpt_venues` | `venues` |
| `dpt_events` | `events` |
| `dpt_tournaments` | `tournaments` + qualifier/TOC join tables |
| `dpt_tournament_players` | `tournament_entries` |
| `dpt_tournament_players_addon` | `tournament_entry_addons` |
| `dpt_tournament_payout_distributions` | `tournament_payouts` |
| flight state | `flight_advancements` |

## Stage 4 — Parallel validation

Run old and new calculations side-by-side for sample tournaments:

- prize pools
- scores
- ranks
- winnings
- final table flags
- flight advancement chips
- TOC qualifiers

## Stage 5 — Cutover later

Only after prototype validation:

- freeze old writes
- final data/media migration
- DNS/domain switch
- rollback plan
