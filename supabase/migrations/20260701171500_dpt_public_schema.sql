-- DPT public replacement schema draft for Supabase/Postgres.
-- Local-only migration design. Do not run against production without review.

create table if not exists public.dpt_public_venues (
  legacy_id bigint primary key,
  alias text unique,
  name text not null,
  city text,
  state text,
  address text,
  image_url text,
  local_image_path text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_events (
  legacy_id bigint primary key,
  alias text unique not null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  venue_legacy_id bigint references public.dpt_public_venues(legacy_id),
  image_url text,
  local_image_path text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_tournaments (
  legacy_id bigint primary key,
  alias text unique not null,
  event_alias text,
  name text not null,
  short_description text,
  start_date date,
  end_date date,
  venue_legacy_id bigint references public.dpt_public_venues(legacy_id),
  minimum_buy_in numeric,
  total_players integer,
  total_prize_pool numeric,
  image_url text,
  local_image_path text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_articles (
  legacy_id bigint primary key,
  alias text unique,
  title text not null,
  excerpt text,
  published_at timestamptz,
  event_alias text,
  tournament_alias text,
  image_url text,
  local_image_path text,
  video_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_players (
  legacy_id bigint primary key,
  display_name text not null,
  city text,
  state text,
  avatar_url text,
  local_avatar_path text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_leaderboard_entries (
  rank integer primary key,
  player_legacy_id bigint references public.dpt_public_players(legacy_id),
  display_name text not null,
  points integer not null default 0,
  wins integer not null default 0,
  cashes integer not null default 0,
  city text,
  state text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.dpt_public_champions (
  id bigserial primary key,
  tournament_alias text,
  tournament_name text not null,
  player_name text not null,
  finish integer,
  winnings numeric,
  result_date date,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.dpt_public_videos (
  id text primary key,
  title text not null,
  video_url text not null,
  embed_url text,
  thumbnail_url text,
  local_thumbnail_path text,
  source text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.dpt_media_assets (
  source_url text primary key,
  asset_type text not null,
  filename text not null,
  suggested_public_path text,
  local_public_path text,
  status integer,
  content_type text,
  content_length bigint,
  downloaded boolean not null default false,
  asset_references jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists dpt_public_events_start_idx on public.dpt_public_events(start_date desc);
create index if not exists dpt_public_tournaments_event_idx on public.dpt_public_tournaments(event_alias);
create index if not exists dpt_public_articles_published_idx on public.dpt_public_articles(published_at desc);
create index if not exists dpt_public_articles_tournament_idx on public.dpt_public_articles(tournament_alias);
create index if not exists dpt_public_media_type_idx on public.dpt_media_assets(asset_type, downloaded);

create or replace view public.dpt_public_event_cards as
select
  e.legacy_id as id,
  e.alias,
  e.name,
  e.description,
  e.start_date,
  e.end_date,
  jsonb_build_object(
    'id', v.legacy_id,
    'alias', v.alias,
    'name', v.name,
    'city', v.city,
    'state', v.state,
    'imageUrl', v.image_url,
    'localImagePath', v.local_image_path
  ) as venue,
  e.image_url,
  e.local_image_path
from public.dpt_public_events e
left join public.dpt_public_venues v on v.legacy_id = e.venue_legacy_id;

create or replace view public.dpt_public_tournament_details as
select
  t.*,
  jsonb_build_object('alias', e.alias, 'name', e.name) as event,
  jsonb_build_object('id', v.legacy_id, 'alias', v.alias, 'name', v.name, 'city', v.city, 'state', v.state) as venue
from public.dpt_public_tournaments t
left join public.dpt_public_events e on e.alias = t.event_alias
left join public.dpt_public_venues v on v.legacy_id = t.venue_legacy_id;

create or replace view public.dpt_public_homepage as
select jsonb_build_object(
  'events', (select jsonb_agg(to_jsonb(x) order by x.start_date desc nulls last) from (select * from public.dpt_public_event_cards limit 60) x),
  'leaderboard', (select jsonb_agg(to_jsonb(l) order by l.rank) from public.dpt_public_leaderboard_entries l),
  'articles', (select jsonb_agg(to_jsonb(a) order by a.published_at desc nulls last) from (select * from public.dpt_public_articles limit 80) a),
  'venues', (select jsonb_agg(to_jsonb(v) order by v.name) from public.dpt_public_venues v),
  'champions', (select jsonb_agg(to_jsonb(c) order by c.result_date desc nulls last) from public.dpt_public_champions c),
  'videos', (select jsonb_agg(to_jsonb(v) order by v.created_at) from public.dpt_public_videos v)
) as payload;

alter table public.dpt_public_venues enable row level security;
alter table public.dpt_public_events enable row level security;
alter table public.dpt_public_tournaments enable row level security;
alter table public.dpt_public_articles enable row level security;
alter table public.dpt_public_players enable row level security;
alter table public.dpt_public_leaderboard_entries enable row level security;
alter table public.dpt_public_champions enable row level security;
alter table public.dpt_public_videos enable row level security;
alter table public.dpt_media_assets enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read venues') then
    create policy "dpt public read venues" on public.dpt_public_venues for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read events') then
    create policy "dpt public read events" on public.dpt_public_events for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read tournaments') then
    create policy "dpt public read tournaments" on public.dpt_public_tournaments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read articles') then
    create policy "dpt public read articles" on public.dpt_public_articles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read players') then
    create policy "dpt public read players" on public.dpt_public_players for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read leaderboard') then
    create policy "dpt public read leaderboard" on public.dpt_public_leaderboard_entries for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read champions') then
    create policy "dpt public read champions" on public.dpt_public_champions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read videos') then
    create policy "dpt public read videos" on public.dpt_public_videos for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'dpt public read media') then
    create policy "dpt public read media" on public.dpt_media_assets for select using (true);
  end if;
end $$;

grant select on table
  public.dpt_public_venues,
  public.dpt_public_events,
  public.dpt_public_tournaments,
  public.dpt_public_articles,
  public.dpt_public_players,
  public.dpt_public_leaderboard_entries,
  public.dpt_public_champions,
  public.dpt_public_videos,
  public.dpt_media_assets,
  public.dpt_public_event_cards,
  public.dpt_public_tournament_details,
  public.dpt_public_homepage
to anon, authenticated;
