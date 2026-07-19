begin;

-- Loop 1: production's preview/edit elimination correction in one locked, audited operation.
create or replace function public.dpt_admin_bulk_correct_ranks(
  p_tournament_id bigint,
  p_corrections jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  actor_profile_id uuid;
  before_entries jsonb;
  after_entries jsonb;
  tournament_type text;
  multiplier numeric;
  participation_bonus integer;
  final_table_count integer;
  correction_count integer;
  locked_count integer;
  duplicate_payouts integer;
  invalid_rank_layout boolean;
  changed_count integer;
begin
  if auth.uid() is null or not private.is_admin_operator() then
    raise exception 'DPT administrator authorization required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_corrections) <> 'array' or jsonb_array_length(p_corrections) = 0 then
    raise exception 'Corrections must be a non-empty JSON array' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_corrections) correction
    where jsonb_typeof(correction) <> 'object'
      or not (correction ?& array['entry_id', 'rank', 'total_buy_in_amount', 'bounty'])
      or jsonb_typeof(correction->'entry_id') <> 'number'
      or jsonb_typeof(correction->'rank') <> 'number'
      or jsonb_typeof(correction->'total_buy_in_amount') <> 'number'
      or jsonb_typeof(correction->'bounty') <> 'number'
      or correction->>'entry_id' !~ '^[1-9][0-9]*$'
      or correction->>'rank' !~ '^[1-9][0-9]*$'
      or correction->>'total_buy_in_amount' !~ '^[0-9]+$'
      or correction->>'bounty' !~ '^[0-9]+$'
      or length(correction->>'entry_id') > 18
      or length(correction->>'rank') > 9
      or length(correction->>'total_buy_in_amount') > 9
      or length(correction->>'bounty') > 9
  ) then
    raise exception 'Each correction requires positive integer entry_id/rank and non-negative integer totals' using errcode = '22023';
  end if;

  select profile.id into actor_profile_id
  from public.profiles profile
  where profile.auth_user_id = auth.uid() and profile.status = 'active' and profile.deleted_at is null
  limit 1;
  if actor_profile_id is null then
    raise exception 'Authenticated administrator profile is missing' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(p_tournament_id);
  select type.code,
         case when tournament.points_multiplier_enabled and tournament.points_multiplier_value is not null
           then tournament.points_multiplier_value else 1 end,
         coalesce(tournament.participation_bonus_points, 0),
         coalesce(tournament.players_at_final_table, 0)
  into tournament_type, multiplier, participation_bonus, final_table_count
  from public.tournaments tournament
  join public.tournament_types type on type.id = tournament.tournament_type_id
  where tournament.id = p_tournament_id and tournament.deleted_at is null
  for update of tournament;
  if not found then
    raise exception 'Tournament was not found' using errcode = 'P0002';
  end if;

  select count(*)::integer, count(distinct correction.entry_id)::integer
  into correction_count, locked_count
  from jsonb_to_recordset(p_corrections) as correction(entry_id bigint, rank integer, total_buy_in_amount integer, bounty integer);
  if correction_count <> locked_count then
    raise exception 'Each entry may appear only once in corrections' using errcode = '22023';
  end if;

  -- Lock the entire affected result set, then prove every requested entry is eligible.
  perform 1
  from public.tournament_entries entry
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null
  for update;

  select count(*)::integer into locked_count
  from public.tournament_entries entry
  join jsonb_to_recordset(p_corrections) as correction(entry_id bigint, rank integer, total_buy_in_amount integer, bounty integer)
    on correction.entry_id = entry.id
  where entry.tournament_id = p_tournament_id
    and entry.deleted_at is null
    and entry.checked_in = true
    and entry.pre_registered = false;
  if locked_count <> correction_count then
    raise exception 'Every correction must reference an active, checked-in, non-pre-registered entry in this tournament' using errcode = '22023';
  end if;

  select count(*)::integer into duplicate_payouts
  from (
    select standing from public.tournament_payouts
    where tournament_id = p_tournament_id
    group by standing having count(*) > 1
  ) duplicates
  where tournament_type <> 'satellite' or duplicates.standing <> 1;
  if duplicate_payouts > 0 then
    raise exception 'Tournament payout rows have unsupported duplicate standings' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(to_jsonb(entry) order by entry.id), '[]'::jsonb) into before_entries
  from public.tournament_entries entry
  join jsonb_to_recordset(p_corrections) as correction(entry_id bigint, rank integer, total_buy_in_amount integer, bounty integer)
    on correction.entry_id = entry.id
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null;

  -- Match the legacy bulk-edit semantics: a supplied rank is an eliminated result and its sequence.
  update public.tournament_entries entry
  set rank = correction.rank,
      total_buy_in_amount = correction.total_buy_in_amount,
      bounty = correction.bounty,
      eliminated = true,
      elimination_sequence = correction.rank,
      updated_at = now()
  from jsonb_to_recordset(p_corrections) as correction(entry_id bigint, rank integer, total_buy_in_amount integer, bounty integer)
  where entry.id = correction.entry_id and entry.tournament_id = p_tournament_id and entry.deleted_at is null;
  get diagnostics changed_count = row_count;

  -- Preserve production's ability to correct imperfect historical layouts. Duplicate ranks are
  -- rejected, but gaps are allowed so an operator can repair them incrementally.
  select exists (
    select 1
    from public.tournament_entries entry
    where entry.tournament_id = p_tournament_id and entry.deleted_at is null
      and entry.checked_in = true and entry.pre_registered = false and entry.rank is not null
    group by entry.rank
    having (tournament_type <> 'satellite' and count(*) > 1)
      or (tournament_type = 'satellite' and entry.rank <> 1 and count(*) > 1)
  ) into invalid_rank_layout;
  if invalid_rank_layout then
    raise exception 'Ranks must be unique except for tied satellite rank 1' using errcode = '22023';
  end if;

  update public.tournament_entries entry
  set winnings = coalesce(round(payout.payout_amount)::integer, 0),
      score = round((case when tournament_type = 'freeroll'
        then coalesce(payout.payout_amount, 0) + coalesce(payout.points, 0) + participation_bonus
        else entry.total_buy_in_amount + coalesce(payout.payout_amount, 0)
      end) * multiplier)::integer,
      final_table = tournament_type <> 'satellite' and final_table_count > 0 and entry.rank between 1 and final_table_count,
      updated_at = now()
  from public.tournament_payouts payout
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null
    and entry.checked_in = true and entry.pre_registered = false and entry.rank = payout.standing;

  -- Unpaid ranks are legitimate in the production workflow and receive a zero payout/score basis.
  update public.tournament_entries entry
  set winnings = 0,
      score = round((case when tournament_type = 'freeroll' then participation_bonus else entry.total_buy_in_amount end) * multiplier)::integer,
      final_table = tournament_type <> 'satellite' and final_table_count > 0 and entry.rank between 1 and final_table_count,
      updated_at = now()
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null
    and entry.checked_in = true and entry.pre_registered = false and entry.rank is not null
    and not exists (select 1 from public.tournament_payouts payout where payout.tournament_id = p_tournament_id and payout.standing = entry.rank);

  update public.tournament_entries entry
  set final_table = false, updated_at = now()
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null
    and (not entry.checked_in or entry.pre_registered or entry.rank is null);

  select coalesce(jsonb_agg(to_jsonb(entry) order by entry.id), '[]'::jsonb) into after_entries
  from public.tournament_entries entry
  join jsonb_to_recordset(p_corrections) as correction(entry_id bigint, rank integer, total_buy_in_amount integer, bounty integer)
    on correction.entry_id = entry.id
  where entry.tournament_id = p_tournament_id and entry.deleted_at is null;

  insert into public.dpt_admin_audit_log (actor_auth_user_id, actor_profile_id, action, entity_type, entity_id, tournament_id, before_data, after_data)
  values (auth.uid(), actor_profile_id, 'tournament_entries.bulk_rank_correction', 'tournament', p_tournament_id::text, p_tournament_id,
    jsonb_build_object('entries', before_entries, 'count', correction_count),
    jsonb_build_object('entries', after_entries, 'count', changed_count, 'ranked_entries_recalculated', (select count(*) from public.tournament_entries where tournament_id = p_tournament_id and deleted_at is null and rank is not null)));

  return jsonb_build_object('tournament_id', p_tournament_id, 'corrected_count', changed_count, 'entries', after_entries);
end;
$$;

revoke all on function public.dpt_admin_bulk_correct_ranks(bigint, jsonb) from public, anon;
grant execute on function public.dpt_admin_bulk_correct_ranks(bigint, jsonb) to authenticated;

commit;
