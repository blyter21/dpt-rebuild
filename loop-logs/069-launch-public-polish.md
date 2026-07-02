# Loop 069 — Launch-Facing Public Site Polish

## Goal

Clean launch-facing public-site polish: remove staging copy like “New stack replacement,” clean encoding artifacts in SQL-derived article/event text, improve the Videos section with real video/article cards, and tighten homepage visual fidelity against live DakotaPokerTour.com.

## Result

Completed launch-facing polish on the SQL-backed public homepage.

## Changes

```text
Removed visible staging copy: “New stack replacement”
Changed header subtitle to FPN Gaming, Inc.
Added displayText() cleanup helper for visible imported content
Removed replacement boxes / unsupported card-suit emoji artifacts from card excerpts
Added real video seed data from live DakotaPokerTour.com homepage
Rendered two video cards/YouTube embeds on homepage and /videos
Added video-grid/video-frame styling
Kept all homepage media local-first via /media/dpt paths
```

Live video embeds added:

```text
Tri-State Championship Day 1 -> https://www.youtube.com/embed/TUj5rdgBHZQ
Hype Video - Cactus Jacks Open -> https://www.youtube.com/embed/UJvMmjhOXFc
```

## Files changed

```text
apps/site/data/dpt-public.json
scripts/extract_public_dpt_data.py
apps/site/lib/dpt-data.ts
apps/site/components/site.tsx
apps/site/app/page.tsx
apps/site/app/videos/page.tsx
apps/site/app/globals.css
apps/site/tests/public-data.test.ts
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
HTTP homepage checks
Browser visual screenshot
npm audit --omit=dev
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 7 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
HTTP checks: no staging copy, two video embeds present, no replacement boxes, local media still used
Browser visual check: styled page, staging copy removed, videos visible, text artifacts reduced
```

Current local URL:

```text
http://localhost:3001
```

Current process:

```text
proc_1053527807f9
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_b9de46ce31e8417d8ed930d66fee56c4.png
```

## Remaining limitations

```text
Video embeds show as black rectangles in screenshot; playback/thumbnails should be checked interactively.
Some excerpt truncation is still abrupt but controlled.
One or more fallback DPT/thumb blocks remain where content has no media.
Footer still contains Old Website link; confirm whether desired for final launch.
Mobile responsiveness has not had a dedicated pass yet.
```

## Next recommended loop

```text
Run a visual parity pass against the live DakotaPokerTour.com homepage and core public routes, capturing screenshots side-by-side, then adjust header/nav/hero/card/footer spacing and mobile responsiveness to more closely match the current production site.
```
