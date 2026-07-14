import { undoPlayerStat, type TournamentEntry, type TournamentType } from '@dpt/tournament-engine';
import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

type TournamentConfig = {
  rebuy_chips_count: number;
  tournament_types: { code?: string } | Array<{ code?: string }> | null;
};

type EntryRow = {
  id: number;
  eliminated: boolean;
  initial_chips_count: number;
  no_of_addons_buy: number;
  total_chips: number;
  total_buy_in_amount: number;
  rank: number | null;
  winnings: number | null;
  score: number | null;
  elimination_sequence: number | null;
  final_table: boolean;
};

const supportedTypes = new Set<TournamentType>(['dpt_standard', 'satellite', 'freeroll', 'flight']);

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
    select: 'rebuy_chips_count,tournament_types(code)',
    id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });
  const entryQuery = new URLSearchParams({
    select: 'id,eliminated,initial_chips_count,no_of_addons_buy,total_chips,total_buy_in_amount,rank,winnings,score,elimination_sequence,final_table',
    id: `eq.${entryId}`,
    tournament_id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });

  const [tournamentResponse, entryResponse] = await Promise.all([
    dptAdminSupabaseFetch(context, `/rest/v1/tournaments?${tournamentQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_entries?${entryQuery}`),
  ]);
  if (!tournamentResponse.ok || !entryResponse.ok) {
    return NextResponse.json({ error: 'Unable to load undo state' }, { status: 502 });
  }

  const tournament = (await tournamentResponse.json() as TournamentConfig[])[0];
  const entry = (await entryResponse.json() as EntryRow[])[0];
  if (!tournament || !entry) return NextResponse.json({ error: 'Tournament entry not found' }, { status: 404 });
  if (!entry.eliminated && entry.rank == null && entry.winnings == null && entry.score == null) {
    return NextResponse.json({ error: 'Entry has no result to undo' }, { status: 409 });
  }

  const relation = Array.isArray(tournament.tournament_types)
    ? tournament.tournament_types[0]
    : tournament.tournament_types;
  const tournamentType = relation?.code as TournamentType | undefined;
  if (!tournamentType || !supportedTypes.has(tournamentType)) {
    return NextResponse.json({ error: 'Tournament type is not configured' }, { status: 409 });
  }

  const engineEntry: TournamentEntry = {
    playerId: String(entryId),
    initialChipsCount: Number(entry.initial_chips_count || 0),
    noOfAddonsBuy: Number(entry.no_of_addons_buy || 0),
    totalChips: Number(entry.total_chips || 0),
    totalBuyInAmount: Number(entry.total_buy_in_amount || 0),
    eliminated: Boolean(entry.eliminated),
    preRegistered: false,
    rank: entry.rank,
    winnings: entry.winnings,
    score: entry.score,
    eliminationSequence: entry.elimination_sequence,
    finalTable: Boolean(entry.final_table),
  };
  const next = undoPlayerStat({
    playerId: String(entryId),
    tournamentType,
    rebuyChipsCount: Number(tournament.rebuy_chips_count || 0),
    entries: [engineEntry],
  })[0];

  const rpcResponse = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_undo_entry_result', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_entry_id: entryId,
      p_next_total_chips: Number(next.totalChips || 0),
    }),
  });
  if (!rpcResponse.ok) return NextResponse.json({ error: 'Player result could not be undone' }, { status: 409 });

  return NextResponse.json({ entry: await rpcResponse.json(), result: next });
}
