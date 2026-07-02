# DPT Vercel Preview Preflight Report

## Scope

Prepared a Vercel preview deployment package without deploying.

## Safety

```text
No Vercel project linked
No Vercel deploy run
No Supabase project linked
No cloud credentials written
No production mutation
```

## Added preview package files

```text
apps/site/vercel.json
docs/DPT_VERCEL_PREVIEW_PACKAGE.md
docs/DPT_VERCEL_ENV_VARS.md
```

## Recommended Vercel project settings

```text
Root Directory: apps/site
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Development Command: npm run dev
```

## Recommended first preview env

Use JSON fallback mode first:

```text
DPT_DATA_SOURCE=json
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=
```

Do not set Supabase env vars until Supabase schema/seed/RLS are validated in Docker/cloud.

## Full readiness verification

Ran:

```bash
npm run dpt:verify:public
```

Result:

```text
Environment discovery: passed
Seed generation: passed
Embedded Postgres validation: passed
Media storage plan generation: passed
JSON fallback tests: 10 passed
JSON fallback typecheck: passed
Supabase source-mode typecheck without credentials: passed
Next build: passed
```

## Final clean dev smoke

After the production build, restarted dev cleanly from an empty `.next`.

Current local process:

```text
proc_f078e71bd1a8
```

HTTP route/media smoke:

```text
11 route smoke checks passed
routes: 11
localImages: 33
remoteStorageImages: 0
cdnExamplePresent: false
heroSliderLocal: true
videoThumbLocal: true
```

Machine-readable smoke report:

```text
reports/dpt-vercel-preview-route-media-smoke.json
```

## Browser visual preflight

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_8ada7e621e054697b3b20e68d7947b5d.png
```

Visual result:

```text
Header/nav visible
Hero visible
POY strip visible
Past Events cards visible
News/Latest Posts sidebar visible
Video thumbnail cards visible
Venues grid visible
Footer visible
No major broken UI visible
```

Browser console:

```text
JS errors: 0
Only React DevTools dev info message
```

## Known pre-preview cautions

```text
Player of the Year strip may clip/scroll at right edge.
Some thumbnails intentionally use DPT placeholders.
Hero image crop/blur should be owner-approved.
Login route is placeholder.
Next/PostCSS audit warning remains until dedicated Next 16 upgrade loop.
```

## Approval question for Brook

Proceeding to an actual Vercel preview would require Brook approval and a Vercel account/project target. Recommended first preview remains JSON fallback mode with no Supabase connection.
