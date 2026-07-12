# Loop 080 — Integrated Real-Data Admin Foundation

## Status

COMPLETED locally and verified.

## Goal

Build the first real `/admin` foundation inside the existing `apps/site` Next.js/Vercel project using production-derived data from `prod_dakotapokertour.sql`. Do not use the historical mock simulator or expose private/auth rows.

## Added

```text
apps/site/lib/dpt-admin-repository.ts
apps/site/components/admin.tsx
apps/site/app/admin/layout.tsx
apps/site/app/admin/page.tsx
apps/site/app/admin/events/page.tsx
apps/site/app/admin/tournaments/page.tsx
apps/site/app/admin/venues/page.tsx
apps/site/app/admin/articles/page.tsx
```

Updated:

```text
apps/site/app/globals.css
apps/site/tests/public-data.test.ts
```

## Real data source

```text
/home/hermes/.hermes/private/dpt/prod_dakotapokertour.sql
```

The integrated admin routes use the same repository/data layer as the public site. The current JSON transport is a curated production SQL snapshot, not fabricated records. The repository can switch to Supabase after staging is connected.

## Routes

```text
/admin
/admin/events
/admin/tournaments
/admin/venues
/admin/articles
```

## Safety boundary

```text
Read-only
No create/edit/delete controls
No production mutations
No mock-route or mock records
No passwords, OTP data, token tables, emails, or phone numbers
robots: noindex, nofollow
```

## Verification

```text
npm --workspace apps/site test -> 11 tests passed
npm --workspace apps/site run typecheck -> passed
npm --workspace apps/site run build -> passed
```

Build output includes all five `/admin` routes inside `apps/site`.

HTTP smoke passed:

```text
/
/events
/admin
/admin/events
/admin/tournaments
/admin/venues
/admin/articles
```

Browser dashboard verification:

```text
source: prod_dakotapokertour.sql
Production Data Dashboard: visible
production users: 2,591
production tournament entries: 11,019
mock-route: absent
private table names: absent
admin navigation: Dashboard, Events, Tournaments, Venues, Articles
```

Events browser verification:

```text
rows: 60
Poker Brat Black Chip BOUNTY Tournament: present
Spring Championship: present
Windbreak: present
JS errors: 0
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_8ef49ed0a45d4e14b54970d0cf0995c0.png
```

## Current limitation

Supabase Auth and writes are not connected. These routes are a read-only production-data foundation. The next backend loop is Supabase staging + authentication, then real audited mutations module-by-module.
