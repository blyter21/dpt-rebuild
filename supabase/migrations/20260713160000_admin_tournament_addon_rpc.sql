begin;

create or replace function public.dpt_admin_add_entry_addon(
  p_tournament_id bigint,
  p_entry_id bigint,
  p_addon_buy_in_amount integer,
  p_addon_count integer,
  p_next_total_buy_in_amount integer,
  p_next_no_of_addons integer,
  p_next_total_addon_chips integer,
  p_next_total_chips integer
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
  tournament_rebuy_fee integer;
  tournament_rebuy_chips integer;
  tournament_type public.tournament_type_code;
  addon_net integer;
  expected_addon_count integer;
  expected_addon_chips integer;
  expected_total_chips integer;
  expected_total_buy_in integer;
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

  if p_addon_buy_in_amount < 0 or p_addon_count <= 0 then
    raise exception 'Addon amount must be non-negative and addon count must be positive' using errcode = '22023';
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
    raise exception 'Addons require a checked-in, active tournament entry' using errcode = '22023';
  end if;

  select tournament.rebuy_fee, tournament.rebuy_chips_count, tournament_type.code
  into tournament_rebuy_fee, tournament_rebuy_chips, tournament_type
  from public.tournaments tournament
  join public.tournament_types tournament_type on tournament_type.id = tournament.tournament_type_id
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null;

  if not found then
    raise exception 'Tournament configuration was not found' using errcode = 'P0002';
  end if;

  addon_net := case
    when tournament_type = 'freeroll' then 0
    else p_addon_buy_in_amount - (tournament_rebuy_fee * p_addon_count)
  end;

  if addon_net < 0 then
    raise exception 'Addon buy-in cannot be less than total rebuy fees' using errcode = '22023';
  end if;

  expected_addon_count := before_entry.no_of_addons_buy + p_addon_count;
  expected_addon_chips := expected_addon_count * tournament_rebuy_chips;
  expected_total_chips := before_entry.initial_chips_count + expected_addon_chips;
  expected_total_buy_in := before_entry.total_buy_in_amount + addon_net;

  if p_next_no_of_addons <> expected_addon_count
    or p_next_total_addon_chips <> expected_addon_chips
    or p_next_total_chips <> expected_total_chips
    or p_next_total_buy_in_amount <> expected_total_buy_in then
    raise exception 'Addon totals do not match tournament configuration' using errcode = '22023';
  end if;

  insert into public.tournament_entry_addons (
    tournament_entry_id,
    tournament_id,
    player_id,
    legacy_user_id,
    addon_buy_in_amount,
    addon_chips_count,
    addon_count,
    created_by
  ) values (
    before_entry.id,
    before_entry.tournament_id,
    before_entry.player_id,
    before_entry.legacy_user_id,
    p_addon_buy_in_amount,
    tournament_rebuy_chips * p_addon_count,
    p_addon_count,
    actor_profile_id
  );

  update public.tournament_entries entry
  set total_buy_in_amount = expected_total_buy_in,
      no_of_addons_buy = expected_addon_count,
      total_addon_chips = expected_addon_chips,
      total_chips = expected_total_chips,
      updated_at = now()
  where entry.id = p_entry_id
  returning entry.* into after_entry;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    tournament_id,
    before_data,
    after_data
  ) values (
    auth.uid(),
    actor_profile_id,
    'tournament_entry.addon',
    'tournament_entry',
    p_entry_id::text,
    p_tournament_id,
    to_jsonb(before_entry),
    to_jsonb(after_entry)
  );

  return after_entry;
end;
$$;

revoke all on function public.dpt_admin_add_entry_addon(bigint,bigint,integer,integer,integer,integer,integer,integer) from public;
revoke all on function public.dpt_admin_add_entry_addon(bigint,bigint,integer,integer,integer,integer,integer,integer) from anon;
grant execute on function public.dpt_admin_add_entry_addon(bigint,bigint,integer,integer,integer,integer,integer,integer) to authenticated;

commit;
