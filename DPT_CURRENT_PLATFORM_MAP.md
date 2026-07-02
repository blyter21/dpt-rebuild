# DPT Current Platform Reverse-Engineering Map

Last updated: 2026-06-28

Purpose: browser-first and source-backed map of DakotaPokerTour.com so Brook/Nacho/Pedro can judge what a real modern-stack replica must include.

This is **not** a final rebuild spec. It is the first authenticated platform map after Pedro gained working browser access to the public site and the DPT admin dashboard.

## Executive readout

Brook's criticism of the earlier prototype is correct: the existing Next.js prototype proves some tournament math and API-boundary concepts, but it does **not** yet resemble the current Dakota Poker Tour application.

The current production platform is a full content + events + player + tournament management system. A credible replacement must replicate both:

1. public DPT website surfaces, and
2. authenticated admin workflows for managing events, tournaments, players, venues, articles, live updates, notifications, and tournament operations.

## Evidence gathered

### Browser-authenticated admin crawl

Captured from `pedro@fpngaming.com` admin account via Chrome DevTools connection:

```text
browser-audit/admin-pages.json
browser-audit/admin-links.json
browser-audit/deep-admin/deep-admin-pages.json
```

Admin dashboard URL confirmed:

```text
https://dakotapokertour.com/admin
```

### Public-site crawl

Captured public nav/pages:

```text
browser-audit/public-pages.json
```

### Laravel source map

Primary source files:

```text
/home/hermes/projects/dpt-web/src/routes/web.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Admin/*.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Site/*.php
/home/hermes/projects/dpt-web/src/app/Models/*.php
```

## Public website surface

Observed public navigation:

| Public area | URL | Observed functions/content | Laravel source |
|---|---|---|---|
| Home | `/` | Player of the Year leaderboard, past events, videos, news, footer/FPN info | Site home/controllers/views |
| Events | `/events` | Upcoming/past event cards, event/tournament links | `Site\EventController@index/show` |
| Upcoming Events | `/upcomingEvents` | Upcoming event list, currently no records | `Site\EventController@upcomingEvents` |
| Past Events | `/pastEvents` | Past event list with venues, dates, tournament/result links | `Site\EventController@pastEvents` |
| Calendar | `/calendar` | Event/tournament calendar filters | `Site\CalendarController@index/getCalendarEvents` |
| News | `/news`, `/articles/{alias}` | News/article feed and detail pages | `Site\ArticleController@index/show` |
| Videos | `/videos` | YouTube/video posts | Site article/video views |
| Venues | `/venues`, `/venues/{alias}` | Venue directory and venue detail | `Site\VenueController@index/show` |
| Leaderboard | `/leaderboard` | Season/tournament leaderboards | Site player/tournament controllers |
| Players | `/players`, `/player/{alias}` | Player database/list and profiles | `Site\PlayerController` |
| Champions / TOC | `/tournament-of-champions` | Tournament winners/TOC qualifiers by season | `Site\TournamentController@tournamentOFChampion/getTournamentChampions` |
| Live Updates | `/liveTournaments` | Redirect/current live tournament/results view | `Site\TournamentController@liveTournaments` |
| Tournament detail | `/tournament/{alias}` | Info/results/payouts/chip counts/pre-registration | `Site\TournamentController@show` and helper routes |

Important public route helpers in `routes/web.php`:

```text
/tournament-info/{id}/payoutsList
/tournament-info/{id}/payoutsListFlight
/tournament-info/{id}/chipcountsList
/tournament-info/{id}/dpt-payouts
/tournament-info/{id}/dpt-qualified-players
/tournament-info/{id}/satellite-payouts
/tournament-info/{id}/freeroll-payouts
POST /tournaments/{id}/preRegisteredPlayer
GET  /tournaments/{id}/removePlayer
```

## Authenticated admin surface

Observed admin navigation:

```text
Dashboard
Tournament Management
  Tournaments
  Payout Distributions Template
  Blind Structures
  Live Updates
  Events
  Seasons
  Leagues
  Venues
Article Management
  Articles
User Management
  Players
  Fix Duplicate Players
  Notifications
```

### Admin modules

