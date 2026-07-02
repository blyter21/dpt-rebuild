# Loop 002 — Elimination, Satellite Winners, and Flight Undo

## Goal

Continue the DPT tournament-engine extraction by implementing elimination, final-table, satellite make-winners, and flight advancement undo behavior.

## Files created/updated

- `packages/tournament-engine/src/types.ts`
- `packages/tournament-engine/src/elimination.ts`
- `packages/tournament-engine/src/flight.ts`
- `packages/tournament-engine/src/index.ts`
- `packages/tournament-engine/tests/elimination.test.ts`
- `packages/tournament-engine/tests/flight-undo.test.ts`
- `packages/tournament-engine/README.md`
- `GOAL.md`
- `loop-logs/002-elimination-satellite-flight-undo.md`

## Implemented logic

### Elimination

- `countRemainingEntries()` counts non-pre-registered, non-eliminated players.
- `eliminateDptPlayer()` assigns rank from current remaining player count, applies payout by standing, calculates DPT score, and sets elimination sequence.
- `eliminateFreerollPlayer()` applies freeroll payout points + participation bonus + optional multiplier.

### Final table

- `applyFinalTableFlags()` marks `finalTable = true` for ranks `1..playersAtFinalTable`.

### Satellite make-winners

- `makeSatelliteWinners()` marks all remaining players as eliminated/winners.
- Clicked player is processed first, matching the Laravel behavior where clicked user is unshifted into the remaining-winner list.
- Optional remainder payout gets rank `2` first; other winners get rank `1`.

### Flight undo

- `undoFlightAdvancement()` supports both chip carryover modes:
  - `sum`: subtracts undone flight chips from main stack when other qualified flights remain.
  - `highest`: resets main stack to highest remaining qualified flight stack.
- Removes player from main if the undone flight was their only qualified flight.
- Resets flight player `qualifiedFlightPlayer = false`, `eliminated = false`, and `rank = null`.

## Commands run

```bash
npm --workspace packages/tournament-engine test
npm --workspace packages/tournament-engine run typecheck
npm --workspace packages/tournament-engine run build
npm audit --omit=dev
```

## Actual verification output

```text
Test Files  4 passed (4)
Tests       19 passed (19)

tsc --noEmit passed

tsc build passed

npm audit --omit=dev
found 0 vulnerabilities
```

## Notes

- Loop 001 started with 12 tests; Loop 002 ends with 19 tests.
- This loop adds the first explicit implementation of flight-advancement undo, which was one of the riskiest custom Laravel behaviors.
- The current engine is still a pure logic package; no Supabase/Vercel connection yet.

## Next recommended loop

Implement the next engine slice:

1. `undoPlayerStat()` behavior, including restoring flight chips.
2. manual rank edit/recalculation behavior.
3. payout materialization from template rows.
4. Tournament of Champions qualification helpers.
5. Add richer tests around bounties and final table after manual rank edits.
