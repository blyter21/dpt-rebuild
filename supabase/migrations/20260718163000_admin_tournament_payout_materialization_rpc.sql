begin;

alter table public.tournaments
  add column if not exists payout_template_id bigint references public.payout_templates(id),
  add column if not exists total_registered_players integer,
  add column if not exists total_payout_players integer,
  add column if not exists total_payout_distribution_amount numeric;

create or replace function public.dpt_admin_materialize_payouts(
  p_tournament_id bigint,
  p_payout_template_id bigint,
  p_total_distribution_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_tournament public.tournaments%rowtype;
  after_tournament public.tournaments%rowtype;
  tournament_type_code text;
  template_type text;
  registered_players integer;
  source_structure_id bigint;
  inserted_count integer;
  previous_payout_count integer;
  multiplier numeric;
begin
  if not private.is_admin_operator() then
    raise exception 'Administrator access required';
  end if;
  if p_total_distribution_amount is null or p_total_distribution_amount < 0 then
    raise exception 'Distribution amount must be non-negative';
  end if;

  select profile.id into actor_profile_id
  from public.profiles profile
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'
    and profile.deleted_at is null
  limit 1;
  if actor_profile_id is null then
    raise exception 'Active operator profile required';
  end if;

  perform pg_advisory_xact_lock(p_tournament_id);
  select *
  into before_tournament
  from public.tournaments tournament
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null
  for update;
  if not found then
    raise exception 'Tournament not found';
  end if;

  select code into tournament_type_code
  from public.tournament_types
  where id = before_tournament.tournament_type_id;
  if tournament_type_code is null then
    raise exception 'Tournament type not found';
  end if;
  if not before_tournament.registration_closed then
    raise exception 'Registration must be closed before payouts are materialized';
  end if;
  if tournament_type_code not in ('dpt_standard', 'freeroll') then
    raise exception 'Satellite and flight payouts require their dedicated workflow';
  end if;

  select template.type into template_type
  from public.payout_templates template
  where template.id = p_payout_template_id
    and template.deleted_at is null;
  if not found then
    raise exception 'Payout template not found';
  end if;

  select count(*)::integer into registered_players
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
    and entry.pre_registered = false
    and entry.duplicate_status = true;
  if registered_players <= 0 then
    raise exception 'No registered players are eligible for payout materialization';
  end if;

  select (row.legacy_data ->> 'source_structure_id')::bigint into source_structure_id
  from public.payout_template_rows row
  where row.payout_template_id = p_payout_template_id
    and coalesce(row.player_count_start, registered_players) <= registered_players
    and coalesce(row.player_count_end, registered_players) >= registered_players
    and row.legacy_data ? 'source_structure_id'
  order by row.player_count_end asc nulls last, row.player_count_start desc nulls last
  limit 1;
  if source_structure_id is null then
    raise exception 'No payout structure covers % registered players', registered_players;
  end if;

  select count(*)::integer into previous_payout_count
  from public.tournament_payouts payout
  where payout.tournament_id = p_tournament_id;

  delete from public.tournament_payouts payout
  where payout.tournament_id = p_tournament_id;

  insert into public.tournament_payouts (
    tournament_id, payout_template_row_id, standing, payout_percentage,
    payout_amount, prize_description, points, created_at, updated_at, legacy_data
  )
  select
    p_tournament_id,
    row.id,
    row.standing,
    row.payout_percentage,
    coalesce(row.payout_amount, round(p_total_distribution_amount * coalesce(row.payout_percentage, 0) / 100.0, 2)),
    row.prize_description,
    row.points,
    now(),
    now(),
    jsonb_build_object('materialized_by', actor_profile_id, 'source_structure_id', source_structure_id)
  from public.payout_template_rows row
  where row.payout_template_id = p_payout_template_id
    and (row.legacy_data ->> 'source_structure_id')::bigint = source_structure_id
  order by row.standing, row.id;
  get diagnostics inserted_count = row_count;

  if inserted_count <= 0 then
    raise exception 'Selected payout structure contains no rows';
  end if;

  update public.tournament_entries entry
  set winnings = null,
      score = null,
      updated_at = now()
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null;

  multiplier := case
    when before_tournament.points_multiplier_enabled and before_tournament.points_multiplier_value is not null
      then before_tournament.points_multiplier_value
    else 1
  end;

  update public.tournament_entries entry
  set winnings = round(payout.payout_amount)::integer,
      score = round(
        case when tournament_type_code = 'freeroll'
          then (payout.payout_amount + coalesce(payout.points, 0) + before_tournament.participation_bonus_points) * multiplier
          else (entry.total_buy_in_amount + payout.payout_amount) * multiplier
        end
      )::integer,
      updated_at = now()
  from public.tournament_payouts payout
  where payout.tournament_id = p_tournament_id
    and entry.tournament_id = p_tournament_id
    and entry.rank = payout.standing
    and entry.deleted_at is null;

  update public.tournaments
  set payout_template_id = p_payout_template_id,
      total_registered_players = registered_players,
      total_payout_players = inserted_count,
      total_payout_distribution_amount = p_total_distribution_amount,
      updated_at = now()
  where id = p_tournament_id
  returning * into after_tournament;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id, actor_profile_id, action, entity_type, entity_id, tournament_id, before_data, after_data
  ) values (
    auth.uid(),
    actor_profile_id,
    'payouts_materialized',
    'tournament',
    p_tournament_id::text,
    p_tournament_id,
    jsonb_build_object('tournament', to_jsonb(before_tournament), 'payout_count', previous_payout_count),
    jsonb_build_object('tournament', to_jsonb(after_tournament), 'payout_count', inserted_count, 'source_structure_id', source_structure_id)
  );

  return jsonb_build_object(
    'tournament_id', p_tournament_id,
    'registered_players', registered_players,
    'payout_rows', inserted_count,
    'source_structure_id', source_structure_id,
    'distribution_amount', p_total_distribution_amount,
    'template_type', template_type
  );
end;
$$;

revoke all on function public.dpt_admin_materialize_payouts(bigint, bigint, numeric) from public, anon;
grant execute on function public.dpt_admin_materialize_payouts(bigint, bigint, numeric) to authenticated;

commit;
