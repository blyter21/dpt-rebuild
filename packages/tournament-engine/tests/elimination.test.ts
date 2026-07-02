import { describe, expect, it } from 'vitest';
import {
  applyFinalTableFlags,
  eliminateDptPlayer,
  eliminateFreerollPlayer,
  makeSatelliteWinners
} from '../src/index.js';

describe('elimination, final table, and satellite winner logic', () => {
  it('assigns DPT elimination rank from current remaining players and calculates score', () => {
    const result = eliminateDptPlayer({
      playerId: 'p3',
      entries: [
        { playerId: 'p1', totalBuyInAmount: 140, eliminated: false },
        { playerId: 'p2', totalBuyInAmount: 240, eliminated: false },
        { playerId: 'p3', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p4', totalBuyInAmount: 120, eliminated: true, rank: 4, eliminationSequence: 1 }
      ],
      payouts: [
        { standing: 1, payoutAmount: 500 },
        { standing: 2, payoutAmount: 250 },
        { standing: 3, payoutAmount: 100 }
      ],
      nextEliminationSequence: 2,
      pointsMultiplierValue: 2
    });

    expect(result.find((entry) => entry.playerId === 'p3')).toMatchObject({
      rank: 3,
      winnings: 100,
      score: 400,
      eliminated: true,
      eliminationSequence: 2
    });
  });

  it('marks final table flags for ranks 1 through configured final table count', () => {
    expect(applyFinalTableFlags([
      { playerId: 'winner', rank: 1, eliminated: true },
      { playerId: 'runner-up', rank: 2, eliminated: true },
      { playerId: 'bubble', rank: 3, eliminated: true },
      { playerId: 'unranked', eliminated: false }
    ], 2)).toEqual([
      { playerId: 'winner', rank: 1, eliminated: true, finalTable: true },
      { playerId: 'runner-up', rank: 2, eliminated: true, finalTable: true },
      { playerId: 'bubble', rank: 3, eliminated: true, finalTable: false },
      { playerId: 'unranked', eliminated: false, finalTable: false }
    ]);
  });

  it('calculates freeroll elimination score from winnings, points, bonus, and multiplier', () => {
    const result = eliminateFreerollPlayer({
      playerId: 'p2',
      entries: [
        { playerId: 'p1', totalBuyInAmount: 0, eliminated: false },
        { playerId: 'p2', totalBuyInAmount: 0, eliminated: false },
        { playerId: 'p3', totalBuyInAmount: 0, eliminated: false }
      ],
      payouts: [
        { standing: 1, payoutAmount: 50, points: 100 },
        { standing: 2, payoutAmount: 25, points: 50 },
        { standing: 3, payoutAmount: 0, points: 10 }
      ],
      participationBonusPoints: 5,
      pointsMultiplierValue: 2,
      nextEliminationSequence: 7
    });

    expect(result.find((entry) => entry.playerId === 'p2')).toMatchObject({
      rank: 3,
      winnings: 0,
      score: 30,
      eliminated: true,
      eliminationSequence: 7
    });
  });

  it('satellite make-winners marks all remaining players, assigning remainder rank first', () => {
    const result = makeSatelliteWinners({
      clickedPlayerId: 'p2',
      entries: [
        { playerId: 'p1', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p2', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p3', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p4', totalBuyInAmount: 100, eliminated: true, rank: 4 }
      ],
      payoutWinnerCount: 3,
      hasRemainderPayout: true,
      nextEliminationSequence: 10
    });

    expect(result.find((entry) => entry.playerId === 'p2')).toMatchObject({
      rank: 2,
      eliminated: true,
      eliminationSequence: 10
    });
    expect(result.find((entry) => entry.playerId === 'p1')).toMatchObject({
      rank: 1,
      eliminated: true,
      eliminationSequence: 11
    });
    expect(result.find((entry) => entry.playerId === 'p3')).toMatchObject({
      rank: 1,
      eliminated: true,
      eliminationSequence: 12
    });
    expect(result.find((entry) => entry.playerId === 'p4')).toMatchObject({
      rank: 4,
      eliminated: true
    });
  });

  it('satellite make-winners skips remainder rank when remainder was already assigned', () => {
    const result = makeSatelliteWinners({
      clickedPlayerId: 'p1',
      entries: [
        { playerId: 'p1', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p2', totalBuyInAmount: 100, eliminated: false },
        { playerId: 'p3', totalBuyInAmount: 100, eliminated: true, rank: 2 }
      ],
      payoutWinnerCount: 3,
      hasRemainderPayout: true,
      remainderAlreadyAssigned: true,
      nextEliminationSequence: 20
    });

    expect(result.find((entry) => entry.playerId === 'p1')).toMatchObject({ rank: 1, eliminated: true });
    expect(result.find((entry) => entry.playerId === 'p2')).toMatchObject({ rank: 1, eliminated: true });
    expect(result.find((entry) => entry.playerId === 'p3')).toMatchObject({ rank: 2, eliminated: true });
  });
});
