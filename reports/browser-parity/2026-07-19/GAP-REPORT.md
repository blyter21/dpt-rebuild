# DPT production vs rebuild authenticated browser gap report — 2026-07-19

Viewport: `1440 × 1000` in the same `PedroChromeDebug` Chrome profile. Production was read-only. Rebuild used an admin session established through a one-time Supabase authentication exchange; no password was changed or exposed.

## Captured routes

| Module | Production | Rebuild | Assessment |
|---|---|---|---|
| Dashboard | `production/dashboard.png` | `rebuild/dashboard.png` | Different shell/dashboard purpose |
| Tournaments | `production/tournaments.png` | `rebuild/tournaments.png` | Major list-control/setup gaps |
| Events | `production/events.png` | `rebuild/events.png` | Core columns/actions present; source snapshot lags live rows |
| Seasons | `production/seasons.png` | `rebuild/seasons.png` | 5 shared rows exact; production 2027 row newer than snapshot |
| Leagues | `production/leagues.png` | `rebuild/leagues.png` | Exact two-row data parity |
| Venues | `production/venues.png` | `rebuild/venues.png` | Strong visible row/column parity |
| Blind Structures | `production/blinds.png` | `rebuild/blinds.png` | Core rows/actions present; one snapshot-only row differs |
| Payout Templates | `production/payouts.png` | `rebuild/payouts.png` | Exact 5-row/type/assignment parity |
| Tournament 346 desk | prior production evidence | `rebuild/tournament-desk-346.png` | Rebuild operational desk loads authenticated fixture |

Side-by-side images are in `comparison/*.jpg`.

## Strong parity confirmed

- Payout Templates: all five records, types, order, assigned-tournament counts, and range-only Edit/View actions match.
- Leagues: both records, IDs, names, order, and status match.
- Venues: visible IDs/names/addresses/cities/states/zips/statuses match.
- Seasons: the five snapshot rows shared with production match exactly.
- Events/Seasons/Leagues/Venues expose production columns plus search, page size, pagination, create, edit, view and delete controls.
- Blind Structures include the seven production rows plus the production-derived snapshot's ID 9; all eight now contain real imported levels/breaks (277 rows total).
- All protected rebuild routes remained authenticated without login redirects.

## Intentional rebuild improvements

- Writes are staging-only; production remained read-only throughout QA.
- Explicit labeled Create buttons replace ambiguous plus-only buttons.
- Status Publish/Unpublish controls are exposed directly.
- Blind/Payout copy is explicit per row rather than checkbox + page-level copy.
- Destructive actions use confirmation and active-child/assignment database protection.
- Environment/source warning prevents operators from mistaking staging for production.

## Highest-priority gaps

### 1. Tournament list/setup parity

Production has year/event/type/status/scope filters, reset, sortable Start/End/Status/Type columns, create, and Save as Copy. The rebuild tournament list still emphasizes read-model columns (players, buy-in, Manage/Public) and lacks those setup/filter/copy controls.

**Recommended next loop:** full tournament create/edit/copy plus production-equivalent list filters and columns.

### 2. Application shell/navigation density

Production uses a compact sidebar and exposes Live Updates, Categories, Players, Roles, Fix Duplicate Players, Notifications, and Email Management. Rebuild uses a large hero and horizontal navigation, consuming more vertical space and omitting those destinations.

**Recommended next loop:** add grouped navigation for completed/next backend modules and reduce above-the-fold shell height on operational pages.

### 3. Snapshot freshness

Live production contains newer/changed records not present in the 2026-07-13 protected SQL snapshot:

- Events production begins at IDs 96–89; rebuild snapshot begins at 89.
- Production has Season 2027 (ID 9); rebuild does not.
- Rebuild snapshot contains Blind Structure ID 9 not shown in the current production list.

This is a data-refresh gap, not a browser rendering failure. A fresh production export/import should be a controlled staging migration after backend workflows are complete.

### 4. Bulk selection/sort affordances

Production Blind/Payout lists use row checkboxes and page-level Save as Copy. Rebuild uses per-row Copy. Rebuild sortable headers work but use less-visible affordances. If bulk copy is operationally important, restore selection semantics.

### 5. Remaining backend modules

Not yet represented in the rebuild navigation/workflows: Players, Roles, duplicate-player merging, Categories, email templates/delivery, and full notification targeting.

## Browser QA conclusion

The rebuild is no longer a mock shell: authenticated staging CRUD and tournament operations load in Chrome with real imported data. Configuration and payout list content parity is strong. The largest remaining operational gap is tournament setup/list management, followed by player/security/content/notification modules. Visual shell parity is intentionally looser than data/workflow parity and should be tightened after the missing backend modules are implemented.
