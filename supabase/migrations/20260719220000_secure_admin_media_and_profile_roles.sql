begin;

-- Storage is optional in the PGlite validation harness.  Production Supabase has this
-- schema; dynamic SQL keeps the rest of this migration portable.
alter table public.media_assets add column if not exists purpose text not null default 'article_logo';
alter table public.media_assets add column if not exists state text not null default 'uploading';
alter table public.media_assets add column if not exists original_key text;
alter table public.media_assets add column if not exists variants jsonb not null default '{}'::jsonb;
alter table public.media_assets add column if not exists created_by uuid references public.profiles(id);
alter table public.media_assets add column if not exists deleted_at timestamptz;
alter table public.media_assets add column if not exists updated_at timestamptz not null default now();
alter table public.media_assets drop constraint if exists media_assets_purpose_check;
alter table public.media_assets add constraint media_assets_purpose_check check (purpose in ('article_logo','email_attachment'));
alter table public.media_assets drop constraint if exists media_assets_state_check;
alter table public.media_assets add constraint media_assets_state_check check (state in ('uploading','ready','deleting','failed'));
create index if not exists media_assets_ready_idx on public.media_assets(purpose,state,created_at desc) where deleted_at is null;

-- Never expose a storage URL in data tables. The proxy derives a permitted object name.
update public.articles set logo_media_id=null where logo_media_id in (select id from public.media_assets where purpose <> 'article_logo') or logo_media_id in (select id from public.media_assets where state <> 'ready' or deleted_at is not null);

create or replace function private.dpt_require_media_operator(p_purpose text) returns uuid language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid:=private.dpt_actor();
begin
 if actor is null or (p_purpose='article_logo' and not private.has_permission('manage_articles')) or (p_purpose='email_attachment' and not private.has_permission('manage_email_templates')) then raise exception 'permission denied' using errcode='42501'; end if;
 return actor;
end $$;

create or replace function public.dpt_admin_begin_media(p_purpose text,p_content_type text,p_byte_size bigint,p_width integer,p_height integer,p_alt_text text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid; media_id uuid:=gen_random_uuid(); object_key text; variant_keys jsonb;
begin
 actor:=private.dpt_require_media_operator(p_purpose);
 if p_content_type<>'image/webp' or p_byte_size is null or p_byte_size<1 or p_byte_size>10485760 or p_width is null or p_height is null or p_width<1 or p_height<1 or p_width>12000 or p_height>12000 or p_width::bigint*p_height::bigint>40000000 then raise exception 'invalid normalized image metadata' using errcode='22023'; end if;
 object_key:=format('operator/%s/%s/original.webp',actor,media_id);
 variant_keys:=jsonb_build_object('thumb',format('operator/%s/%s/thumb.webp',actor,media_id),'card',format('operator/%s/%s/card.webp',actor,media_id),'hero',format('operator/%s/%s/hero.webp',actor,media_id),'logo',format('operator/%s/%s/logo.webp',actor,media_id));
 insert into public.media_assets(id,purpose,state,storage_key,original_key,content_type,byte_size,width,height,alt_text,created_by,variants) values(media_id,p_purpose,'uploading',object_key,object_key,p_content_type,p_byte_size,p_width,p_height,nullif(btrim(p_alt_text),''),actor,variant_keys);
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_data) values(auth.uid(),actor,'begin_upload','media_asset',media_id::text,jsonb_build_object('purpose',p_purpose,'key',object_key));
 return jsonb_build_object('id',media_id,'key',object_key,'variants',variant_keys);
end $$;

