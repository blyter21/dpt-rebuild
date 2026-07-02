# Loop 066 — Production Media URL Mapping

## Goal

Locate production media/assets referenced by the SQL and update the SQL-backed public site to render real event/article/venue/player images instead of placeholder blocks.

## Located production asset paths

From live DakotaPokerTour.com DOM/background images and URL probes:

| Asset type | URL pattern |
|---|---|
| Official logo | `https://dakotapokertour.com/images/logo.png` |
| Event posters | `https://dakotapokertour.com/storage/event/medium/{filename}` |
| Tournament posters | `https://dakotapokertour.com/storage/tournament/medium/{filename}` |
| Article/news thumbs | `https://dakotapokertour.com/storage/article/thumb/{filename}` |
| Player avatars | `https://dakotapokertour.com/storage/profile/medium/{filename}` |
| Venue logos/photos | `https://dakotapokertour.com/storage/venue/medium/{filename}` |

## Files changed

```text
scripts/extract_public_dpt_data.py
apps/site/data/dpt-public.json
apps/site/components/site.tsx
apps/site/app/page.tsx
apps/site/app/videos/page.tsx
apps/site/app/events/[alias]/page.tsx
apps/site/app/tournaments/[alias]/page.tsx
apps/site/app/globals.css
apps/site/tests/public-data.test.ts
```

## Result

The extractor now emits media URL fields:

```text
events[].imageUrl
terms/tournaments[].imageUrl
articles[].imageUrl
venues[].imageUrl
leaderboard[].avatarUrl
```

The homepage and public pages now render:

```text
official DPT logo
player avatars in leaderboard
event poster images
article/news thumbnails
venue logos/photos
tournament/event detail images
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
curl homepage media URL check
remote asset HTTP 200 checks
browser visual verification
npm audit --omit=dev
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 5 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
Remote sample assets: 200 OK for event, tournament, article, venue, and profile images
Browser visual check: official logo, avatars, event posters, news thumbs, and venue logos visible
```

Current local URL:

```text
http://localhost:3001
```

Current process:

```text
proc_49f47516e6c9
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_4133f8e49e124ac3b75058223de10230.png
```

## Remaining limitations

```text
Assets are currently referenced from live dakotapokertour.com URLs, not self-hosted on the new stack yet.
Videos section still needs richer video cards/embeds.
Some news/champion rows still use generic fallback blocks.
Some venue images are real but visually inconsistent in size/crop.
Some imported text still has encoding/symbol cleanup issues.
Header still contains staging copy: "New stack replacement".
```

## Next recommended loop

```text
Create a media migration manifest from apps/site/data/dpt-public.json that lists every referenced production asset URL, downloads a safe local sample set, reports missing/broken assets, and prepares the path for copying all media into our own new-stack storage bucket.
```
