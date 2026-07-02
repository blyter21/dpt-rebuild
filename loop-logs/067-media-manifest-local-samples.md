# Loop 067 — Media Migration Manifest + Local Sample Fallback

## Goal

Build the DPT media migration manifest and local sample media import, then update the SQL-backed public site to prefer local/self-hosted assets with fallback to old live DakotaPokerTour.com URLs.

## Result

Created:

```text
apps/site/data/dpt-media-manifest.json
reports/dpt-media-migration-report.md
scripts/build_dpt_media_manifest.py
apps/site/public/media/dpt/
```

## Manifest summary

```text
Total unique production asset URLs: 328
Valid HTTP 200 assets: 309
Broken/missing assets: 19
Downloaded local sample assets: 37
```

## Local sample paths

```text
apps/site/public/media/dpt/logo/
apps/site/public/media/dpt/event/
apps/site/public/media/dpt/tournament/
apps/site/public/media/dpt/article/
apps/site/public/media/dpt/venue/
apps/site/public/media/dpt/profile/
```

The site now uses:

```text
mediaUrl(sourceUrl)
```

which resolves:

```text
local /media/dpt/... sample path if downloaded
otherwise original https://dakotapokertour.com/... URL fallback
```

## Homepage verification

Rendered HTML included local sample asset paths such as:

```text
/media/dpt/logo/logo.png
/media/dpt/event/DPT-2026-Poker-Brat-Digital_26-rOrEDWVO.png
/media/dpt/article/IMG_8038-VKsCKKNP.jpg
/media/dpt/profile/0VjWB6SbDVndm3hm9M7Ymw3aERI1ukwQ8cmC3tQu.jpg
/media/dpt/venue/Dyl9v8kpi1tkCJiQy51Bs0DKwHl7PSchChcGQyFv.png
```

DOM verification:

```text
headerDisplay: flex
eventGrid: grid
bodyFont: Arial, Helvetica, sans-serif
localImages: 26
remoteImages: 4
```

## Files changed

```text
scripts/build_dpt_media_manifest.py
scripts/extract_public_dpt_data.py
apps/site/package.json
apps/site/lib/dpt-data.ts
apps/site/components/site.tsx
apps/site/app/page.tsx
apps/site/app/videos/page.tsx
apps/site/app/events/[alias]/page.tsx
apps/site/app/tournaments/[alias]/page.tsx
apps/site/tests/public-data.test.ts
apps/site/data/dpt-media-manifest.json
apps/site/public/media/dpt/**
reports/dpt-media-migration-report.md
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
HTTP local media check
browser DOM/CSS/media check
browser visual screenshot
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 6 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
CSS served as text/css with .header-inner selector
Browser visual check: styled page with logo, avatars, event posters, news thumbnails, venue images
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_39848597b6d14c31815a8a8a995881f8.png
```

## Notes

The original uploaded SQL path in Hermes cache is ephemeral and was no longer present during this loop. The extraction script now safely reuses the generated `apps/site/data/dpt-public.json` if the uploaded SQL cache path is missing, instead of breaking every future build.

## Remaining gaps

```text
Only a sample set is local/self-hosted; 4 homepage images still fall back remote and the full 309 valid assets need bulk copy.
19 referenced media URLs are broken/missing and need review.
Videos section remains sparse/empty.
Some text encoding cleanup is still needed.
Header still has staging copy: New stack replacement.
```

## Next recommended loop

```text
Use the media manifest to bulk-download or copy all 309 valid production media assets into local/new-stack storage paths, update the manifest to remove remaining live URL dependencies, and produce a broken-assets review list for the 19 missing files.
```
