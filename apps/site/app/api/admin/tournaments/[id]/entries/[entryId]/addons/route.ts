import { applyAddon, type TournamentType } from '@dpt/tournament-engine';
import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

type TournamentConfig = {
  rebuy_fee: number;
  rebuy_chips_count: number;
  tournament_types: { code?: string } | Array<{ code?: string }> | null;
};

type EntryRow = {
  id: number;
  checked_in: boolean;
  eliminated: boolean;
  initial_buyin: number;
  initial_chips_count: number;
  total_buy_in_amount: number;
  no_of_addons_buy: number;
  total_addon_chips: number;
  total_chips: number;
};

const supportedTypes = new Set<TournamentType>(['dpt_standard', 'satellite', 'freeroll', 'flight']);

function positiveInteger(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`${field} must be a positive integer`);
  return number;
}

function nonNegativeInteger(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${field} must be a non-negative integer`);
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

  let body: { addonBuyInAmount?: unknown; noOfAddons?: unknown };
  try {
    body = await request.json() as { addonBuyInAmount?: unknown; noOfAddons?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let addonBuyInAmount: number;
  let noOfAddons: number;
  try {
    addonBuyInAmount = nonNegativeInteger(body.addonBuyInAmount, 'addonBuyInAmount');
    noOfAddons = positiveInteger(body.noOfAddons, 'noOfAddons');
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid addon values' }, { status: 400 });
  }

  const tournamentQuery = new URLSearchParams({
    select: 'rebuy_fee,rebuy_chips_count,tournament_types(code)',
    id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });
  const entryQuery = new URLSearchParams({
    select: 'id,checked_in,eliminated,initial_buyin,initial_chips_count,total_buy_in_amount,no_of_addons_buy,total_addon_chips,total_chips',
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
    return NextResponse.json({ error: 'Unable to load tournament entry configuration' }, { status: 502 });
  }

  const tournament = (await tournamentResponse.json() as TournamentConfig[])[0];
  const entry = (await entryResponse.json() as EntryRow[])[0];
  if (!tournament || !entry) return NextResponse.json({ error: 'Tournament entry not found' }, { status: 404 });
  if (!entry.checked_in || entry.eliminated) {
    return NextResponse.json({ error: 'Addons require a checked-in, active entry' }, { status: 409 });
  }

  const relation = Array.isArray(tournament.tournament_types)
    ? tournament.tournament_types[0]
    : tournament.tournament_types;
  const tournamentType = relation?.code as TournamentType | undefined;
  if (!tournamentType || !supportedTypes.has(tournamentType)) {
    return NextResponse.json({ error: 'Tournament type is not configured' }, { status: 409 });
  }

  const next = applyAddon({
    initialBuyIn: Number(entry.initial_buyin || 0),
    initialChipsCount: Number(entry.initial_chips_count || 0),
    totalBuyInAmount: Number(entry.total_buy_in_amount || 0),
    noOfAddonsBuy: Number(entry.no_of_addons_buy || 0),
    totalAddonChips: Number(entry.total_addon_chips || 0),
    totalChips: Number(entry.total_chips || 0),
  }, {
    tournamentType,
    addonBuyInAmount,
    addonRebuyFee: Number(tournament.rebuy_fee || 0),
    noOfAddons,
    rebuyChipsCount: Number(tournament.rebuy_chips_count || 0),
  });

  if (Object.values(next).some((value) => !Number.isFinite(value) || value < 0)) {
    return NextResponse.json({ error: 'Calculated addon totals are invalid' }, { status: 400 });
  }

  const rpcResponse = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_add_entry_addon', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_entry_id: entryId,
      p_addon_buy_in_amount: addonBuyInAmount,
      p_addon_count: noOfAddons,
      p_next_total_buy_in_amount: next.totalBuyInAmount,
      p_next_no_of_addons: next.noOfAddonsBuy,
      p_next_total_addon_chips: next.totalAddonChips,
      p_next_total_chips: next.totalChips,
    }),
  });
  if (!rpcResponse.ok) {
    return NextResponse.json({ error: 'Addon could not be saved' }, { status: 409 });
  }

  return NextResponse.json({ entry: await rpcResponse.json(), totals: next });
}
