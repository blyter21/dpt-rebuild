# Loop 072 — Supabase Public Migration Path

## Goal

Start the Supabase migration path: design the Postgres schema/views from the production SQL for public data first, create migration/seed scripts for events, tournaments, venues, articles, leaderboard/results, and media manifest paths, then switch apps/site from JSON files to a local Supabase-compatible data access layer without deploying or mutating production.

## Result

Completed a local-only Supabase migration path for public DPT data.

## Added

```text
supabase/migrations/20260701171500_dpt_public_schema.sql
scripts/build_dpt_supabase_seed.py
supabase/seed/dpt_public_seed.sql
apps/site/lib/dpt-repository.ts
reports/dpt-supabase-public-migration-path.md
```

## Schema includes

```text
dpt_public_venues
dpt_public_events
dpt_public_tournaments
dpt_public_articles
dpt_public_players
dpt_public_leaderboard_entries
dpt_public_champions
dpt_public_videos
dpt_media_assets
```

Views:

```text
dpt_public_event_cards
dpt_public_tournament_details
dpt_public_homepage
```

## Seed counts

```text
venues: 77
events: 60
tournaments: 80
articles: 80
players: 25
leaderboard: 25
champions: 40
videos: 2
mediaAssets: 328
```

## App data access change

Public pages now use:

```ts
getDptRepository()
```

instead of importing raw JSON directly in page components.

Pages switched:

```text
/
/events
/events/[alias]
/tournaments/[alias]
/news
/leaderboard
/venues
/champions
/players
```

## Verification

```text
npm run dpt:seed:public
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
repository-backed route smoke checks
browser DOM/media check
```

Actual results:

```text
Supabase CLI: 2.108.0
Site tests: 1 file / 8 tests passed
Typecheck: passed
Build: passed
Route smoke checks: 11 passed
Browser DOM: hero + POY present, 33 local images, 0 remote storage images
```

## Safety

```text
No Supabase project linked
No DB connection opened
No cloud writes
No deploy
No production mutation
```

Current local process:

```text
proc_c5ac6d473ac4
```

## Limitation

Docker/psql are unavailable in this environment, so migrations were not executed against a real local Supabase DB yet.

## Next recommended loop

```text
Install/enable a local Supabase runtime or Docker-backed Postgres, execute the new public schema and seed SQL locally, validate row counts/views/RLS behavior, then add a SupabaseRepository implementation behind the existing getDptRepository interface while keeping the JSON repository as fallback.
```
