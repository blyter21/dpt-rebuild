begin;

create or replace function public.dpt_admin_save_blind_structure(p_id bigint, p_values jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare
  before_row jsonb; result jsonb; actor uuid; levels jsonb := p_values->'blind_info';
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  if jsonb_typeof(p_values) <> 'object' or nullif(btrim(p_values->>'name'),'') is null or jsonb_typeof(levels) <> 'array' or jsonb_array_length(levels)=0 then raise exception 'Invalid blind structure' using errcode='22023'; end if;
  if nullif(p_values->>'blind_intervals','') is not null and (p_values->>'blind_intervals')::integer <= 0 then raise exception 'Blind interval must be positive' using errcode='22023'; end if;
  if exists(
    select 1 from jsonb_array_elements(levels) x(value)
    where jsonb_typeof(value) <> 'object'
       or (value ? 'addbreak' and nullif(btrim(value->>'addbreak'),'') is null)
       or (not (value ? 'addbreak') and (nullif(value->>'small_blind','') is null or nullif(value->>'big_blind','') is null))
  ) then raise exception 'Every blind row must be a complete level or break' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-blind:'||coalesce(p_id,0)::text));
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  if p_id is null then
    insert into blind_structures(name,description,status,blind_intervals,blind_info)
    values(btrim(p_values->>'name'),nullif(btrim(p_values->>'description'),''),coalesce(nullif(p_values->>'status','')::boolean,true),nullif(p_values->>'blind_intervals','')::integer,levels)
    returning to_jsonb(blind_structures.*) into result;
  else
    select to_jsonb(item) into before_row from blind_structures item where id=p_id and deleted_at is null for update;
    if before_row is null then raise exception 'Blind structure not found'; end if;
    update blind_structures set name=btrim(p_values->>'name'),description=nullif(btrim(p_values->>'description'),''),status=coalesce(nullif(p_values->>'status','')::boolean,status),blind_intervals=nullif(p_values->>'blind_intervals','')::integer,blind_info=levels,updated_at=now()
    where id=p_id returning to_jsonb(blind_structures.*) into result;
  end if;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,case when p_id is null then 'create' else 'update' end,'blind_structure',coalesce(p_id,(result->>'id')::bigint)::text,before_row,result);
  return result;
end $$;

create or replace function public.dpt_admin_status_blind_structure(p_id bigint,p_status boolean)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare before_row jsonb; result jsonb; actor uuid;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-blind:'||p_id::text));
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  select to_jsonb(item) into before_row from blind_structures item where id=p_id and deleted_at is null for update;
  if before_row is null then raise exception 'Blind structure not found'; end if;
  update blind_structures set status=p_status,updated_at=now() where id=p_id returning to_jsonb(blind_structures.*) into result;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,'status','blind_structure',p_id::text,before_row,result);
  return result;
end $$;

create or replace function public.dpt_admin_delete_blind_structure(p_id bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare before_row jsonb; result jsonb; actor uuid;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-blind:'||p_id::text));
  if exists(select 1 from tournaments where blind_structure_id=p_id and status and deleted_at is null) then raise exception 'Cannot delete blind structure assigned to active tournaments' using errcode='23503'; end if;
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  select to_jsonb(item) into before_row from blind_structures item where id=p_id and deleted_at is null for update;
  if before_row is null then raise exception 'Blind structure not found'; end if;
  update blind_structures set status=false,deleted_at=now(),updated_at=now() where id=p_id returning to_jsonb(blind_structures.*) into result;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,'soft_delete','blind_structure',p_id::text,before_row,result);
  return result;
end $$;

create or replace function public.dpt_admin_copy_blind_structure(p_id bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare source_row jsonb; result jsonb; actor uuid;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-blind:'||p_id::text));
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  select to_jsonb(item) into source_row from blind_structures item where id=p_id and deleted_at is null for update;
  if source_row is null then raise exception 'Blind structure not found'; end if;
  insert into blind_structures(name,description,status,blind_intervals,blind_info,is_copy)
  select name||' Copy',description,false,blind_intervals,blind_info,true from blind_structures where id=p_id
  returning to_jsonb(blind_structures.*) into result;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,'copy','blind_structure',result->>'id',source_row,result);
  return result;
