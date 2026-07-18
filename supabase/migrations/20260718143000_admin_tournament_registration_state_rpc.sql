begin;

create or replace function public.dpt_admin_set_registration_state(
  p_tournament_id bigint,
  p_closed boolean
)
returns public.tournaments
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_row public.tournaments%rowtype;
  after_row public.tournaments%rowtype;
begin
  if not private.is_admin_operator() then
    raise exception 'Administrator access required';
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
  select * into before_row
  from public.tournaments
  where id = p_tournament_id
    and deleted_at is null
  for update;
  if not found then
    raise exception 'Tournament not found';
  end if;

  if before_row.registration_closed = p_closed then
    return before_row;
  end if;

  update public.tournaments
  set registration_closed = p_closed,
      registration_closed_by = case when p_closed then actor_profile_id else registration_closed_by end,
      registration_closed_at = case when p_closed then now() else registration_closed_at end,
      updated_at = now()
  where id = p_tournament_id
  returning * into after_row;

  insert into public.dpt_admin_audit_log (
    actor_user_id, action, entity_type, entity_id, tournament_id, before_data, after_data
  ) values (
    actor_profile_id,
    case when p_closed then 'registration_closed' else 'registration_opened' end,
    'tournament',
    p_tournament_id::text,
    p_tournament_id,
    to_jsonb(before_row),
    to_jsonb(after_row)
  );

  return after_row;
end;
$$;

revoke all on function public.dpt_admin_set_registration_state(bigint, boolean) from public, anon;
grant execute on function public.dpt_admin_set_registration_state(bigint, boolean) to authenticated;

commit;
