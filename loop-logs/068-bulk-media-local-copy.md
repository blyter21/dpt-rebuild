# Loop 068 — Bulk Media Local Copy + Broken Asset Review

## Goal

Use the media manifest to bulk-download/copy all 309 valid production media assets into local/new-stack storage paths, update the manifest to remove remaining live URL dependencies for valid assets, and produce a broken-assets review list for the 19 missing files.

## Result

All valid assets are now downloaded under:

```text
apps/site/public/media/dpt/
```

Manifest:

```text
apps/site/data/dpt-media-manifest.json
```

Reports:

```text
reports/dpt-media-migration-report.md
reports/dpt-broken-assets-review.md
```

## Manifest summary

```text
Total unique production asset URLs: 328
Valid HTTP 200 assets: 309
Downloaded local assets: 309
Broken/missing assets: 19
```

By type:

```text
logo:       1 / 1 downloaded
event:      59 / 59 downloaded
tournament: 72 / 72 downloaded
article:    78 / 78 downloaded
venue:      74 / 74 downloaded
profile:    25 / 25 downloaded
```

Local media size/count:

```text
309 files
15,911,962 bytes
```

## Site behavior

`mediaUrl(sourceUrl)` now resolves:

```text
valid downloaded asset -> /media/dpt/...
broken/missing asset   -> empty string, so component renders placeholder/fallback
```

Homepage rendered HTML check:

```text
local src count: 30
remote media src count: 0
CSS check: .header-inner and .event-grid selectors served as text/css
```

## Files changed

```text
scripts/build_dpt_media_manifest.py
apps/site/data/dpt-media-manifest.json
apps/site/public/media/dpt/**
reports/dpt-media-migration-report.md
reports/dpt-broken-assets-review.md
apps/site/lib/dpt-data.ts
apps/site/components/site.tsx
apps/site/app/events/[alias]/page.tsx
apps/site/app/tournaments/[alias]/page.tsx
apps/site/tests/public-data.test.ts
```

## Verification

```text
python3 scripts/build_dpt_media_manifest.py
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
HTTP homepage local/remote src check
browser CSS/media DOM check
browser visual screenshot
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 6 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
Homepage local media check: 30 local image srcs, 0 remote media srcs
Browser visual check: styled homepage, logo/images/cards visible
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_6cfbd91d63ef4a7792fad38b26cab125.png
```

## Broken asset notes

The 19 broken assets are documented in:

```text
reports/dpt-broken-assets-review.md
```

Most are legacy bad filename values from SQL such as:

```text
/var/www/dakotapokertour.com/tmp/php...
```

The site now suppresses those as image sources and renders fallbacks instead.

## Remaining gaps

```text
Header still says "New stack replacement".
Videos section still appears empty/sparse.
Some imported text has encoding artifacts.
Some rows intentionally use fallback blocks, e.g. champion #1 cards.
Full new-stack cloud storage upload is not done yet; assets are local under apps/site/public/media/dpt/.
```

## Next recommended loop

```text
Clean launch-facing public-site polish: remove staging copy like "New stack replacement", clean encoding artifacts in SQL-derived article/event text, improve the Videos section with real video/article cards, and tighten homepage visual fidelity against live DakotaPokerTour.com.
```
