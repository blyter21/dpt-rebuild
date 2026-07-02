-- DPT Rebuild Lab local seed data
-- Matches tournament-engine test fixture concepts. Dev/local only.

insert into public.tournament_types (id, code, name, config) values
  (1, 'dpt_standard', 'DPT Standard', '{"dealer_fee": true, "allow_rebuy": true, "minimum_buyin": true, "tournament_fee": true}'::jsonb),
  (2, 'satellite', 'Satellite', '{"dealer_fee": true, "allow_rebuy": true, "minimum_buyin": true, "tournament_fee": true}'::jsonb),
  (3, 'freeroll', 'Freeroll', '{"qualifier": true, "dealer_fee": false, "minimum_buyin": false, "participation_bonus_points": true}'::jsonb),
  (4, 'flight', 'Flight', '{"dealer_fee": false, "allow_rebuy": true, "minimum_buyin": true, "tournament_fee": true}'::jsonb)
on conflict (id) do update set code = excluded.code, name = excluded.name, config = excluded.config;

insert into public.profiles (id, first_name, last_name, email, alias) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alice', 'Aces', 'alice@example.test', 'alice-aces'),
  ('00000000-0000-0000-0000-0000000000b2', 'Bob', 'Bounty', 'bob@example.test', 'bob-bounty'),
  ('00000000-0000-0000-0000-0000000000c3', 'Cora', 'Chips', 'cora@example.test', 'cora-chips'),
  ('00000000-0000-0000-0000-0000000000d4', 'Drew', 'Dealer', 'drew@example.test', 'drew-dealer'),
  ('00000000-0000-0000-0000-0000000000e5', 'Evan', 'Edge', 'evan@example.test', 'evan-edge')
on conflict (id) do update set first_name = excluded.first_name, last_name = excluded.last_name, email = excluded.email, alias = excluded.alias;

insert into public.profile_roles (profile_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'player'),
  ('00000000-0000-0000-0000-0000000000b2', 'player'),
  ('00000000-0000-0000-0000-0000000000c3', 'player'),
  ('00000000-0000-0000-0000-0000000000d4', 'player'),
  ('00000000-0000-0000-0000-0000000000e5', 'player')
on conflict do nothing;

insert into public.leagues (id, name, alias, description) values
  (1, 'Dakota Poker Tour', 'dakota-poker-tour', 'Local rebuild lab seed league')
on conflict (id) do update set name = excluded.name, alias = excluded.alias, description = excluded.description;

insert into public.seasons (id, league_id, name, alias, is_default, start_at, end_at) values
  (1, 1, '2026 Test Season', '2026-test-season', true, '2026-01-01', '2026-12-31')
on conflict (id) do update set league_id = excluded.league_id, name = excluded.name, alias = excluded.alias, is_default = excluded.is_default;

insert into public.venues (id, name, alias, city, state) values
  (1, 'Test Poker Room', 'test-poker-room', 'Fargo', 'ND')
on conflict (id) do update set name = excluded.name, alias = excluded.alias, city = excluded.city, state = excluded.state;

insert into public.events (id, season_id, venue_id, name, alias, start_at, end_at, rules_description) values
  (1, 1, 1, 'DPT Engine Test Event', 'dpt-engine-test-event', '2026-02-01', '2026-02-03', 'Seed event for tournament-engine parity tests')
on conflict (id) do update set season_id = excluded.season_id, venue_id = excluded.venue_id, name = excluded.name, alias = excluded.alias;

insert into public.blind_structures (id, name, blind_info, blind_intervals, is_copy) values
  (1, 'Seed Blind Structure', '[{"level":1,"small":100,"big":200},{"level":2,"small":200,"big":400}]'::jsonb, 20, false)
on conflict (id) do update set name = excluded.name, blind_info = excluded.blind_info, blind_intervals = excluded.blind_intervals;

