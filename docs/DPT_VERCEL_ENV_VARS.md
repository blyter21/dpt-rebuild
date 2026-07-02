# DPT Vercel Environment Variables

## Preview mode 1: JSON fallback / no Supabase

Use this for the first safe preview.

| Variable | Value | Notes |
|---|---|---|
| `DPT_DATA_SOURCE` | `json` | Safe default. Uses generated JSON and local copied media. |
| `NEXT_PUBLIC_DPT_MEDIA_BASE_URL` | blank | Keeps `/media/dpt/...` local static asset paths. |

## Preview mode 2: Supabase public-read mode

Only use after Supabase schema/seed/RLS are verified.

| Variable | Value | Notes |
|---|---|---|
| `DPT_DATA_SOURCE` | `supabase` | Explicit opt-in. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Use staging/preview first. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Public read-only key. |
| `NEXT_PUBLIC_DPT_MEDIA_BASE_URL` | CDN/Supabase public media base | Only after media uploaded/verified. |

Optional server aliases if later needed:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

## Never use in public Vercel env

```text
SUPABASE_SERVICE_ROLE_KEY
AWS_SECRET_ACCESS_KEY
production database passwords
Laravel APP_KEY
private SMS/email provider secrets
```

## Expected fallback behavior

If `DPT_DATA_SOURCE=supabase` but Supabase URL/key are missing, the app falls back to the JSON repository so previews do not break accidentally.

## Verification

Run before changing Vercel env:

```bash
npm run dpt:verify:public
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.test/dpt-public-media npm --workspace apps/site run typecheck
```
