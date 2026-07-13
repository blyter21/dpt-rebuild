# DPT Public Replica Gap Audit

Status: **INCOMPLETE — current preview is not an acceptable production replica.**

The acceptance standard is functional and visual parity with `dakotapokertour.com`, followed by deliberate usability improvements. A route returning HTTP 200 is not parity.

## User-reported critical gaps

- Tournament history and full tournament details are missing.
- Player profile photos and tournament history are incomplete.
- Events navigation lacks Upcoming / Past / Calendar submenu behavior.
- Champions presentation lacks player photos and rich context.
- Leaderboard lacks season filters.
- News imagery is low-quality/fuzzy and the listing uses undersized thumbnails.

## Measured production vs preview gaps

| Page | Production evidence | Preview evidence | Required correction |
|---|---|---|---|
| Tournament detail | 2 tables, 16 inputs, 4 buttons, results/registration/payout content | 0 tables, 0 inputs, basic summary only | Restore registration details, rules, entrants/results, payouts, structures, updates and full history |
| Player profile | Player image plus tournament-history table | Summary stats only, no history table | Correct photo mapping and add complete tournament history/results |
| Leaderboard | 2 selectors and season/filter controls | 0 selectors, one unfiltered table | Add season-aware filtering and correct ranking/stat logic |
| Calendar | 4 selectors and calendar controls | Static grouped list, 0 selectors | Build interactive month/season/location calendar behavior |
| Event detail | 13 images and rich tournament sections in sample | 1 image and simple schedule | Restore full description/media/tournament sections/results |
| Champions | Photo-oriented champion presentation | Text-only rows and placeholder blocks | Build champion cards with player/tournament photos and links |
| News listing | Designed news page with larger content cards | Hundreds of tiny list thumbnails | Use high-resolution source images, responsive cards and pagination |
| Article detail | Full article presentation | Flattened text and limited layout | Preserve article structure, media and readable typography |

## Acceptance gates

- [ ] Production navigation and submenu parity
- [ ] Full public-safe production data coverage
- [ ] Season-aware leaderboards and player statistics
- [ ] Full tournament/event/player history and details
- [ ] High-resolution media with no fuzzy thumbnail substitution
- [ ] Desktop and mobile visual parity screenshots for every core route
- [ ] Search/filter/pagination behavior verified
- [ ] No public admin/data access regression
- [ ] Explicit remaining-gap report before any claim of replica completion
