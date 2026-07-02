# Loop 073 — Local Postgres Validation + SupabaseRepository

## Goal

Install/enable a local Supabase runtime or Docker-backed Postgres, execute the new public schema and seed SQL locally, validate row counts/views/RLS behavior, then add a SupabaseRepository implementation behind the existing getDptRepository interface while keeping the JSON repository as fallback.

## Environment result

```text
Docker: unavailable
Docker Compose: unavailable
psql/postgres: unavailable
podman: unavailable
sudo: password required
Supabase CLI: 2.108.0
```

Because Docker/Postgres could not be installed or started without sudo, I used PGlite as the local embedded Postgres-compatible runtime for schema/seed execution validation.

## Added/changed

```text
scripts/validate_dpt_public_postgres.mjs
reports/dpt-local-postgres-validation.json
reports/dpt-local-postgres-supabase-repository-validation.md
apps/site/lib/dpt-repository.ts
apps/site/app/**/*.tsx
package.json
package-lock.json
apps/site/package.json
supabase/migrations/20260701171500_dpt_public_schema.sql
scripts/build_dpt_supabase_seed.py
supabase/seed/dpt_public_seed.sql
```

## Schema execution

Initial local SQL execution caught a real schema issue:

```text
references is a reserved keyword
```

Fixed:

```text
dpt_media_assets.references -> dpt_media_assets.asset_references
```

## Local DB validation

Ran:

```bash
npm run dpt:seed:public
npm run dpt:db:validate
```

Result:

```text
schemaExecuted: true
seedExecuted: true
all expected row counts matched
homepage view payload validated
```

Counts:

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

Homepage view:

```text
events: 60
leaderboard: 25
articles: 80
venues: 77
champions: 40
videos: 2
```

## RLS note

The migration includes RLS enable statements and public read policies. PGlite validates the SQL shape, but Docker/Supabase is still required for true role-enforcement testing.

## Repository result

Added:

```text
SupabaseDptRepository
createSupabaseDptRepository()
getDptRepository()
```

Default:

```text
JSON fallback/localDptRepository
```

Supabase opt-in:

```text
DPT_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`SupabaseDptRepository` currently uses Supabase/PostgREST via built-in `fetch`; no `@supabase/supabase-js` dependency is required for public reads yet.

Pages were converted to async repository reads so the app can use either JSON fallback or Supabase reads.

## Verification

```text
npm --workspace apps/site test -> 8 passed
npm --workspace apps/site run typecheck -> passed
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck -> passed
npm --workspace apps/site run build -> passed
route smoke checks -> 11 passed
browser DOM/media check -> hero + POY present, 33 local images, 0 remote storage images
console JS errors -> 0
```

Current local process:

```text
proc_90adcda890b7
```

## Remaining blocker

A true Supabase Docker-backed runtime still cannot run here until Docker/Postgres is installed/enabled in WSL/host.

## Next recommended loop

```text
Prepare the Vercel/Supabase deployment readiness layer without deploying: add environment templates, transport/source-mode docs, a Supabase smoke-test checklist for when Docker/cloud credentials are available, and CI-style commands that verify JSON fallback, Supabase mode type safety, schema/seed generation, local Postgres validation, tests, and build.
```
