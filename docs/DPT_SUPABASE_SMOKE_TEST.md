# DPT Supabase Smoke-Test Checklist

Use this when Docker/local Supabase or cloud Supabase credentials are available. Do not run cloud tests against production without explicit approval.

## Local Docker-backed Supabase path

Prerequisites:

```bash
docker --version
npx supabase --version
```

Start local Supabase:

```bash
npx supabase start
```

Apply schema/seed:

```bash
npx supabase db reset
# or manually execute:
# supabase/migrations/20260701171500_dpt_public_schema.sql
# supabase/seed/dpt_public_seed.sql
```

Validate row counts:

```sql
select count(*) from public.dpt_public_venues; -- 77
select count(*) from public.dpt_public_events; -- 60
select count(*) from public.dpt_public_tournaments; -- 80
select count(*) from public.dpt_public_articles; -- 80
select count(*) from public.dpt_public_players; -- 25
select count(*) from public.dpt_public_leaderboard_entries; -- 25
select count(*) from public.dpt_public_champions; -- 40
select count(*) from public.dpt_public_videos; -- 2
select count(*) from public.dpt_media_assets; -- 328
```

Validate homepage view:

```sql
select
  jsonb_array_length(payload->'events') as events,
  jsonb_array_length(payload->'leaderboard') as leaderboard,
  jsonb_array_length(payload->'articles') as articles,
  jsonb_array_length(payload->'venues') as venues,
  jsonb_array_length(payload->'champions') as champions,
  jsonb_array_length(payload->'videos') as videos
from public.dpt_public_homepage;
```

Expected:

```text
events=60
leaderboard=25
articles=80
venues=77
champions=40
videos=2
```

## RLS / anon read behavior

The migration enables RLS and creates public read policies. Verify with anon/public access in real Supabase:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/dpt_public_events?select=legacy_id,alias,name&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Expected:

```text
HTTP 200 with one public event row
```

Also verify public views:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/dpt_public_event_cards?select=*&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

## App Supabase source-mode smoke

With local Supabase env loaded:

```bash
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck
DPT_DATA_SOURCE=supabase npm --workspace apps/site run build
```

Run local dev in Supabase mode:

```bash
DPT_DATA_SOURCE=supabase npm --workspace apps/site run dev -- --hostname 0.0.0.0
```

Then smoke routes:

```bash
DPT_VERIFY_HTTP_URL=http://127.0.0.1:3001 npm run dpt:verify:public
```

## Production safety

Before using a hosted project:

```text
Use preview/staging Supabase first.
Use anon key only for the public site.
Never use service-role key in Next public env.
Confirm RLS read policies before connecting Vercel preview.
Confirm media paths are moved to final storage/CDN.
```
