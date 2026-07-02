# Admin Prototype Environment & Transport Config

This app is intentionally safe-by-default. The admin desk uses local mock data and the local Next.js route layer unless Supabase is explicitly enabled with a two-step opt-in.

## Default behavior

With no environment variables set, the active transport is:

```text
mock-route
```

Meaning:

```text
Next.js UI
  -> admin-api-client.ts
  -> /api/dpt/[rpc]
  -> mock RPC dispatcher
  -> mock service layer
  -> @dpt/tournament-engine
```

The UI indicator should show:

```text
Transport: mock-route
Safe local mode
```

## Exact environment variables

| Variable | Default | Purpose | Safe behavior |
|---|---|---|---|
| `NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT` | unset / `mock-route` | Requested admin API transport. Supported values today: `mock-route`, `supabase-rpc`. | Unknown/unset values fall back to `mock-route`. |
| `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT` | unset / not `true` | Second explicit opt-in required before selecting `supabase-rpc`. | Supabase is ignored unless this is exactly `true`. |
| `NEXT_PUBLIC_SUPABASE_URL` | unset | Future Supabase project/local URL. | Not used unless Supabase transport is explicitly enabled. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | unset | Future public anon key for Supabase client calls. | Not used unless Supabase transport is explicitly enabled. |

## Safe local example

Recommended current config:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
# NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

This keeps all admin actions local and mock-backed.

## Supabase does not enable accidentally

If someone sets only:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

then `readAdminApiRuntimeConfig()` intentionally returns:

```text
activeTransport: mock-route
safeMode: true
reason: Supabase RPC was requested but ignored because NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT is not true.
```

To even select the disabled placeholder transport, both values are required:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, the current `admin-api-supabase.ts` transport is a placeholder and still requires explicit adapter/config before it can make a real call.

## Future Supabase/local DB example

Only after local Supabase or cloud credentials are intentionally available:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-with-local-dev-anon-key
```

Do not add production Supabase credentials to this local rebuild lab without explicit approval.

## Testing the disabled transport safely

The safe way to test the placeholder is with an injected adapter in unit tests, not real credentials:

```ts
import { callSupabaseStateRpc } from './admin-api-supabase';

await callSupabaseStateRpc('dpt_check_in_player', state, {}, {
  enabled: true,
  projectUrl: 'http://localhost:54321',
  anonKey: 'test-anon-key',
  adapter: async (rpc, body) => ({
    ok: true,
    rpc,
    result: {
      state,
      message: 'test adapter ok'
    }
  })
});
```

The existing test file demonstrates this pattern:

```text
apps/admin/tests/admin-api-supabase.test.ts
```

## Verification commands

Use these after config changes:

```bash
npm --workspace apps/admin test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl -s http://127.0.0.1:3000 | grep -E 'Transport|Safe local mode|Supabase disconnected'
```

## Safety checklist before real Supabase use

- [ ] Docker/local Supabase or approved cloud project is available.
- [ ] No production credentials are committed to files.
- [ ] `NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true` is intentionally set.
- [ ] RLS helpers/policies have been applied and smoke-tested.
- [ ] At least one read-only RPC/query is swapped and tested before mutations.
- [ ] Mutating tournament operations remain transactional and role-gated.
