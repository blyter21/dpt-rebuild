import { calculateDptStoredScore, calculateFreerollScore, calculateSatelliteRank } from './calculations';
import type { PayoutRow, TournamentEntry } from './types';

export interface EliminatePlayerInput {
  playerId: string;
  entries: TournamentEntry[];
  payouts: PayoutRow[];
  nextEliminationSequence: number;
  pointsMultiplierValue?: number | null;
}

export interface EliminateFreerollPlayerInput extends EliminatePlayerInput {
  participationBonusPoints?: number | null;
}

export interface MakeSatelliteWinnersInput {
  clickedPlayerId: string;
  entries: TournamentEntry[];
  payoutWinnerCount: number;
  hasRemainderPayout: boolean;
  remainderAlreadyAssigned?: boolean;
  nextEliminationSequence: number;
}

export function countRemainingEntries(entries: TournamentEntry[]): number {
  return entries.filter((entry) => !entry.preRegistered && !entry.eliminated).length;
}

export function payoutForStanding(payouts: PayoutRow[], standing: number): PayoutRow | undefined {
  return payouts.find((payout) => payout.standing === standing);
}

export function applyFinalTableFlags(entries: TournamentEntry[], playersAtFinalTable: number): TournamentEntry[] {
  return entries.map((entry) => ({
    ...entry,
    finalTable: typeof entry.rank === 'number' && entry.rank >= 1 && entry.rank <= playersAtFinalTable
  }));
}

export function eliminateDptPlayer(input: EliminatePlayerInput): TournamentEntry[] {
  const rank = countRemainingEntries(input.entries);
  const payout = payoutForStanding(input.payouts, rank);
  const winnings = payout?.payoutAmount ?? 0;

  return input.entries.map((entry) => {
    if (entry.playerId !== input.playerId) return entry;

    const totalBuyInAmount = entry.totalBuyInAmount ?? 0;
    return {
      ...entry,
      rank,
      winnings,
      score: calculateDptStoredScore({
        totalBuyInAmount,
        winnings,
        pointsMultiplierValue: input.pointsMultiplierValue
      }),
      eliminated: true,
      eliminationSequence: input.nextEliminationSequence
    };
  });
}

export function eliminateFreerollPlayer(input: EliminateFreerollPlayerInput): TournamentEntry[] {
  const rank = countRemainingEntries(input.entries);
  const payout = payoutForStanding(input.payouts, rank);
  const winnings = payout?.payoutAmount ?? 0;
  const payoutPoints = payout?.points ?? 0;

  return input.entries.map((entry) => {
    if (entry.playerId !== input.playerId) return entry;

    return {
      ...entry,
      rank,
      winnings,
      score: calculateFreerollScore({
        winnings,
        payoutPoints,
        participationBonusPoints: input.participationBonusPoints,
        pointsMultiplierValue: input.pointsMultiplierValue
      }),
      eliminated: true,
      eliminationSequence: input.nextEliminationSequence
    };
  });
}

export function makeSatelliteWinners(input: MakeSatelliteWinnersInput): TournamentEntry[] {
  const remaining = input.entries.filter((entry) => !entry.preRegistered && !entry.eliminated);
  const clicked = remaining.find((entry) => entry.playerId === input.clickedPlayerId);
  const ordered = [
    ...(clicked ? [clicked] : []),
    ...remaining.filter((entry) => entry.playerId !== input.clickedPlayerId)
  ];

  let remainderAlreadyAssigned = input.remainderAlreadyAssigned ?? false;
  const updates = new Map<string, TournamentEntry>();

  ordered.forEach((entry, index) => {
    const remainingPlayerCount = remaining.length - index;
    const rank = calculateSatelliteRank({
      remainingPlayerCount,
      payoutWinnerCount: input.payoutWinnerCount,
      hasRemainderPayout: input.hasRemainderPayout,
      remainderAlreadyAssigned
    });

    if (rank === 2) remainderAlreadyAssigned = true;

    updates.set(entry.playerId, {
      ...entry,
      rank,
      eliminated: true,
      eliminationSequence: input.nextEliminationSequence + index
    });
  });

  return input.entries.map((entry) => updates.get(entry.playerId) ?? entry);
}
