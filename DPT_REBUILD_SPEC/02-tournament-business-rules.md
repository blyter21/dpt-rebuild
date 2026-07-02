# 02 — Tournament Business Rules

This is the implementation contract for the standalone tournament engine. The current source of truth is mostly `Admin/TournamentController.php`, `Tournament.php`, and `TournamentPlayer.php`.

## Tournament types

| ID | Type | Current behavior |
|---:|---|---|
| 1 | DPT Standard | Buy-in tournament. Score generally equals buy-in amount plus winnings, with optional multiplier. |
| 2 | Satellite | Winner ranks can collapse to rank `1`; optional remainder payout uses rank `2`. |
| 3 | Freeroll | No normal cash buy-in. Uses winnings/prize + points + participation bonus. |
| 4 | Flight | Feeder tournament that advances remaining players/chips into a main tournament. |

## Check-in calculations

### Non-freeroll initial buy-in

```text
initial_buyin = submitted_initial_buyin - dealer_fee
```

### Add-ons included at check-in

```text
total_buyin = initial_buyin + (total_addon_buyin - (rebuy_fee * no_of_addons))
```

When add-ons are not included:

```text
no_of_addons = 0
```

### Chips

```text
total_addon_chips = no_of_addons * tournament.rebuy_chips_count
total_chips = initial_chips_count + total_addon_chips
```

### Freeroll money

For freeroll tournaments, monetary buy-in fields are forced to zero, but chips may still be calculated from initial/rebuy chip configuration.

## Post-check-in add-ons

For non-freerolls:

```text
rebuy_amount = addon_buy_in_amount - (addon_rebuy_fee * no_of_addons)
total_buy_in_amount += rebuy_amount
no_of_addons_buy += no_of_addons
total_addon_chips = no_of_addons_buy * tournament.rebuy_chips_count
total_chips = initial_chips_count + total_addon_chips
```

## Prize pool

For running/open tournaments:

```text
total_amount = sum(non_pre_registered_player.total_buy_in_amount)
fee = total_amount * tournament_fee_percent / 100
prize_pool = total_amount - fee + total_bounty
```

For closed tournaments with saved payout distribution amount:

```text
prize_pool = total_payout_distribution_amount + total_bounty
```

For main tournaments with flights, buy-ins may include tied flight tournaments plus main tournament buy-ins depending on `allow_search_registration`.

## DPT score

Stored score:

```text
score = total_buy_in_amount + winnings
```

With multiplier:

```text
score = (total_buy_in_amount + winnings) * points_multiplier_value
```

Public display may add bounty separately:

```text
display_score = score + bounty
```

With multiplier display:

```text
display_score = score + round(bounty * points_multiplier_value)
```

## Freeroll score

```text
points = payout_points + participation_bonus_points
score = winnings + points
```

With multiplier:

```text
score = (winnings + points) * points_multiplier_value
```

## Elimination rank

Base rank count:

```text
rankcount = count(players where pre_registration = 0 and eliminated = 0)
```

The next busted player gets the current remaining-player count as finishing rank. The final remaining player is forced to rank `1`.

## Satellite rank

If the player is within the payout winner count:

- rank `1` normally
- rank `2` for the optional remainder payout, if remainder exists and has not already been assigned

If outside payout winner count:

- rank equals remaining-player count / normal finishing position

## Flight advancement

When a flight is stopped:

1. Find main tournament via `advancing_tournaments_id`.
2. Set flight `stop_flight_tournament = 1`.
3. Mark remaining non-eliminated players as `qualified_flight_player = 1`.
4. Add/update those players in the main tournament.
5. Rank flight survivors by chip count, ties sharing rank.
6. Mark flight survivors as eliminated in the flight.

Chip carryover modes:

```text
accumulator/sum: main chips = sum(qualified flight chips)
highest: main chips = max(qualified flight chips)
```

## Undo flight advancement

Undo should:

- reopen/unst stop the flight
- remove this flight’s advanced chips from main if player has other qualified flights
- otherwise remove player from main tournament
- reset flight player `qualified_flight_player`, `eliminated`, and `rank`

In the rebuild this should use a `flight_advancements` ledger, not only row mutations.