create or replace function public.dpt_admin_finalize_media(p_id uuid,p_original_key text,p_variants jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid; asset public.media_assets%rowtype; result jsonb; objects_exist boolean:=true; expected_keys text[];
begin
 select * into asset from public.media_assets where id=p_id and deleted_at is null for update;
 if not found then raise exception 'media not found' using errcode='22023'; end if;
 actor:=private.dpt_require_media_operator(asset.purpose);
 if asset.created_by<>actor or asset.state<>'uploading' or p_original_key<>asset.original_key or jsonb_typeof(p_variants)<>'object' or p_variants<>asset.variants then raise exception 'invalid media finalization' using errcode='22023'; end if;
 expected_keys:=array[asset.original_key]||(select array_agg(value order by key) from jsonb_each_text(asset.variants));
 if to_regclass('storage.objects') is not null then execute 'select count(distinct name)=5 from storage.objects where bucket_id=$1 and name=any($2)' into objects_exist using 'dpt-admin-media',expected_keys; end if;
 if not objects_exist then raise exception 'required storage objects are missing' using errcode='23503'; end if;
 update public.media_assets set state='ready',updated_at=now() where id=p_id returning to_jsonb(media_assets.*) into result;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_data) values(auth.uid(),actor,'finalize_upload','media_asset',p_id::text,jsonb_build_object('variants',p_variants));
 return result - 'public_url';
end $$;

create or replace function public.dpt_admin_delete_media(p_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid; asset public.media_assets%rowtype; result jsonb;
begin
 select * into asset from public.media_assets where id=p_id and deleted_at is null for update;
 if not found then raise exception 'media not found' using errcode='22023'; end if;
 actor:=private.dpt_require_media_operator(asset.purpose);
 if exists(select 1 from public.articles where logo_media_id=p_id) or exists(select 1 from public.email_template_attachments where media_id=p_id) then raise exception 'referenced media cannot be deleted' using errcode='23503'; end if;
 update public.media_assets set state='deleting',deleted_at=now(),updated_at=now() where id=p_id returning to_jsonb(media_assets.*) into result;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor,'delete_media','media_asset',p_id::text,to_jsonb(asset),result);
 return result - 'public_url';
end $$;

-- Use the media functions for relationship changes so a caller cannot point an article
-- or template at an unready/cross-purpose object.
create or replace function public.dpt_admin_set_article_logo(p_article_id bigint,p_media_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid:=private.dpt_require_media_operator('article_logo'); before_data jsonb; result jsonb;
begin
 select to_jsonb(a.*) into before_data from public.articles a where id=p_article_id for update; if before_data is null then raise exception 'article not found'; end if;
 if p_media_id is not null and not exists(select 1 from public.media_assets where id=p_media_id and purpose='article_logo' and state='ready' and deleted_at is null) then raise exception 'ready article logo required' using errcode='22023'; end if;
 update public.articles set logo_media_id=p_media_id,updated_by=actor,updated_at=now() where id=p_article_id returning to_jsonb(articles.*) into result;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor,'set_logo','article',p_article_id::text,before_data,result); return result;
end $$;

create or replace function public.dpt_admin_set_email_template_attachments(p_template_id uuid,p_media_ids uuid[]) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid:=private.dpt_require_media_operator('email_attachment');
begin
 if not exists(select 1 from public.email_templates where id=p_template_id for update) then raise exception 'template not found'; end if;
 if cardinality(coalesce(p_media_ids,array[]::uuid[]))<>coalesce((select count(distinct x) from unnest(coalesce(p_media_ids,array[]::uuid[])) x),0) or exists(select 1 from unnest(coalesce(p_media_ids,array[]::uuid[])) x left join public.media_assets m on m.id=x and m.purpose='email_attachment' and m.state='ready' and m.deleted_at is null where m.id is null) then raise exception 'invalid attachment set' using errcode='22023'; end if;
 delete from public.email_template_attachments where template_id=p_template_id;
 insert into public.email_template_attachments(template_id,media_id,filename,content_type,byte_size) select p_template_id,m.id,regexp_replace(m.original_key,'^.*/',''),m.content_type,m.byte_size from public.media_assets m where m.id=any(coalesce(p_media_ids,array[]::uuid[]));
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,after_data) values(auth.uid(),actor,'set_attachments','email_template',p_template_id::text,jsonb_build_object('media_ids',p_media_ids));
 return jsonb_build_object('template_id',p_template_id,'media_ids',p_media_ids);
end $$;

