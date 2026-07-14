import { NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  const tournamentQuery = new URLSearchParams({
    select: 'id,name,starts_at,ends_at,registration_closed,minimum_buy_in,initial_chips_count,rebuy_amount,rebuy_fee,rebuy_chips_count,players_at_final_table,points_multiplier_enabled,points_multiplier_value,participation_bonus_points,event:events(id,name),venue:venues(id,name,city,state),tournament_type:tournament_types(id,code,name)',
    id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    limit: '1',
  });
  const entriesQuery = new URLSearchParams({
    select: 'id,player_id,pre_registered,checked_in,initial_buyin,initial_chips_count,total_buy_in_amount,no_of_addons_buy,total_addon_chips,total_chips,rank,winnings,score,bounty,eliminated,elimination_sequence,final_table,player:profiles!tournament_entries_player_id_fkey(id,legacy_user_id,first_name,last_name,nick_name,avatar_url)',
    tournament_id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    order: 'eliminated.asc,rank.asc.nullslast,id.asc',
  });
  const addonsQuery = new URLSearchParams({
    select: 'id,tournament_entry_id,addon_buy_in_amount,addon_chips_count,addon_count,created_at',
    tournament_id: `eq.${tournamentId}`,
    order: 'created_at.desc',
  });
  const payoutsQuery = new URLSearchParams({
    select: 'id,standing,payout_amount,points,prize_description',
    tournament_id: `eq.${tournamentId}`,
    order: 'standing.asc',
  });
  const updatesQuery = new URLSearchParams({
    select: 'id,title,published_at,featured,status',
    tournament_id: `eq.${tournamentId}`,
    deleted_at: 'is.null',
    order: 'published_at.desc.nullslast',
  });
  const auditQuery = new URLSearchParams({
    select: 'id,action,entity_type,entity_id,actor_profile_id,before_data,after_data,created_at',
    tournament_id: `eq.${tournamentId}`,
    order: 'created_at.desc',
    limit: '50',
  });

  const [tournamentResponse, entriesResponse, addonsResponse, payoutsResponse, updatesResponse, auditResponse] = await Promise.all([
    dptAdminSupabaseFetch(context, `/rest/v1/tournaments?${tournamentQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_entries?${entriesQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_entry_addons?${addonsQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_payouts?${payoutsQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/tournament_updates?${updatesQuery}`),
    dptAdminSupabaseFetch(context, `/rest/v1/dpt_admin_audit_log?${auditQuery}`),
  ]);
  const responses = [tournamentResponse, entriesResponse, addonsResponse, payoutsResponse, updatesResponse, auditResponse];
  if (responses.some((response) => !response.ok)) {
    return NextResponse.json({ error: 'Unable to load tournament desk' }, { status: 502 });
  }

  const tournament = (await tournamentResponse.json() as unknown[])[0];
  if (!tournament) return NextResponse.json({ error: 'Operational tournament not found' }, { status: 404 });

  const entries = await entriesResponse.json() as Array<Record<string, unknown>>;
  const addons = await addonsResponse.json() as Array<Record<string, unknown>>;
  const payouts = await payoutsResponse.json() as Array<Record<string, unknown>>;
  const updates = await updatesResponse.json() as Array<Record<string, unknown>>;
  const audit = await auditResponse.json() as Array<Record<string, unknown>>;

  return NextResponse.json({
    tournament,
    entries,
    addons,
    payouts,
    updates,
    audit,
    metrics: {
      registered: entries.length,
      checkedIn: entries.filter((entry) => entry.checked_in === true).length,
      remaining: entries.filter((entry) => entry.checked_in === true && entry.eliminated !== true).length,
      eliminated: entries.filter((entry) => entry.eliminated === true).length,
      totalBuyIn: entries.reduce((sum, entry) => sum + Number(entry.total_buy_in_amount || 0), 0),
      addonCount: addons.reduce((sum, addon) => sum + Number(addon.addon_count || 0), 0),
    },
  });
}
