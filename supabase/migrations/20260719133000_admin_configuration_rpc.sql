begin;

-- Production Create/Edit forms expose these fields directly; preserve them as first-class columns.
alter table public.events
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists facebook_event_url text;
alter table public.seasons
  add column if not exists logo_url text,
  add column if not exists banner_url text;
alter table public.venues
  add column if not exists logo_url text,
  add column if not exists banner_url text,
  add column if not exists facebook_url text,
  add column if not exists twitter_url text,
  add column if not exists instagram_url text,
  add column if not exists youtube_url text,
  add column if not exists map_location_address text;

update public.events set
  logo_url = coalesce(logo_url, legacy_data->>'logo'),
  banner_url = coalesce(banner_url, legacy_data->>'banner_image'),
  facebook_event_url = coalesce(facebook_event_url, legacy_data->>'fb_event_url');
update public.seasons set
  logo_url = coalesce(logo_url, legacy_data->>'logo'),
  banner_url = coalesce(banner_url, legacy_data->>'banner_image');
update public.venues set
  logo_url = coalesce(logo_url, legacy_data->>'logo'),
  banner_url = coalesce(banner_url, legacy_data->>'banner_image'),
  facebook_url = coalesce(facebook_url, legacy_data->>'fb_url'),
  twitter_url = coalesce(twitter_url, legacy_data->>'twitter_url'),
  instagram_url = coalesce(instagram_url, legacy_data->>'instagram_url'),
  youtube_url = coalesce(youtube_url, legacy_data->>'youtube_url'),
  map_location_address = coalesce(map_location_address, legacy_data->>'map_location_address');

