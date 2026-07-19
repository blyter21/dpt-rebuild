begin;

alter table public.tournaments add column if not exists toc_all_types boolean not null default false;

-- Relationship changes are intentionally a separate operation: runtime flight records must
-- never be silently detached, mutated, or copied.
create or replace function public.dpt_admin_save_tournament_relationships(p_main_id bigint, p_values jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare
 actor uuid; main_row public.tournaments%rowtype; child_row public.tournaments%rowtype; before_data jsonb; after_data jsonb;
 flight jsonb; child_id bigint; flight_type bigint; incoming_ids bigint[] := '{}'::bigint[];
 qualifier jsonb; target_id bigint; type_id bigint;
begin
 if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
 if jsonb_typeof(p_values) <> 'object' or not (p_values ?& array['advancing_to_flight_tournaments','allow_search_registration','chip_carryover','flights','qualifiers','toc_all_types','toc_type_ids','toc_tournament_ids']) or exists(select 1 from jsonb_object_keys(p_values) key where key not in ('advancing_to_flight_tournaments','allow_search_registration','chip_carryover','flights','qualifiers','toc_all_types','toc_type_ids','toc_tournament_ids')) then raise exception 'Invalid relationship payload' using errcode='22023'; end if;
 if jsonb_typeof(p_values->'flights') <> 'array' or jsonb_typeof(p_values->'qualifiers') <> 'array' or jsonb_typeof(p_values->'toc_type_ids') <> 'array' or jsonb_typeof(p_values->'toc_tournament_ids') <> 'array' then raise exception 'Relationship selectors must be arrays' using errcode='22023'; end if;
 if jsonb_typeof(p_values->'advancing_to_flight_tournaments') <> 'boolean' or jsonb_typeof(p_values->'allow_search_registration') <> 'boolean' or jsonb_typeof(p_values->'toc_all_types') <> 'boolean' or (p_values->>'chip_carryover') not in ('','highest','sum') then raise exception 'Invalid relationship value' using errcode='22023'; end if;
 if (select count(*) from jsonb_array_elements(p_values->'flights') item where nullif(item->>'id','') is not null) <> (select count(distinct (item->>'id')::bigint) from jsonb_array_elements(p_values->'flights') item where nullif(item->>'id','') is not null) then raise exception 'Duplicate flight IDs' using errcode='22023'; end if;
 select id into actor from public.profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
 if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('dpt-tournament-relationships:'||p_main_id::text));
 select * into main_row from public.tournaments where id=p_main_id and deleted_at is null for update;
 if not found then raise exception 'Tournament not found' using errcode='P0002'; end if;
 if main_row.main_tournament_id is not null then raise exception 'Child flights cannot own relationships' using errcode='22023'; end if;
 before_data:=jsonb_build_object('main',to_jsonb(main_row),'flights',coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.tournaments t where t.main_tournament_id=p_main_id and t.deleted_at is null),'[]'::jsonb),'qualifiers',coalesce((select jsonb_agg(to_jsonb(q) order by q.qualifier_tournament_id) from public.tournament_qualifiers q where q.tournament_id=p_main_id),'[]'::jsonb),'toc_all_types',main_row.toc_all_types,'toc_type_ids',coalesce((select jsonb_agg(tournament_type_id order by tournament_type_id) from public.toc_qualified_types where tournament_id=p_main_id),'[]'::jsonb),'toc_tournament_ids',coalesce((select jsonb_agg(qualified_tournament_id order by qualified_tournament_id) from public.toc_qualified_tournaments where tournament_id=p_main_id),'[]'::jsonb));
 -- Deterministically lock existing children before deciding what can be removed.
 perform 1 from public.tournaments t where t.main_tournament_id=p_main_id and t.deleted_at is null order by t.id for update;
 for flight in select value from jsonb_array_elements(p_values->'flights') loop
   if jsonb_typeof(flight)<>'object' or not (flight ?& array['id','name','starts_at','ends_at','registration_starts_at','registration_ends_at','minimum_buyin','tournament_fee_percent','initial_chips_count']) or flight ?| array['main_tournament_id','dealer_fee','tournament_type_id','entries'] then raise exception 'Invalid flight shape' using errcode='22023'; end if;
   if nullif(btrim(flight->>'name'),'') is null or coalesce(nullif(flight->>'minimum_buyin','')::integer,0)<0 or coalesce(nullif(flight->>'initial_chips_count','')::integer,0)<0 then raise exception 'Invalid flight values' using errcode='22023'; end if;
   if nullif(flight->>'starts_at','') is not null and nullif(flight->>'ends_at','') is not null and (flight->>'ends_at')::timestamptz < (flight->>'starts_at')::timestamptz then raise exception 'Flight end must not precede start' using errcode='22023'; end if;
   child_id:=nullif(flight->>'id','')::bigint;
   if child_id is not null then
     select * into child_row from public.tournaments where id=child_id and main_tournament_id=p_main_id and deleted_at is null for update;
     if not found then raise exception 'Flight does not belong to tournament' using errcode='23503'; end if;
     if exists(select 1 from public.tournament_entries where tournament_id=child_id and deleted_at is null) or exists(select 1 from public.flight_advancements where flight_tournament_id=child_id and undone_at is null) then
       if child_row.name is distinct from trim(flight->>'name') or child_row.starts_at is distinct from nullif(flight->>'starts_at','')::timestamptz or child_row.ends_at is distinct from nullif(flight->>'ends_at','')::timestamptz or child_row.registration_starts_at is distinct from nullif(flight->>'registration_starts_at','')::timestamptz or child_row.registration_ends_at is distinct from nullif(flight->>'registration_ends_at','')::timestamptz or child_row.minimum_buyin is distinct from coalesce(nullif(flight->>'minimum_buyin','')::integer,0) or child_row.tournament_fee_percent is distinct from coalesce(nullif(flight->>'tournament_fee_percent','')::numeric,0) or child_row.initial_chips_count is distinct from coalesce(nullif(flight->>'initial_chips_count','')::integer,0) then raise exception 'Flight with entries or advancements is read-only' using errcode='23503'; end if;
     else
       update public.tournaments set name=trim(flight->>'name'),starts_at=nullif(flight->>'starts_at','')::timestamptz,ends_at=nullif(flight->>'ends_at','')::timestamptz,registration_starts_at=nullif(flight->>'registration_starts_at','')::timestamptz,registration_ends_at=nullif(flight->>'registration_ends_at','')::timestamptz,minimum_buyin=coalesce(nullif(flight->>'minimum_buyin','')::integer,0),tournament_fee_percent=coalesce(nullif(flight->>'tournament_fee_percent','')::numeric,0),initial_chips_count=coalesce(nullif(flight->>'initial_chips_count','')::integer,0) where id=child_id;
     end if;
   else
     select id into flight_type from public.tournament_types where lower(coalesce(code::text,name))='flight' order by id limit 1;
     if flight_type is null then raise exception 'Flight tournament type is required' using errcode='23503'; end if;
     insert into public.tournaments(event_id,venue_id,tournament_type_id,blind_structure_id,payout_template_id,point_distribution_id,name,alias,short_description,long_description,rules_description,starts_at,ends_at,registration_starts_at,registration_ends_at,dealer_fee,tournament_fee_percent,minimum_buyin,maximum_buyin,allow_rebuy,rebuy_amount,rebuy_fee,rebuy_chips_count,initial_chips_count,players_at_final_table,points_multiplier_enabled,points_multiplier_value,participation_bonus_points,chip_carryover,allow_search_registration,status,featured,multi_day,logo_url,banner_url,live_stream_url,allowed_rebuys_limit,allow_rebuy_chips,title_count,blind_intervals,main_tournament_id)
     values(main_row.event_id,main_row.venue_id,flight_type,main_row.blind_structure_id,main_row.payout_template_id,main_row.point_distribution_id,trim(flight->>'name'),null,main_row.short_description,main_row.long_description,main_row.rules_description,nullif(flight->>'starts_at','')::timestamptz,nullif(flight->>'ends_at','')::timestamptz,nullif(flight->>'registration_starts_at','')::timestamptz,nullif(flight->>'registration_ends_at','')::timestamptz,0,coalesce(nullif(flight->>'tournament_fee_percent','')::numeric,0),coalesce(nullif(flight->>'minimum_buyin','')::integer,0),main_row.maximum_buyin,main_row.allow_rebuy,main_row.rebuy_amount,main_row.rebuy_fee,main_row.rebuy_chips_count,coalesce(nullif(flight->>'initial_chips_count','')::integer,0),main_row.players_at_final_table,main_row.points_multiplier_enabled,main_row.points_multiplier_value,main_row.participation_bonus_points,null,true,false,false,main_row.multi_day,main_row.logo_url,main_row.banner_url,main_row.live_stream_url,main_row.allowed_rebuys_limit,main_row.allow_rebuy_chips,main_row.title_count,main_row.blind_intervals,p_main_id) returning id into child_id;
   end if;
   incoming_ids:=array_append(incoming_ids,child_id);
 end loop;
 for target_id in select id from public.tournaments where main_tournament_id=p_main_id and deleted_at is null and not (id=any(incoming_ids)) order by id loop
   if exists(select 1 from public.tournament_entries where tournament_id=target_id and deleted_at is null) or exists(select 1 from public.flight_advancements where flight_tournament_id=target_id and undone_at is null) then raise exception 'Flight with entries or advancements cannot be removed' using errcode='23503'; end if;
   update public.tournaments set deleted_at=now() where id=target_id;
 end loop;
 update public.tournaments set advancing_to_flight_tournaments=(p_values->>'advancing_to_flight_tournaments')::boolean,allow_search_registration=(p_values->>'allow_search_registration')::boolean,chip_carryover=nullif(p_values->>'chip_carryover','')::public.chip_carryover_mode,toc_all_types=(p_values->>'toc_all_types')::boolean where id=p_main_id;
 delete from public.tournament_qualifiers where tournament_id=p_main_id;
 for qualifier in select value from jsonb_array_elements(p_values->'qualifiers') loop
   if jsonb_typeof(qualifier)<>'object' or not (qualifier ?& array['tournament_id','qualifier_prize']) or qualifier ?| array['id','main_tournament_id'] then raise exception 'Invalid qualifier shape' using errcode='22023'; end if;
   target_id:=nullif(qualifier->>'tournament_id','')::bigint;
   if target_id is null or target_id=p_main_id or not exists(select 1 from public.tournaments where id=target_id and deleted_at is null) then raise exception 'Invalid qualifier tournament' using errcode='23503'; end if;
   insert into public.tournament_qualifiers(tournament_id,qualifier_tournament_id,qualifier_prize) values(p_main_id,target_id,nullif(qualifier->>'qualifier_prize',''));
 end loop;
 delete from public.toc_qualified_types where tournament_id=p_main_id;
 for type_id in select value::text::bigint from jsonb_array_elements(p_values->'toc_type_ids') loop
   if not exists(select 1 from public.tournament_types where id=type_id) then raise exception 'Invalid TOC type' using errcode='23503'; end if;
   insert into public.toc_qualified_types values(p_main_id,type_id) on conflict do nothing;
 end loop;
 delete from public.toc_qualified_tournaments where tournament_id=p_main_id;
 for target_id in select value::text::bigint from jsonb_array_elements(p_values->'toc_tournament_ids') loop
   if target_id=p_main_id or not exists(select 1 from public.tournaments where id=target_id and deleted_at is null) then raise exception 'Invalid TOC tournament' using errcode='23503'; end if;
   insert into public.toc_qualified_tournaments values(p_main_id,target_id) on conflict do nothing;
 end loop;
 after_data:=jsonb_build_object('main',(select to_jsonb(t) from public.tournaments t where t.id=p_main_id),'flights',coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.tournaments t where t.main_tournament_id=p_main_id and t.deleted_at is null),'[]'::jsonb),'qualifiers',coalesce((select jsonb_agg(to_jsonb(q) order by q.qualifier_tournament_id) from public.tournament_qualifiers q where q.tournament_id=p_main_id),'[]'::jsonb),'toc_all_types',(p_values->>'toc_all_types')::boolean,'toc_type_ids',p_values->'toc_type_ids','toc_tournament_ids',p_values->'toc_tournament_ids');
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,tournament_id,before_data,after_data) values(auth.uid(),actor,'relationships','tournament',p_main_id::text,p_main_id,before_data,after_data);
 return after_data;