create or replace function public.dpt_admin_fail_media(p_id uuid) returns void language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid; asset public.media_assets%rowtype;
begin
 select * into asset from public.media_assets where id=p_id and deleted_at is null for update; if not found then return; end if;
 actor:=private.dpt_require_media_operator(asset.purpose); if asset.created_by<>actor or asset.state<>'uploading' then raise exception 'invalid failed upload transition' using errcode='22023'; end if;
 update public.media_assets set state='failed',updated_at=now() where id=p_id;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor,'fail_upload','media_asset',p_id::text,to_jsonb(asset),jsonb_build_object('state','failed'));
end $$;

create or replace function public.dpt_admin_save_article_with_media(p_id bigint,p_values jsonb,p_logo_media_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare saved jsonb;
begin
 saved:=public.dpt_admin_save_article(p_id,p_values);
 return public.dpt_admin_set_article_logo((saved->>'id')::bigint,p_logo_media_id);
end $$;

create or replace function public.dpt_admin_save_email_template_with_attachments(p_id uuid,p_values jsonb,p_media_ids uuid[]) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare saved jsonb;
begin
 saved:=public.dpt_admin_save_email_template(p_id,p_values);
 perform public.dpt_admin_set_email_template_attachments((saved->>'id')::uuid,coalesce(p_media_ids,array[]::uuid[]));
 return saved||jsonb_build_object('media_ids',coalesce(p_media_ids,array[]::uuid[]));
end $$;

-- Seed granular assignments from existing broad domain roles before exposing assignment UI.
insert into public.profile_admin_roles(profile_id,role_id)
select pr.profile_id,ar.id from public.profile_roles pr join public.admin_roles ar on ar.name=pr.role::text where pr.role::text in ('super_admin','administrator')
on conflict do nothing;

-- Only super admins can edit built-in escalation roles. Assignment itself has a strict
-- hierarchy and preserves at least one super admin.
create or replace function public.dpt_admin_set_profile_admin_roles(p_profile uuid,p_role_ids bigint[]) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid:=private.dpt_actor(); target_is_actor boolean; requested_super boolean; actor_super boolean; before_data jsonb; result jsonb;
begin
 if actor is null or not private.has_permission('manage_roles') then raise exception 'permission denied' using errcode='42501'; end if;
 if p_profile is null or cardinality(coalesce(p_role_ids,array[]::bigint[]))<>coalesce((select count(distinct x) from unnest(coalesce(p_role_ids,array[]::bigint[])) x),0) or exists(select 1 from unnest(coalesce(p_role_ids,array[]::bigint[])) x left join public.admin_roles r on r.id=x where r.id is null) then raise exception 'invalid role set' using errcode='22023'; end if;
 actor_super:=exists(select 1 from public.profile_admin_roles par join public.admin_roles r on r.id=par.role_id where par.profile_id=actor and r.name='super_admin'); target_is_actor:=actor=p_profile; requested_super:=exists(select 1 from unnest(coalesce(p_role_ids,array[]::bigint[])) x join public.admin_roles r on r.id=x where r.name in ('super_admin','administrator'));
 if (requested_super or exists(select 1 from public.profile_admin_roles par join public.admin_roles r on r.id=par.role_id where par.profile_id=p_profile and r.name in ('super_admin','administrator'))) and not actor_super then raise exception 'super admin required for protected roles' using errcode='42501'; end if;
 if target_is_actor and actor_super and not exists(select 1 from unnest(coalesce(p_role_ids,array[]::bigint[])) x join public.admin_roles r on r.id=x where r.name='super_admin') then raise exception 'cannot remove own super admin role' using errcode='42501'; end if;
 if exists(select 1 from public.profile_admin_roles par join public.admin_roles r on r.id=par.role_id where par.profile_id=p_profile and r.name='super_admin') and not exists(select 1 from unnest(coalesce(p_role_ids,array[]::bigint[])) x join public.admin_roles r on r.id=x where r.name='super_admin') and (select count(*) from public.profile_admin_roles par join public.admin_roles r on r.id=par.role_id where r.name='super_admin')<=1 then raise exception 'final super admin cannot be removed' using errcode='42501'; end if;
 select coalesce(jsonb_agg(role_id order by role_id),'[]'::jsonb) into before_data from public.profile_admin_roles where profile_id=p_profile; if not exists(select 1 from public.profiles where id=p_profile and status='active' and merged_into is null and deleted_at is null for update) then raise exception 'profile not found' using errcode='22023'; end if;
 delete from public.profile_admin_roles where profile_id=p_profile; insert into public.profile_admin_roles(profile_id,role_id) select p_profile,x from unnest(coalesce(p_role_ids,array[]::bigint[])) x;
 select jsonb_build_object('profile_id',p_profile,'role_ids',coalesce(jsonb_agg(role_id order by role_id),'[]'::jsonb)) into result from public.profile_admin_roles where profile_id=p_profile;
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor,'set_admin_roles','profile',p_profile::text,before_data,result); return result;
end $$;

