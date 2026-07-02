# DPT Local Postgres / Supabase Repository Validation

## Scope

Execute the public schema and seed SQL locally, validate row counts/views, and add a SupabaseRepository behind the existing `getDptRepository()` interface while preserving JSON fallback.

## Environment discovery

```text
Supabase CLI: 2.108.0
Docker: not installed
Docker Compose: not installed
psql: not installed
postgres: not installed
podman: not installed
sudo: password required
Runtime fallback used: PGlite embedded Postgres-compatible runtime
```

Because Docker/Postgres were unavailable, validation used PGlite for local SQL execution. This validates SQL table/view/seed shape and counts, but real Supabase/Docker still needs to validate role/RLS enforcement.

## Schema bug fixed

PGlite execution caught a real SQL issue:

```text
dpt_media_assets.references
```

`references` is a reserved SQL keyword. Fixed to:

```text
dpt_media_assets.asset_references
```

Updated:

```text
supabase/migrations/20260701171500_dpt_public_schema.sql
scripts/build_dpt_supabase_seed.py
supabase/seed/dpt_public_seed.sql
```

## Local DB validation command

```bash
npm run dpt:seed:public
npm run dpt:db:validate
```

Validation script:

```text
scripts/validate_dpt_public_postgres.mjs
```

JSON evidence:

```text
reports/dpt-local-postgres-validation.json
```

## Validation result

Schema executed:

```text
true
```

Seed executed:

```text
true
```

Counts:

| Table | Expected | Actual | Result |
|---|---:|---:|---|
| `dpt_public_venues` | 77 | 77 | pass |
| `dpt_public_events` | 60 | 60 | pass |
| `dpt_public_tournaments` | 80 | 80 | pass |
| `dpt_public_articles` | 80 | 80 | pass |
| `dpt_public_players` | 25 | 25 | pass |
| `dpt_public_leaderboard_entries` | 25 | 25 | pass |
| `dpt_public_champions` | 40 | 40 | pass |
| `dpt_public_videos` | 2 | 2 | pass |
| `dpt_media_assets` | 328 | 328 | pass |

Homepage view payload:

```text
events: 60
leaderboard: 25
articles: 80
venues: 77
champions: 40
videos: 2
```

## RLS behavior

The migration contains:

```text
enable row level security
create policy ... for select using (true)
```

PGlite executed the schema and retained the RLS/policy SQL shape, but this is **not** a substitute for Docker/Supabase role-enforcement QA. Real RLS behavior still needs:

```bash
npx supabase start
npx supabase db reset
```

then role-specific read tests.

## Repository implementation

Updated:

```text
apps/site/lib/dpt-repository.ts
```

Added:

```text
SupabaseDptRepository
createSupabaseDptRepository()
getDptRepository()
```

Default behavior:

```text
DPT_DATA_SOURCE unset/json -> localDptRepository
```

Supabase opt-in behavior:

```text
DPT_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The repository uses Supabase/PostgREST over built-in `fetch` instead of adding `@supabase/supabase-js`, which keeps Node 18 compatibility and avoids introducing additional client-package audit issues during this local loop.

If Supabase mode is requested but env vars are missing:

```text
falls back to localDptRepository
```

Pages were converted to async repository reads so both JSON and Supabase implementations fit the same interface.

## App verification

```text
npm --workspace apps/site test: 1 file / 8 tests passed
npm --workspace apps/site run typecheck: passed
npm --workspace apps/site run build: passed
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck: passed
Route smoke checks: 11 passed
Browser check: hero + POY present, 33 local images, 0 remote storage images
Console JS errors: 0
```

## Current local process

```text
proc_90adcda890b7
```
