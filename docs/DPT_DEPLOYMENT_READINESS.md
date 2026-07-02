# DPT Vercel/Supabase Deployment Readiness

## Status

This repo is **not deployed yet** and is **not connected to a live Supabase project**.

Current safe default:

```text
DPT_DATA_SOURCE=json
```

The public site currently runs from:

```text
SQL-derived public JSON
local copied media under apps/site/public/media/dpt
repository boundary via getDptRepository()
```

## Target stack

```text
Next.js / React
Vercel
Supabase Postgres
Supabase Storage or equivalent public media storage/CDN
```

## Do-not-deploy-yet checklist

Do not deploy until these are explicitly approved/complete:

```text
[ ] Supabase project chosen: local/staging/production
[ ] Public schema and seed executed in real Supabase/Postgres
[ ] RLS anon read behavior verified in real Supabase
[ ] Final media storage bucket/CDN path chosen
[ ] Local media copied/uploaded to final storage
[ ] Vercel preview env vars reviewed
[ ] Vercel project Root Directory set to apps/site
[ ] First deploy target is preview URL only, not production domain
[ ] Next/PostCSS audit upgrade plan accepted or risk explicitly accepted for preview
[ ] Brook approves preview deployment
```

## Source modes

See:

```text
docs/DPT_SOURCE_MODES.md
docs/DPT_VERCEL_ENV_VARS.md
docs/DPT_VERCEL_PREVIEW_PACKAGE.md
```

Modes:

```text
DPT_DATA_SOURCE=json       # safe default/fallback
DPT_DATA_SOURCE=supabase   # explicit opt-in with Supabase URL/anon key
```

## Environment templates

```text
.env.example
.env.supabase.example
apps/site/.env.example
apps/site/.env.supabase.example
```

Rules:

```text
Never commit real keys.
Never put service-role keys in public Next/Vercel env.
Use anon key for public read-only data.
Use staging/preview before production.
```

## Readiness verification command

Run the full local readiness gate:

```bash
npm run dpt:verify:public
```

This performs:

```text
environment discovery
seed generation
embedded Postgres validation
media storage plan generation
tests in JSON mode
typecheck in JSON mode
typecheck in Supabase mode without credentials
Next build
```

Optional HTTP route smoke check after starting local dev:

```bash
npm --workspace apps/site run dev -- --hostname 0.0.0.0
DPT_VERIFY_HTTP_URL=http://127.0.0.1:3001 npm run dpt:verify:public
```

## Supabase smoke testing

See:

```text
docs/DPT_SUPABASE_SMOKE_TEST.md
```

When Docker or Supabase cloud credentials are available, validate:

```text
row counts
homepage aggregate view
public event/tournament/article/venue reads
RLS anon read policies
app route rendering in DPT_DATA_SOURCE=supabase mode
```

## Current validation evidence

```text
reports/dpt-local-postgres-validation.json
reports/dpt-local-postgres-supabase-repository-validation.md
reports/dpt-supabase-public-migration-path.md
reports/dpt-media-storage-migration-plan.md
apps/site/data/dpt-media-storage-manifest.json
```

Current local embedded Postgres-compatible validation passes:

```text
venues: 77
events: 60
tournaments: 80
articles: 80
players: 25
leaderboard: 25
champions: 40
videos: 2
media assets: 328
```

## Known blockers / risks

```text
Docker/Postgres unavailable in current WSL runtime.
Real Supabase RLS role enforcement is not yet tested.
Final media bucket/CDN not selected.
Vercel project not linked.
Next/PostCSS audit warnings remain until a dedicated Next upgrade loop.
Login/auth remains placeholder.
Admin/backend migration is not connected to Supabase yet.
```

## Recommended pre-preview order

```text
1. Enable Docker/local Supabase or create staging Supabase project.
2. Execute migration + seed.
3. Validate row counts/views/RLS from docs/DPT_SUPABASE_SMOKE_TEST.md.
4. Copy media to final storage bucket/CDN and update media paths.
5. Run npm run dpt:verify:public.
6. Configure Vercel preview env vars.
7. Deploy preview only after approval.
```