end $$;

create or replace function public.dpt_admin_save_payout_template(p_id bigint,p_values jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare
  before_data jsonb; after_data jsonb; actor uuid; template_id bigint; item jsonb; item_id bigint; saved_id bigint; kept_ids bigint[] := '{}'::bigint[];
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  if jsonb_typeof(p_values) <> 'object' or nullif(btrim(p_values->>'name'),'') is null or p_values->>'type' not in ('range','satellite','formula') or jsonb_typeof(p_values->'rows') <> 'array' or jsonb_array_length(p_values->'rows')=0 then raise exception 'Invalid payout template' using errcode='22023'; end if;
  if nullif(p_values->>'tournament_type_id','') is not null and not exists(select 1 from tournament_types where id=(p_values->>'tournament_type_id')::bigint) then raise exception 'Tournament type not found' using errcode='23503'; end if;
  if exists(
    select 1 from jsonb_array_elements(p_values->'rows') row_item(value)
    where jsonb_typeof(value) <> 'object'
       or nullif(value->>'player_count_start','') is null or nullif(value->>'player_count_end','') is null
       or (value->>'player_count_start')::integer < 1 or (value->>'player_count_end')::integer < (value->>'player_count_start')::integer
       or coalesce(nullif(value->>'winners_count','')::integer,0) < 1
       or coalesce(nullif(value->>'standing','')::integer,0) < 1
       or (value->>'standing')::integer > (value->>'winners_count')::integer
  ) then raise exception 'Invalid payout range row' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-payout:'||coalesce(p_id,0)::text));
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  if p_id is null then
    insert into payout_templates(name,type,tournament_type_id) values(btrim(p_values->>'name'),p_values->>'type',nullif(p_values->>'tournament_type_id','')::bigint)
    returning id into template_id;
  else
    select jsonb_build_object('template',to_jsonb(template),'rows',coalesce((select jsonb_agg(to_jsonb(row_item) order by row_item.id) from payout_template_rows row_item where row_item.payout_template_id=p_id),'[]'::jsonb))
    into before_data from payout_templates template where template.id=p_id and template.deleted_at is null for update;
    if before_data is null then raise exception 'Payout template not found'; end if;
    template_id:=p_id;
    update payout_templates set name=btrim(p_values->>'name'),type=p_values->>'type',tournament_type_id=nullif(p_values->>'tournament_type_id','')::bigint,updated_at=now() where id=p_id;
  end if;
  for item in select value from jsonb_array_elements(p_values->'rows') loop
    item_id:=nullif(item->>'id','')::bigint;
    if item_id is not null then
      if p_id is null or not exists(select 1 from payout_template_rows where id=item_id and payout_template_id=template_id) then raise exception 'Payout row does not belong to template' using errcode='23503'; end if;
      update payout_template_rows set player_count_start=(item->>'player_count_start')::integer,player_count_end=(item->>'player_count_end')::integer,winners_count=(item->>'winners_count')::integer,standing=(item->>'standing')::integer,payout_percentage=nullif(item->>'payout_percentage','')::numeric,payout_amount=nullif(item->>'payout_amount','')::numeric,points=nullif(item->>'points','')::integer,prize_description=nullif(btrim(item->>'prize_description'),'') where id=item_id returning id into saved_id;
    else
      insert into payout_template_rows(payout_template_id,player_count_start,player_count_end,winners_count,standing,payout_percentage,payout_amount,points,prize_description)
      values(template_id,(item->>'player_count_start')::integer,(item->>'player_count_end')::integer,(item->>'winners_count')::integer,(item->>'standing')::integer,nullif(item->>'payout_percentage','')::numeric,nullif(item->>'payout_amount','')::numeric,nullif(item->>'points','')::integer,nullif(btrim(item->>'prize_description'),'')) returning id into saved_id;
    end if;
    kept_ids:=array_append(kept_ids,saved_id);
  end loop;
  if p_id is not null and exists(select 1 from payout_template_rows row_item join tournament_payouts materialized on materialized.payout_template_row_id=row_item.id where row_item.payout_template_id=template_id and not (row_item.id=any(kept_ids))) then raise exception 'Cannot remove payout rows already used by tournament payouts' using errcode='23503'; end if;
  delete from payout_template_rows where payout_template_id=template_id and not (id=any(kept_ids));
  select jsonb_build_object('template',to_jsonb(template),'rows',coalesce((select jsonb_agg(to_jsonb(row_item) order by row_item.player_count_start,row_item.standing,row_item.id) from payout_template_rows row_item where row_item.payout_template_id=template_id),'[]'::jsonb))
  into after_data from payout_templates template where template.id=template_id;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,case when p_id is null then 'create' else 'update' end,'payout_template',template_id::text,before_data,after_data);
  return after_data;
