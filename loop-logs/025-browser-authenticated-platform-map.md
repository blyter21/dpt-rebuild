# Loop 025 — Browser-Authenticated Current Platform Map

## Goal

Use public-site browser access and authenticated `pedro@fpngaming.com` admin access to understand DakotaPokerTour.com as a platform, then map what must be replicated on the new stack.

## Files created/updated

- `DPT_CURRENT_PLATFORM_MAP.md`
- `browser-audit/public-pages.json`
- `browser-audit/admin-pages.json`
- `browser-audit/admin-links.json`
- `browser-audit/deep-admin/deep-admin-pages.json`
- `HANDOFF.md`
- `README.md`
- `loop-logs/025-browser-authenticated-platform-map.md`

## Evidence gathered

Authenticated admin crawl captured these modules:

```text
Dashboard
Tournaments
Payout Distributions Template
Blind Structures
Live Updates
Events
Seasons
Leagues
Venues
Articles
Players
Fix Duplicate Players
Notifications
Internal Notifications
```

Public crawl captured these pages:

```text
Home
Events
Upcoming Events
Past Events
Calendar
News
Videos
Venues
Leaderboard
Players
Champions / TOC
Live tournament/results page
```

Representative deep admin screens captured or partially captured:

```text
Tournament create
Tournament show
Tournament manage / checked-in players
Venue create/edit
Season create
League create
Player view
Article create
Notification send
```

## Key finding

The existing production platform is far broader than the current mock Tournament Desk prototype. The prototype proves selected backend/tournament logic, but a faithful migration proof must now rebuild the visible product surface: public site, admin shell, event/tournament/player/venue/content/notification modules, and real operator workflows.

## Most important missing workflows

- Add/search player from player database into tournament.
- Select a live tournament player and eliminate/undo/edit that player.
- Event → tournament context selection.
- Tournaments list/create/edit/view/manage.
- Player database and duplicate-player merge.
- Venues/seasons/leagues/blinds/payout templates.
- Articles/live updates/notifications.

## Verification commands run

```bash
python3 doc checks
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
```

## Next recommended loop

Use `DPT_CURRENT_PLATFORM_MAP.md` to rebuild the Next.js prototype into a recognizable DPT admin/public replica shell with modules for Dashboard, Tournaments, Events, Players, Venues, Articles, Notifications, and a live tournament manager that supports player database search/add and selected-player elimination/undo.