| Admin module | URL | Observed screen/function | Laravel controller/source | Rebuild status |
|---|---|---|---|---|
| Dashboard | `/admin`, `/admin/dashboard` | Basic dashboard/welcome | `Admin\DashboardController@index` | Missing from prototype |
| Tournaments list | `/admin/tournaments` | Search/filter tournaments, copy, edit, view, manage, updates | `Admin\TournamentController` | Partially mocked only |
| Tournament create/edit | `/admin/tournaments/create`, `/admin/tournaments/{id}/edit` | Extensive tournament setup form | `TournamentController@create/store/edit/update` | Missing |
| Tournament show | `/admin/tournaments/{id}` | Tournament detail, manage/list/edit buttons | `TournamentController@show` | Missing |
| Tournament manage | `/admin/tournaments/{id}/index_checkedInPlayers` | Live tournament desk: registered players, check-in, add player, elimination, add-on/rebuy, live update | `TournamentController@index_checkedInPlayers` + many helper routes | Only tiny proof mocked |
| Payout templates | `/admin/payoutdistributions` | Permission blocked for current Pedro role | `PayoutDistributionController` | Missing/permission gap |
| Blind structures | `/admin/blinds` | Blind list, save as copy, edit/view | `BlindStructureController` | Missing |
| Live updates | `/admin/articles?liveupdate=1` | Live update list/articles filtered by liveupdate | `ArticleController` / `TournamentUpdateController` | Missing |
| Events | `/admin/events` | Event list/create/edit/show, season/date/status | `EventController` | Missing |
| Seasons | `/admin/seasons` | Season list/create/edit, league/default/logo/date range | `SeasonController` | Missing |
| Leagues | `/admin/leagues` | League list/create/edit | `LeagueController` | Missing |
| Venues | `/admin/venues` | Venue list/create/edit, address/social/map/media | `VenueController` | Missing |
| Articles | `/admin/articles` | Article list/create/edit/view, tournament/category/published date/SEO/media/tag players | `ArticleController` | Missing |
| Players | `/admin/users` | Player/user list, notification prefs, export/copy/CSV/print, roles | `Admin\UserController` and `Admin\PlayerController` | Missing |
| Duplicate players | `/admin/duplicates/players` | Primary/secondary duplicate player merge, history table | `PlayerController@duplicate_view/fix_duplicate` | Missing |
| Notifications | `/admin/send-notifications` | Send notifications by venue/season/event/tournament, email/SMS/internal toggles | `SubscribeController@GetNotification/SendNotification` | Missing |
| Internal notifications | `/admin/internal-notifications` | Unread/all notifications | `SubscribeController@internalNotifications` | Missing |

## Live tournament management details

Representative page:

```text
/admin/tournaments/346/index_checkedInPlayers
```

Observed page labels/actions include:

```text
Tournament Management
Registered Players
Check In
Initial Buy In
Dealer Appreciation Fee
Buy In
Chips Count
Add Rebuy/Add-on?
How Many Addons?
Rebuys
Rebuy Dealer Appreciation Fee
Total Addon BuyIn
Total Addon Chips Count
Review/Edit Check In Details
Edit Elimination Player
Select Player
Points
Total Buy in
Winnings
Addon Buy In
Addon Chips Count
Preview & Edit Elimination Players
Add Player
Live Update Add
```

Important Laravel admin tournament routes:

```text
GET  /admin/tournaments/{id}/index_checkedInPlayers
POST /admin/tournaments/{id}/checkIn
POST /admin/tournaments/{id}/pre_reg_edit_checkIn
GET  /admin/tournaments/{id}/pre_registered_players
GET  /admin/tournaments/{id}/eliminatePlayer
GET  /admin/tournaments/{id}/calculateScore
POST /admin/tournaments/{id}/addScore
POST /admin/tournaments/{id}/addonBuyIn
POST /admin/tournaments/{id}/edit_EliminatePlayer
GET  /admin/tournaments/playersList
GET  /admin/tournaments/{id}/search_players
GET  /admin/tournaments/{id}/registered_players
GET  /admin/tournaments/{id}/registered_flight_players
GET  /admin/tournaments/{id}/approve_pre_resgistered_player
GET  /admin/tournaments/{id}/resetTournament
GET  /admin/tournaments/{id}/removePlayer
GET  /admin/tournaments/{id}/removePreRegPlayer
POST /admin/selectTournament
POST /admin/tournaments/{id}/bulkEliminate
POST /admin/tournaments/{id}/updateEliminatedRanks
GET  /admin/tournaments/{id}/calculateTournamentData
GET  /admin/tournaments/{id}/undoPlayerStat
GET  /admin/tournaments/{id}/singleEliminate
GET  /admin/tournaments/{id}/eliminateNoRankPlayers
GET  /admin/tournaments/{id}/makeWinners
GET  /admin/tournaments/getTournamentTypeConfig
GET  /admin/tournaments/{id}/getPlayerAddonLimit
```

