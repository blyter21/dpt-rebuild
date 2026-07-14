begin;

create or replace function public.dpt_admin_undo_entry_result(
  p_tournament_id bigint,
  p_entry_id bigint,
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
  tournament_type public.tournament_type_code;
  tournament_rebuy_chips integer;
  expected_total_chips integer;
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

  if not before_entry.eliminated
    and before_entry.rank is null
    and before_entry.winnings is null
    and before_entry.score is null then
    raise exception 'Entry has no result to undo' using errcode = '22023';
  end if;

  select tournament_type_row.code, tournament.rebuy_chips_count
  into tournament_type, tournament_rebuy_chips
  from public.tournaments tournament
  join public.tournament_types tournament_type_row on tournament_type_row.id = tournament.tournament_type_id
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null;

  if not found then
    raise exception 'Tournament configuration was not found' using errcode = 'P0002';
  end if;

  expected_total_chips := case
    when tournament_type = 'flight' then before_entry.initial_chips_count + tournament_rebuy_chips * before_entry.no_of_addons_buy
    else before_entry.total_chips
  end;

  if p_next_total_chips <> expected_total_chips then
    raise exception 'Undo chip total does not match tournament state' using errcode = '22023';
  end if;

  update public.tournament_entries entry
  set total_chips = expected_total_chips,
      rank = null,
      winnings = null,
      score = null,
      eliminated = false,
      elimination_sequence = null,
      final_table = false,
      updated_at = now()
  where entry.id = p_entry_id
  returning entry.* into after_entry;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id, actor_profile_id, action, entity_type, entity_id,
    tournament_id, before_data, after_data
  ) values (
    auth.uid(), actor_profile_id, 'tournament_entry.undo_result', 'tournament_entry', p_entry_id::text,
    p_tournament_id, to_jsonb(before_entry), to_jsonb(after_entry)
  );

  return after_entry;
end;
$$;

revoke all on function public.dpt_admin_undo_entry_result(bigint,bigint,integer) from public;
revoke all on function public.dpt_admin_undo_entry_result(bigint,bigint,integer) from anon;
grant execute on function public.dpt_admin_undo_entry_result(bigint,bigint,integer) to authenticated;

commit;
