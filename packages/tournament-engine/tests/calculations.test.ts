import { describe, expect, it } from 'vitest';
import {
  applyAddon,
  calculateCheckInTotals,
  calculateDptDisplayScore,
  calculateDptStoredScore,
  calculateFreerollScore,
  calculatePrizePool,
  calculateSatelliteRank
} from '../src/index.js';

describe('check-in, add-ons, chips, prize pool, and scoring', () => {
  it('calculates DPT check-in totals without add-ons', () => {
    expect(calculateCheckInTotals({
      tournamentType: 'dpt_standard',
      submittedInitialBuyIn: 150,
      dealerFee: 10,
      includeAddons: false,
      totalAddonBuyIn: 0,
      rebuyFee: 0,
      noOfAddons: 0,
      initialChipsCount: 20000,
      rebuyChipsCount: 10000
    })).toEqual({
      initialBuyIn: 140,
      totalBuyIn: 140,
      noOfAddons: 0,
      totalAddonChips: 0,
      totalChips: 20000
    });
  });

  it('calculates DPT check-in totals with add-ons net of rebuy fees', () => {
    expect(calculateCheckInTotals({
      tournamentType: 'dpt_standard',
      submittedInitialBuyIn: 150,
      dealerFee: 10,
      includeAddons: true,
      totalAddonBuyIn: 120,
      rebuyFee: 10,
      noOfAddons: 2,
      initialChipsCount: 20000,
      rebuyChipsCount: 10000
    })).toEqual({
      initialBuyIn: 140,
      totalBuyIn: 240,
      noOfAddons: 2,
      totalAddonChips: 20000,
      totalChips: 40000
    });
  });

  it('forces freeroll money fields to zero but preserves chip calculation', () => {
    expect(calculateCheckInTotals({
      tournamentType: 'freeroll',
      submittedInitialBuyIn: 150,
      dealerFee: 10,
      includeAddons: true,
      totalAddonBuyIn: 120,
      rebuyFee: 10,
      noOfAddons: 2,
      initialChipsCount: 5000,
      rebuyChipsCount: 2000
    })).toEqual({
      initialBuyIn: 0,
      totalBuyIn: 0,
      noOfAddons: 2,
      totalAddonChips: 4000,
      totalChips: 9000
    });
  });

  it('applies a post-check-in add-on to totals', () => {
    expect(applyAddon({
      initialBuyIn: 140,
      initialChipsCount: 20000,
      totalBuyInAmount: 140,
      noOfAddonsBuy: 1,
      totalAddonChips: 10000,
      totalChips: 30000
    }, {
      tournamentType: 'dpt_standard',
      addonBuyInAmount: 120,
      addonRebuyFee: 10,
      noOfAddons: 2,
      rebuyChipsCount: 10000
    })).toEqual({
      initialBuyIn: 140,
      initialChipsCount: 20000,
      totalBuyInAmount: 240,
      noOfAddonsBuy: 3,
      totalAddonChips: 30000,
      totalChips: 50000
    });
  });

  it('calculates running prize pool from buy-ins minus fee plus bounty', () => {
    expect(calculatePrizePool({
      playerBuyIns: [140, 240, 100],
      tournamentFeePercent: 10,
      totalBounty: 50
    })).toBe(482);
  });

  it('uses saved payout distribution amount after registration close', () => {
    expect(calculatePrizePool({
      playerBuyIns: [140, 240, 100],
      tournamentFeePercent: 10,
      totalBounty: 50,
      registrationClosed: true,
      savedPayoutDistributionAmount: 400
    })).toBe(450);
  });

  it('calculates DPT stored and display scores with multiplier and bounty', () => {
    const input = { totalBuyInAmount: 240, winnings: 500, bounty: 20, pointsMultiplierValue: 2 };
    expect(calculateDptStoredScore(input)).toBe(1480);
    expect(calculateDptDisplayScore(input)).toBe(1520);
  });

  it('calculates freeroll score with participation bonus and multiplier', () => {
    expect(calculateFreerollScore({
      winnings: 25,
      payoutPoints: 100,
      participationBonusPoints: 10,
      pointsMultiplierValue: 2
    })).toBe(270);
  });

  it('calculates satellite rank for normal winner, remainder winner, and non-winner', () => {
    expect(calculateSatelliteRank({
      remainingPlayerCount: 3,
      payoutWinnerCount: 5,
      hasRemainderPayout: false,
      remainderAlreadyAssigned: false
    })).toBe(1);

    expect(calculateSatelliteRank({
      remainingPlayerCount: 3,
      payoutWinnerCount: 5,
      hasRemainderPayout: true,
      remainderAlreadyAssigned: false
    })).toBe(2);

    expect(calculateSatelliteRank({
      remainingPlayerCount: 8,
      payoutWinnerCount: 5,
      hasRemainderPayout: true,
      remainderAlreadyAssigned: true
    })).toBe(8);
  });
});
