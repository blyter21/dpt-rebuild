import { calculateDptStoredScore, calculateFreerollScore } from './calculations.js';
import { applyFinalTableFlags, payoutForStanding } from './elimination.js';
import type { PayoutRow, TournamentEntry, TournamentType } from './types.js';

export interface UndoPlayerStatInput {
  playerId: string;
  tournamentType: TournamentType;
  rebuyChipsCount: number;
  entries: TournamentEntry[];
}

export interface ManualRankEdit {
  playerId: string;
  rank: number | null;
  totalBuyInAmount?: number;
  bounty?: number;
  totalChips?: number;
}

export interface RecalculateManualRanksInput {
  tournamentType: TournamentType;
  entries: TournamentEntry[];
  edits: ManualRankEdit[];
  payouts: PayoutRow[];
  playersAtFinalTable?: number;
  participationBonusPoints?: number | null;
  pointsMultiplierValue?: number | null;
}

export interface PayoutTemplateRow {
  standing: number;
  payoutPercentage?: number | null;
  payoutAmount?: number | null;
  prizeDescription?: string | null;
  points?: number | null;
}

export interface MaterializePayoutsInput {
  tournamentId: string;
  structureId?: string | null;
  totalDistributionAmount?: number | null;
  templateRows: PayoutTemplateRow[];
}

export interface MaterializedPayoutRow {
  tournamentId: string;
  structureId?: string | null;
  standing: number;
  payoutPercentage: number | null;
  payoutAmount: number;
  prizeDescription?: string | null;
  points?: number | null;
}

export function undoPlayerStat(input: UndoPlayerStatInput): TournamentEntry[] {
  return input.entries.map((entry) => {
    if (entry.playerId !== input.playerId) return entry;

    const restoredChips = input.tournamentType === 'flight'
      ? (entry.initialChipsCount ?? 0) + input.rebuyChipsCount * (entry.noOfAddonsBuy ?? 0)
      : entry.totalChips;

    return {
      ...entry,
      ...(restoredChips !== undefined ? { totalChips: restoredChips } : {}),
      rank: null,
      winnings: null,
      score: null,
      eliminated: false,
      eliminationSequence: null,
      finalTable: false
    };
  });
}

export function recalculateManualRanks(input: RecalculateManualRanksInput): TournamentEntry[] {
  const editsByPlayer = new Map(input.edits.map((edit) => [edit.playerId, edit]));

  const recalculated = input.entries.map((entry) => {
    const edit = editsByPlayer.get(entry.playerId);
    const next: TournamentEntry = edit
      ? {
          ...entry,
          totalBuyInAmount: edit.totalBuyInAmount ?? entry.totalBuyInAmount,
          bounty: edit.bounty ?? entry.bounty,
          totalChips: edit.totalChips ?? entry.totalChips,
          rank: edit.rank
        }
      : { ...entry };

    const rank = next.rank ?? null;
    const payout = typeof rank === 'number' ? payoutForStanding(input.payouts, rank) : undefined;
    const winnings = payout?.payoutAmount ?? 0;
    const eliminated = typeof rank === 'number' ? true : Boolean(next.eliminated && rank !== null);

    let score: number;
    if (input.tournamentType === 'freeroll') {
      score = calculateFreerollScore({
        winnings,
        payoutPoints: payout?.points ?? 0,
        participationBonusPoints: input.participationBonusPoints,
        pointsMultiplierValue: input.pointsMultiplierValue
      });
    } else {
      score = calculateDptStoredScore({
        totalBuyInAmount: next.totalBuyInAmount ?? 0,
        winnings,
        pointsMultiplierValue: input.pointsMultiplierValue
      });
    }

    return {
      ...next,
      rank,
      eliminationSequence: rank,
      winnings,
      score,
      eliminated
    };
  });

  return applyFinalTableFlags(recalculated, input.playersAtFinalTable ?? 0);
}

export function materializePayouts(input: MaterializePayoutsInput): MaterializedPayoutRow[] {
  return input.templateRows.map((row) => {
    const payoutPercentage = row.payoutPercentage ?? null;
    const payoutAmount = row.payoutAmount ?? (
      payoutPercentage != null && input.totalDistributionAmount != null
        ? (input.totalDistributionAmount * payoutPercentage) / 100
        : 0
    );

    const materialized: MaterializedPayoutRow = {
      tournamentId: input.tournamentId,
      structureId: input.structureId ?? null,
      standing: row.standing,
      payoutPercentage,
      payoutAmount
    };

    if (row.prizeDescription !== undefined) materialized.prizeDescription = row.prizeDescription;
    if (row.points !== undefined) materialized.points = row.points;

    return materialized;
  });
}
