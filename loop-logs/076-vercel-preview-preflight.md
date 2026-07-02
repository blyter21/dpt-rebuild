# Loop 076 — Vercel Preview Package Preflight

## Goal

Prepare a Vercel preview deployment package without deploying: add vercel.json/project notes if needed, document required Vercel env vars, create a preflight checklist for preview deployment, and run a final production-build/route/media smoke report that Brook can use to approve the first Vercel preview.

## Added

```text
apps/site/vercel.json
docs/DPT_VERCEL_PREVIEW_PACKAGE.md
docs/DPT_VERCEL_ENV_VARS.md
reports/dpt-vercel-preview-preflight-report.md
reports/dpt-vercel-preview-route-media-smoke.json
```

## Vercel project recommendation

```text
Root Directory: apps/site
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Development Command: npm run dev
```

## First preview env recommendation

```text
DPT_DATA_SOURCE=json
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=
```

Keep Supabase off for first preview unless Brook explicitly approves connecting a verified Supabase project.

## Verification

Ran:

```bash
npm run dpt:verify:public
```

Actual result:

```text
seed generation: passed
embedded Postgres validation: passed
media storage plan generation: passed
JSON fallback tests: 10 passed
JSON fallback typecheck: passed
Supabase source-mode typecheck without credentials: passed
Next build: passed
```

After build, restarted dev cleanly and ran final route/media smoke:

```text
routes: 11
localImages: 33
remoteStorageImages: 0
cdnExamplePresent: false
heroSliderLocal: true
videoThumbLocal: true
```

Browser screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_8ada7e621e054697b3b20e68d7947b5d.png
```

Browser console:

```text
JS errors: 0
```

Current process:

```text
proc_f078e71bd1a8
```

## Safety

```text
No Vercel deploy
No Vercel project link
No Supabase cloud link
No credentials written
No production mutation
```

## Remaining before actual preview

```text
Brook approves first preview.
Choose Vercel account/team/project target.
Set Vercel Root Directory to apps/site.
Set preview env vars in JSON fallback mode.
Do not map production domain yet.
```

## Next recommended loop

```text
If Brook approves, perform a guided first Vercel preview setup/deploy in JSON fallback mode only: have Brook log into/select Vercel account locally, create or select the Vercel project with Root Directory apps/site, set safe preview env vars, deploy preview, then verify the preview URL with route/media/browser smoke checks. Stop before custom domain, Supabase cloud connection, or production DNS.
```
