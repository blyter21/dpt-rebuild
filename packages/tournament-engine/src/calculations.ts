import type {
  AddonInput,
  CheckInInput,
  CheckInTotals,
  DptScoreInput,
  EntryTotals,
  FreerollScoreInput,
  PrizePoolInput,
  SatelliteRankInput
} from './types';

export function calculateInitialBuyIn(
  tournamentType: CheckInInput['tournamentType'],
  submittedInitialBuyIn: number,
  dealerFee: number
): number {
  if (tournamentType === 'freeroll') return 0;
  return submittedInitialBuyIn - dealerFee;
}

export function calculateCheckInTotals(input: CheckInInput): CheckInTotals {
  const initialBuyIn = calculateInitialBuyIn(
    input.tournamentType,
    input.submittedInitialBuyIn,
    input.dealerFee
  );

  const noOfAddons = input.includeAddons ? input.noOfAddons : 0;
  const addonBuyInNet = input.includeAddons
    ? input.totalAddonBuyIn - input.rebuyFee * noOfAddons
    : 0;

  const totalBuyIn = input.tournamentType === 'freeroll' ? 0 : initialBuyIn + addonBuyInNet;
  const totalAddonChips = noOfAddons * input.rebuyChipsCount;
  const totalChips = input.initialChipsCount + totalAddonChips;

  return { initialBuyIn, totalBuyIn, noOfAddons, totalAddonChips, totalChips };
}

export function applyAddon(entry: EntryTotals, input: AddonInput): EntryTotals {
  const addonNetAmount = input.tournamentType === 'freeroll'
    ? 0
    : input.addonBuyInAmount - input.addonRebuyFee * input.noOfAddons;

  const noOfAddonsBuy = entry.noOfAddonsBuy + input.noOfAddons;
  const totalAddonChips = noOfAddonsBuy * input.rebuyChipsCount;
  const totalChips = entry.initialChipsCount + totalAddonChips;

  return {
    ...entry,
    totalBuyInAmount: entry.totalBuyInAmount + addonNetAmount,
    noOfAddonsBuy,
    totalAddonChips,
    totalChips
  };
}

export function calculatePrizePool(input: PrizePoolInput): number {
  const bounty = input.totalBounty ?? 0;
  if (input.registrationClosed && input.savedPayoutDistributionAmount != null) {
    return input.savedPayoutDistributionAmount + bounty;
  }

  const totalAmount = input.playerBuyIns.reduce((sum, amount) => sum + amount, 0);
  const fee = (totalAmount / 100) * input.tournamentFeePercent;
  return totalAmount - fee + bounty;
}

export function calculateDptStoredScore(input: DptScoreInput): number {
  const base = input.totalBuyInAmount + input.winnings;
  return input.pointsMultiplierValue ? base * input.pointsMultiplierValue : base;
}

export function calculateDptDisplayScore(input: DptScoreInput): number {
  const stored = calculateDptStoredScore(input);
  const bounty = input.bounty ?? 0;
  return input.pointsMultiplierValue ? stored + Math.round(bounty * input.pointsMultiplierValue) : stored + bounty;
}

export function calculateFreerollScore(input: FreerollScoreInput): number {
  const base = input.winnings + (input.payoutPoints ?? 0) + (input.participationBonusPoints ?? 0);
  return input.pointsMultiplierValue ? base * input.pointsMultiplierValue : base;
}

export function calculateSatelliteRank(input: SatelliteRankInput): number {
  if (input.remainingPlayerCount <= input.payoutWinnerCount) {
    if (input.hasRemainderPayout && !input.remainderAlreadyAssigned) return 2;
    return 1;
  }
  return input.remainingPlayerCount;
}
