# DPT Admin Local API

This API is local/mock-only. It is designed to make the future Supabase RPC boundary visible before any Supabase connection is enabled.

## Route index

```text
GET /api/dpt
```

Returns:

- active transport
- safe mode flag
- supported RPC names
- route links
- diagnostics link
- Supabase readiness booleans
- no secrets

Use this route first when inspecting the local admin API.

## Diagnostics

```text
GET /api/dpt/diagnostics
```

Returns transport diagnostics:

- `activeTransport`
- `safeMode`
- `reason`
- `supportedRpcs`
- `rpcCount`
- `testMode.mockRoute`
- `testMode.supabaseRpcSelected`
- `testMode.supabaseTransportReady`
- `supabase.disabledReason`
- `supabase.hasProjectUrl`
- `supabase.hasAnonKey`
- `supabase.exposesSecrets`

The diagnostics endpoint intentionally exposes only booleans for Supabase URL/key presence, never actual values.

## RPC route pattern

```text
POST /api/dpt/[rpc]
```

Example:

```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -d '{}' \
  http://127.0.0.1:3000/api/dpt/dpt_check_in_player
```

Current local route pattern sends mock state and receives updated mock state. Future Supabase calls should send IDs/payloads, not whole UI state.

## Supported RPCs

Current supported names are sourced from `apps/admin/lib/admin-api-contracts.ts`:

```text
dpt_check_in_player
dpt_add_tournament_addon
dpt_eliminate_player
dpt_undo_player_stat
dpt_recalculate_manual_ranks
dpt_advance_flight_players
dpt_undo_flight_advancement
dpt_materialize_tournament_payouts
dpt_get_toc_qualifiers
set_flight_carryover_mode
get_prize_pool
get_last_display_score
```

## Safety

- No production data.
- No Supabase connection by default.
- `mock-route` remains active unless Supabase is explicitly enabled through the two-step environment opt-in documented in `ENVIRONMENT.md`.
- Do not add production credentials to local files.
