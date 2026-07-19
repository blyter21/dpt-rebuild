begin;

-- Loop 3: production-compatible live update lifecycle. Legacy update_at remains the authored/display timestamp.
alter table public.tournament_updates
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references public.profiles(id),
  add column if not exists unpublished_at timestamptz,
  add column if not exists unpublished_by uuid references public.profiles(id),
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists deleted_by uuid references public.profiles(id);

update public.tournament_updates
set published_at = coalesce(update_at, updated_at, created_at, now())
where status = true and published_at is null and deleted_at is null;

create index if not exists tournament_updates_featured_lookup
  on public.tournament_updates (tournament_id, featured)
  where featured and deleted_at is null;
create index if not exists tournament_updates_public_order
  on public.tournament_updates (tournament_id, featured desc, published_at desc)
  where status and deleted_at is null;

drop policy if exists "tournament_updates_admin_all" on public.tournament_updates;
create policy "tournament_updates_admin_all"
  on public.tournament_updates for all
  to authenticated
  using (private.is_admin_operator())
  with check (private.is_admin_operator());

drop policy if exists "tournament updates public published select" on public.tournament_updates;
create policy "tournament updates public published select"
  on public.tournament_updates for select
  to anon, authenticated
  using (status = true and published_at is not null and deleted_at is null);
grant select on public.tournament_updates to anon, authenticated;

create or replace view public.dpt_public_tournament_updates
with (security_invoker = true) as
select u.id, u.tournament_id, t.alias as tournament_alias, u.title, u.description,
       u.update_at, u.image_url, u.video_url, u.featured, u.published_at
from public.tournament_updates u
join public.dpt_public_tournaments t on t.legacy_id = u.tournament_id
where u.status = true and u.published_at is not null and u.deleted_at is null;

grant select on public.dpt_public_tournament_updates to anon, authenticated;

create or replace function public.dpt_admin_save_tournament_update(
  p_tournament_id bigint,
  p_update_id bigint default null,
  p_title text default null,
  p_description text default null,
  p_update_at timestamptz default null,
  p_image_url text default null,
  p_video_url text default null
) returns public.tournament_updates
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare actor_profile_id uuid; before_row public.tournament_updates%rowtype; after_row public.tournament_updates%rowtype;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode = '42501'; end if;
  select id into actor_profile_id from public.profiles where auth_user_id = auth.uid() and status = 'active' and deleted_at is null limit 1;
  if actor_profile_id is null then raise exception 'Active operator profile required' using errcode = '42501'; end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then raise exception 'Update title is required' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(p_tournament_id);
  perform 1 from public.tournaments where id = p_tournament_id and deleted_at is null for update;
  if not found then raise exception 'Tournament not found' using errcode = 'P0002'; end if;
  if p_update_id is null then
    insert into public.tournament_updates (tournament_id,title,description,update_at,image_url,video_url,status,featured,created_by,updated_by)
    values (p_tournament_id,btrim(p_title),nullif(btrim(p_description),''),coalesce(p_update_at,now()),nullif(btrim(p_image_url),''),nullif(btrim(p_video_url),''),false,false,actor_profile_id,actor_profile_id)
    returning * into after_row;
  else
    select * into before_row from public.tournament_updates where id=p_update_id and tournament_id=p_tournament_id and deleted_at is null for update;
    if not found then raise exception 'Tournament update was not found for this tournament' using errcode = 'P0002'; end if;
    update public.tournament_updates set title=btrim(p_title), description=nullif(btrim(p_description),''), update_at=coalesce(p_update_at, update_at), image_url=nullif(btrim(p_image_url),''), video_url=nullif(btrim(p_video_url),''), updated_by=actor_profile_id, updated_at=now() where id=p_update_id returning * into after_row;
  end if;
  insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,tournament_id,before_data,after_data)
  values(auth.uid(),actor_profile_id,case when p_update_id is null then 'tournament_update.created' else 'tournament_update.edited' end,'tournament_update',after_row.id::text,p_tournament_id,case when p_update_id is null then null else to_jsonb(before_row) end,to_jsonb(after_row));
  return after_row;
end $$;

create or replace function public.dpt_admin_set_tournament_update_state(p_tournament_id bigint,p_update_id bigint,p_action text)
returns public.tournament_updates
language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare actor_profile_id uuid; before_row public.tournament_updates%rowtype; after_row public.tournament_updates%rowtype;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode = '42501'; end if;
  if p_action not in ('publish','unpublish','feature','unfeature','delete') then raise exception 'Unsupported update state action' using errcode = '22023'; end if;
  select id into actor_profile_id from public.profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor_profile_id is null then raise exception 'Active operator profile required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(p_tournament_id);
  perform 1 from public.tournaments where id=p_tournament_id and deleted_at is null for update;
  if not found then raise exception 'Tournament not found' using errcode = 'P0002'; end if;
  select * into before_row from public.tournament_updates where id=p_update_id and tournament_id=p_tournament_id and deleted_at is null for update;
  if not found then raise exception 'Tournament update was not found for this tournament' using errcode = 'P0002'; end if;
  if p_action='publish' then update public.tournament_updates set status=true,published_at=coalesce(published_at,now()),published_by=actor_profile_id,unpublished_at=null,unpublished_by=null,updated_by=actor_profile_id,updated_at=now() where id=p_update_id returning * into after_row;
  elsif p_action='unpublish' then update public.tournament_updates set status=false,featured=false,unpublished_at=now(),unpublished_by=actor_profile_id,updated_by=actor_profile_id,updated_at=now() where id=p_update_id returning * into after_row;
  elsif p_action='feature' then
    if not before_row.status or before_row.published_at is null then raise exception 'Only published updates can be featured' using errcode = '22023'; end if;
    update public.tournament_updates set featured=true,updated_by=actor_profile_id,updated_at=now() where id=p_update_id returning * into after_row;
  elsif p_action='unfeature' then update public.tournament_updates set featured=false,updated_by=actor_profile_id,updated_at=now() where id=p_update_id returning * into after_row;
  else update public.tournament_updates set status=false,deleted_at=now(),deleted_by=actor_profile_id,featured=false,updated_by=actor_profile_id,updated_at=now() where id=p_update_id returning * into after_row;
  end if;
  insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,tournament_id,before_data,after_data)
  values(auth.uid(),actor_profile_id,'tournament_update.' || p_action,'tournament_update',p_update_id::text,p_tournament_id,to_jsonb(before_row),to_jsonb(after_row));
  return after_row;
end $$;

revoke all on function public.dpt_admin_save_tournament_update(bigint,bigint,text,text,timestamptz,text,text) from public, anon;
revoke all on function public.dpt_admin_set_tournament_update_state(bigint,bigint,text) from public, anon;
grant execute on function public.dpt_admin_save_tournament_update(bigint,bigint,text,text,timestamptz,text,text) to authenticated;
grant execute on function public.dpt_admin_set_tournament_update_state(bigint,bigint,text) to authenticated;
commit;
