# Loop 081 — Faithful Admin Authentication Foundation

## Status

COMPLETED locally. Supabase staging connection remains pending.

## Legacy behavior verified

```text
Public `/login`: phone plus SMS OTP
Backend `/admin-login`: email plus password
Admin authorization middleware: authenticated session, verified account, and `can:view_admin`
Authorized roles: super admin, administrator, host, venue
```

## Production role inventory

```text
16 unique admin-capable users
14 with email
13 with password hash
2,582 regular user-role assignments without view_admin
```

No identities, emails, passwords, hashes, OTPs, or tokens were printed or committed.

## Implemented

```text
apps/site/middleware.ts
apps/site/lib/supabase-http.ts
apps/site/lib/dpt-admin-auth.ts
apps/site/app/admin/login/page.tsx
apps/site/app/admin/(protected)/layout.tsx
apps/site/app/api/admin/auth/login/route.ts
apps/site/app/api/admin/auth/logout/route.ts
supabase/migrations/20260712033000_dpt_admin_auth.sql
```

Existing integrated admin routes were moved under the protected route group while preserving their URLs.

## Fail-closed behavior

Without Supabase staging env:

```text
GET / -> 200
GET /admin -> 307 /admin/login?next=%2Fadmin
GET /admin/events -> 307 /admin/login?next=%2Fadmin%2Fevents
GET /admin/login -> 200 locked login screen
```

Unauthorized redirect bodies contain no dashboard strings, production counts, or admin records. Middleware blocks before route rendering.

## Verification

```text
Typecheck: passed
Tests: 11 passed
Production build: passed
Middleware bundle: 26.7 kB
Browser JS errors: 0
Login screen: locked; visible email/password controls disabled without Supabase config
Admin dashboard data visible while unauthenticated: no
Unauthorized redirect response contains admin data: no
```

Final build includes dynamic `/admin`, `/admin/login`, all integrated admin modules, login/logout API routes, and pre-render middleware.

## Deployment

Not pushed or deployed. Current Vercel public preview is unchanged.