create or replace function public.dpt_admin_save_role(p_id bigint,p_values jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare actor uuid:=private.dpt_actor(); v_role_id bigint; before_row jsonb; after_row jsonb; permission_names text[]; protected boolean:=false; old_name text;
begin
 if actor is null or not private.has_permission('manage_roles') then raise exception 'permission denied' using errcode='42501'; end if;
 if jsonb_typeof(p_values)<>'object' or exists(select 1 from jsonb_object_keys(p_values) key where key not in ('name','permissions')) or nullif(btrim(p_values->>'name'),'') is null or jsonb_typeof(p_values->'permissions')<>'array' or jsonb_array_length(p_values->'permissions')=0 then raise exception 'invalid role payload' using errcode='22023'; end if;
 select array_agg(value order by value) into permission_names from jsonb_array_elements_text(p_values->'permissions') value;
 if exists(select 1 from unnest(permission_names) s left join public.admin_permissions p on p.name=s where p.id is null) then raise exception 'unknown permission' using errcode='23503'; end if;
 if p_id is not null then select to_jsonb(r.*),r.name in ('super_admin','administrator'),r.name into before_row,protected,old_name from public.admin_roles r where r.id=p_id for update; if before_row is null then raise exception 'role not found'; end if; end if;
 if protected and lower(regexp_replace(btrim(p_values->>'name'),'[^a-zA-Z0-9]+','_','g'))<>old_name then raise exception 'protected role name cannot change' using errcode='42501'; end if;
 if protected and not exists(select 1 from public.profile_admin_roles par join public.admin_roles r on r.id=par.role_id where par.profile_id=actor and r.name='super_admin') then raise exception 'super admin required for protected role' using errcode='42501'; end if;
 if p_id is null then insert into public.admin_roles(name,display_name) values(lower(regexp_replace(btrim(p_values->>'name'),'[^a-zA-Z0-9]+','_','g')),btrim(p_values->>'name')) returning id,to_jsonb(admin_roles.*) into v_role_id,after_row; else update public.admin_roles set name=lower(regexp_replace(btrim(p_values->>'name'),'[^a-zA-Z0-9]+','_','g')),display_name=btrim(p_values->>'name') where id=p_id returning id,to_jsonb(admin_roles.*) into v_role_id,after_row; end if;
 delete from public.admin_role_permissions where role_id=v_role_id; insert into public.admin_role_permissions(role_id,permission_id) select v_role_id,id from public.admin_permissions where name=any(permission_names);
 insert into public.dpt_admin_audit_log(actor_auth_user_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),actor,case when p_id is null then 'create' else 'update' end,'admin_role',v_role_id::text,before_row,after_row||jsonb_build_object('permissions',permission_names)); return after_row||jsonb_build_object('permissions',permission_names);
end $$;

create or replace function public.dpt_public_media_key(p_media_id uuid,p_variant text default 'logo') returns text language sql stable security definer set search_path=pg_catalog,public as $$
 select case when p_variant='original' then m.original_key else m.variants->>p_variant end from public.media_assets m join public.articles a on a.logo_media_id=m.id where m.id=p_media_id and m.purpose='article_logo' and m.state='ready' and m.deleted_at is null and a.status='published' and a.published_at<=now() and p_variant in ('original','thumb','card','hero','logo') limit 1
$$;
revoke all on function public.dpt_public_media_key(uuid,text) from public;
grant execute on function public.dpt_public_media_key(uuid,text) to anon,authenticated;

