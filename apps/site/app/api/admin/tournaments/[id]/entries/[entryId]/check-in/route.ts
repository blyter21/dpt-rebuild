import { calculateCheckInTotals, type TournamentType } from '@dpt/tournament-engine';
import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

type CheckInBody = {
  submittedInitialBuyIn?: unknown;
  initialChipsCount?: unknown;
  includeAddons?: unknown;
  totalAddonBuyIn?: unknown;
  noOfAddons?: unknown;
};

type TournamentConfigRow = {
  id: number;
  dealer_fee: number;
  rebuy_fee: number;
  rebuy_chips_count: number;
  tournament_types: { code?: string } | Array<{ code?: string }> | null;
};

const tournamentTypes = new Set<TournamentType>(['dpt_standard', 'satellite', 'freeroll', 'flight']);

function nonNegativeNumber(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number`);
  return number;
}

function nonNegativeInteger(value: unknown, field: string) {
  const number = nonNegativeNumber(value, field);
  if (!Number.isInteger(number)) throw new Error(`${field} must be an integer`);
  return number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  const entryId = Number(params.entryId);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0 || !Number.isSafeInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament or entry ID' }, { status: 400 });
  }

  let body: CheckInBody;
  try {
    body = await request.json() as CheckInBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let submittedInitialBuyIn: number;
  let initialChipsCount: number;
  let totalAddonBuyIn: number;
  let noOfAddons: number;
  try {
    submittedInitialBuyIn = nonNegativeInteger(body.submittedInitialBuyIn, 'submittedInitialBuyIn');
    initialChipsCount = nonNegativeInteger(body.initialChipsCount, 'initialChipsCount');
    totalAddonBuyIn = nonNegativeInteger(body.totalAddonBuyIn ?? 0, 'totalAddonBuyIn');
    noOfAddons = nonNegativeInteger(body.noOfAddons ?? 0, 'noOfAddons');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid check-in values' }, { status: 400 });
  }

  const includeAddons = body.includeAddons === true;
  if (!includeAddons && (totalAddonBuyIn !== 0 || noOfAddons !== 0)) {
    return NextResponse.json({ error: 'Addon totals require includeAddons=true' }, { status: 400 });
  }
  if (includeAddons && noOfAddons === 0 && totalAddonBuyIn !== 0) {
    return NextResponse.json({ error: 'Addon buy-in requires at least one addon' }, { status: 400 });
  }

  const tournamentQuery = new URLSearchParams({
    select: 'id,dealer_fee,rebuy_fee,rebuy_chips_count,tournament_types(code)',
    id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });
  const tournamentResponse = await dptAdminSupabaseFetch(
    context,
    `/rest/v1/tournaments?${tournamentQuery}`,
  );
  if (!tournamentResponse.ok) {
    return NextResponse.json({ error: 'Unable to load tournament configuration' }, { status: 502 });
  }

  const tournaments = await tournamentResponse.json() as TournamentConfigRow[];
  const tournament = tournaments[0];
  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

  const typeRelation = Array.isArray(tournament.tournament_types)
    ? tournament.tournament_types[0]
    : tournament.tournament_types;
  const tournamentType = typeRelation?.code as TournamentType | undefined;
  if (!tournamentType || !tournamentTypes.has(tournamentType)) {
    return NextResponse.json({ error: 'Tournament type is not configured' }, { status: 409 });
  }

  const totals = calculateCheckInTotals({
    tournamentType,
    submittedInitialBuyIn,
    dealerFee: Number(tournament.dealer_fee || 0),
    includeAddons,
    totalAddonBuyIn,
    rebuyFee: Number(tournament.rebuy_fee || 0),
    noOfAddons,
    initialChipsCount,
    rebuyChipsCount: Number(tournament.rebuy_chips_count || 0),
  });

  if (Object.values(totals).some((value) => !Number.isFinite(value) || value < 0)) {
    return NextResponse.json({ error: 'Calculated check-in totals are invalid' }, { status: 400 });
  }

  const rpcResponse = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_check_in_entry', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_entry_id: entryId,
      p_initial_buyin: totals.initialBuyIn,
      p_initial_chips_count: initialChipsCount,
      p_total_buy_in_amount: totals.totalBuyIn,
      p_no_of_addons: totals.noOfAddons,
      p_total_addon_chips: totals.totalAddonChips,
      p_total_chips: totals.totalChips,
    }),
  });

  if (!rpcResponse.ok) {
    const status = rpcResponse.status === 404 ? 404 : 409;
    return NextResponse.json({ error: 'Tournament check-in could not be saved' }, { status });
  }

  return NextResponse.json({ entry: await rpcResponse.json(), totals });
}