end $$;

-- A copied tournament has no relationship graph, even when its source does.
create or replace function public.dpt_admin_copy_tournament(p_id bigint) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid; source public.tournaments%rowtype; result jsonb; new_id bigint;
begin
 if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('dpt-tournament:'||p_id::text)); select id into actor from public.profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1; if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
 select * into source from public.tournaments where id=p_id and deleted_at is null for update; if not found then raise exception 'Tournament not found'; end if;
 insert into public.tournaments(event_id,venue_id,tournament_type_id,blind_structure_id,payout_template_id,point_distribution_id,name,alias,short_description,long_description,rules_description,starts_at,ends_at,registration_starts_at,registration_ends_at,dealer_fee,tournament_fee_percent,minimum_buyin,maximum_buyin,allow_rebuy,rebuy_amount,rebuy_fee,rebuy_chips_count,initial_chips_count,players_at_final_table,points_multiplier_enabled,points_multiplier_value,participation_bonus_points,allow_search_registration,status,featured,multi_day,logo_url,banner_url,live_stream_url,allowed_rebuys_limit,allow_rebuy_chips,title_count,blind_intervals,legacy_data,toc_all_types)
 select event_id,venue_id,tournament_type_id,blind_structure_id,payout_template_id,point_distribution_id,name||' Copy',null,short_description,long_description,rules_description,starts_at,ends_at,registration_starts_at,registration_ends_at,dealer_fee,tournament_fee_percent,minimum_buyin,maximum_buyin,allow_rebuy,rebuy_amount,rebuy_fee,rebuy_chips_count,initial_chips_count,players_at_final_table,points_multiplier_enabled,points_multiplier_value,participation_bonus_points,allow_search_registration,false,false,multi_day,logo_url,banner_url,live_stream_url,allowed_rebuys_limit,allow_rebuy_chips,title_count,blind_intervals,legacy_data,false from public.tournaments where id=p_id returning id,to_jsonb(public.tournaments.*) into new_id,result;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,tournament_id,before_data,after_data) values(auth.uid(),actor,'copy','tournament',new_id::text,new_id,to_jsonb(source),result); return result;
end $$;

revoke all on function public.dpt_admin_save_tournament_relationships(bigint,jsonb) from public,anon;
grant execute on function public.dpt_admin_save_tournament_relationships(bigint,jsonb) to authenticated;
commit;
