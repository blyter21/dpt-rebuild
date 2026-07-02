# DPT Tournament Engine

Standalone tested TypeScript package for Dakota Poker Tour tournament business logic.

## Current commands

```bash
npm install
npm --workspace packages/tournament-engine test
npm --workspace packages/tournament-engine run typecheck
```

## Implemented rule areas

### Loop 001

- DPT/Freeroll check-in buy-in and chip calculations
- Post-check-in add-on updates
- Prize pool calculation
- DPT stored/display score
- Freeroll score
- Satellite rank helper
- Flight survivor ranking and simple advancement in highest/sum modes

### Loop 002

- DPT elimination rank assignment and score calculation
- Final-table flag calculation
- Freeroll elimination score assignment
- Satellite make-winners behavior with optional remainder rank
- Flight advancement undo in highest-stack and sum/accumulator modes

### Loop 003

- `undoPlayerStat` reset behavior, including flight chip restoration
- Manual rank/buy-in/bounty/chip edit recalculation
- Payout materialization from percentage and freeroll template rows
- Tournament of Champions qualification helpers by tournament type and explicit tournament IDs

### Loop 004

- Edge-case tests for duplicate manual ranks
- Missing payout row behavior
- Satellite make-winners with remainder already assigned
- Bounty + multiplier manual rank edit behavior
- `ENGINE_RULE_MAPPING.md` linking engine functions to Laravel behaviors

## Source mapping

Current Laravel logic lives mainly in:

```text
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Admin/TournamentController.php
/home/hermes/projects/dpt-web/src/app/Models/Tournament.php
/home/hermes/projects/dpt-web/src/app/Models/TournamentPlayer.php
```
