# DPT Integrated Product Direction

## Authoritative decision

The Dakota Poker Tour rebuild is one replacement product:

```text
apps/site
```

It must contain both:

```text
Public site routes
Authenticated admin routes under /admin
```

It will be deployed as one Vercel project.

## Product objective

Faithfully rebuild and take over the current live DakotaPokerTour.com Laravel/AWS platform on:

```text
Next.js / React
Vercel
Supabase Postgres
Supabase Auth
Supabase Storage or approved CDN
```

## Source of truth

```text
Live production public site
Authenticated production admin workflows
Production SQL-derived schema and records
Production media/content
Legacy Laravel business rules
```

## Data policy

Mock data is not an acceptable product path. Temporary prototypes may be used only to learn UI/workflow behavior, then must be replaced with production-derived data and real staging backend operations.

## Admin architecture

Target:

```text
apps/site/app/admin
apps/site/app/admin/**
```

Admin must share the same application, repository/domain layer, deployment, and Supabase backend as the public site.

Hard security requirement:

```text
No /admin route is anonymously accessible.
Every admin request requires an authenticated session.
Only users with an authorized admin role may access admin routes or admin APIs.
Unauthenticated users are redirected to the login flow.
Authenticated non-admin users receive no admin access.
Do not deploy an unprotected admin preview, even if it is read-only.
```

Expected capabilities eventually include:

```text
Supabase Auth login
role/permission enforcement
real event/tournament CRUD
player records and registration
venue/article/live-update management
tournament desk operations
payouts/eliminations/flights/results
notifications with explicit provider/cost approval
reports/audit history
```

## Historical simulator

```text
apps/admin
```

Status:

```text
Reference/prototype only
Do not deploy as the target admin
Do not continue mock-data feature development as product work
Reuse only validated workflow knowledge/components/domain rules
```

## Migration approach

1. Create a real Supabase staging project.
2. Execute and validate production-derived schema/seed in staging.
3. Add Supabase Auth and admin role foundation.
4. Build read-only `/admin` production-data views inside `apps/site`.
5. Add real mutations module-by-module with RLS, transactions, audit logs, and tests.
6. Compare public/admin parity against production.
7. Plan controlled cutover only after owner acceptance and data reconciliation.

## Immediate next loop

```text
Build the integrated real-admin foundation inside apps/site: create /admin routes and shared admin layout, connect them to the production-derived repository/Supabase staging contract, and implement read-only dashboard/events/tournaments/players/venues/articles views without mock data or production mutations.
```
