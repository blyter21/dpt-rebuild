# DPT Vercel Preview Package

## Status

Prepared for review only. No Vercel project was linked and no deployment was run.

## Recommended Vercel project setup

Use the public replacement app as the Vercel project root:

```text
Root Directory: apps/site
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Development Command: npm run dev
```

App-local Vercel config:

```text
apps/site/vercel.json
```

## Why apps/site as project root

```text
Keeps preview focused on the public DPT replacement app.
Avoids deploying admin prototype/mock tooling.
Keeps Vercel routing/build behavior aligned with the Next app.
Still allows the app build to use repo scripts via ../../scripts.
```

## Required preview env vars

Safe JSON/local preview mode:

```text
DPT_DATA_SOURCE=json
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=
```

Supabase preview mode after Supabase is ready:

```text
DPT_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-preview-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-anon-key
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://your-cdn-or-supabase-public-media-base
```

Do **not** add service-role keys to Vercel public/frontend env.

## Preview deployment preflight checklist

Before first Vercel preview:

```text
[ ] Brook approves running a Vercel preview deploy.
[ ] Vercel account/team/project target selected.
[ ] Root Directory set to apps/site.
[ ] Env vars reviewed and set to JSON fallback first unless Supabase preview is ready.
[ ] npm run dpt:verify:public passes locally.
[ ] reports/dpt-vercel-preview-preflight-report.md reviewed.
[ ] No service-role keys or production secrets in env.
[ ] Supabase mode remains off unless Supabase schema/seed/RLS are verified.
[ ] First deploy uses Vercel preview URL only, not production domain.
```

## First preview recommendation

Start with JSON fallback mode:

```text
DPT_DATA_SOURCE=json
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=
```

This previews the faithful public site using local copied media and SQL-derived static JSON. Supabase can be switched on later after Docker/cloud validation.

## Do not do yet

```text
Do not map dakotapokertour.com.
Do not map production DNS.
Do not connect production Supabase.
Do not upload media to final bucket without approval.
Do not add service-role key to Vercel.
```
