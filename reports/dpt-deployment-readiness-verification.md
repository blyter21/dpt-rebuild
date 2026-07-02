# DPT Vercel/Supabase Readiness Verification Report

## Scope

Prepared the deployment-readiness layer without deploying or connecting live credentials.

## Added

Environment templates:

```text
.env.example
.env.supabase.example
apps/site/.env.example
apps/site/.env.supabase.example
```

Docs:

```text
docs/DPT_SOURCE_MODES.md
docs/DPT_SUPABASE_SMOKE_TEST.md
docs/DPT_DEPLOYMENT_READINESS.md
```

CI-style verifier:

```text
scripts/verify_dpt_deployment_readiness.sh
npm run dpt:verify:public
```

## Verification command

Ran:

```bash
npm run dpt:verify:public
```

Result:

```text
Environment discovery: passed
Seed generation: passed
Embedded Postgres validation: passed
JSON fallback tests: passed
JSON fallback typecheck: passed
Supabase mode typecheck without credentials: passed
Next build: passed
```

Test result:

```text
Test Files 1 passed
Tests 9 passed
```

Build result:

```text
Next.js build passed
12 app routes generated
/events/[alias] and /tournaments/[alias] remain dynamic
```

## Clean dev route smoke

After the build, restarted dev from a clean `.next` and ran route smoke checks.

Current process:

```text
proc_ce6e2ca86b98
```

Result:

```text
11 route smoke checks passed
```

Routes:

```text
/
/events
/events/[representative alias]
/tournaments/[representative alias]
/leaderboard
/venues
/news
/videos
/champions
/players
/login
```

Browser check:

```text
hero present: true
POY strip present: true
local images: 33
remote storage images: 0
```

## Safety status

```text
No production mutation
No Supabase project linked
No Vercel deployment
No AWS/Laravel change
No real credentials written
```

## Remaining blockers before preview deploy

```text
Docker/local Supabase still unavailable in WSL.
Real Supabase RLS role behavior still needs Docker/cloud verification.
Final media storage bucket/CDN not selected.
Vercel project/env not configured.
Next/PostCSS audit upgrade remains pre-deployment.
Login/auth remains placeholder.
```