create or replace function public.dpt_public_media_object_allowed(p_name text) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.media_assets m join public.articles a on a.logo_media_id=m.id where m.purpose='article_logo' and m.state='ready' and m.deleted_at is null and a.status='published' and a.published_at<=now() and (m.original_key=p_name or exists(select 1 from jsonb_each_text(m.variants) variant where variant.value=p_name)))
$$;
revoke all on function public.dpt_public_media_object_allowed(text) from public;
grant execute on function public.dpt_public_media_object_allowed(text) to anon,authenticated;

-- Configure the private bucket only where Supabase Storage exists. All object paths must
-- already be declared by an uploading media row created by the guarded begin RPC.
do $storage$
begin
 if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
  execute $sql$insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('dpt-admin-media','dpt-admin-media',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp']$sql$;
  execute 'drop policy if exists "dpt media operator object write" on storage.objects';
  execute 'drop policy if exists "dpt media operator object read" on storage.objects';
  execute 'drop policy if exists "dpt media operator object delete" on storage.objects';
  execute 'drop policy if exists "dpt media published logo proxy read" on storage.objects';
  execute $sql$create policy "dpt media operator object write" on storage.objects for insert to authenticated with check(bucket_id='dpt-admin-media' and exists(select 1 from public.media_assets m where m.created_by=private.dpt_actor() and m.state='uploading' and (m.original_key=name or exists(select 1 from jsonb_each_text(m.variants) variant where variant.value=name)) and ((m.purpose='article_logo' and private.has_permission('manage_articles')) or (m.purpose='email_attachment' and private.has_permission('manage_email_templates')))))$sql$;
  execute $sql$create policy "dpt media operator object read" on storage.objects for select to authenticated using(bucket_id='dpt-admin-media' and exists(select 1 from public.media_assets m where (m.original_key=name or exists(select 1 from jsonb_each_text(m.variants) variant where variant.value=name)) and ((m.purpose='article_logo' and private.has_permission('manage_articles')) or (m.purpose='email_attachment' and private.has_permission('manage_email_templates')))))$sql$;
  execute $sql$create policy "dpt media operator object delete" on storage.objects for delete to authenticated using(bucket_id='dpt-admin-media' and exists(select 1 from public.media_assets m where (m.original_key=name or exists(select 1 from jsonb_each_text(m.variants) variant where variant.value=name)) and ((m.purpose='article_logo' and private.has_permission('manage_articles')) or (m.purpose='email_attachment' and private.has_permission('manage_email_templates')))))$sql$;
  execute $sql$create policy "dpt media published logo proxy read" on storage.objects for select to anon,authenticated using(bucket_id='dpt-admin-media' and public.dpt_public_media_object_allowed(name))$sql$;
 end if;
end
$storage$;

revoke all on function public.dpt_admin_begin_media(text,text,bigint,integer,integer,text),public.dpt_admin_finalize_media(uuid,text,jsonb),public.dpt_admin_fail_media(uuid),public.dpt_admin_delete_media(uuid),public.dpt_admin_set_article_logo(bigint,uuid),public.dpt_admin_set_email_template_attachments(uuid,uuid[]),public.dpt_admin_save_article_with_media(bigint,jsonb,uuid),public.dpt_admin_save_email_template_with_attachments(uuid,jsonb,uuid[]),public.dpt_admin_set_profile_admin_roles(uuid,bigint[]) from public,anon;
grant execute on function public.dpt_admin_begin_media(text,text,bigint,integer,integer,text),public.dpt_admin_finalize_media(uuid,text,jsonb),public.dpt_admin_fail_media(uuid),public.dpt_admin_delete_media(uuid),public.dpt_admin_set_article_logo(bigint,uuid),public.dpt_admin_set_email_template_attachments(uuid,uuid[]),public.dpt_admin_save_article_with_media(bigint,jsonb,uuid),public.dpt_admin_save_email_template_with_attachments(uuid,jsonb,uuid[]),public.dpt_admin_set_profile_admin_roles(uuid,bigint[]) to authenticated;
commit;
