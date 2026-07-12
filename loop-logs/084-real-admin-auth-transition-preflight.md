# Loop 084 — Real Admin Auth Transition Preflight

Date: 2026-07-12

## Result

Resumed the DPT rebuild on GPT-5.6 Sol, reconciled the checkpoint with the actual live Supabase-backed deployment, and added executable behavior tests for the future switch from read-only review mode to real Supabase-authenticated admin access.

## Live state reconfirmed

- Current model: `gpt-5.6-sol`.
- Public preview: https://dpt-rebuild-site.vercel.app
- Live admin preview: https://dpt-rebuild-site.vercel.app/admin
- `GET /api/dpt/staging-health` returned:
  - `ok: true`
  - `activeRepositoryMode: supabase`
  - events: 60
  - tournaments: 80
  - venues: 77
  - articles: 80
  - players: 25
- `/admin`, `/admin/events`, `/admin/tournaments`, `/admin/venues`, `/admin/articles`, and `/admin/login` each returned HTTP 200 in the intentional read-only review mode.
- GitHub remote `main` remains at pushed commit `d9455446056681b5767db442911c63b71ae71bcb`; local checkpoint commit `e11abd3` is not pushed.

## Access inspection

- Supabase CLI is usable through `npx supabase`; version `2.109.1` was verified.
- This Hermes Linux user has no `SUPABASE_ACCESS_TOKEN`, and `supabase projects list` correctly stopped without exposing or requesting credentials.
- The browser is signed out of the Supabase dashboard.
- Vercel CLI is also signed out.
- Pedro's team invitation was already accepted according to the owner-confirmed checkpoint. Do not send Brook through invite setup again.

## Auth transition test coverage added

Created:

```text
apps/site/tests/admin-auth.test.ts
```

The nine tests exercise actual Next request/response behavior for:

1. Missing Supabase configuration fails closed.
2. Invalid Supabase credentials issue no cookies.
3. Authenticated but unauthorized users issue no cookies.
4. Authorized users receive HTTP-only, same-site access/refresh cookies.
5. External post-login redirect targets are rejected.
6. Explicit read-only review mode bypasses Supabase without network calls.
7. Real-auth mode with no access cookie redirects to login.
8. Valid user plus active DPT admin authorization passes middleware.
9. Missing/inactive DPT admin authorization redirects to login.

Also corrected `DptAdminAccount.legacy_user_id` to `number | null`, matching the staging migration that permits Supabase-only service/admin accounts without a Laravel legacy ID.

Targeted auth test result:

```text
Test Files  1 passed (1)
Tests       9 passed (9)
```

Full `apps/site` verification result:

```text
Vitest: 3 files passed, 21 tests passed
TypeScript: tsc --noEmit passed
Next.js production build: compiled successfully; 20 pages generated; admin routes and auth endpoints are dynamic
```

## Safety boundary

No Supabase, Vercel, production Laravel/AWS, or database mutation was performed. No credentials, passwords, OTPs, tokens, or private auth rows were requested or exposed.

## Remaining staging boundary

Temporarily set `DPT_ADMIN_REVIEW_MODE=disabled` in an authenticated Vercel owner session, verify Pedro's real Supabase login and `dpt_admin_accounts` authorization, then decide whether to leave real auth enabled or restore review mode. Do not ask Brook to paste credentials into chat.
