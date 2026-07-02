-- 03 — Supabase Schema Draft
-- Draft only. Do not run against production.

create type tournament_type_code as enum ('dpt_standard', 'satellite', 'freeroll', 'flight');
create type chip_carryover_mode as enum ('highest', 'sum');

create table profiles (
  id uuid primary key,
  first_name text,
  last_name text,
  nick_name text,
  email text,
  mobile text,
  country_code text,
  alias text unique,
  avatar_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leagues (
  id bigint generated always as identity primary key,
  name text not null,
  alias text unique,
  description text,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table seasons (
  id bigint generated always as identity primary key,
  league_id bigint references leagues(id),
  name text not null,
  alias text unique,
  description text,
  is_default boolean default false,
  start_at timestamptz,
  end_at timestamptz,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table venues (
  id bigint generated always as identity primary key,
  name text not null,
  alias text unique,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  website text,
  latitude numeric,
  longitude numeric,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table events (
  id bigint generated always as identity primary key,
  season_id bigint references seasons(id),
  venue_id bigint references venues(id),
  name text not null,
  alias text unique,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  status boolean default true,
  rules_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table tournament_types (
  id bigint generated always as identity primary key,
  code tournament_type_code not null unique,
  name text not null,
  config jsonb default '{}'::jsonb
);

create table blind_structures (
  id bigint generated always as identity primary key,
  name text not null,
  blind_info jsonb not null default '[]'::jsonb,
  blind_intervals integer,
  is_copy boolean default false,
  status boolean default true,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table tournaments (
  id bigint generated always as identity primary key,
  event_id bigint references events(id),
  venue_id bigint references venues(id),
  tournament_type_id bigint references tournament_types(id),
  main_tournament_id bigint references tournaments(id),
  blind_structure_id bigint references blind_structures(id),
  name text not null,
  alias text unique,
  short_description text,
  long_description text,
  rules_description text,
  starts_at timestamptz,
  ends_at timestamptz,
  registration_starts_at timestamptz,
  registration_ends_at timestamptz,
  registration_closed boolean default false,
  dealer_fee integer default 0,
  tournament_fee_percent numeric default 0,
  minimum_buyin integer default 0,
  maximum_buyin integer,
  allow_rebuy boolean default false,
  rebuy_amount integer default 0,
  rebuy_fee integer default 0,
  rebuy_chips_count integer default 0,
  initial_chips_count integer default 0,
  players_at_final_table integer,
  points_multiplier_enabled boolean default false,
  points_multiplier_value numeric,
  participation_bonus_points integer default 0,
  chip_carryover chip_carryover_mode,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table tournament_entries (
  id bigint generated always as identity primary key,
  tournament_id bigint not null references tournaments(id),
  player_id uuid not null references profiles(id),
  pre_registered boolean default false,
  checked_in boolean default false,
  initial_buyin integer default 0,
  initial_chips_count integer default 0,
  total_buy_in_amount integer default 0,
  no_of_addons_buy integer default 0,
  total_addon_chips integer default 0,
  total_chips integer default 0,
  rank integer,
  winnings integer default 0,
  score integer,
  bounty integer default 0,
  eliminated boolean default false,
  elimination_sequence integer,
  final_table boolean default false,
  duplicate_status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(tournament_id, player_id)
);

create table tournament_entry_addons (
  id bigint generated always as identity primary key,
  tournament_entry_id bigint not null references tournament_entries(id),
  addon_buy_in_amount integer default 0,
  addon_chips_count integer default 0,
  addon_count integer default 1,
  created_at timestamptz default now()
);

create table flight_advancements (
  id bigint generated always as identity primary key,
  flight_tournament_id bigint not null references tournaments(id),
  main_tournament_id bigint not null references tournaments(id),
  player_id uuid not null references profiles(id),
  chips_advanced integer not null,
  mode_snapshot chip_carryover_mode not null,
  advanced_at timestamptz default now(),
  undone_at timestamptz
);
