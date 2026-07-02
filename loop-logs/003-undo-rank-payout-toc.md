# Loop 003 — Undo Stats, Manual Rank Recalculation, Payout Materialization, TOC

## Goal

Implement the next core tournament operations in the standalone DPT tournament engine: undo player stats, manual rank recalculation, payout materialization from template rows, and Tournament of Champions qualification helpers.

## Files created/updated

- `packages/tournament-engine/src/types.ts`
- `packages/tournament-engine/src/operations.ts`
- `packages/tournament-engine/src/toc.ts`
- `packages/tournament-engine/src/index.ts`
- `packages/tournament-engine/tests/operations.test.ts`
- `packages/tournament-engine/tests/toc.test.ts`
- `packages/tournament-engine/README.md`
- `GOAL.md`
- `loop-logs/003-undo-rank-payout-toc.md`

## Implemented logic

### Undo player stat

- `undoPlayerStat()` clears rank, winnings, score, eliminated state, elimination sequence, and final-table flag.
- For flight tournaments, restores `totalChips` using:

```text
totalChips = initialChipsCount + rebuyChipsCount * noOfAddonsBuy
```

This mirrors the Laravel undo behavior that restores flight chips after eliminated flight players are undone.

### Manual rank recalculation

- `recalculateManualRanks()` applies admin-edited ranks, total buy-ins, bounty, and chip totals.
- Recomputes winnings from payout standing.
- Recomputes DPT score or freeroll score depending on tournament type.
- Marks ranked players eliminated and unranked players not eliminated.
- Re-applies final-table flags.

### Payout materialization

- `materializePayouts()` converts reusable payout template rows into per-tournament payout rows.
- Supports percentage payouts:

```text
payoutAmount = totalDistributionAmount * payoutPercentage / 100
```

- Supports freeroll/static rows with prize descriptions and points.

### Tournament of Champions qualification

- `getTournamentOfChampionsQualifiers()` returns non-pre-registered rank-1 players from selected tournament types and/or explicit tournament IDs.
- Results are sorted newest tournament end date first, matching the public TOC behavior direction.

## Commands run

```bash
npm --workspace packages/tournament-engine test
npm --workspace packages/tournament-engine run typecheck
npm --workspace packages/tournament-engine run build
npm audit --omit=dev
```

## Actual verification output

```text
Test Files  6 passed (6)
Tests       27 passed (27)

tsc --noEmit passed

tsc build passed

npm audit --omit=dev
found 0 vulnerabilities
```

## Notes

- Loop 002 ended with 19 tests; Loop 003 ends with 27 tests.
- The engine now covers most of the highest-risk Laravel tournament operations before any UI/Supabase implementation.
- The current TOC helper is pure/domain-level; later Supabase implementation should translate this into queries over normalized TOC selector tables.

## Next recommended loop

Before UI, do one hardening/spec alignment loop:

1. Add edge-case tests for duplicate ranks, missing payout rows, and satellite remainder already assigned.
2. Add richer bounty/multiplier cases after manual rank edits.
3. Add a concise `ENGINE_RULE_MAPPING.md` linking each engine function back to Laravel source lines/behaviors.
4. Consider initializing git in the rebuild lab or creating a private GitHub repo for clean version history.
