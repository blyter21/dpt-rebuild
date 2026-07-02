# Loop 032 — Mock Pagination and Row Action Menus

## Goal

Add mock pagination and row action menus for admin list tables, including View, Edit, Duplicate/Save as Copy, Manage, and Delete-disabled placeholders matching current DPT admin action patterns.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/032-mock-pagination-row-actions.md
```

## What changed

Added shared components:

```text
PaginationControls
RowActionMenu
```

List modules now show pagination and row actions:

```text
Tournaments
Events
Players
Venues
Articles / Live Updates
```

Row action menu:

```text
View
Edit
Duplicate / Save as Copy
Manage
Delete disabled
```

Delete is intentionally disabled in the POC.

## Browser verification

Verified locally:

```text
Tournaments: showing 1-2 of 4 mock rows · page 1 of 2
Previous / Next controls visible
Row actions visible: View, Edit, Duplicate / Save as Copy, Manage, Delete disabled
Next moves to page 2 showing rows 3-4 of 4
```

## Verification commands

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```
