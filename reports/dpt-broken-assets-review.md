# DPT Broken Assets Review

Total broken/missing referenced asset URLs: 19

| Status | Type | URL | First reference | Error |
|---:|---|---|---|---|
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/php02Zkbk | event 83 Dakota Jim Dandy Poker Festival-Featuring the $1,000 Buy In \"Dream Chaser V\" Tournament! $5,000 Player of the Series package up for grabs! | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phplcWEv3 | event 78 The Tri-State Poker Championship | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpbV1pUy | event 62 RPT Casino State Championship 2024/2025 | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpebPceM | event 60 RPT/DPT Season Championship | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpbeVPL3 | event 49 Watford City Eagles Club Monster Stack | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpdJeL8o | event 42 \"RPT Casino State Championship\"-BRACELET EVENT! | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpHSq5XI | event 37 Dakota Jim Dandy Poker Festival | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpGdFa6A | event 33 Poker Brat BOUNTY Tournament | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpotCGSS | event 35 Mandan Eagles Club Mega Stack | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/php6EwLh1 | event 34 Hagge's Deep Stack | HTTPError: HTTP Error 404: Not Found |
| 404 | `event` | https://dakotapokertour.com/storage/event/medium//var/www/dakotapokertour.com/tmp/phpyz7ian | event 32 RPT Summer Main Event | HTTPError: HTTP Error 404: Not Found |
|  | `event` | https://dakotapokertour.com/storage/event/medium/DPT-Buffalo-City–FB-REVISED-zUID7aGT.png | event 30 Buffalo City Showdown | UnicodeEncodeError: 'ascii' codec can't encode character '\u2013' in position 42: ordinal not in range(128) |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phpLIBbBL | tournament 289 RPT/DPT Main Event | HTTPError: HTTP Error 404: Not Found |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phppkPvdg | tournament 273 Watford City Eagles Club Monster Stack | HTTPError: HTTP Error 404: Not Found |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/phpLuBP7V | tournament 256 Event 1 \"RPT Season Premiere\" | HTTPError: HTTP Error 404: Not Found |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium/RPT-Spirit-Lake-Casino-Flyer_CasinoPoker-Flyer-2023-01-01-01-(1)-fOfxtgcj.jpg | tournament 257 RPT Casino State Championship | HTTPError: HTTP Error 404: Not Found |
| 404 | `tournament` | https://dakotapokertour.com/storage/tournament/medium//var/www/dakotapokertour.com/tmp/php4ViadY | tournament 257 RPT Casino State Championship | HTTPError: HTTP Error 404: Not Found |
| 404 | `venue` | https://dakotapokertour.com/storage/venue/medium/venue/LfgqfsBQp5tivsoC3gkPB181MF1h4A3b9MgnHwcv.png | venue 8 Playmaker's All American Lounge | HTTPError: HTTP Error 404: Not Found |
| 404 | `venue` | https://dakotapokertour.com/storage/venue/medium/venue/zpIvTPXzOJEmItjuOMZjyzTRYyoYlwwTGJeE928s.png | venue 2 Pour Decisions | HTTPError: HTTP Error 404: Not Found |

## Recommended review

- If the live site also fails to load these files, leave them missing and rely on fallbacks.
- If the files exist in an S3/server upload archive under a different variant/path, add alternate path rules to `scripts/build_dpt_media_manifest.py`.
- If these assets are no longer needed by public pages, they can remain noted as legacy broken references.