begin;

create table if not exists public.dpt_admin_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  legacy_user_id bigint not null unique,
  role_name text not null check (role_name in ('super admin', 'administrator', 'host', 'venue')),
  can_view_admin boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dpt_admin_accounts enable row level security;

revoke all on public.dpt_admin_accounts from anon;
grant select on public.dpt_admin_accounts to authenticated;

drop policy if exists "admin account can read own authorization" on public.dpt_admin_accounts;
create policy "admin account can read own authorization"
on public.dpt_admin_accounts
for select
to authenticated
using (
  auth_user_id = auth.uid()
  and is_active = true
  and can_view_admin = true
);

create or replace function public.dpt_current_user_can_view_admin()
returns boolean
language sql
stable
security definer
set search_path = public
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

revoke all on function public.dpt_current_user_can_view_admin() from public;
grant execute on function public.dpt_current_user_can_view_admin() to authenticated;

commit;
