# DPT Media Migration Report

Generated: 2026-07-02T01:00:20.010756Z

## Summary

- Total unique production asset URLs: 328
- Valid HTTP 200 assets: 309
- Missing/broken assets: 19
- Downloaded local assets: 309

## By type

| Type | Total | Valid | Downloaded local assets |
|---|---:|---:|---:|
| `article` | 78 | 78 | 78 |
| `event` | 71 | 59 | 59 |
| `logo` | 1 | 1 | 1 |
| `profile` | 25 | 25 | 25 |
| `tournament` | 77 | 72 | 72 |
| `venue` | 76 | 74 | 74 |

## Broken/missing assets

| Status | Type | URL | First reference |
|---:|---|---|---|
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/php02Zkbk | event Dakota Jim Dandy Poker Festival-Featuring the $1,000 Buy In \"Dream Chaser V\" Tournament! $5,000 Player of the Series package up for grabs! |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phplcWEv3 | event The Tri-State Poker Championship |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpbV1pUy | event RPT Casino State Championship 2024/2025 |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpebPceM | event RPT/DPT Season Championship |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpbeVPL3 | event Watford City Eagles Club Monster Stack |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpdJeL8o | event \"RPT Casino State Championship\"-BRACELET EVENT! |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpHSq5XI | event Dakota Jim Dandy Poker Festival |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpGdFa6A | event Poker Brat BOUNTY Tournament |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpotCGSS | event Mandan Eagles Club Mega Stack |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/php6EwLh1 | event Hagge's Deep Stack |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpyz7ian | event RPT Summer Main Event |
|  | `event` | https://dakotapokertour.com/storage/event/medium/DPT-Buffalo-City–FB-REVISED-zUID7aGT.png | event Buffalo City Showdown |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phpLIBbBL | tournament RPT/DPT Main Event |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phppkPvdg | tournament Watford City Eagles Club Monster Stack |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phpLuBP7V | tournament Event 1 \"RPT Season Premiere\" |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium/RPT-Spirit-Lake-Casino-Flyer_CasinoPoker-Flyer-2023-01-01-01-(1)-fOfxtgcj.jpg | tournament RPT Casino State Championship |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/php4ViadY | tournament RPT Casino State Championship |
| 404 | `venue` | https://dakotapokertour.com/storage/venue/medium/venue/LfgqfsBQp5tivsoC3gkPB181MF1h4A3b9MgnHwcv.png | venue Playmaker's All American Lounge |
| 404 | `venue` | https://dakotapokertour.com/storage/venue/medium/venue/zpIvTPXzOJEmItjuOMZjyzTRYyoYlwwTGJeE928s.png | venue Pour Decisions |

## Local media path

```text
apps/site/public/media/dpt/
```

## Next migration path

Copy every valid `sourceUrl` to the matching `suggestedPublicPath` in our new-stack storage bucket, then rewrite the manifest generation to point `localPublicPath` at the new bucket/CDN path.