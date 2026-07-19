begin;

-- A main entry can pre-date a flight.  Keep its original stack separate from
-- flight contributions so undo never deletes or recalculates another source.
create table if not exists public.flight_main_entry_provenance (
  main_tournament_id bigint not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.profiles(id),
  main_entry_id bigint not null references public.tournament_entries(id) on delete cascade,
  baseline_initial_chips integer not null,
  baseline_total_chips integer not null,
  created_by_flight boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (main_tournament_id, player_id),
  unique (main_entry_id)
);

create unique index if not exists flight_advancements_active_lookup_idx
  on public.flight_advancements (flight_tournament_id, main_tournament_id, player_id)
  where undone_at is null;

alter table public.flight_main_entry_provenance enable row level security;

grant select on public.flight_main_entry_provenance to authenticated;

drop policy if exists "flight provenance readable by operators" on public.flight_main_entry_provenance;
create policy "flight provenance readable by operators"
  on public.flight_main_entry_provenance for select
  to authenticated
  using (private.is_admin_operator());

create or replace function public.dpt_admin_advance_flight_players(
  p_flight_tournament_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  flight_row public.tournaments%rowtype;
  main_row public.tournaments%rowtype;
  flight_type public.tournament_type_code;
  carryover public.chip_carryover_mode;
  survivor public.tournament_entries%rowtype;
  main_entry public.tournament_entries%rowtype;
  provenance public.flight_main_entry_provenance%rowtype;
  created_main_entry boolean;
  next_rank integer := 0;
  advanced_count integer := 0;
  before_data jsonb;
  after_data jsonb;
  contribution_count integer;
  computed_chips integer;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;
  select id into actor_profile_id from public.profiles
  where auth_user_id = auth.uid() and status = 'active' and deleted_at is null limit 1;
  if actor_profile_id is null then
    raise exception 'Active operator profile required' using errcode = '42501';
  end if;

  -- Discover the linked id, then take both transaction locks in one global order.
  select * into flight_row from public.tournaments
  where id = p_flight_tournament_id and deleted_at is null;
  if not found then raise exception 'Flight tournament not found' using errcode = 'P0002'; end if;
  if flight_row.main_tournament_id is null then
    raise exception 'Flight tournament must be linked to a main tournament' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(least(p_flight_tournament_id, flight_row.main_tournament_id));
  perform pg_advisory_xact_lock(greatest(p_flight_tournament_id, flight_row.main_tournament_id));

  select * into flight_row from public.tournaments
  where id = p_flight_tournament_id and deleted_at is null for update;
  select * into main_row from public.tournaments
  where id = flight_row.main_tournament_id and deleted_at is null for update;
  if not found then raise exception 'Linked main tournament not found' using errcode = 'P0002'; end if;
  select code into flight_type from public.tournament_types where id = flight_row.tournament_type_id;
  if flight_type is distinct from 'flight' then
    raise exception 'Flight advancement requires a flight tournament' using errcode = '22023';
  end if;
  if not flight_row.registration_closed then
    raise exception 'Registration must be closed before flight advancement' using errcode = '22023';
  end if;
  carryover := coalesce(main_row.chip_carryover, 'highest'::public.chip_carryover_mode);

  select jsonb_build_object(
    'flight', to_jsonb(flight_row),
    'survivors', coalesce(jsonb_agg(to_jsonb(entry) order by entry.total_chips desc, entry.id), '[]'::jsonb)
  ) into before_data
  from public.tournament_entries entry
  where entry.tournament_id = p_flight_tournament_id and entry.deleted_at is null
    and entry.checked_in and not entry.pre_registered and not entry.eliminated;
  if jsonb_array_length(before_data -> 'survivors') = 0 then
    raise exception 'No checked-in active flight survivors remain' using errcode = '22023';
  end if;

  for survivor in
    select entry.* from public.tournament_entries entry
    where entry.tournament_id = p_flight_tournament_id and entry.deleted_at is null
      and entry.checked_in and not entry.pre_registered and not entry.eliminated
    order by entry.total_chips desc, entry.id asc
    for update
  loop
    next_rank := next_rank + 1;
    created_main_entry := false;
    select * into main_entry from public.tournament_entries entry
    where entry.tournament_id = main_row.id and entry.player_id = survivor.player_id and entry.deleted_at is null
    for update;
    if not found then
      insert into public.tournament_entries (
        tournament_id, player_id, pre_registered, checked_in, checked_in_by,
        initial_buyin, initial_chips_count, total_buy_in_amount, total_chips
      ) values (main_row.id, survivor.player_id, false, true, actor_profile_id, 0, 0, 0, 0)
      returning * into main_entry;
      created_main_entry := true;
    end if;

    select * into provenance from public.flight_main_entry_provenance source
    where source.main_tournament_id = main_row.id and source.player_id = survivor.player_id for update;
    if not found then
      insert into public.flight_main_entry_provenance (
        main_tournament_id, player_id, main_entry_id, baseline_initial_chips, baseline_total_chips, created_by_flight
      ) values (
        main_row.id, survivor.player_id, main_entry.id, main_entry.initial_chips_count, main_entry.total_chips, created_main_entry
      ) returning * into provenance;
    end if;

    insert into public.flight_advancements (
      flight_tournament_id, main_tournament_id, player_id, chips_advanced, mode_snapshot
    ) values (p_flight_tournament_id, main_row.id, survivor.player_id, survivor.total_chips, carryover)
    on conflict (flight_tournament_id, main_tournament_id, player_id) where undone_at is null
    do update set chips_advanced = excluded.chips_advanced, mode_snapshot = excluded.mode_snapshot, advanced_at = now();

    select count(*)::integer,
      case when carryover = 'sum' then provenance.baseline_total_chips + coalesce(sum(chips_advanced), 0)
           else greatest(provenance.baseline_total_chips, coalesce(max(chips_advanced), 0)) end
    into contribution_count, computed_chips
    from public.flight_advancements
    where main_tournament_id = main_row.id and player_id = survivor.player_id and undone_at is null;

    update public.tournament_entries set initial_chips_count = computed_chips, total_chips = computed_chips, updated_at = now()
    where id = main_entry.id;
    update public.tournament_entries set qualified_flight_player = true, eliminated = true, rank = next_rank, updated_at = now()
    where id = survivor.id;
    advanced_count := advanced_count + 1;
  end loop;

  select jsonb_build_object(
    'flight_entries', coalesce(jsonb_agg(to_jsonb(entry) order by entry.id), '[]'::jsonb),
    'main_entries', coalesce((select jsonb_agg(to_jsonb(entry) order by entry.id) from public.tournament_entries entry
      where entry.tournament_id = main_row.id and entry.deleted_at is null and exists (
        select 1 from public.flight_advancements advancement where advancement.main_tournament_id = main_row.id and advancement.player_id = entry.player_id and advancement.flight_tournament_id = p_flight_tournament_id and advancement.undone_at is null
      )), '[]'::jsonb),
    'advanced_count', advanced_count
  ) into after_data
  from public.tournament_entries entry
  where entry.tournament_id = p_flight_tournament_id and entry.deleted_at is null and entry.qualified_flight_player;

  insert into public.dpt_admin_audit_log (actor_auth_user_id, actor_profile_id, action, entity_type, entity_id, tournament_id, before_data, after_data)
  values (auth.uid(), actor_profile_id, 'tournament.flight_advance', 'tournament', p_flight_tournament_id::text, p_flight_tournament_id, before_data, after_data);
  return jsonb_build_object('flight_tournament_id', p_flight_tournament_id, 'main_tournament_id', main_row.id, 'advanced_count', advanced_count, 'chip_carryover', carryover);
end;
$$;

create or replace function public.dpt_admin_undo_flight_advancement(
  p_flight_tournament_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  flight_row public.tournaments%rowtype;
  main_row public.tournaments%rowtype;
  flight_type public.tournament_type_code;
  carryover public.chip_carryover_mode;
  source public.flight_main_entry_provenance%rowtype;
  player_row record;
  before_data jsonb;
  after_data jsonb;
  computed_chips integer;
  active_count integer;
  undone_count integer := 0;
  updated_rows integer;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;
  select id into actor_profile_id from public.profiles
  where auth_user_id = auth.uid() and status = 'active' and deleted_at is null limit 1;
  if actor_profile_id is null then raise exception 'Active operator profile required' using errcode = '42501'; end if;
  select * into flight_row from public.tournaments where id = p_flight_tournament_id and deleted_at is null;
  if not found then raise exception 'Flight tournament not found' using errcode = 'P0002'; end if;
  if flight_row.main_tournament_id is null then raise exception 'Flight tournament must be linked to a main tournament' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(least(p_flight_tournament_id, flight_row.main_tournament_id));
  perform pg_advisory_xact_lock(greatest(p_flight_tournament_id, flight_row.main_tournament_id));
  select * into flight_row from public.tournaments where id = p_flight_tournament_id and deleted_at is null for update;
  select * into main_row from public.tournaments where id = flight_row.main_tournament_id and deleted_at is null for update;
  if not found then raise exception 'Linked main tournament not found' using errcode = 'P0002'; end if;
  select code into flight_type from public.tournament_types where id = flight_row.tournament_type_id;
  if flight_type is distinct from 'flight' then raise exception 'Flight undo requires a flight tournament' using errcode = '22023'; end if;
  carryover := coalesce(main_row.chip_carryover, 'highest'::public.chip_carryover_mode);

  select jsonb_build_object('advancements', coalesce(jsonb_agg(to_jsonb(advancement) order by advancement.id), '[]'::jsonb)) into before_data
  from public.flight_advancements advancement
  where advancement.flight_tournament_id = p_flight_tournament_id and advancement.main_tournament_id = main_row.id and advancement.undone_at is null;
  if jsonb_array_length(before_data -> 'advancements') = 0 then
    raise exception 'No active advancement exists for this flight' using errcode = '22023';
  end if;

  for player_row in
    select distinct advancement.player_id from public.flight_advancements advancement
    where advancement.flight_tournament_id = p_flight_tournament_id and advancement.main_tournament_id = main_row.id and advancement.undone_at is null
  loop
    select * into source from public.flight_main_entry_provenance provenance
    where provenance.main_tournament_id = main_row.id and provenance.player_id = player_row.player_id for update;
    update public.flight_advancements set undone_at = now()
    where flight_tournament_id = p_flight_tournament_id and main_tournament_id = main_row.id and player_id = player_row.player_id and undone_at is null;
    get diagnostics updated_rows = row_count;
    undone_count := undone_count + updated_rows;

    select count(*)::integer,
      case when carryover = 'sum' then source.baseline_total_chips + coalesce(sum(chips_advanced), 0)
           else greatest(source.baseline_total_chips, coalesce(max(chips_advanced), 0)) end
    into active_count, computed_chips
    from public.flight_advancements
    where main_tournament_id = main_row.id and player_id = player_row.player_id and undone_at is null;
    if active_count = 0 and source.created_by_flight then
      delete from public.tournament_entries where id = source.main_entry_id;
    else
      update public.tournament_entries set initial_chips_count = computed_chips, total_chips = computed_chips, updated_at = now()
      where id = source.main_entry_id;
    end if;
  end loop;

  update public.tournament_entries entry set qualified_flight_player = false, eliminated = false, rank = null, updated_at = now()
  where entry.tournament_id = p_flight_tournament_id and entry.deleted_at is null and exists (
    select 1 from public.flight_advancements advancement
    where advancement.flight_tournament_id = p_flight_tournament_id and advancement.player_id = entry.player_id and advancement.undone_at is not null
  );

  select jsonb_build_object('undone_count', undone_count, 'remaining_active_advancements', count(*)) into after_data
  from public.flight_advancements where main_tournament_id = main_row.id and undone_at is null;
  insert into public.dpt_admin_audit_log (actor_auth_user_id, actor_profile_id, action, entity_type, entity_id, tournament_id, before_data, after_data)
  values (auth.uid(), actor_profile_id, 'tournament.flight_advance_undo', 'tournament', p_flight_tournament_id::text, p_flight_tournament_id, before_data, after_data);
  return jsonb_build_object('flight_tournament_id', p_flight_tournament_id, 'main_tournament_id', main_row.id, 'undone_count', undone_count, 'chip_carryover', carryover);
end;
$$;

revoke all on function public.dpt_admin_advance_flight_players(bigint) from public, anon;
revoke all on function public.dpt_admin_undo_flight_advancement(bigint) from public, anon;
grant execute on function public.dpt_admin_advance_flight_players(bigint) to authenticated;
grant execute on function public.dpt_admin_undo_flight_advancement(bigint) to authenticated;

commit;