-- Loop 2 configuration administration. All mutations are authenticated, locked and audited.
create or replace function public.dpt_admin_save_configuration(p_entity text, p_id bigint, p_values jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, private as $$
declare before_row jsonb; result jsonb; actor_profile_id uuid; new_id bigint;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode = '42501'; end if;
  if p_entity not in ('league','season','venue','event') or jsonb_typeof(p_values) <> 'object' then raise exception 'Invalid configuration payload' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-config:' || p_entity || ':' || coalesce(p_id, 0)::text));
  select id into actor_profile_id from public.profiles where auth_user_id = auth.uid() and status = 'active' and deleted_at is null limit 1;
  if actor_profile_id is null then raise exception 'Active operator profile required' using errcode = '42501'; end if;
  if nullif(btrim(coalesce(p_values->>'name','')), '') is null then raise exception 'Name is required' using errcode = '22023'; end if;
  if nullif(p_values->>'start_at','') is not null and nullif(p_values->>'end_at','') is not null and (p_values->>'end_at')::timestamptz < (p_values->>'start_at')::timestamptz then raise exception 'End date must not precede start date' using errcode = '22023'; end if;
  if p_entity = 'league' then
    if p_id is not null then select to_jsonb(l) into before_row from leagues l where id=p_id and deleted_at is null for update; if before_row is null then raise exception 'League not found'; end if;
      update leagues set name=coalesce(nullif(trim(p_values->>'name'),''),name), alias=coalesce(nullif(trim(p_values->>'alias'),''),alias), description=nullif(trim(p_values->>'description'), ''), updated_at=now() where id=p_id returning to_jsonb(leagues.*) into result;
    else insert into leagues(name,alias,description) values (nullif(trim(p_values->>'name'),''),coalesce(nullif(trim(p_values->>'alias'),''),trim(both '-' from regexp_replace(lower(trim(p_values->>'name')),'[^a-z0-9]+','-','g'))),nullif(trim(p_values->>'description'),'')) returning id,to_jsonb(leagues.*) into new_id,result; end if;
  elsif p_entity = 'season' then
    if nullif(p_values->>'league_id','') is null or not exists(select 1 from leagues where id=(p_values->>'league_id')::bigint and status and deleted_at is null) then raise exception 'An active league is required' using errcode='23503'; end if;
    if p_id is not null then select to_jsonb(s) into before_row from seasons s where id=p_id and deleted_at is null for update; if before_row is null then raise exception 'Season not found'; end if;
      update seasons set league_id=(p_values->>'league_id')::bigint,name=coalesce(nullif(trim(p_values->>'name'),''),name),alias=coalesce(nullif(trim(p_values->>'alias'),''),alias),description=nullif(trim(p_values->>'description'),''),is_default=coalesce(nullif(p_values->>'is_default','')::boolean,is_default),logo_url=nullif(trim(p_values->>'logo_url'),''),banner_url=nullif(trim(p_values->>'banner_url'),''),start_at=nullif(p_values->>'start_at','')::timestamptz,end_at=nullif(p_values->>'end_at','')::timestamptz,updated_at=now() where id=p_id returning to_jsonb(seasons.*) into result;
    else insert into seasons(league_id,name,alias,description,is_default,logo_url,banner_url,start_at,end_at) values((p_values->>'league_id')::bigint,nullif(trim(p_values->>'name'),''),coalesce(nullif(trim(p_values->>'alias'),''),trim(both '-' from regexp_replace(lower(trim(p_values->>'name')),'[^a-z0-9]+','-','g'))),nullif(trim(p_values->>'description'),''),coalesce(nullif(p_values->>'is_default','')::boolean,false),nullif(trim(p_values->>'logo_url'),''),nullif(trim(p_values->>'banner_url'),''),nullif(p_values->>'start_at','')::timestamptz,nullif(p_values->>'end_at','')::timestamptz) returning id,to_jsonb(seasons.*) into new_id,result; end if;
  elsif p_entity = 'venue' then
    if p_id is not null then select to_jsonb(v) into before_row from venues v where id=p_id and deleted_at is null for update; if before_row is null then raise exception 'Venue not found'; end if;
      update venues set name=coalesce(nullif(trim(p_values->>'name'),''),name),alias=coalesce(nullif(trim(p_values->>'alias'),''),alias),address=nullif(trim(p_values->>'address'),''),city=nullif(trim(p_values->>'city'),''),state=nullif(trim(p_values->>'state'),''),zip=nullif(trim(p_values->>'zip'),''),phone=nullif(trim(p_values->>'phone'),''),website=nullif(trim(p_values->>'website'),''),logo_url=nullif(trim(p_values->>'logo_url'),''),banner_url=nullif(trim(p_values->>'banner_url'),''),facebook_url=nullif(trim(p_values->>'facebook_url'),''),twitter_url=nullif(trim(p_values->>'twitter_url'),''),instagram_url=nullif(trim(p_values->>'instagram_url'),''),youtube_url=nullif(trim(p_values->>'youtube_url'),''),map_location_address=nullif(trim(p_values->>'map_location_address'),''),updated_at=now() where id=p_id returning to_jsonb(venues.*) into result;
    else insert into venues(name,alias,address,city,state,zip,phone,website,logo_url,banner_url,facebook_url,twitter_url,instagram_url,youtube_url,map_location_address) values(nullif(trim(p_values->>'name'),''),coalesce(nullif(trim(p_values->>'alias'),''),trim(both '-' from regexp_replace(lower(trim(p_values->>'name')),'[^a-z0-9]+','-','g'))),nullif(trim(p_values->>'address'),''),nullif(trim(p_values->>'city'),''),nullif(trim(p_values->>'state'),''),nullif(trim(p_values->>'zip'),''),nullif(trim(p_values->>'phone'),''),nullif(trim(p_values->>'website'),''),nullif(trim(p_values->>'logo_url'),''),nullif(trim(p_values->>'banner_url'),''),nullif(trim(p_values->>'facebook_url'),''),nullif(trim(p_values->>'twitter_url'),''),nullif(trim(p_values->>'instagram_url'),''),nullif(trim(p_values->>'youtube_url'),''),nullif(trim(p_values->>'map_location_address'),'')) returning id,to_jsonb(venues.*) into new_id,result; end if;
  else
    if nullif(p_values->>'season_id','') is null or not exists(select 1 from seasons where id=(p_values->>'season_id')::bigint and status and deleted_at is null) then raise exception 'An active season is required' using errcode='23503'; end if;
    if nullif(p_values->>'venue_id','') is not null and not exists(select 1 from venues where id=(p_values->>'venue_id')::bigint and status and deleted_at is null) then raise exception 'Venue must be active' using errcode='23503'; end if;
    if p_id is not null then select to_jsonb(e) into before_row from events e where id=p_id and deleted_at is null for update; if before_row is null then raise exception 'Event not found'; end if;
      update events set season_id=(p_values->>'season_id')::bigint,venue_id=nullif(p_values->>'venue_id','')::bigint,name=coalesce(nullif(trim(p_values->>'name'),''),name),alias=coalesce(nullif(trim(p_values->>'alias'),''),alias),description=nullif(trim(p_values->>'description'),''),rules_description=nullif(trim(p_values->>'rules_description'),''),logo_url=nullif(trim(p_values->>'logo_url'),''),banner_url=nullif(trim(p_values->>'banner_url'),''),facebook_event_url=nullif(trim(p_values->>'facebook_event_url'),''),start_at=nullif(p_values->>'start_at','')::timestamptz,end_at=nullif(p_values->>'end_at','')::timestamptz,updated_at=now() where id=p_id returning to_jsonb(events.*) into result;
    else insert into events(season_id,venue_id,name,alias,description,rules_description,logo_url,banner_url,facebook_event_url,start_at,end_at) values((p_values->>'season_id')::bigint,nullif(p_values->>'venue_id','')::bigint,nullif(trim(p_values->>'name'),''),coalesce(nullif(trim(p_values->>'alias'),''),trim(both '-' from regexp_replace(lower(trim(p_values->>'name')),'[^a-z0-9]+','-','g'))),nullif(trim(p_values->>'description'),''),nullif(trim(p_values->>'rules_description'),''),nullif(trim(p_values->>'logo_url'),''),nullif(trim(p_values->>'banner_url'),''),nullif(trim(p_values->>'facebook_event_url'),''),nullif(p_values->>'start_at','')::timestamptz,nullif(p_values->>'end_at','')::timestamptz) returning id,to_jsonb(events.*) into new_id,result; end if;
  end if;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor_profile_id,case when p_id is null then 'create' else 'update' end,p_entity,coalesce(p_id,new_id)::text,before_row,result);
  return result;
