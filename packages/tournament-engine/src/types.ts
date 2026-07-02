export type TournamentType = 'dpt_standard' | 'satellite' | 'freeroll' | 'flight';
export type ChipCarryoverMode = 'highest' | 'sum';

export interface CheckInInput {
  tournamentType: TournamentType;
  submittedInitialBuyIn: number;
  dealerFee: number;
  includeAddons: boolean;
  totalAddonBuyIn: number;
  rebuyFee: number;
  noOfAddons: number;
  initialChipsCount: number;
  rebuyChipsCount: number;
}

export interface CheckInTotals {
  initialBuyIn: number;
  totalBuyIn: number;
  noOfAddons: number;
  totalAddonChips: number;
  totalChips: number;
}

export interface EntryTotals {
  initialBuyIn: number;
  initialChipsCount: number;
  totalBuyInAmount: number;
  noOfAddonsBuy: number;
  totalAddonChips: number;
  totalChips: number;
}

export interface AddonInput {
  tournamentType: TournamentType;
  addonBuyInAmount: number;
  addonRebuyFee: number;
  noOfAddons: number;
  rebuyChipsCount: number;
}

export interface PrizePoolInput {
  playerBuyIns: number[];
  tournamentFeePercent: number;
  totalBounty?: number;
  registrationClosed?: boolean;
  savedPayoutDistributionAmount?: number | null;
}

export interface DptScoreInput {
  totalBuyInAmount: number;
  winnings: number;
  bounty?: number;
  pointsMultiplierValue?: number | null;
}

export interface FreerollScoreInput {
  winnings: number;
  payoutPoints?: number | null;
  participationBonusPoints?: number | null;
  pointsMultiplierValue?: number | null;
}

export interface SatelliteRankInput {
  remainingPlayerCount: number;
  payoutWinnerCount: number;
  hasRemainderPayout: boolean;
  remainderAlreadyAssigned: boolean;
}

export interface TournamentEntry {
  playerId: string;
  totalBuyInAmount?: number;
  initialChipsCount?: number;
  noOfAddonsBuy?: number;
  totalChips?: number;
  eliminated: boolean;
  preRegistered?: boolean;
  rank?: number | null;
  winnings?: number | null;
  score?: number | null;
  bounty?: number;
  eliminationSequence?: number | null;
  finalTable?: boolean;
}

export interface PayoutRow {
  standing: number;
  payoutAmount: number;
  points?: number | null;
}

export interface FlightEntry {
  playerId: string;
  totalChips: number;
  eliminated: boolean;
  preRegistered?: boolean;
  qualifiedFlightPlayer?: boolean;
  rank?: number | null;
}

export interface MainEntry {
  playerId: string;
  initialChipsCount: number;
  totalChips: number;
}

export interface FlightAdvancement {
  playerId: string;
  chipsAdvanced: number;
  flightTournamentId: string;
}
