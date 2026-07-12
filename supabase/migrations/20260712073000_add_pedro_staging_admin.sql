begin;

-- Service/admin accounts created directly in Supabase Auth may not have a legacy Laravel user ID.
alter table public.dpt_admin_accounts
  alter column legacy_user_id drop not null;

do $$
declare
  pedro_auth_user_id uuid;
begin
  select id into pedro_auth_user_id
  from auth.users
  where lower(email) = lower('pedro@fpngaming.com')
  limit 1;

  if pedro_auth_user_id is null then
    raise exception 'Expected Supabase Auth user pedro@fpngaming.com was not found';
  end if;

  insert into public.profiles (
    id,
    legacy_user_id,
    first_name,
    email,
    status
  ) values (
    pedro_auth_user_id,
    null,
    'Pedro',
    'pedro@fpngaming.com',
    'active'
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    email = excluded.email,
    status = excluded.status,
    updated_at = now();

  insert into public.profile_roles (profile_id, role)
  values (pedro_auth_user_id, 'administrator')
  on conflict (profile_id, role) do nothing;

  insert into public.dpt_admin_accounts (
    auth_user_id,
    legacy_user_id,
    role_name,
    can_view_admin,
    is_active
  ) values (
    pedro_auth_user_id,
    null,
    'administrator',
    true,
    true
  )
  on conflict (auth_user_id) do update set
    role_name = excluded.role_name,
    can_view_admin = true,
    is_active = true,
    updated_at = now();
end $$;

commit;
