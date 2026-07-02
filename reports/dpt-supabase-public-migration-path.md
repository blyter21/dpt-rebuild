# DPT Supabase Public Migration Path

## Scope

This is the first local-only Supabase migration path for the public Dakota Poker Tour replacement app.

No production service was touched:

```text
No Supabase project linked
No cloud database writes
No Vercel deploy
No AWS/Laravel mutation
```

## New schema/migration

```text
supabase/migrations/20260701171500_dpt_public_schema.sql
```

Public tables:

```text
dpt_public_venues
dpt_public_events
dpt_public_tournaments
dpt_public_articles
dpt_public_players
dpt_public_leaderboard_entries
dpt_public_champions
dpt_public_videos
dpt_media_assets
```

Public views:

```text
dpt_public_event_cards
dpt_public_tournament_details
dpt_public_homepage
```

RLS:

```text
RLS enabled on all public DPT tables
read-only public select policies created for public content
```

## Seed generator

```text
scripts/build_dpt_supabase_seed.py
```

Input:

```text
apps/site/data/dpt-public.json
apps/site/data/dpt-media-manifest.json
```

Output:

```text
supabase/seed/dpt_public_seed.sql
```

Generated counts:

| Dataset | Rows |
|---|---:|
| venues | 77 |
| events | 60 |
| tournaments | 80 |
| articles | 80 |
| players | 25 |
| leaderboard | 25 |
| champions | 40 |
| videos | 2 |
| media assets | 328 |

## Repository/data access layer

```text
apps/site/lib/dpt-repository.ts
```

The app now routes public page data through:

```ts
getDptRepository()
```

Current implementation:

```text
localDptRepository reads SQL-derived JSON files locally
```

Future Supabase implementation should keep the same interface and replace internals with Supabase reads from:

```text
dpt_public_homepage
dpt_public_event_cards
dpt_public_tournament_details
dpt_public_articles
dpt_public_venues
dpt_public_leaderboard_entries
dpt_public_champions
dpt_public_videos
dpt_media_assets
```

## Pages switched to repository access

```text
/
/events
/events/[alias]
/tournaments/[alias]
/news
/leaderboard
/venues
/champions
/players
```

`/videos` still uses `videoArticles()` from `dpt-data.ts` because that helper normalizes seeded video rows and possible future article-embedded YouTube URLs.

## Verification

```text
npm run dpt:seed:public
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
repository-backed route smoke checks
browser DOM/media check
npx supabase --version
```

Actual results:

```text
Supabase CLI: 2.108.0
Seed generation: passed
Site tests: 1 file / 8 tests passed
Typecheck: passed
Build: passed
Route smoke checks: 11 passed
Browser local media: 33 local images, 0 remote storage images
```

## Local DB validation note

Supabase CLI is installed, but Docker/psql are not available in this environment, so I did not start a local Supabase database or execute migrations. SQL was validated by generation/text checks plus app build/tests against the repository layer.

## Next step

When Docker/local Supabase is available:

```bash
npx supabase start
npx supabase db reset
```

Then verify:

```sql
select jsonb_array_length(payload->'events') from public.dpt_public_homepage;
select count(*) from public.dpt_public_events;
select count(*) from public.dpt_media_assets where downloaded = true;
```
