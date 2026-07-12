# DPT Supabase Migration Audit

## Status

Completed locally before connecting GitHub or applying migrations to `dpt-rebuild-staging`.

## Scope

Audited all four migrations together:

```text
20260626220600_initial_schema.sql
20260626221000_rls_helpers_and_policies.sql
20260701171500_dpt_public_schema.sql
20260712033000_dpt_admin_auth.sql
```

Validated them with:

```bash
npm run dpt:db:validate:full
```

## Issues corrected

1. App roles did not match production.

Old draft:

```text
super_admin, admin, manager, host, player
```

Production-aligned:

```text
super_admin, administrator, host, venue, user
```

2. `profiles.id` was an independent random UUID even though RLS compared it to `auth.uid()`.

Corrected:

```text
profiles.id references auth.users(id)
profiles.legacy_user_id preserves production mapping
```

3. Core profile/admin/tournament tables had broad public-read policies.

Corrected:

```text
anon cannot select profiles
anon cannot select tournament_entries
anon cannot select payout/qualifier/admin operational tables
```

4. Public reads are explicitly granted only to curated `dpt_public_*` tables/views.

5. Function and table privileges are explicit for authenticated users; anonymous privileges are explicitly revoked from core tables.

## Validation result

```text
migrations applied: 4
public tables: 29
policies: 36
public events seeded: 60
public tournaments seeded: 80
public venues seeded: 77
public articles seeded: 80
public players seeded: 25
```

Privilege assertions:

```text
anon profiles select: false
anon tournament entries select: false
anon curated public events select: true
authenticated own admin authorization select: true
```

## Supabase limitation of embedded test

Supabase includes `pgcrypto`; PGlite does not ship its extension control file. The validator omits only the `create extension pgcrypto` statement while executing all schema, policy, grant, seed, and auth-table SQL.

## Deployment state

No Supabase migration has been applied remotely. GitHub integration remains unconnected. The staging database remains empty/healthy.
