# Supabase Draft Area

This directory holds proposed schema migrations, seed data, and RPC signature drafts for the DPT rebuild.

No live Supabase project or production credential should be used until Brook explicitly approves.

## Files

```text
migrations/20260626220600_initial_schema.sql      # initial dev schema draft
migrations/20260626221000_rls_helpers_and_policies.sql # draft RLS helpers/policies
seed.sql                                          # local/dev seed data matching tournament-engine fixtures
RPC_SIGNATURES.md                                 # human-readable RPC contract draft
rpc_signatures.sql                                # SQL stub signatures that intentionally raise not-implemented exceptions
config.toml                                       # Supabase CLI local project config
LOCAL_SETUP.md                                    # prerequisite and local execution notes
SUPABASE_REPLACEMENT_PLAN.md                      # planned replacement of mock API boundary with Supabase RPC/Edge/server operations
```

## Intended local flow later

Once we decide to use a local Supabase CLI/dev stack:

```bash
supabase init
supabase start
supabase db reset
```

For now, this is schema/RPC design plus local Supabase CLI scaffolding. The Supabase CLI is available through `npx supabase`, but Docker is not available/running in the current environment, so local stack execution is blocked until Docker is installed/started. See `LOCAL_SETUP.md`.

## Safety

- Do not connect these files to a production database.
- Do not add live credentials to this repo.
- Treat RPC stubs as contracts, not implemented behavior.
