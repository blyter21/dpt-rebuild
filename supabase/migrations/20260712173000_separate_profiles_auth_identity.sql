begin;

-- Legacy DPT players are domain records. Only users who can sign in need an auth.users identity.
alter table public.profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- Preserve the existing Pedro/admin linkage before removing the old profiles.id -> auth.users coupling.
update public.profiles profile
set auth_user_id = profile.id
where profile.auth_user_id is null
  and exists (select 1 from auth.users auth_user where auth_user.id = profile.id);

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

-- Merge the existing staging Pedro Auth profile with production legacy user 2787.
do $$
declare
  existing_profile_id uuid;
  merged_profile_id constant uuid := 'df653b3b-14e6-560d-84a7-4f69fca93ed9';
begin
  select id into existing_profile_id
  from public.profiles
  where auth_user_id = (select id from auth.users where lower(email) = 'pedro@fpngaming.com' limit 1)
  limit 1;

  if existing_profile_id is not null and existing_profile_id <> merged_profile_id then
    delete from public.profile_roles where profile_id = existing_profile_id;
    update public.profiles
    set id = merged_profile_id,
        legacy_user_id = 2787
    where id = existing_profile_id;
  elsif existing_profile_id = merged_profile_id then
    update public.profiles set legacy_user_id = 2787 where id = merged_profile_id;
  end if;

  if exists (select 1 from public.profiles where id = merged_profile_id) then
    insert into public.profile_roles (profile_id, role)
    values (merged_profile_id, 'administrator'), (merged_profile_id, 'user')
    on conflict (profile_id, role) do nothing;
  end if;
end $$;

-- Preserve full non-secret legacy rows privately while normalized fields are rebuilt.
alter table public.profiles add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.leagues add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.seasons add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.venues add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.events add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.tournament_types add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.blind_structures add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.tournaments add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.tournament_entries add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.tournament_entry_addons add column if not exists legacy_data jsonb not null default '{}'::jsonb;
alter table public.tournament_updates add column if not exists legacy_data jsonb not null default '{}'::jsonb;

-- Production permits duplicate/re-entry rows and historical rows with deleted/null users.
alter table public.tournament_entries drop constraint if exists tournament_entries_tournament_id_player_id_key;
alter table public.tournament_entries alter column player_id drop not null;
alter table public.tournament_entries add column if not exists legacy_user_id bigint;
create index if not exists tournament_entries_tournament_player_idx
  on public.tournament_entries (tournament_id, player_id);
create index if not exists tournament_entries_legacy_user_idx
  on public.tournament_entries (legacy_user_id);

-- Legacy add-ons are keyed by user+tournament, which can be ambiguous when duplicate entries exist.
alter table public.tournament_entry_addons alter column tournament_entry_id drop not null;
alter table public.tournament_entry_addons add column if not exists tournament_id bigint references public.tournaments(id) on delete cascade;
alter table public.tournament_entry_addons add column if not exists player_id uuid references public.profiles(id);
alter table public.tournament_entry_addons add column if not exists legacy_user_id bigint;
create index if not exists tournament_entry_addons_tournament_player_idx
  on public.tournament_entry_addons (tournament_id, player_id);

-- Rebuild self-service policies against the optional auth identity.
drop policy if exists "profiles_user_read_self" on public.profiles;
create policy "profiles_user_read_self"
  on public.profiles for select
  using (auth_user_id = auth.uid());

drop policy if exists "profiles_user_update_self" on public.profiles;
create policy "profiles_user_update_self"
  on public.profiles for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "profile_roles_self_read" on public.profile_roles;
create policy "profile_roles_self_read"
  on public.profile_roles for select
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = profile_roles.profile_id
        and profile.auth_user_id = auth.uid()
    )
    or private.is_admin_operator()
  );

drop policy if exists "tournament_entries_player_insert_own" on public.tournament_entries;
create policy "tournament_entries_player_insert_own"
  on public.tournament_entries for insert
  with check (
    exists (
      select 1 from public.profiles profile
      where profile.id = tournament_entries.player_id
        and profile.auth_user_id = auth.uid()
    )
  );

drop policy if exists "tournament_entries_player_update_own_pre_registration" on public.tournament_entries;
create policy "tournament_entries_player_update_own_pre_registration"
  on public.tournament_entries for update
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = tournament_entries.player_id
        and profile.auth_user_id = auth.uid()
    )
    and pre_registered = true
    and checked_in = false
    and eliminated = false
  )
  with check (
    exists (
      select 1 from public.profiles profile
      where profile.id = tournament_entries.player_id
        and profile.auth_user_id = auth.uid()
    )
  );

create policy "tournament_entries_player_read_own"
  on public.tournament_entries for select
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = tournament_entries.player_id
        and profile.auth_user_id = auth.uid()
    )
  );

-- Keep authorization helpers private while resolving roles through profiles.auth_user_id.
create or replace function private.has_app_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.profile_roles profile_role
    join public.profiles profile on profile.id = profile_role.profile_id
    where profile.auth_user_id = auth.uid()
      and profile_role.role = p_role
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
    from public.profile_roles profile_role
    join public.profiles profile on profile.id = profile_role.profile_id
    where profile.auth_user_id = auth.uid()
      and profile_role.role = any(p_roles)
  );
$$;

commit;
