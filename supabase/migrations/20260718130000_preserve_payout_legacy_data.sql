begin;

alter table public.payout_templates
  add column if not exists legacy_data jsonb not null default '{}'::jsonb;

alter table public.payout_template_rows
  alter column payout_amount type numeric using payout_amount::numeric,
  add column if not exists legacy_data jsonb not null default '{}'::jsonb;

alter table public.tournament_payouts
  alter column payout_amount type numeric using payout_amount::numeric,
  add column if not exists legacy_data jsonb not null default '{}'::jsonb;

commit;
