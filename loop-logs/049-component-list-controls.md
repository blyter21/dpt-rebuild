# Loop 049 — Extract List and Action Controls

## Goal

Moved ListControls, PaginationControls, RowActionMenu, and RowActionPreviewPanel into components/dpt-replica/list-controls.tsx.

## Files/areas

```text
apps/admin/app/admin-simulator.tsx
apps/admin/components/dpt-replica/
apps/admin/tests/admin-replica-shell.test.ts
```

## Safety

```text
Local/mock-only refactor
No production DPT mutation
No Laravel writes
No Supabase writes
No deploy
```

## Verification

```text
@dpt/admin-prototype test: 11 files / 46 tests passed
@dpt/tournament-engine test: 6 files / 31 tests passed
@dpt/admin-prototype typecheck: passed
@dpt/admin-prototype build: passed
```

## Result

Moved ListControls, PaginationControls, RowActionMenu, and RowActionPreviewPanel into components/dpt-replica/list-controls.tsx.
