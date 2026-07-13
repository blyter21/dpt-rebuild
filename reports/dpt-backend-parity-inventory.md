# DPT Backend-First Parity Inventory

Status: **INCOMPLETE — authenticated backend workflows are the primary product requirement.**

Source of truth: browser-driven production admin at `dakotapokertour.com/admin`, Laravel routes/controllers, and production-derived database structure. Production is read-only during QA; all mutations must be tested in Supabase staging.

## Authenticated production modules

- Dashboard
- Tournaments
- Payout Distributions Template
- Blind Structures
- Live Updates
- Events
- Seasons
- Leagues
- Venues
- Articles
- Players
- Fix Duplicate Players
- Notifications

## Tournament list behavior

Production `/admin/tournaments` includes:

- Season selector
- Event selector
- Tournament type selector
- Status selector
- Upcoming/past/all scope selector
- Page-size control
- Search
- Sortable columns
- Add tournament
- Save as Copy / duplicate workflow
- Pagination
- Actions column

## Live tournament desk

Production representative route: `/admin/tournaments/346/index_checkedInPlayers`

Observed workflow groups:

- Tournament state: reset, payouts, live update, registration open/closed
- Registered player count and remaining-player count
- Registered player table with profile image, name, nickname, rank, elimination, total buy-in and points
- Search and page-size controls
- Check-in workflow
- Initial buy-in and chip count
- Dealer appreciation fee
- Include add-ons/rebuys toggle
- Number of add-ons
- Add-on buy-in and chip-count totals
- Review/edit check-in details
- Player elimination editing
- Player selection
- Points, total buy-in and winnings
- Individual addon buy-in
- Preview/edit eliminated players
- Bulk rank, buy-in and bounty editing
- Add player
- Live update creation
- Full table pagination/export behavior

## Blind structures

Production `/admin/blinds` includes:

- Master Blinds / Copy Blind filter
- Search, page size and pagination
- Multi-select checkboxes
- Save as Copy workflow
- Published status
- Edit and View actions
- Seven current blind structures

## Role boundary discovered

The current authenticated administrator receives `403 — YOU DON'T HAVE ENOUGH PERMISSIONS` for `/admin/payoutdistributions`, while `/admin/blinds` is permitted. The rebuild must model this permission difference explicitly rather than treating all administrators as unrestricted.

## Backend acceptance gates

- [ ] Every production module has a rebuilt equivalent
- [ ] Tournament create/edit/copy/view/manage workflows match production
- [ ] Registration/check-in/add-on/rebuy/elimination/payout/flight flows work end-to-end
- [ ] Undo/reset/correction paths are tested
- [ ] Player merge, exports, roles and preferences work
- [ ] Content/live-update/media workflows work
- [ ] Notifications can target venue/season/event/tournament audiences safely
- [ ] Role and permission boundaries match or improve production
- [ ] Every mutation writes an audit event
- [ ] Production remains read-only; all mutation QA uses staging
- [ ] Browser screenshots and click-through evidence exist for production and rebuild
