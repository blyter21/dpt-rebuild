# Loop 075 — Final Media Storage Migration Plan

## Goal

Create the final media-storage migration plan for Supabase Storage or Vercel/public CDN: map every local `/media/dpt` asset to final bucket/object paths, generate upload commands/manifests without uploading, update media path abstraction to support a future CDN base URL, and verify JSON/Supabase modes still render local media by default.

## Added

```text
scripts/build_dpt_media_storage_plan.py
apps/site/data/dpt-media-storage-manifest.json
reports/dpt-media-storage-migration-plan.md
reports/dpt-media-upload-commands.jsonl
reports/dpt-media-storage-plan-verification.md
```

## Updated

```text
apps/site/lib/dpt-data.ts
apps/site/app/page.tsx
apps/site/components/site.tsx
apps/site/package.json
package.json
.env.example
.env.supabase.example
apps/site/.env.example
apps/site/.env.supabase.example
docs/DPT_SOURCE_MODES.md
docs/DPT_DEPLOYMENT_READINESS.md
apps/site/tests/public-data.test.ts
scripts/verify_dpt_deployment_readiness.sh
```

## Manifest summary

```text
totalFiles: 312
totalBytes: 15,992,956
bucket: dpt-public-media
baseUrlEnv: NEXT_PUBLIC_DPT_MEDIA_BASE_URL
mode: dry-run/no-upload
```

By type:

```text
article: 78
event: 59
logo: 1
profile: 25
slider: 1
tournament: 72
venue: 74
video: 2
```

## Mapping rule

```text
/media/dpt/event/example.png
  -> bucket: dpt-public-media
  -> object: event/example.png
```

Future CDN env:

```text
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.com/dpt-public-media
```

## Runtime helper

Added:

```ts
publicMediaUrl(localPublicPath)
```

Behavior:

```text
blank NEXT_PUBLIC_DPT_MEDIA_BASE_URL -> render local /media/dpt/... paths
set NEXT_PUBLIC_DPT_MEDIA_BASE_URL -> render CDN/base URL paths
```

## Safety

```text
No upload performed
No Supabase project linked
No Vercel deploy
No production mutation
```

## Verification

```text
python3 scripts/build_dpt_media_storage_plan.py
npm --workspace apps/site test -> 10 passed
npm --workspace apps/site run typecheck -> passed
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck -> passed
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.test/dpt-public-media npm --workspace apps/site run typecheck -> passed
npm run dpt:verify:public -> passed
clean dev route/media smoke -> 11 routes passed, 33 local images, 0 old-host storage images, 0 CDN example images
browser DOM -> hero + POY present, 33 local images
```

Current local process:

```text
proc_8b89621f1b51
```

## Remaining work

```text
Choose final storage target: Supabase Storage bucket vs Vercel/static CDN vs other CDN.
Create bucket and upload only after approval.
Set NEXT_PUBLIC_DPT_MEDIA_BASE_URL only after uploaded objects are verified.
Real Supabase/Docker RLS smoke test is still pending because Docker is unavailable here.
```

## Next recommended loop

```text
Prepare a Vercel preview deployment package without deploying: add vercel.json/project notes if needed, document required Vercel env vars, create a preflight checklist for preview deployment, and run a final production-build/route/media smoke report that Brook can use to approve the first Vercel preview.
```
