# Loop 064 — Clean SQL-Backed Public Site

## Goal

Create a clean DPT replacement app path using the uploaded production SQL as source-of-truth, extract real public data, and build the first faithful public homepage/navigation from real data instead of mock data.

## Files changed

```text
scripts/extract_public_dpt_data.py
apps/site/package.json
apps/site/next.config.mjs
apps/site/tsconfig.json
apps/site/next-env.d.ts
apps/site/app/layout.tsx
apps/site/app/page.tsx
apps/site/app/globals.css
apps/site/data/dpt-public.json
apps/site/tests/public-data.test.ts
DPT_REPLACEMENT_SITE_RESULTS.md
```

## Result

Created a new app:

```text
apps/site
```

It reads the uploaded SQL and generates:

```text
apps/site/data/dpt-public.json
```

Then renders a public Dakota Poker Tour homepage using real production SQL data.

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
curl http://127.0.0.1:3001
browser visual verification
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 3 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
@dpt/admin-prototype test: 11 files / 46 tests passed
@dpt/tournament-engine test: 6 files / 31 tests passed
HTTP /: 200 OK
```

## Browser evidence

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_48b90be8f73d4751ab7f497c8b595b7c.png
```

## Safety

```text
No production mutation
No Laravel writes
No AWS writes
No Supabase writes
No deploy
Local SQL-derived static data only
```
