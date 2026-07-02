# DPT Replacement Site Results — Clean Public App

## Goal

Create a clean DakotaPokerTour.com replacement app path using the uploaded production SQL as source-of-truth, extract real public data, and build the first faithful public homepage/navigation from real data instead of mock data.

## Result

Created a new public replacement app separate from the previous mock/admin rebuild lab:

```text
apps/site
```

Current local URL:

```text
http://localhost:3001
```

Current process:

```text
proc_52c109fbb680
```

## Real SQL-derived data

Generated from uploaded production SQL:

```text
apps/site/data/dpt-public.json
```

Extraction script:

```text
scripts/extract_public_dpt_data.py
```

Extracted public-facing dataset:

| Dataset | Count |
|---|---:|
| Leaderboard players | 25 |
| Events | 60 |
| Tournaments | 80 |
| Venues | 77 |
| Articles | 80 |
| Champions/results | 40 |

Source SQL table counts used by homepage:

```text
82 events
271 tournaments
78 venues
392 articles
2591 users
```

## Built homepage sections

The new public app now renders:

```text
Dakota Poker Tour header/nav
Events / News / Videos / Venues / Leaderboard / Players / Champions / Join/Login / Live Updates nav
Hero feature from real tournament data
Player of the Year leaderboard from real SQL scores
Past Events cards from real SQL events
News from real SQL articles
Recent Champions from real SQL tournament results
Venues from real SQL venues
Footer with FPN Gaming context
```

Verified real data visible:

```text
Poker Brat Black Chip BOUNTY Tournament
Spring Championship
Windbreak
Brad Pausch
Basim Habib
Recent Champions
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
curl http://127.0.0.1:3001
browser visual check
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 3 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
@dpt/admin-prototype test: 11 files / 46 tests passed
@dpt/tournament-engine test: 6 files / 31 tests passed
HTTP / on port 3001: 200 OK
```

## Browser screenshot evidence

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_48b90be8f73d4751ab7f497c8b595b7c.png
```

## Known limitations

This is the first corrected public duplicate pass, not the finished replacement.

Remaining visible gaps:

```text
Real media/assets are not imported yet, so images are placeholders.
Videos section currently has limited/empty visible cards depending on SQL article video_url data.
Header/logo is recreated, not official/pixel-perfect.
Some imported text has encoding/symbol cleanup needs.
Internal dev label/source-data note should be removed before public preview.
Only homepage is implemented; section/detail pages are linked but not built yet.
```

## Next recommended loop

```text
Build real public subpages for Events, Leaderboard, Venues, News, Champions, and Tournament detail routes from apps/site/data/dpt-public.json, preserving the new SQL-backed public app direction and no longer extending the old mock shell.
```
