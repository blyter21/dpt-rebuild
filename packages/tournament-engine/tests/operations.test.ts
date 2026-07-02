import { describe, expect, it } from 'vitest';
import {
  materializePayouts,
  recalculateManualRanks,
  undoPlayerStat
} from '../src/index.js';

describe('tournament operations', () => {
  it('undoPlayerStat clears rank/score/winnings/elimination state for non-flight entries', () => {
    expect(undoPlayerStat({
      playerId: 'p1',
      tournamentType: 'dpt_standard',
      rebuyChipsCount: 10000,
      entries: [{
        playerId: 'p1',
        totalBuyInAmount: 240,
        initialChipsCount: 20000,
        noOfAddonsBuy: 2,
        totalChips: 40000,
        rank: 2,
        winnings: 500,
        score: 740,
        eliminated: true,
        eliminationSequence: 4,
        finalTable: true
      }]
    })).toEqual([{
      playerId: 'p1',
      totalBuyInAmount: 240,
      initialChipsCount: 20000,
      noOfAddonsBuy: 2,
      totalChips: 40000,
      rank: null,
      winnings: null,
      score: null,
      eliminated: false,
      eliminationSequence: null,
      finalTable: false
    }]);
  });

  it('undoPlayerStat restores total chips for flight entries', () => {
    expect(undoPlayerStat({
      playerId: 'p1',
      tournamentType: 'flight',
      rebuyChipsCount: 10000,
      entries: [{
        playerId: 'p1',
        totalBuyInAmount: 240,
        initialChipsCount: 20000,
        noOfAddonsBuy: 2,
        totalChips: 0,
        rank: 2,
        winnings: 0,
        score: 240,
        eliminated: true,
        eliminationSequence: 4,
        finalTable: true
      }]
    })).toEqual([{
      playerId: 'p1',
      totalBuyInAmount: 240,
      initialChipsCount: 20000,
      noOfAddonsBuy: 2,
      totalChips: 40000,
      rank: null,
      winnings: null,
      score: null,
      eliminated: false,
      eliminationSequence: null,
      finalTable: false
    }]);
  });

  it('recalculates DPT scores after manual rank, buy-in, bounty, and chip edits', () => {
    const result = recalculateManualRanks({
      tournamentType: 'dpt_standard',
      playersAtFinalTable: 2,
      payouts: [
        { standing: 1, payoutAmount: 500 },
        { standing: 2, payoutAmount: 250 }
      ],
      edits: [
        { playerId: 'p1', rank: 1, totalBuyInAmount: 300, bounty: 25, totalChips: 0 },
        { playerId: 'p2', rank: 2, totalBuyInAmount: 200, bounty: 10, totalChips: 0 },
        { playerId: 'p3', rank: null, totalBuyInAmount: 100, bounty: 0, totalChips: 5000 }
      ],
      entries: [
        { playerId: 'p1', eliminated: false },
        { playerId: 'p2', eliminated: false },
        { playerId: 'p3', eliminated: false }
      ]
    });

    expect(result).toEqual([
      { playerId: 'p1', eliminated: true, totalBuyInAmount: 300, bounty: 25, totalChips: 0, rank: 1, eliminationSequence: 1, winnings: 500, score: 800, finalTable: true },
      { playerId: 'p2', eliminated: true, totalBuyInAmount: 200, bounty: 10, totalChips: 0, rank: 2, eliminationSequence: 2, winnings: 250, score: 450, finalTable: true },
      { playerId: 'p3', eliminated: false, totalBuyInAmount: 100, bounty: 0, totalChips: 5000, rank: null, eliminationSequence: null, winnings: 0, score: 100, finalTable: false }
    ]);
  });

  it('allows duplicate manual ranks to share payout and final-table flags', () => {
    const result = recalculateManualRanks({
      tournamentType: 'dpt_standard',
      playersAtFinalTable: 2,
      payouts: [
        { standing: 1, payoutAmount: 500 },
        { standing: 2, payoutAmount: 250 }
      ],
      edits: [
        { playerId: 'p1', rank: 2, totalBuyInAmount: 100 },
        { playerId: 'p2', rank: 2, totalBuyInAmount: 200 }
      ],
      entries: [
        { playerId: 'p1', eliminated: false },
        { playerId: 'p2', eliminated: false }
      ]
    });

    expect(result).toEqual([
      { playerId: 'p1', eliminated: true, totalBuyInAmount: 100, rank: 2, eliminationSequence: 2, winnings: 250, score: 350, finalTable: true },
      { playerId: 'p2', eliminated: true, totalBuyInAmount: 200, rank: 2, eliminationSequence: 2, winnings: 250, score: 450, finalTable: true }
    ]);
  });

  it('uses zero winnings when a manual rank has no matching payout row', () => {
    const result = recalculateManualRanks({
      tournamentType: 'dpt_standard',
      payouts: [{ standing: 1, payoutAmount: 500 }],
      edits: [{ playerId: 'p9', rank: 9, totalBuyInAmount: 75 }],
      entries: [{ playerId: 'p9', eliminated: false }]
    });

    expect(result).toEqual([
      { playerId: 'p9', eliminated: true, totalBuyInAmount: 75, rank: 9, eliminationSequence: 9, winnings: 0, score: 75, finalTable: false }
    ]);
  });

  it('applies multiplier to manual DPT scores while preserving bounty for display-layer scoring', () => {
    const result = recalculateManualRanks({
      tournamentType: 'dpt_standard',
      pointsMultiplierValue: 3,
      payouts: [{ standing: 1, payoutAmount: 500 }],
      edits: [{ playerId: 'p1', rank: 1, totalBuyInAmount: 100, bounty: 25 }],
      entries: [{ playerId: 'p1', eliminated: false }]
    });

    expect(result).toEqual([
      { playerId: 'p1', eliminated: true, totalBuyInAmount: 100, bounty: 25, rank: 1, eliminationSequence: 1, winnings: 500, score: 1800, finalTable: false }
    ]);
  });

  it('materializes percentage payout template rows into tournament payouts', () => {
    expect(materializePayouts({
      tournamentId: 't1',
      structureId: 's1',
      totalDistributionAmount: 1000,
      templateRows: [
        { standing: 1, payoutPercentage: 50 },
        { standing: 2, payoutPercentage: 30 },
        { standing: 3, payoutPercentage: 20 }
      ]
    })).toEqual([
      { tournamentId: 't1', structureId: 's1', standing: 1, payoutPercentage: 50, payoutAmount: 500 },
      { tournamentId: 't1', structureId: 's1', standing: 2, payoutPercentage: 30, payoutAmount: 300 },
      { tournamentId: 't1', structureId: 's1', standing: 3, payoutPercentage: 20, payoutAmount: 200 }
    ]);
  });

  it('materializes freeroll payout rows with prize descriptions and points', () => {
    expect(materializePayouts({
      tournamentId: 't1',
      structureId: 's-free',
      templateRows: [
        { standing: 1, payoutAmount: 100, prizeDescription: 'Seat', points: 50 },
        { standing: 2, payoutAmount: 0, prizeDescription: 'Points only', points: 25 }
      ]
    })).toEqual([
      { tournamentId: 't1', structureId: 's-free', standing: 1, payoutPercentage: null, payoutAmount: 100, prizeDescription: 'Seat', points: 50 },
      { tournamentId: 't1', structureId: 's-free', standing: 2, payoutPercentage: null, payoutAmount: 0, prizeDescription: 'Points only', points: 25 }
    ]);
  });
});
