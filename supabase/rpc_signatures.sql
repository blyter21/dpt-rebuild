-- DPT RPC signature stubs
-- Draft only. These stubs intentionally raise exceptions so they cannot be mistaken for working implementation.

create or replace function public.dpt_pre_register_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_submitted_initial_buyin integer,
  p_include_addons boolean default false,
  p_total_addon_buyin integer default 0,
  p_no_of_addons integer default 0
) returns public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_pre_register_player is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_check_in_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_submitted_initial_buyin integer,
  p_initial_chips_count integer,
  p_include_addons boolean default false,
  p_total_addon_buyin integer default 0,
  p_no_of_addons integer default 0,
  p_checked_in_by uuid default auth.uid()
) returns public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_check_in_player is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_add_tournament_addon(
  p_tournament_entry_id bigint,
  p_addon_buy_in_amount integer,
  p_addon_count integer,
  p_created_by uuid default auth.uid()
) returns public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_add_tournament_addon is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_set_registration_closed(
  p_tournament_id bigint,
  p_closed boolean,
  p_actor uuid default auth.uid()
) returns public.tournaments
language plpgsql
as $$
begin
  raise exception 'dpt_set_registration_closed is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_materialize_tournament_payouts(
  p_tournament_id bigint,
  p_payout_template_id bigint,
  p_total_distribution_amount integer default null
) returns setof public.tournament_payouts
language plpgsql
as $$
begin
  raise exception 'dpt_materialize_tournament_payouts is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_eliminate_player(
  p_tournament_id bigint,
  p_player_id uuid,
  p_actor uuid default auth.uid()
) returns public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_eliminate_player is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_undo_player_stat(
  p_tournament_id bigint,
  p_player_id uuid,
  p_actor uuid default auth.uid()
) returns public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_undo_player_stat is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_recalculate_manual_ranks(
  p_tournament_id bigint,
  p_rank_edits jsonb,
  p_actor uuid default auth.uid()
) returns setof public.tournament_entries
language plpgsql
as $$
begin
  raise exception 'dpt_recalculate_manual_ranks is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_advance_flight_players(
  p_flight_tournament_id bigint,
  p_actor uuid default auth.uid()
) returns jsonb
language plpgsql
as $$
begin
  raise exception 'dpt_advance_flight_players is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_undo_flight_advancement(
  p_flight_tournament_id bigint,
  p_actor uuid default auth.uid()
) returns jsonb
language plpgsql
as $$
begin
  raise exception 'dpt_undo_flight_advancement is a draft stub and is not implemented';
end;
$$;

create or replace function public.dpt_get_toc_qualifiers(
  p_tournament_id bigint
) returns table (
  tournament_id bigint,
  player_id uuid,
  rank integer,
  tournament_type public.tournament_type_code,
  tournament_end_at timestamptz
)
language plpgsql
as $$
begin
  raise exception 'dpt_get_toc_qualifiers is a draft stub and is not implemented';
end;
$$;
