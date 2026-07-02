# Local Supabase Setup — DPT Rebuild Lab

This project now has a Supabase CLI config and draft migrations, but this machine cannot run the local stack until Docker is available.

## Current prerequisite check

```text
npx supabase --version -> 2.108.0
docker -> not found / daemon unavailable
psql -> not found
node -> v18.19.1
npm -> 9.2.0
```

`npx supabase start` currently fails with:

```text
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Docker Desktop is a prerequisite for local development.
```

## Files

```text
supabase/config.toml
supabase/migrations/20260626220600_initial_schema.sql
supabase/migrations/20260626221000_rls_helpers_and_policies.sql
supabase/seed.sql
supabase/RPC_SIGNATURES.md
supabase/rpc_signatures.sql
```

## Once Docker is available

From repo root:

```bash
npx supabase start
npx supabase db reset
```

Expected behavior:

1. local Supabase stack starts via Docker
2. migrations apply in filename order
3. seed file loads from `supabase/seed.sql`
4. Studio is available on the configured local port, usually `http://127.0.0.1:54323`

## If SQL fails on first execution

Likely first fixes to inspect:

- enum casts in RLS helper calls
- policy syntax compatibility with local Postgres/Supabase version
- seed `on conflict` assumptions
- auth UID assumptions; seed profile IDs are UUIDs but not actual `auth.users` rows yet

## Safety

- Do not connect to cloud Supabase yet.
- Do not add production credentials.
- RPC SQL file contains stubs only; it is not wired into migrations yet.
