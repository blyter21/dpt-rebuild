-- DPT Rebuild Lab initial RLS helpers and policy draft
-- Draft/dev migration only. Review before any production use.

create or replace function public.has_app_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = auth.uid()
      and pr.role = p_role
  );
$$;

create or replace function public.has_any_app_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_roles pr
    where pr.profile_id = auth.uid()
      and pr.role = any(p_roles)
  );
$$;

create or replace function public.is_admin_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_app_role(array['super_admin','administrator','host','venue']::public.app_role[]);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_app_role('super_admin');
$$;

-- Profiles are private. Users may read/update only their own profile; authorized admins may manage profiles.
create policy "profiles_user_read_self"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_user_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.has_any_app_role(array['super_admin','administrator']::public.app_role[]))
  with check (public.has_any_app_role(array['super_admin','administrator']::public.app_role[]));

-- Profile roles should be highly restricted.
create policy "profile_roles_self_read"
  on public.profile_roles for select
  using (profile_id = auth.uid() or public.has_any_app_role(array['super_admin','administrator']::public.app_role[]));

create policy "profile_roles_super_admin_all"
  on public.profile_roles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Core operational tables intentionally have no anonymous/public policies.
-- Public site reads use the curated dpt_public_* tables and views created by the later public-schema migration.

-- Admin/operator write policies for core admin-managed tables.
create policy "leagues_admin_all"
  on public.leagues for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "seasons_admin_all"
  on public.seasons for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "venues_admin_all"
  on public.venues for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "events_admin_all"
  on public.events for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournament_types_admin_all"
  on public.tournament_types for all
  using (public.has_any_app_role(array['super_admin','administrator']::public.app_role[]))
  with check (public.has_any_app_role(array['super_admin','administrator']::public.app_role[]));

create policy "blind_structures_admin_all"
  on public.blind_structures for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournaments_admin_all"
  on public.tournaments for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournament_updates_admin_all"
  on public.tournament_updates for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

-- Tournament entries are private operational records. Players may manage their own pre-registration; admins/operators manage all.

create policy "tournament_entries_player_insert_self"
  on public.tournament_entries for insert
  with check (
    player_id = auth.uid()
    and pre_registered = true
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_entries.tournament_id
        and t.status = true
        and t.deleted_at is null
        and t.registration_closed = false
        and (t.registration_ends_at is null or t.registration_ends_at > now())
    )
  );

create policy "tournament_entries_player_update_self_prereg"
  on public.tournament_entries for update
  using (player_id = auth.uid() and pre_registered = true)
  with check (player_id = auth.uid() and pre_registered = true);

create policy "tournament_entries_admin_all"
  on public.tournament_entries for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournament_entry_addons_admin_all"
  on public.tournament_entry_addons for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournament_entry_addons_player_read_own"
  on public.tournament_entry_addons for select
  using (
    exists (
      select 1 from public.tournament_entries te
      where te.id = tournament_entry_addons.tournament_entry_id
        and te.player_id = auth.uid()
    )
  );

-- Payout and flight ledgers are operational/admin data; public summaries must use curated views.

create policy "payout_templates_admin_all"
  on public.payout_templates for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "payout_template_rows_admin_all"
  on public.payout_template_rows for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "tournament_payouts_admin_all"
  on public.tournament_payouts for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "flight_advancements_admin_all"
  on public.flight_advancements for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "flight_advancements_player_read_own"
  on public.flight_advancements for select
  using (player_id = auth.uid());

-- Qualifier selector tables are operational/admin data.
alter table public.tournament_qualifiers enable row level security;
alter table public.toc_qualified_types enable row level security;
alter table public.toc_qualified_tournaments enable row level security;

create policy "tournament_qualifiers_admin_all"
  on public.tournament_qualifiers for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "toc_qualified_types_admin_all"
  on public.toc_qualified_types for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

create policy "toc_qualified_tournaments_admin_all"
  on public.toc_qualified_tournaments for all
  using (public.is_admin_operator())
  with check (public.is_admin_operator());

-- Explicit privilege boundary: anonymous users never access core operational tables.
revoke all on table
  public.profiles,
  public.profile_roles,
  public.leagues,
  public.seasons,
  public.venues,
  public.events,
  public.tournament_types,
  public.blind_structures,
  public.tournaments,
  public.tournament_qualifiers,
  public.toc_qualified_types,
  public.toc_qualified_tournaments,
  public.tournament_entries,
  public.tournament_entry_addons,
  public.payout_templates,
  public.payout_template_rows,
  public.tournament_payouts,
  public.flight_advancements,
  public.tournament_updates
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.profile_roles,
  public.leagues,
  public.seasons,
  public.venues,
  public.events,
  public.tournament_types,
  public.blind_structures,
  public.tournaments,
  public.tournament_qualifiers,
  public.toc_qualified_types,
  public.toc_qualified_tournaments,
  public.tournament_entries,
  public.tournament_entry_addons,
  public.payout_templates,
  public.payout_template_rows,
  public.tournament_payouts,
  public.flight_advancements,
  public.tournament_updates
to authenticated;

grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.has_app_role(public.app_role) from public;
revoke all on function public.has_any_app_role(public.app_role[]) from public;
revoke all on function public.is_admin_operator() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.has_app_role(public.app_role) to authenticated;
grant execute on function public.has_any_app_role(public.app_role[]) to authenticated;
grant execute on function public.is_admin_operator() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
