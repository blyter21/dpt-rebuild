begin;

create or replace function public.dpt_admin_register_entry(
  p_tournament_id bigint,
  p_player_id uuid,
  p_pre_registered boolean default true
)
returns public.tournament_entries
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  tournament_row public.tournaments;
  player_row public.profiles;
  new_entry public.tournament_entries;
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

  select tournament.* into tournament_row
  from public.tournaments tournament
  where tournament.id = p_tournament_id
    and tournament.deleted_at is null
    and tournament.status = true;

  if not found then
    raise exception 'Active tournament was not found' using errcode = 'P0002';
  end if;

  select profile.* into player_row
  from public.profiles profile
  where profile.id = p_player_id
    and profile.deleted_at is null
    and profile.status = 'active';

  if not found then
    raise exception 'Active player was not found' using errcode = 'P0002';
  end if;

  insert into public.tournament_entries (
    tournament_id,
    player_id,
    legacy_user_id,
    pre_registered,
    checked_in,
    duplicate_status
  ) values (
    p_tournament_id,
    p_player_id,
    player_row.legacy_user_id,
    p_pre_registered,
    false,
    true
  ) returning * into new_entry;

  insert into public.dpt_admin_audit_log (
    actor_auth_user_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    tournament_id,
    after_data
  ) values (
    auth.uid(),
    actor_profile_id,
    'tournament_entry.register',
    'tournament_entry',
    new_entry.id::text,
    p_tournament_id,
    to_jsonb(new_entry)
  );

  return new_entry;
end;
$$;

revoke all on function public.dpt_admin_register_entry(bigint,uuid,boolean) from public;
revoke all on function public.dpt_admin_register_entry(bigint,uuid,boolean) from anon;
grant execute on function public.dpt_admin_register_entry(bigint,uuid,boolean) to authenticated;

commit;
