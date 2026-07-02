# Loop 033 — Row Action Preview Panel

## Goal

Add a mock row-action result drawer/detail preview so row actions have visible feedback and map current Laravel route patterns to modern rebuild targets.

## Files changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/tests/admin-replica-shell.test.ts
GOAL.md
HANDOFF.md
loop-logs/033-row-action-preview-panel.md
```

## What changed

Added shared row-action preview behavior:

```text
RowActionPreviewPanel
legacyRouteFor()
rebuiltTargetFor()
```

Clicking a row action populates:

```text
Action + item name
Module
Legacy route pattern
Modern rebuild target
Safety status
Clear preview
```

## Safety behavior

```text
No save, delete, or production mutation executed.
```

## Browser verification

Verified locally on Tournaments:

```text
Click View row action
Row Action Preview populates
Legacy route pattern displays
Modern rebuild target displays
Safety text displays
Clear preview available
```

Example verified preview:

```text
View · Spring Championship MEGASTACK (100K)
/admin/tournaments/spring-championship-megastack-100k
Next.js admin/tournaments/detail view mode
No save, delete, or production mutation executed.
```

## Verification commands

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```