end $$;

create or replace function public.dpt_admin_delete_payout_template(p_id bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare before_data jsonb; result jsonb; actor uuid;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-payout:'||p_id::text));
  if exists(select 1 from tournaments where payout_template_id=p_id and deleted_at is null) then raise exception 'Cannot delete payout template assigned to tournaments' using errcode='23503'; end if;
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  select jsonb_build_object('template',to_jsonb(template),'rows',coalesce((select jsonb_agg(to_jsonb(row_item) order by row_item.id) from payout_template_rows row_item where row_item.payout_template_id=p_id),'[]'::jsonb)) into before_data from payout_templates template where template.id=p_id and template.deleted_at is null for update;
  if before_data is null then raise exception 'Payout template not found'; end if;
  update payout_templates set deleted_at=now(),updated_at=now() where id=p_id returning to_jsonb(payout_templates.*) into result;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,'soft_delete','payout_template',p_id::text,before_data,result);
  return result;
end $$;

create or replace function public.dpt_admin_copy_payout_template(p_id bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare source_data jsonb; result jsonb; actor uuid; new_id bigint;
begin
  if auth.uid() is null or not private.is_admin_operator() then raise exception 'DPT administrator authorization required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dpt-payout:'||p_id::text));
  select id into actor from profiles where auth_user_id=auth.uid() and status='active' and deleted_at is null limit 1;
  if actor is null then raise exception 'Active operator profile required' using errcode='42501'; end if;
  select jsonb_build_object('template',to_jsonb(template),'rows',coalesce((select jsonb_agg(to_jsonb(row_item) order by row_item.id) from payout_template_rows row_item where row_item.payout_template_id=p_id),'[]'::jsonb)) into source_data from payout_templates template where template.id=p_id and template.deleted_at is null for update;
  if source_data is null then raise exception 'Payout template not found'; end if;
  insert into payout_templates(name,type,tournament_type_id) select name||' Copy',type,tournament_type_id from payout_templates where id=p_id returning id into new_id;
  insert into payout_template_rows(payout_template_id,player_count_start,player_count_end,winners_count,standing,payout_percentage,payout_amount,points,prize_description,legacy_data)
  select new_id,player_count_start,player_count_end,winners_count,standing,payout_percentage,payout_amount,points,prize_description,legacy_data from payout_template_rows where payout_template_id=p_id;
  select jsonb_build_object('template',to_jsonb(template),'rows',coalesce((select jsonb_agg(to_jsonb(row_item) order by row_item.id) from payout_template_rows row_item where row_item.payout_template_id=new_id),'[]'::jsonb)) into result from payout_templates template where template.id=new_id;
  insert into dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),actor,'copy','payout_template',new_id::text,source_data,result);
  return result;
end $$;

revoke all on function public.dpt_admin_save_blind_structure(bigint,jsonb),public.dpt_admin_status_blind_structure(bigint,boolean),public.dpt_admin_delete_blind_structure(bigint),public.dpt_admin_copy_blind_structure(bigint),public.dpt_admin_save_payout_template(bigint,jsonb),public.dpt_admin_delete_payout_template(bigint),public.dpt_admin_copy_payout_template(bigint) from public,anon;
grant execute on function public.dpt_admin_save_blind_structure(bigint,jsonb),public.dpt_admin_status_blind_structure(bigint,boolean),public.dpt_admin_delete_blind_structure(bigint),public.dpt_admin_copy_blind_structure(bigint),public.dpt_admin_save_payout_template(bigint,jsonb),public.dpt_admin_delete_payout_template(bigint),public.dpt_admin_copy_payout_template(bigint) to authenticated;

commit;
