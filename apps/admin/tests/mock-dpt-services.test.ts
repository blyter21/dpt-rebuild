import { describe, expect, it } from 'vitest';
import {
  createInitialMockState,
  dptAddTournamentAddon,
  dptAdvanceFlightPlayers,
  dptCheckInPlayer,
  dptEliminatePlayer,
  dptGetTocQualifiers,
  dptMaterializeTournamentPayouts,
  dptRecalculateManualRanks,
  dptUndoFlightAdvancement,
  dptUndoPlayerStat,
  getLastDisplayScore,
  getPrizePool,
  setFlightCarryoverMode
} from '../lib/mock-dpt-services';

describe('mock DPT admin services', () => {
  it('checks in Alice through the RPC-shaped service boundary', () => {
    const result = dptCheckInPlayer(createInitialMockState());
    const alice = result.state.entries.find((entry) => entry.playerId === 'Alice');

    expect(result.message).toContain('dpt_check_in_player');
    expect(alice).toMatchObject({
      totalBuyInAmount: 240,
      noOfAddonsBuy: 2,
      totalAddonChips: 20_000,
      totalChips: 40_000
    });
  });

  it('adds an add-on after check-in and updates state totals', () => {
    const checkedIn = dptCheckInPlayer(createInitialMockState()).state;
    const result = dptAddTournamentAddon(checkedIn);
    const alice = result.state.entries.find((entry) => entry.playerId === 'Alice');

    expect(result.message).toContain('dpt_add_tournament_addon');
    expect(alice).toMatchObject({
      totalBuyInAmount: 290,
      noOfAddonsBuy: 3,
      totalAddonChips: 30_000,
      totalChips: 50_000
    });
  });

  it('eliminates and then undoes Cora through service calls', () => {
    const eliminated = dptEliminatePlayer(createInitialMockState());
    const eliminatedCora = eliminated.state.entries.find((entry) => entry.playerId === 'Cora');
    expect(eliminatedCora).toMatchObject({ eliminated: true, rank: 3, winnings: 100, score: 400 });

    const undone = dptUndoPlayerStat(eliminated.state);
    const activeCora = undone.state.entries.find((entry) => entry.playerId === 'Cora');
    expect(activeCora).toMatchObject({ eliminated: false, rank: null, winnings: null, score: null });
  });

  it('recalculates manual ranks and surfaces TOC qualifiers', () => {
    const checkedIn = dptCheckInPlayer(createInitialMockState()).state;
    const ranked = dptRecalculateManualRanks(checkedIn).state;

    expect(ranked.entries.find((entry) => entry.playerId === 'Alice')).toMatchObject({ rank: 1, finalTable: true });
    expect(getPrizePool(ranked)).toBeGreaterThan(0);
    expect(getLastDisplayScore(ranked)).toBeGreaterThan(0);
    expect(dptGetTocQualifiers(ranked).map((qualifier) => qualifier.playerId)).toContain('Alice');
  });

  it('materializes payout rows through service function', () => {
    expect(dptMaterializeTournamentPayouts()).toEqual([
      { tournamentId: 'dpt-standard-seed', structureId: 'dpt-percent-seed', standing: 1, payoutPercentage: 50, payoutAmount: 500 },
      { tournamentId: 'dpt-standard-seed', structureId: 'dpt-percent-seed', standing: 2, payoutPercentage: 30, payoutAmount: 300 },
      { tournamentId: 'dpt-standard-seed', structureId: 'dpt-percent-seed', standing: 3, payoutPercentage: 20, payoutAmount: 200 }
    ]);
  });

  it('advances and undoes flight state through service calls', () => {
    const advanced = dptAdvanceFlightPlayers(createInitialMockState());
    expect(advanced.message).toContain('dpt_advance_flight_players');
    expect(advanced.state.mainEntries.find((entry) => entry.playerId === 'Bob')).toMatchObject({ totalChips: 30_000 });

    const undoneHighest = dptUndoFlightAdvancement(advanced.state);
    expect(undoneHighest.message).toContain('dpt_undo_flight_advancement');
    expect(undoneHighest.state.mainEntries.find((entry) => entry.playerId === 'Bob')).toMatchObject({ totalChips: 22_000 });

    const sumModeBase = setFlightCarryoverMode(createInitialMockState(), 'sum').state;
    const sumMode = {
      ...sumModeBase,
      mainEntries: [...sumModeBase.mainEntries, { playerId: 'Bob', initialChipsCount: 15_000, totalChips: 15_000 }]
    };
    const advancedSum = dptAdvanceFlightPlayers(sumMode).state;
    const undoneSum = dptUndoFlightAdvancement(advancedSum).state;
    expect(undoneSum.mainEntries.find((entry) => entry.playerId === 'Bob')).toMatchObject({ totalChips: 15_000 });
  });
});