This is the core admin desk replacement target. The current prototype needs to model these workflows explicitly.

## Data/domain model observed from Laravel

Important models found:

```text
Article
Blind
Category
Configuration
Event
League
MobileOtp
NotificationEntity
PayoutDistribution
PayoutStructure
Permission
Role
Season
Tournament
TournamentAddon
TournamentPayout
TournamentPlayer
TournamentSchedule
TournamentTypes
TournamentUpdates
User
Venue
```

The replacement stack will need at least these domains:

```text
users/players
roles/permissions
leagues
seasons
events
venues
tournaments
tournament types
blind structures
payout distributions/templates
tournament players / entries
add-ons/rebuys
payouts/results
articles/news/live updates
notifications
configuration/media
```

## Major gaps in current Next.js prototype

The current local prototype is valuable as a tournament-logic lab, but it is not close to a production replica.

| Current prototype | Needed for real DPT replica |
|---|---|
| Single Tournament Desk mock page | Full public + admin app shell |
| Hardcoded Alice/Bob/Cora | Player database with search/select/add-to-tournament |
| Hardcoded eliminate Cora | Select a live tournament player and eliminate/undo/edit |
| No event/tournament selectors | Event → tournament context switching |
| No venues/leagues/seasons | Full management screens and relationships |
| No article/live-update authoring | Content/live update CMS |
| No notification workflow | Send notifications by venue/season/event/tournament/preferences |
| No duplicate-player merge | Primary/secondary merge workflow |
| No blind/payout templates UI | Blind/payout structure management |
| Mock API only | Supabase-backed reads/mutations still blocked |

## Replica-first rebuild target

The next prototype must become recognizable as DPT, not just a backend test lab.

Recommended next visible shell:

```text
DPT Admin Replica
├─ Dashboard
├─ Tournament Management
│  ├─ Tournaments list
│  ├─ Create/edit tournament
│  ├─ Tournament detail
│  ├─ Live tournament manager
│  ├─ Payout templates
│  └─ Blind structures
├─ Event Management
│  ├─ Events
│  ├─ Seasons
│  ├─ Leagues
│  └─ Venues
├─ Content Management
│  ├─ Articles
│  └─ Live updates
├─ Player/User Management
│  ├─ Players
│  ├─ Duplicate merge
│  └─ Roles/permissions later
├─ Notifications
└─ Diagnostics / migration status
```

Public replica shell:

```text
DPT Public Site
├─ Home
├─ Events / Upcoming / Past
├─ Calendar
├─ News
├─ Videos
├─ Venues
├─ Leaderboard
├─ Players
├─ Champions / TOC
├─ Tournament detail/results
└─ Live Updates
```

## Migration proof-of-concept conclusion

The project has now proven Pedro can access and inspect:

1. the public site in a real browser,
2. the authenticated admin dashboard,
3. the Laravel source routes/controllers/models,
4. the backend tournament logic.

But it has **not yet proven** that Pedro can build a faithful platform replica. The next proof point must be visible and workflow-based:

> Build a mock-data DPT replica shell that matches the public/admin navigation and implements the two operator workflows Brook immediately noticed were missing: add player from player database to tournament, and select/eliminate a live tournament player.

## Recommended next loop

```text
continue next DPT rebuild loop: use the browser-backed DPT feature map to rebuild the Next.js prototype into a recognizable DPT admin/public replica shell with modules for Dashboard, Tournaments, Events, Players, Venues, Articles, Notifications, and a live tournament manager that supports selecting a player from a player database, adding them to a tournament, selecting a live player, and eliminating/undoing them
```