insert into public.tournaments (
  id, event_id, venue_id, tournament_type_id, main_tournament_id, blind_structure_id,
  name, alias, starts_at, ends_at, registration_starts_at, registration_ends_at,
  dealer_fee, tournament_fee_percent, minimum_buyin, allow_rebuy, rebuy_amount, rebuy_fee,
  rebuy_chips_count, initial_chips_count, players_at_final_table, points_multiplier_enabled,
  points_multiplier_value, participation_bonus_points, chip_carryover
) values
  (1, 1, 1, 1, null, 1, 'DPT Standard Seed', 'dpt-standard-seed', '2026-02-01 12:00Z', '2026-02-01 20:00Z', '2026-01-01', '2026-02-01 11:00Z', 10, 10, 150, true, 60, 10, 10000, 20000, 2, true, 2, 0, null),
  (2, 1, 1, 2, null, 1, 'Satellite Seed', 'satellite-seed', '2026-02-01 12:00Z', '2026-02-01 20:00Z', '2026-01-01', '2026-02-01 11:00Z', 10, 10, 150, true, 60, 10, 10000, 20000, null, false, null, 0, null),
  (3, 1, 1, 3, null, 1, 'Freeroll Seed', 'freeroll-seed', '2026-02-02 12:00Z', '2026-02-02 20:00Z', '2026-01-01', '2026-02-02 11:00Z', 0, 0, 0, false, 0, 0, 2000, 5000, 2, true, 2, 5, null),
  (4, 1, 1, 1, null, 1, 'Main Event Seed', 'main-event-seed', '2026-02-03 12:00Z', '2026-02-03 20:00Z', '2026-01-01', '2026-02-03 11:00Z', 0, 10, 0, true, 60, 10, 10000, 0, 2, false, null, 0, 'highest'),
  (5, 1, 1, 4, 4, 1, 'Flight A Seed', 'flight-a-seed', '2026-02-02 12:00Z', '2026-02-02 20:00Z', '2026-01-01', '2026-02-02 11:00Z', 0, 10, 150, true, 60, 10, 10000, 20000, 2, false, null, 0, null)
on conflict (id) do update set name = excluded.name, alias = excluded.alias, tournament_type_id = excluded.tournament_type_id, main_tournament_id = excluded.main_tournament_id;

insert into public.payout_templates (id, name, tournament_type_id, type) values
  (1, 'DPT Percent Seed', 1, 'dpt'),
  (2, 'Satellite Seed', 2, 'satellite'),
  (3, 'Freeroll Seed', 3, 'freeroll')
on conflict (id) do update set name = excluded.name, tournament_type_id = excluded.tournament_type_id, type = excluded.type;

insert into public.payout_template_rows (id, payout_template_id, player_count_start, player_count_end, winners_count, standing, payout_percentage, payout_amount, prize_description, points) values
  (1, 1, 1, 100, 3, 1, 50, null, null, null),
  (2, 1, 1, 100, 3, 2, 30, null, null, null),
  (3, 1, 1, 100, 3, 3, 20, null, null, null),
  (4, 2, 1, 100, 3, 1, 100, 100, null, null),
  (5, 2, 1, 100, 3, 2, 100, 25, 'Remainder', null),
  (6, 3, 1, 100, 2, 1, null, 100, 'Seat', 50),
  (7, 3, 1, 100, 2, 2, null, 0, 'Points only', 25)
on conflict (id) do update set payout_template_id = excluded.payout_template_id, standing = excluded.standing, payout_percentage = excluded.payout_percentage, payout_amount = excluded.payout_amount, prize_description = excluded.prize_description, points = excluded.points;

insert into public.tournament_entries (
  id, tournament_id, player_id, pre_registered, checked_in, initial_buyin, initial_chips_count,
  total_buy_in_amount, no_of_addons_buy, total_addon_chips, total_chips, rank,
  winnings, score, bounty, eliminated, elimination_sequence, final_table, qualified_flight_player
) values
  (1, 1, '00000000-0000-0000-0000-0000000000a1', false, true, 140, 20000, 300, 2, 20000, 40000, 1, 500, 1600, 25, true, 1, true, false),
  (2, 1, '00000000-0000-0000-0000-0000000000b2', false, true, 140, 20000, 200, 1, 10000, 30000, 2, 250, 900, 10, true, 2, true, false),
  (3, 1, '00000000-0000-0000-0000-0000000000c3', false, true, 100, 20000, 100, 0, 0, 20000, null, 0, 100, 0, false, null, false, false),
  (4, 2, '00000000-0000-0000-0000-0000000000a1', false, true, 100, 20000, 100, 0, 0, 20000, null, null, null, 0, false, null, false, false),
  (5, 2, '00000000-0000-0000-0000-0000000000b2', false, true, 100, 20000, 100, 0, 0, 20000, 2, 25, 125, 0, true, 1, false, false),
  (6, 3, '00000000-0000-0000-0000-0000000000e5', false, true, 0, 5000, 0, 0, 0, 5000, 1, 100, 310, 0, true, 1, true, false),
  (7, 5, '00000000-0000-0000-0000-0000000000a1', false, true, 140, 20000, 140, 1, 10000, 30000, 1, 0, 140, 0, true, 1, false, true)
on conflict (id) do update set rank = excluded.rank, winnings = excluded.winnings, score = excluded.score, eliminated = excluded.eliminated, total_chips = excluded.total_chips;

insert into public.flight_advancements (flight_tournament_id, main_tournament_id, player_id, chips_advanced, mode_snapshot, advanced_at) values
  (5, 4, '00000000-0000-0000-0000-0000000000a1', 30000, 'highest', '2026-02-02 20:00Z')
on conflict do nothing;
