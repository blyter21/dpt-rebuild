# Loop 074 — Vercel/Supabase Deployment Readiness Layer

## Goal

Prepare the Vercel/Supabase deployment readiness layer without deploying: add environment templates, source-mode docs, Supabase smoke-test checklist for when Docker/cloud credentials are available, and CI-style commands that verify JSON fallback, Supabase mode type safety, schema/seed generation, local Postgres validation, tests, and build.

## Added

```text
.env.example
.env.supabase.example
apps/site/.env.example
apps/site/.env.supabase.example
docs/DPT_SOURCE_MODES.md
docs/DPT_SUPABASE_SMOKE_TEST.md
docs/DPT_DEPLOYMENT_READINESS.md
scripts/verify_dpt_deployment_readiness.sh
reports/dpt-deployment-readiness-verification.md
```

## Package scripts

Added:

```bash
npm run dpt:verify:public
```

Existing readiness commands now include:

```bash
npm run dpt:seed:public
npm run dpt:db:validate
npm run dpt:media:manifest
npm run dpt:verify:public
```

## Source modes documented

```text
DPT_DATA_SOURCE=json      safe default / JSON fallback
DPT_DATA_SOURCE=supabase  explicit Supabase/PostgREST opt-in
```

Supabase mode requires:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No service-role key is needed for the public read-only site.

## Verification

Ran:

```bash
npm run dpt:verify:public
```

Actual output:

```text
seed generation: passed
embedded Postgres validation: passed
JSON fallback tests: 9 passed
JSON fallback typecheck: passed
Supabase source-mode typecheck without credentials: passed
Next build: passed
```

After build, restarted dev cleanly and ran route smoke checks:

```text
11 route smoke checks passed
```

Browser check:

```text
hero present: true
POY strip present: true
local images: 33
remote storage images: 0
```

Current local process:

```text
proc_ce6e2ca86b98
```

## Safety

```text
No deploy
No Supabase project link
No cloud credentials
No production DB mutation
No Laravel/AWS change
```

## Remaining blockers

```text
Docker/local Supabase still unavailable.
Real Supabase RLS behavior still requires Docker/cloud Supabase smoke testing.
Final storage/CDN target for local media not selected.
Vercel preview env vars not configured.
Next/PostCSS audit upgrade remains pre-deployment.
```

## Next recommended loop

```text
Create the final media-storage migration plan for Supabase Storage or Vercel/public CDN: map every local /media/dpt asset to final bucket/object paths, generate upload commands/manifests without uploading, update media path abstraction to support a future CDN base URL, and verify JSON/Supabase modes still render local media by default.
```
