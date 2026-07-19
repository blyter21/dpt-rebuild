begin;

create or replace function public.dpt_admin_make_satellite_winners(
  p_tournament_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_tournament public.tournaments%rowtype;
  tournament_type_code public.tournament_type_code;
  multiplier numeric;
  payout_winner_count integer;
  has_remainder_payout boolean;
  remainder_already_assigned boolean;
  next_sequence integer;
  remaining_count integer;
  assigned_rank integer;
  payout_amount integer;
  updated_count integer := 0;
  entry_row public.tournament_entries%rowtype;
  before_entries jsonb;
  after_entries jsonb;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;

  select profile.id into actor_profile_id
  from public.profiles profile
  where profile.auth_user_id = auth.uid()
    and profile.status = 'active'
    and profile.deleted_at is null
  limit 1;
  if actor_profile_id is null then
    raise exception 'Active operator profile required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(p_tournament_id);
  select * into before_tournament
  from public.tournaments tournament
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null
  for update;
  if not found then
    raise exception 'Tournament not found' using errcode = 'P0002';
  end if;

  select type.code into tournament_type_code
  from public.tournament_types type
  where type.id = before_tournament.tournament_type_id;
  if tournament_type_code is distinct from 'satellite' then
    raise exception 'Satellite winner handling requires a satellite tournament' using errcode = '22023';
  end if;
  if not before_tournament.registration_closed then
    raise exception 'Registration must be closed before satellite winners are assigned' using errcode = '22023';
  end if;

  select count(*)::integer, bool_or(payout.standing = 2)
  into payout_winner_count, has_remainder_payout
  from public.tournament_payouts payout
  where payout.tournament_id = p_tournament_id;
  if payout_winner_count <= 0 then
    raise exception 'Materialized satellite payouts are required before winners are assigned' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(to_jsonb(entry) order by entry.id), '[]'::jsonb), count(*)::integer
  into before_entries, remaining_count
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
    and entry.checked_in = true
    and entry.pre_registered = false
    and entry.eliminated = false;
  if remaining_count <= 0 then
    raise exception 'No checked-in active satellite entries remain' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.tournament_entries entry
    where entry.tournament_id = p_tournament_id
      and entry.deleted_at is null
      and entry.pre_registered = false
      and entry.rank = 2
  ) into remainder_already_assigned;
  select coalesce(max(entry.elimination_sequence), 0) + 1 into next_sequence
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null;
  multiplier := case
    when before_tournament.points_multiplier_enabled and before_tournament.points_multiplier_value is not null
      then before_tournament.points_multiplier_value
    else 1
  end;

  -- Stable entry-id ordering is deliberate: this bulk operation has no clicked player.
  for entry_row in
    select entry.* from public.tournament_entries entry
    where entry.tournament_id = p_tournament_id
      and entry.deleted_at is null
      and entry.checked_in = true
      and entry.pre_registered = false
      and entry.eliminated = false
    order by entry.id
    for update
  loop
    if remaining_count <= payout_winner_count then
      if has_remainder_payout and not remainder_already_assigned then
        assigned_rank := 2;
        remainder_already_assigned := true;
      else
        assigned_rank := 1;
      end if;
    else
      assigned_rank := remaining_count;
    end if;

    select coalesce(payout.payout_amount, 0)::integer into payout_amount
    from public.tournament_payouts payout
    where payout.tournament_id = p_tournament_id
      and payout.standing = assigned_rank
    order by payout.id
    limit 1;
    payout_amount := coalesce(payout_amount, 0);

    update public.tournament_entries entry
    set rank = assigned_rank,
        winnings = payout_amount,
        score = round((entry_row.total_buy_in_amount + payout_amount) * multiplier)::integer,
        eliminated = true,
        elimination_sequence = next_sequence,
        final_table = false,
        updated_at = now()
    where entry.id = entry_row.id;

    updated_count := updated_count + 1;
    remaining_count := remaining_count - 1;
    next_sequence := next_sequence + 1;
  end loop;

  select coalesce(jsonb_agg(to_jsonb(entry) order by entry.id), '[]'::jsonb)
  into after_entries
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.id in (
      select (item ->> 'id')::bigint from jsonb_array_elements(before_entries) item
    );

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id, actor_profile_id, action, entity_type, entity_id,
    tournament_id, before_data, after_data
  ) values (
    auth.uid(), actor_profile_id, 'tournament_entries.make_satellite_winners', 'tournament', p_tournament_id::text,
    p_tournament_id,
    jsonb_build_object('tournament', to_jsonb(before_tournament), 'entries', before_entries),
    jsonb_build_object('entries', after_entries, 'winner_count', updated_count)
  );

  return jsonb_build_object('tournament_id', p_tournament_id, 'winner_count', updated_count);
end;
$$;

revoke all on function public.dpt_admin_make_satellite_winners(bigint) from public, anon;
grant execute on function public.dpt_admin_make_satellite_winners(bigint) to authenticated;

commit;
