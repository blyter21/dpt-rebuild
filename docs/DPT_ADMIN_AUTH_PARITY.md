# DPT Admin Authentication Parity

## Legacy production behavior

Source inspected:

```text
/home/hermes/projects/dpt-web/src/routes/auth.php
/home/hermes/projects/dpt-web/src/routes/web.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Auth/AuthenticatedSessionController.php
/home/hermes/projects/dpt-web/src/app/Http/Requests/Auth/LoginRequest.php
/home/hermes/projects/dpt-web/src/app/Http/Controllers/Auth/AuthenticatedMobileSessionController.php
```

The production application has two distinct login flows:

| Audience | Legacy route | Method |
|---|---|---|
| Public players/users | `/login` | Phone number + SMS OTP |
| Backend administration | `/admin-login` | Email + password |

Production admin routes are grouped under `/admin` and require:

```text
auth
verified
can:view_admin
```

Production `view_admin` permission roles:

```text
super admin
administrator
host
venue
```

The regular `user` role does not have `view_admin`.

## Production SQL authorization inventory

No identities or credentials are included in this document.

```text
unique admin-capable users: 16
super admin assignments: 9
administrator assignments: 6
host assignments: 6
venue assignments: 3
regular user assignments: 2,582
admin-capable users with email: 14
admin-capable users with password hash: 13
all admin-capable users active: yes
```

Some people hold multiple roles, so role-assignment totals exceed unique admin-user count.

## Replacement implementation

The integrated Next.js application uses:

```text
/admin/login
/api/admin/auth/login
/api/admin/auth/logout
/admin/** protected route group
apps/site/middleware.ts pre-render authorization gate
apps/site/lib/dpt-admin-auth.ts server-side session/role verification
```

Authentication contract:

1. Email/password is sent server-side to Supabase Auth.
2. Supabase access/refresh tokens are stored only in HttpOnly cookies.
3. Middleware validates the Supabase user before rendering `/admin`.
4. Middleware and protected layout query `dpt_admin_accounts` for active `can_view_admin` authorization.
5. Non-admin or unauthenticated requests redirect to `/admin/login` before any admin data renders.
6. Login remains disabled/fail-closed when Supabase staging is not configured.

## Supabase authorization migration

```text
supabase/migrations/20260712033000_dpt_admin_auth.sql
```

It creates:

```text
public.dpt_admin_accounts
public.dpt_current_user_can_view_admin()
RLS policy allowing an authenticated admin to read only their own active authorization row
```

No service-role key is used by the browser/web login flow.

## Pre-production security gate

The current Supabase project is a sandbox/staging environment. Password rotation is not a blocker for staging development. Before any production launch or traffic cutover:

```text
rotate every staging/admin password and credential
revoke temporary credentials
verify only intended production administrators remain active
rerun Supabase Security Advisor
complete authenticated and non-admin access tests
```

No current password or credential value is stored in this document or repository.

## Current status

```text
Auth/authorization code: implemented
Fail-closed behavior: verified
Supabase staging: not connected
Admin users imported into Supabase Auth: not yet
Live login verification: blocked until staging exists
```

## Next implementation step

Create/connect Supabase staging, run the admin auth migration, securely import/map the existing authorized admin accounts, and verify one owner-controlled admin login. Do not request or transmit passwords/OTP codes through chat.
