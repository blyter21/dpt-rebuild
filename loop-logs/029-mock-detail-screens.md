# Loop 029 — Mock-Only Create/Edit Detail Screens

## Goal

Add realistic create/edit detail screens for Events, Tournaments, Venues, and Players using fields captured from the authenticated admin forms, while keeping all actions mock-only and clearly labeled.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/029-mock-detail-screens.md
```

## What changed

Added mock-only detail panels for:

```text
Tournament Create/Edit
Event Create/Edit
Venue Create/Edit
Player Create/Edit
```

Each detail panel is explicitly labeled:

```text
Mock-only detail screen · no save/write actions
```

## Captured field coverage

### Tournament Create/Edit

Fields modeled from `/admin/tournaments/create` and `/admin/tournaments/{id}/edit`:

```text
Status
Featured
Tournament Type
Point System
Flight Tournaments
Direct Registration to Main Tournament
Chips Accumulator
Event
Venue
Name
Short Description
Start Date
Registration Start Date
Initial Buy In
Dealer Appreciation Fee
Initial Chips Count
Allow Rebuy
Rebuys
Rebuy Chips Count
Blind Intervals
Charity Take
Players at Final Table
Rules Description
```

### Event Create/Edit

Fields modeled from `/admin/events/create` and `/admin/events/{id}/edit`:

```text
Status
Season
Name
Start Date
End Date
Short Description
Long Description
Logo
Banner Image
Featured / Public Status
```

### Venue Create/Edit

Fields modeled from `/admin/venues/create` and `/admin/venues/{id}/edit`:

```text
Status
Name
Address
City
State
Zip
Phone
Logo
Banner Image
Facebook
Twitter
Instagram
YouTube
Website
Google Map Location
```

### Player Create/Edit

Fields modeled from `/admin/users`, `/admin/users/{id}`, and duplicate-player views:

```text
First Name
Last Name
Nick Name
Email
Mobile Number
Birthdate
Roles
Notification Preferences
Choose Venues
Permissions
```

## Browser verification

Verified in local browser:

```text
Players -> Mock player detail screen
Tournaments -> Mock tournament detail screen
Events -> Mock event detail screen
Venues -> Mock venue detail screen
```

## Verification commands

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

## Next recommended loop

```text
continue next DPT rebuild loop: make the mock detail screens interactive by adding edit/create mode toggles, dirty-state indicators, cancel/reset behavior, and mock validation errors without saving anything
```
