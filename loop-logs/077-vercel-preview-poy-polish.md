# Loop 077 — Vercel Preview POY Strip Polish

## Goal

Fix the live Vercel preview polish issue: tighten the Player of the Year strip so it does not clip/overflow on desktop/mobile, then push the fix to GitHub, let Vercel auto-deploy, and re-run live preview route/media/browser smoke checks.

## Local changes

```text
apps/site/components/site.tsx
apps/site/app/globals.css
```

## Fix

Changed the homepage Player of the Year strip from a 10-player horizontally clipped strip to a clean top-5 preview.

Full leaderboard remains available at:

```text
/leaderboard
```

CSS updates:

```text
minmax(0, 1fr) scroller grid column
contained flex row for POY tiles
smaller/tighter tile/avatar text sizing
mobile tile width overrides
styled horizontal scrollbar for future scrollable use
```

## Verification

```text
npm --workspace apps/site test -> 10 passed
npm --workspace apps/site run typecheck -> passed
npm --workspace apps/site run build -> passed
local route/media smoke -> 11 routes passed, 33 local images before top-5 change; browser DOM after top-5 showed 28 local images and 0 old-host storage images
browser DOM -> tileCount: 5, all POY tiles fully visible, document width within viewport
browser visual -> no awkward clipped POY card at right edge, page remains styled
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_5e9cdd30b312436eb0ccaf7191fe15b7.png
```

## Current local process

```text
proc_d5c451e127de
```

## Pending

```text
Commit and push to GitHub.
Wait for Vercel auto-deploy.
Verify https://dpt-rebuild-site.vercel.app after redeploy.
```
