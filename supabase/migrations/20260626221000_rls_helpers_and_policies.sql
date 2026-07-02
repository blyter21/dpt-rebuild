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
  select public.has_any_app_role(array['super_admin','admin','manager','host']::public.app_role[]);
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

-- Profiles
create policy "profiles_public_read_active"
  on public.profiles for select
  using (deleted_at is null and status = 'active');

create policy "profiles_user_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.has_any_app_role(array['super_admin','admin']::public.app_role[]))
  with check (public.has_any_app_role(array['super_admin','admin']::public.app_role[]));

-- Profile roles should be highly restricted.
create policy "profile_roles_self_read"
  on public.profile_roles for select
  using (profile_id = auth.uid() or public.has_any_app_role(array['super_admin','admin']::public.app_role[]));

create policy "profile_roles_super_admin_all"
  on public.profile_roles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Public read for active published structure/content tables.
create policy "leagues_public_read_active"
  on public.leagues for select
  using (status = true and deleted_at is null);

create policy "seasons_public_read_active"
  on public.seasons for select
  using (status = true and deleted_at is null);

create policy "venues_public_read_active"
  on public.venues for select
  using (status = true and deleted_at is null);

create policy "events_public_read_active"
  on public.events for select
  using (status = true and deleted_at is null);

create policy "tournament_types_public_read"
  on public.tournament_types for select
  using (true);

create policy "blind_structures_public_read_active"
  on public.blind_structures for select
  using (status = true and deleted_at is null);

create policy "tournaments_public_read_active"
  on public.tournaments for select
  using (status = true and deleted_at is null);

create policy "tournament_updates_public_read_active"
  on public.tournament_updates for select
  using (status = true and deleted_at is null);

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
  using (public.has_any_app_role(array['super_admin','admin']::public.app_role[]))
  with check (public.has_any_app_role(array['super_admin','admin']::public.app_role[]));

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

-- Tournament entries: public can read non-deleted rows for active tournaments; players can manage own pre-reg; admins/operators can manage all.
create policy "tournament_entries_public_read_active_tournaments"
  on public.tournament_entries for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_entries.tournament_id
        and t.status = true
        and t.deleted_at is null
    )
  );

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

-- Payouts and flight advancement ledgers.
create policy "payout_templates_public_read"
  on public.payout_templates for select
  using (deleted_at is null);

create policy "payout_template_rows_public_read"
  on public.payout_template_rows for select
  using (true);

create policy "tournament_payouts_public_read"
  on public.tournament_payouts for select
  using (true);

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

-- Qualifier selector tables.
alter table public.tournament_qualifiers enable row level security;
alter table public.toc_qualified_types enable row level security;
alter table public.toc_qualified_tournaments enable row level security;

create policy "tournament_qualifiers_public_read"
  on public.tournament_qualifiers for select
  using (true);

create policy "toc_qualified_types_public_read"
  on public.toc_qualified_types for select
  using (true);

create policy "toc_qualified_tournaments_public_read"
  on public.toc_qualified_tournaments for select
  using (true);

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
