# Loop 065 — SQL-Backed Public Subpages

## Goal

Build real public subpages for Events, Leaderboard, Venues, News, Champions, and Tournament detail routes from `apps/site/data/dpt-public.json`, preserving the SQL-backed public app direction and not extending the old mock shell.

## Routes added

```text
/events
/events/[alias]
/leaderboard
/venues
/news
/champions
/tournaments/[alias]
```

Also added lightweight nav targets so header links do not dead-end:

```text
/videos
/players
/login
```

## Files changed

```text
apps/site/components/site.tsx
apps/site/lib/dpt-data.ts
apps/site/app/page.tsx
apps/site/app/events/page.tsx
apps/site/app/events/[alias]/page.tsx
apps/site/app/leaderboard/page.tsx
apps/site/app/venues/page.tsx
apps/site/app/news/page.tsx
apps/site/app/champions/page.tsx
apps/site/app/tournaments/[alias]/page.tsx
apps/site/app/videos/page.tsx
apps/site/app/players/page.tsx
apps/site/app/login/page.tsx
apps/site/app/globals.css
apps/site/tests/public-data.test.ts
```

## Production-data edge case fixed

The first build failed because a real production event alias was too long for static prerender file names. Detail pages now use dynamic rendering:

```text
export const dynamic = 'force-dynamic';
```

for:

```text
/events/[alias]
/tournaments/[alias]
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
curl route smoke checks for /, /events, /events/[alias], /leaderboard, /venues, /news, /champions, /tournaments/[alias]
browser check: /events and /tournaments/[alias]
npm audit --omit=dev
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 4 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
HTTP route smoke checks: passed
Browser tournament detail check: passed
```

## Current local URL

```text
http://localhost:3001
```

Current process:

```text
proc_eb60a34c1a24
```

## Known limitations

```text
Real image/media import still needed.
Auth/login is intentionally non-functional pending new-stack auth decisions.
News/article detail pages are not built yet.
Venue detail pages are not built yet.
Event/tournament detail pages are data-backed but not yet pixel-faithful.
```