end $$;

create or replace function public.dpt_admin_set_configuration_status(p_entity text,p_id bigint,p_status boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare before_row jsonb; result jsonb; actor_profile_id uuid;
begin
 if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
 if p_entity not in ('league','season','venue','event') or p_id is null then raise exception 'Invalid configuration target' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext('dpt-config:'||p_entity||':'||p_id)); select id into actor_profile_id from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
 if actor_profile_id is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
 execute format('select to_jsonb(t) from %I t where id=$1 and deleted_at is null for update',p_entity||'s') into before_row using p_id; if before_row is null then raise exception 'Configuration record not found'; end if;
 execute format('update %I set status=$2, updated_at=now() where id=$1 returning to_jsonb(%I.*)',p_entity||'s',p_entity||'s') into result using p_id,p_status;
 insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor_profile_id,'status',p_entity,p_id::text,before_row,result); return result;
end $$;

create or replace function public.dpt_admin_soft_delete_configuration(p_entity text,p_id bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare before_row jsonb; result jsonb; actor_profile_id uuid; child_count integer:=0;
begin
 if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
 if p_entity not in ('league','season','venue','event') or p_id is null then raise exception 'Invalid configuration target' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtext('dpt-config:'||p_entity||':'||p_id)); select id into actor_profile_id from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
 if actor_profile_id is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
 if p_entity='league' then select count(*) into child_count from seasons where league_id=p_id and status and deleted_at is null; elsif p_entity='season' then select count(*) into child_count from events where season_id=p_id and status and deleted_at is null; elsif p_entity='venue' then select count(*) into child_count from events where venue_id=p_id and status and deleted_at is null; else select count(*) into child_count from tournaments where event_id=p_id and status and deleted_at is null; end if;
 if child_count > 0 then raise exception 'Cannot delete configuration with active children' using errcode='23503'; end if;
 execute format('select to_jsonb(t) from %I t where id=$1 and deleted_at is null for update',p_entity||'s') into before_row using p_id; if before_row is null then raise exception 'Configuration record not found'; end if;
 execute format('update %I set status=false, deleted_at=now(), updated_at=now() where id=$1 returning to_jsonb(%I.*)',p_entity||'s',p_entity||'s') into result using p_id;
 insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor_profile_id,'soft_delete',p_entity,p_id::text,before_row,result); return result;
end $$;
revoke all on function public.dpt_admin_save_configuration(text,bigint,jsonb), public.dpt_admin_set_configuration_status(text,bigint,boolean), public.dpt_admin_soft_delete_configuration(text,bigint) from public, anon;
grant execute on function public.dpt_admin_save_configuration(text,bigint,jsonb), public.dpt_admin_set_configuration_status(text,bigint,boolean), public.dpt_admin_soft_delete_configuration(text,bigint) to authenticated;

commit;
