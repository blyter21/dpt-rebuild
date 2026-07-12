begin;

-- Public views must enforce the querying user's privileges and RLS, not the view owner's.
alter view public.dpt_public_event_cards set (security_invoker = true);
alter view public.dpt_public_tournament_details set (security_invoker = true);
alter view public.dpt_public_homepage set (security_invoker = true);

-- Fix mutable search_path warning on the trigger helper.
alter function public.set_updated_at() set search_path = pg_catalog, public;

-- Keep authorization helpers out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

alter function public.has_app_role(public.app_role) set schema private;
alter function public.has_any_app_role(public.app_role[]) set schema private;
alter function public.is_admin_operator() set schema private;
alter function public.is_super_admin() set schema private;
alter function public.dpt_current_user_can_view_admin() set schema private;

create or replace function private.has_app_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = auth.uid()
      and pr.role = p_role
  );
$$;

create or replace function private.has_any_app_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = auth.uid()
      and pr.role = any(p_roles)
  );
$$;

create or replace function private.is_admin_operator()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select private.has_any_app_role(array['super_admin','administrator','host','venue']::public.app_role[]);
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select private.has_app_role('super_admin');
$$;

create or replace function private.dpt_current_user_can_view_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.dpt_admin_accounts account
    where account.auth_user_id = auth.uid()
      and account.is_active = true
      and account.can_view_admin = true
      and account.role_name in ('super admin', 'administrator', 'host', 'venue')
  );
$$;

revoke all on function private.has_app_role(public.app_role) from public, anon;
revoke all on function private.has_any_app_role(public.app_role[]) from public, anon;
revoke all on function private.is_admin_operator() from public, anon;
revoke all on function private.is_super_admin() from public, anon;
revoke all on function private.dpt_current_user_can_view_admin() from public, anon;

grant execute on function private.has_app_role(public.app_role) to authenticated;
grant execute on function private.has_any_app_role(public.app_role[]) to authenticated;
grant execute on function private.is_admin_operator() to authenticated;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.dpt_current_user_can_view_admin() to authenticated;

commit;
