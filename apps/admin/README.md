# DPT Admin Prototype

Mock-data Next.js admin prototype for Dakota Poker Tour.

## Purpose

This app demonstrates admin tournament workflows against local mock data while consuming the standalone `@dpt/tournament-engine` package. It does **not** connect to Supabase yet.

## Commands

```bash
npm --workspace apps/admin run dev
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run test
npm --workspace apps/admin run build
```

## Environment and transport config

See [`ENVIRONMENT.md`](./ENVIRONMENT.md) for exact transport environment variables and safety behavior.

See [`API.md`](./API.md) for the local mock API index, diagnostics route, and RPC route pattern.

Safe default:

```text
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

Supabase cannot be enabled by setting only `NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc`; the explicit enable flag must also be `true`.

## Current screen

- `/` realistic Tournament Desk Command Center
- `/api/dpt/[rpc]` local mock API route layer matching future Supabase RPC names
- `/api/dpt` route index with supported RPC names and diagnostics links
- centralized admin API client for local route fetch/error handling
- typed transport selection between safe `mock-route` default and disabled `supabase-rpc` placeholder
- isolated `admin-api-mock-route.ts` and `admin-api-supabase.ts` transport adapters
- safe runtime config contract that keeps `mock-route` active unless Supabase is explicitly enabled
- visible UI transport indicator showing `mock-route` vs future `supabase-rpc`
- diagnostics panel and `/api/dpt/diagnostics` endpoint reporting active transport, supported RPCs, and Supabase-disabled reason without secrets
- shared TypeScript contracts for RPC names, input bodies, responses, and UI state
- disabled placeholder Supabase transport module conforming to the shared contracts
- route-handler integration tests for actual `GET`/`POST` responses
- registration desk panel for check-in/add-on workflow
- player list panel with buy-in, chips, rank, score, and status
- payout materialization panel
- eliminations/manual-rank correction panel
- flight controls panel with highest-stack vs accumulator/sum mode
- action log and Tournament of Champions panel
- service functions named after future RPCs (`dpt_check_in_player`, `dpt_add_tournament_addon`, etc.)
- live mock state tables powered by `@dpt/tournament-engine`
- Supabase status card showing DB is intentionally disconnected
