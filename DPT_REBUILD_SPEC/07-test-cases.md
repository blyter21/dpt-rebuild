# 07 — Test Cases

## Tournament engine minimum tests

1. DPT check-in with no add-ons calculates buy-in and chips.
2. DPT check-in with add-ons subtracts dealer/rebuy fees correctly.
3. Freeroll check-in forces monetary buy-in to zero but preserves chips.
4. Post-check-in add-on updates total buy-in, add-on count, addon chips, and total chips.
5. Open tournament prize pool uses live buy-ins minus tournament fee plus bounty.
6. Closed tournament prize pool uses saved payout distribution amount plus bounty.
7. DPT score equals total buy-in plus winnings.
8. DPT score multiplier applies to buy-in + winnings.
9. DPT public display score adds bounty separately.
10. Freeroll score equals winnings + payout points + participation bonus.
11. Freeroll score multiplier applies after points/winnings sum.
12. Satellite rank returns rank 1 for normal winners.
13. Satellite rank returns rank 2 for first remainder payout.
14. DPT elimination assigns current remaining count as rank.
15. Last remaining DPT player is forced to rank 1.
16. Final table marks ranks 1..N.
17. Flight advancement highest-stack mode carries the max qualified stack.
18. Flight advancement accumulator mode sums qualified stacks.
19. Undo flight advancement removes player from main if no other qualified flights.
20. Undo flight advancement recalculates remaining stack if player qualified in other flights.
21. TOC qualification by selected tournament type returns rank 1 players.
22. TOC qualification by selected tournament IDs returns rank 1 players.

## First-loop tests to implement

- buy-in/add-on/chip calculations
- prize pool calculations
- DPT score
- freeroll score
- satellite rank
- simple flight advancement highest vs sum
