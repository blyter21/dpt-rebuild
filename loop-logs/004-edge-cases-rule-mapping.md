# Loop 004 — Engine Hardening Edge Cases + Rule Mapping

## Goal

Harden the tournament engine with edge-case tests for duplicate ranks, missing payouts, satellite remainder state, bounty/multiplier manual rank edits, and add a mapping document from engine functions to Laravel behaviors.

## Files created/updated

- `packages/tournament-engine/tests/operations.test.ts`
- `packages/tournament-engine/tests/elimination.test.ts`
- `packages/tournament-engine/src/elimination.ts`
- `packages/tournament-engine/ENGINE_RULE_MAPPING.md`
- `packages/tournament-engine/README.md`
- `GOAL.md`
- `loop-logs/004-edge-cases-rule-mapping.md`

## Added edge-case coverage

### Duplicate manual ranks

Added a test proving multiple players can share a manually assigned rank and receive the same payout/final-table flag behavior.

### Missing payout rows

Added a test proving that if an assigned rank has no matching payout row, winnings default to `0` and score still recalculates from buy-in.

### Bounty + multiplier manual rank edits

Added a test proving manual recalculation applies the DPT points multiplier to stored score while preserving bounty separately for the display layer.

### Satellite remainder already assigned

Added an optional `remainderAlreadyAssigned` input to `makeSatelliteWinners()` and a test proving it skips rank `2` when the remainder payout has already been assigned.

## Rule mapping

Created:

```text
packages/tournament-engine/ENGINE_RULE_MAPPING.md
```

It maps each engine function back to current Laravel behavior/source areas:

- calculations
- eliminations
- final table
- satellite make-winners
- flight advancement/undo
- payout materialization
- Tournament of Champions qualification

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
Tests       31 passed (31)

tsc --noEmit passed

tsc build passed

npm audit --omit=dev
found 0 vulnerabilities
```

## Notes

- Loop 003 ended with 27 tests; Loop 004 ends with 31 tests.
- This loop mostly hardened existing behavior rather than adding large new feature areas.
- The mapping doc currently references source files/function areas; exact line anchors can be added later if needed.

## Next recommended loop

The tournament engine is now strong enough to move toward schema/RPC alignment. Recommended next loop:

1. Create `supabase/README` expansion for local Supabase dev setup.
2. Convert `03-supabase-schema-draft.sql` into an initial migration file.
3. Add seed data matching the tournament-engine test fixtures.
4. Draft RPC signatures for check-in, add-on, eliminate, undo, payout materialization, flight advance/undo, and TOC queries.
5. Do not connect to a real Supabase cloud project yet unless Brook explicitly approves.
