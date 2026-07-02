# Loop 031 — Mock List Filtering/Search/Sort Controls

## Goal

Add realistic mock list filtering/search/sort controls for Tournaments, Events, Players, Venues, and Articles using patterns observed in authenticated admin tables, without mutating real data.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/031-mock-list-controls.md
```

## What changed

Added shared mock list controls:

```text
Search {module}
Status filter
Sort
All statuses
Published
Active
Needs merge review
New
Newest / admin default
Name A-Z
Status
Reset list controls
N of N mock rows
```

Wired controls into:

```text
Tournaments
Events
Players
Venues
Articles / Live Updates
```

## Safety behavior

All controls operate on local mock arrays only:

```text
No production mutation
No database writes
No Supabase writes
No Laravel writes
No form submissions
```

## Browser verification

Verified locally:

```text
Tournaments exposes Search / Status filter / Sort / Reset list controls
Searching Tournaments for Spring reduces visible rows from 4 to 2
Reset list controls restores 4 of 4 mock rows
Articles exposes Search / Status filter / Sort / Reset list controls
Articles shows 3 of 3 mock rows
```

## Verification commands

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
```

## Result

The admin table modules now feel closer to the current DPT admin tables: searchable, filterable, sortable, and clearly mock-only.

## Next recommended loop

```text
continue next DPT rebuild loop: add mock pagination and row action menus for admin list tables, including View, Edit, Duplicate/Save as Copy, Manage, and Delete-disabled placeholders matching the current DPT admin action patterns
```
