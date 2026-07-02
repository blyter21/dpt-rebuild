# DPT Source Modes

The public replacement site can run from either local generated data or Supabase/PostgREST.

## Default: JSON/local fallback

```text
DPT_DATA_SOURCE=json
```

This is the safe default.

It uses:

```text
apps/site/data/dpt-public.json
apps/site/data/dpt-media-manifest.json
apps/site/public/media/dpt/**
```

Use this mode for:

```text
local visual QA
public replacement demo
CI build/test without credentials
safe work while cloud credentials are unavailable
```

## Supabase mode

```text
DPT_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

This uses `SupabaseDptRepository`, which currently reads Supabase/PostgREST via built-in `fetch`.

If `DPT_DATA_SOURCE=supabase` is set but URL/key are missing, `getDptRepository()` falls back to the JSON repository so the local demo does not break.

## Required Supabase objects

Tables:

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

Views:

```text
dpt_public_event_cards
dpt_public_tournament_details
dpt_public_homepage
```

## Safety rules

```text
Do not add service-role keys to app env files.
Do not connect production Supabase credentials without explicit approval.
Do not deploy to Vercel until readiness checks pass.
Do not mutate Laravel/AWS production from this repo.
```

## Media URL mode

By default media renders from local public files:

```text
/media/dpt/...
```

After assets are copied to Supabase Storage or a CDN, set:

```text
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.com/dpt-public-media
```

Then `publicMediaUrl()` rewrites local `/media/dpt/...` paths to the configured base URL while keeping local paths as fallback when the variable is blank.

## Verification commands

```bash
npm run dpt:verify:public
```

Media storage plan only:

```bash
npm run dpt:media:storage-plan
```

Optional route smoke once local dev is already running:

```bash
DPT_VERIFY_HTTP_URL=http://127.0.0.1:3001 npm run dpt:verify:public
```
