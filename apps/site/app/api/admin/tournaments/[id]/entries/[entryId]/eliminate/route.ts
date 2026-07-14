import {
  applyFinalTableFlags,
  eliminateDptPlayer,
  eliminateFreerollPlayer,
  type PayoutRow,
  type TournamentEntry,
  type TournamentType,
} from '@dpt/tournament-engine';
import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

type TournamentConfig = {
  points_multiplier_enabled: boolean;
  points_multiplier_value: number | null;
  participation_bonus_points: number;
  players_at_final_table: number | null;
  tournament_types: { code?: string } | Array<{ code?: string }> | null;
};

type EntryRow = {
  id: number;
  checked_in: boolean;
  pre_registered: boolean;
  eliminated: boolean;
  total_buy_in_amount: number;
  initial_chips_count: number;
  no_of_addons_buy: number;
  total_chips: number;
  rank: number | null;
  winnings: number | null;
  score: number | null;
  bounty: number;
  elimination_sequence: number | null;
  final_table: boolean;
};

type PayoutDbRow = { standing: number; payout_amount: number; points: number | null };

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; entryId: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  const entryId = Number(params.entryId);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0 || !Number.isSafeInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament or entry ID' }, { status: 400 });
  }

  const tournamentQuery = new URLSearchParams({
    select: 'points_multiplier_enabled,points_multiplier_value,participation_bonus_points,players_at_final_table,tournament_types(code)',
    id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });
  const entriesQuery = new URLSearchParams({
    select: 'id,checked_in,pre_registered,eliminated,total_buy_in_amount,initial_chips_count,no_of_addons_buy,total_chips,rank,winnings,score,bounty,elimination_sequence,final_table',
    tournament_id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    order: 'id.asc',
  });
  const payoutsQuery = new URLSearchParams({
    select: 'standing,payout_amount,points',
    tournament_id: `eq.${tournamentId}`,
    order: 'standing.asc',
  });

  const [tournamentResponse, entriesResponse, payoutsResponse] = await Promise.all([
    dptAdminSupabaseFetch(context, `/rest/v1/tournaments?${tournamentQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_entries?${entriesQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_payouts?${payoutsQuery}`),
  ]);
  if (!tournamentResponse.ok || !entriesResponse.ok || !payoutsResponse.ok) {
    return NextResponse.json({ error: 'Unable to load elimination state' }, { status: 502 });
  }

  const tournament = (await tournamentResponse.json() as TournamentConfig[])[0];
  const entries = await entriesResponse.json() as EntryRow[];
  const payoutRows = await payoutsResponse.json() as PayoutDbRow[];
  const target = entries.find((entry) => entry.id === entryId);
  if (!tournament || !target) return NextResponse.json({ error: 'Tournament entry not found' }, { status: 404 });
  if (!target.checked_in || target.eliminated) {
    return NextResponse.json({ error: 'Elimination requires a checked-in, active entry' }, { status: 409 });
  }

  const relation = Array.isArray(tournament.tournament_types)
    ? tournament.tournament_types[0]
    : tournament.tournament_types;
  const tournamentType = relation?.code as TournamentType | undefined;
  if (tournamentType !== 'dpt_standard' && tournamentType !== 'freeroll') {
    return NextResponse.json({ error: 'Satellite and flight elimination require their dedicated workflow' }, { status: 409 });
  }

  const engineEntries: TournamentEntry[] = entries.map((entry) => ({
    playerId: String(entry.id),
    totalBuyInAmount: Number(entry.total_buy_in_amount || 0),
    initialChipsCount: Number(entry.initial_chips_count || 0),
    noOfAddonsBuy: Number(entry.no_of_addons_buy || 0),
    totalChips: Number(entry.total_chips || 0),
    eliminated: Boolean(entry.eliminated),
    preRegistered: !entry.checked_in,
    rank: entry.rank,
    winnings: entry.winnings,
    score: entry.score,
    bounty: Number(entry.bounty || 0),
    eliminationSequence: entry.elimination_sequence,
    finalTable: Boolean(entry.final_table),
  }));
  const payouts: PayoutRow[] = payoutRows.map((row) => ({
    standing: Number(row.standing),
    payoutAmount: Number(row.payout_amount || 0),
    points: row.points == null ? null : Number(row.points),
  }));
  const nextEliminationSequence = entries.reduce(
    (max, entry) => Math.max(max, Number(entry.elimination_sequence || 0)),
    0,
  ) + 1;
  const pointsMultiplierValue = tournament.points_multiplier_enabled
    ? Number(tournament.points_multiplier_value || 0) || null
    : null;

  const eliminated = tournamentType === 'freeroll'
    ? eliminateFreerollPlayer({
        playerId: String(entryId),
        entries: engineEntries,
        payouts,
        nextEliminationSequence,
        participationBonusPoints: Number(tournament.participation_bonus_points || 0),
        pointsMultiplierValue,
      })
    : eliminateDptPlayer({
        playerId: String(entryId),
        entries: engineEntries,
        payouts,
        nextEliminationSequence,
        pointsMultiplierValue,
      });
  const finalized = applyFinalTableFlags(eliminated, Number(tournament.players_at_final_table || 0));
  const next = finalized.find((entry) => entry.playerId === String(entryId));
  if (!next || next.rank == null || next.winnings == null || next.score == null || next.eliminationSequence == null) {
    return NextResponse.json({ error: 'Elimination calculation failed' }, { status: 409 });
  }

  const rpcResponse = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_eliminate_entry', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_entry_id: entryId,
      p_rank: next.rank,
      p_winnings: next.winnings,
      p_score: next.score,
      p_elimination_sequence: next.eliminationSequence,
      p_final_table: Boolean(next.finalTable),
    }),
  });
  if (!rpcResponse.ok) {
    return NextResponse.json({ error: 'Player elimination could not be saved' }, { status: 409 });
  }

  return NextResponse.json({ entry: await rpcResponse.json(), result: next });
}
