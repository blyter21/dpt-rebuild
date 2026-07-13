begin;

alter table public.dpt_public_players
  add column if not exists alias text;

create unique index if not exists dpt_public_players_alias_unique
  on public.dpt_public_players (alias)
  where alias is not null and alias <> '';

commit;
