# DPT Tournament Engine Rule Mapping

This document maps the standalone TypeScript tournament-engine functions back to the current Laravel behaviors they were extracted from.

Primary Laravel references:

```text
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Admin/TournamentController.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Site/TournamentController.php
/home/hermes/projects/dpt-web/src/app/Models/Tournament.php
/home/hermes/projects/dpt-web/src/app/Models/TournamentPlayer.php
```

## Calculation functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `calculateInitialBuyIn()` | Non-freeroll check-in subtracts dealer fee from submitted buy-in. Freeroll money values become zero. | `Admin/TournamentController.php` check-in/pre-reg flows around `pre_reg_edit_checkIn()` and `checkIn()` |
| `calculateCheckInTotals()` | Computes initial buy-in, total buy-in, add-on count, total add-on chips, and total chips during check-in/pre-registration. | `Admin/TournamentController.php` `checkIn()`; `Site/TournamentController.php` `preRegisteredPlayer()` |
| `applyAddon()` | Adds post-check-in rebuy/add-on amount net of rebuy fee, increments add-on count, recalculates total add-on chips and total chips. | `Admin/TournamentController.php` `addonBuyIn()` |
| `calculatePrizePool()` | Running prize pool = sum player buy-ins minus tournament fee plus bounty. Closed registration can use saved distribution amount plus bounty. | `Tournament.php` `manageTournamentInfo()` |
| `calculateDptStoredScore()` | DPT score = total buy-in + winnings, optionally multiplied. | `Admin/TournamentController.php` payout/update/elimination flows |
| `calculateDptDisplayScore()` | Public result display adds bounty separately; multiplier applies to bounty before display add. | `Site/TournamentController.php` `getPayoutsList()` score column |
| `calculateFreerollScore()` | Freeroll score = winnings + payout points + participation bonus, optionally multiplied. | `Admin/TournamentController.php` `updateFreerollEliminationDetails()` and manual rank update flow |
| `calculateSatelliteRank()` | Satellite winners receive rank `1`; optional remainder receives rank `2`; non-winners use normal remaining-player count. | `Admin/TournamentController.php` `calSatelliteRank()` |

## Elimination and result functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `countRemainingEntries()` | Counts non-pre-registered, non-eliminated players to assign finishing rank. | `Admin/TournamentController.php` `singleEliminate()` / `bulkEliminate()` |
| `eliminateDptPlayer()` | Assigns rank from remaining player count, applies payout amount, computes DPT score, sets eliminated and sequence. | `Admin/TournamentController.php` `eliminateForDpt()` + `updateEliminationDetails()` |
| `eliminateFreerollPlayer()` | Assigns rank, applies freeroll payout/points/bonus, computes freeroll score, sets eliminated and sequence. | `Admin/TournamentController.php` `eliminateForFreeroll()` + `updateFreerollEliminationDetails()` |
| `applyFinalTableFlags()` | Marks ranks `1..players_at_final_table` as final table, except satellite normal flow does not use final-table count. | `Admin/TournamentController.php` `updatePlayeratFinalTable()` and rank update flows |
| `makeSatelliteWinners()` | When make-winners flag is set, remaining satellite players are marked winners; clicked player is processed first; remainder rank is handled specially. | `Admin/TournamentController.php` `makeWinners()` and `eliminateForSatellite()` |
| `undoPlayerStat()` | Clears score, winnings, rank, eliminated state, sequence, final table; restores flight chips from initial chips + add-on chips. | `Admin/TournamentController.php` `undoPlayerStat()` |
| `recalculateManualRanks()` | Admin manual rank edit updates buy-in, bounty, chips, recalculates payout/winnings/score, eliminated state, and final table flags. | `Admin/TournamentController.php` `updateEliminatedRanks()` |

## Flight functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `rankByChipsDescending()` | Flight survivors are ranked by total chips; ties share rank. | `Admin/TournamentController.php` `stop_advance_player()` |
| `advanceFlightPlayers()` | Remaining flight players advance into main tournament. Highest-stack mode keeps max stack; accumulator/sum mode sums stacks. Flight survivors are marked qualified and eliminated. | `Admin/TournamentController.php` `stop_advance_player()` |
| `undoFlightAdvancement()` | Undo removes player from main if no other qualified flights; otherwise subtracts chips in accumulator mode or resets to highest remaining stack in highest mode. Flight player qualification/elimination/rank reset. | `Admin/TournamentController.php` `redo_advance_player()` |

## Payout functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `materializePayouts()` | Converts reusable payout template rows into tournament-specific payout rows. Percentage rows calculate amount from total distribution. Freeroll/static rows preserve prize description and points. | `Admin/TournamentController.php` `savePayoutStructures()` and `saveSatellitePayoutStructures()` |

## Tournament of Champions functions

| Engine function | Current Laravel behavior | Source reference |
|---|---|---|
| `getTournamentOfChampionsQualifiers()` | Returns rank-1, non-pre-registered players from configured tournament types and/or explicit tournament IDs, sorted newest tournament first. | `Site/TournamentController.php` `getQualifiedPlayers()` and `TournamentPlayer::tournamentsOFChampion()` |

## Known intentional differences in the engine

- The engine is pure and database-free; Laravel currently performs direct DB updates inside controllers.
- The engine uses normalized identifiers and arrays instead of CSV/text relationship fields.
- Flight advancement undo is modeled as advancement records, matching the proposed rebuild ledger approach rather than only mutating player rows.
- Bounty remains separate from stored DPT score, matching public display behavior where bounty is added later.

## Next mapping improvements

- Add exact Laravel line ranges after the reference repo stabilizes or after creating code anchors.
- Add examples comparing one Laravel tournament snapshot to engine inputs/outputs once sanitized production/sample data is available.
