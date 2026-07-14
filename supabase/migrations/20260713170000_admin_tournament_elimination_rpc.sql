begin;

-- Forward correction: checking in a player moves the entry out of pre-registration.
create or replace function public.dpt_admin_check_in_entry(
  p_tournament_id bigint,
  p_entry_id bigint,
  p_initial_buyin integer,
  p_initial_chips_count integer,
  p_total_buy_in_amount integer,
  p_no_of_addons integer,
  p_total_addon_chips integer,
  p_total_chips integer
)
returns public.tournament_entries
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_entry public.tournament_entries;
  after_entry public.tournament_entries;
  audit_action text;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;

  select profile.id into actor_profile_id
  from public.profiles profile
  where profile.auth_user_id = auth.uid()
  limit 1;

  if actor_profile_id is null then
    raise exception 'Authenticated administrator profile is missing' using errcode = '42501';
  end if;

  if p_initial_buyin < 0
    or p_initial_chips_count < 0
    or p_total_buy_in_amount < 0
    or p_no_of_addons < 0
    or p_total_addon_chips < 0
    or p_total_chips < 0 then
    raise exception 'Tournament check-in totals cannot be negative' using errcode = '22023';
  end if;

  if p_total_chips <> p_initial_chips_count + p_total_addon_chips then
    raise exception 'Total chips must equal initial chips plus addon chips' using errcode = '22023';
  end if;

  if p_total_buy_in_amount < p_initial_buyin then
    raise exception 'Total buy-in cannot be less than initial buy-in' using errcode = '22023';
  end if;

  if p_no_of_addons = 0 and p_total_addon_chips <> 0 then
    raise exception 'Addon chips require at least one addon' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(p_tournament_id);

  select entry.* into before_entry
  from public.tournament_entries entry
  where entry.id = p_entry_id
    and entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
  for update;

  if not found then
    raise exception 'Tournament entry was not found' using errcode = 'P0002';
  end if;

  audit_action := case
    when before_entry.checked_in then 'tournament_entry.edit_check_in'
    else 'tournament_entry.check_in'
  end;

  update public.tournament_entries entry
  set pre_registered = false,
      checked_in = true,
      checked_in_by = actor_profile_id,
      initial_buyin = p_initial_buyin,
      initial_chips_count = p_initial_chips_count,
      total_buy_in_amount = p_total_buy_in_amount,
      no_of_addons_buy = p_no_of_addons,
      total_addon_chips = p_total_addon_chips,
      total_chips = p_total_chips,
      updated_at = now()
  where entry.id = p_entry_id
  returning entry.* into after_entry;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id, actor_profile_id, action, entity_type, entity_id,
    tournament_id, before_data, after_data
  ) values (
    auth.uid(), actor_profile_id, audit_action, 'tournament_entry', p_entry_id::text,
    p_tournament_id, to_jsonb(before_entry), to_jsonb(after_entry)
  );

  return after_entry;
end;
$$;

create or replace function public.dpt_admin_eliminate_entry(
  p_tournament_id bigint,
  p_entry_id bigint,
  p_rank integer,
  p_winnings integer,
  p_score integer,
  p_elimination_sequence integer,
  p_final_table boolean
)
returns public.tournament_entries
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_entry public.tournament_entries;
  after_entry public.tournament_entries;
  tournament_type public.tournament_type_code;
  multiplier_enabled boolean;
  multiplier_value numeric;
  participation_bonus integer;
  final_table_count integer;
  expected_rank integer;
  expected_winnings integer;
  payout_points integer;
  expected_score integer;
  expected_sequence integer;
  expected_final_table boolean;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;

  select profile.id into actor_profile_id
  from public.profiles profile
  where profile.auth_user_id = auth.uid()
  limit 1;

  if actor_profile_id is null then
    raise exception 'Authenticated administrator profile is missing' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(p_tournament_id);

  select entry.* into before_entry
  from public.tournament_entries entry
  where entry.id = p_entry_id
    and entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
  for update;

  if not found then
    raise exception 'Tournament entry was not found' using errcode = 'P0002';
  end if;

  if not before_entry.checked_in or before_entry.eliminated then
    raise exception 'Elimination requires a checked-in, active entry' using errcode = '22023';
  end if;

  select tournament_type_row.code,
         tournament.points_multiplier_enabled,
         tournament.points_multiplier_value,
         tournament.participation_bonus_points,
         coalesce(tournament.players_at_final_table, 0)
  into tournament_type, multiplier_enabled, multiplier_value, participation_bonus, final_table_count
  from public.tournaments tournament
  join public.tournament_types tournament_type_row on tournament_type_row.id = tournament.tournament_type_id
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null;

  if not found then
    raise exception 'Tournament configuration was not found' using errcode = 'P0002';
  end if;

  select count(*)::integer into expected_rank
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
    and entry.checked_in = true
    and entry.eliminated = false;

  select coalesce(payout.payout_amount, 0), coalesce(payout.points, 0)
  into expected_winnings, payout_points
  from public.tournament_payouts payout
  where payout.tournament_id = p_tournament_id
    and payout.standing = expected_rank
  order by payout.id
  limit 1;

  if not found then
    expected_winnings := 0;
    payout_points := 0;
  end if;

  if tournament_type = 'freeroll' then
    expected_score := expected_winnings + payout_points + participation_bonus;
  else
    expected_score := before_entry.total_buy_in_amount + expected_winnings;
  end if;

  if multiplier_enabled and multiplier_value is not null then
    expected_score := round(expected_score * multiplier_value)::integer;
  end if;

  select coalesce(max(entry.elimination_sequence), 0) + 1 into expected_sequence
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null;

  expected_final_table := tournament_type <> 'satellite'
    and final_table_count > 0
    and expected_rank between 1 and final_table_count;

  if p_rank <> expected_rank
    or p_winnings <> expected_winnings
    or p_score <> expected_score
    or p_elimination_sequence <> expected_sequence
    or p_final_table <> expected_final_table then
    raise exception 'Elimination totals do not match tournament state' using errcode = '22023';
  end if;

  update public.tournament_entries entry
  set rank = expected_rank,
      winnings = expected_winnings,
      score = expected_score,
      eliminated = true,
      elimination_sequence = expected_sequence,
      final_table = expected_final_table,
      updated_at = now()
  where entry.id = p_entry_id
  returning entry.* into after_entry;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id, actor_profile_id, action, entity_type, entity_id,
    tournament_id, before_data, after_data
  ) values (
    auth.uid(), actor_profile_id, 'tournament_entry.eliminate', 'tournament_entry', p_entry_id::text,
    p_tournament_id, to_jsonb(before_entry), to_jsonb(after_entry)
  );

  return after_entry;
end;
$$;

revoke all on function public.dpt_admin_eliminate_entry(bigint,bigint,integer,integer,integer,integer,boolean) from public;
revoke all on function public.dpt_admin_eliminate_entry(bigint,bigint,integer,integer,integer,integer,boolean) from anon;
grant execute on function public.dpt_admin_eliminate_entry(bigint,bigint,integer,integer,integer,integer,boolean) to authenticated;

commit;
