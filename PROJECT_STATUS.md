# DPT Rebuild — Business Impact Status

Audience: Brook / Nacho  
Updated: 2026-06-27

## Executive summary

The DPT rebuild has moved from “unknown legacy app” to a tested local modernization lab. The most important tournament-desk rules have been extracted into a standalone TypeScript engine, protected by tests, and wrapped in a mock Next.js admin/API layer that is shaped like the future Supabase boundary.

This means the rebuild is no longer just a visual redesign. It now has a tested foundation for the tournament operations that matter: check-in math, add-ons, scoring, payouts, eliminations, manual rank edits, flight advance/undo, satellite winner behavior, and Tournament of Champions qualification.

## What has been proven

| Area | Status | Business impact |
|---|---|---|
| Legacy understanding | Proven enough for backend rebuild planning | We have mapped the hidden Laravel tournament behavior into reusable docs and tests. |
| Tournament rules | 31 pure engine tests passing | Core poker/tournament math is protected before touching UI/cloud. |
| Admin workflow prototype | Running locally | Tournament desk workflow can be demoed without production data. |
| API boundary | Local `/api/dpt` index, diagnostics, and mock RPC routes working | Future Supabase replacement has a clear seam. |
| Transport safety | `mock-route` default with explicit two-step Supabase opt-in | A future agent cannot accidentally turn on Supabase/cloud by setting one env var. |
| Handoff quality | `HANDOFF.md`, `API.md`, `ENVIRONMENT.md`, loop logs | Nacho/Pedro/future agents can continue without replaying every prior decision. |

## Current verified test counts

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports/config/diagnostics/routes | 10 | 36 |
| **Total** | **16** | **67** |

Latest verified commands include:

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

## Current local demo

Run from `/home/hermes/projects/dpt-rebuild-lab`:

```bash
npm --workspace apps/admin run dev
```

Open:

```text
http://127.0.0.1:3000
```

Current active process at handoff:

```text
proc_9a934ecd4b94
```

Expected on the page:

```text
Tournament Desk Command Center
Transport: mock-route
Safe local mode
Supabase disconnected
Transport Diagnostics
```

## Where future agents should start

| File | Why it matters |
|---|---|
| `HANDOFF.md` | Current architecture, tests, commands, blockers, and next loops. |
| `apps/admin/API.md` | `/api/dpt`, diagnostics route, mock RPC route pattern, supported RPC list. |
| `apps/admin/ENVIRONMENT.md` | Exact transport env vars and why Supabase cannot enable accidentally. |
| `supabase/SUPABASE_REPLACEMENT_PLAN.md` | How to replace the local mock API boundary with Supabase RPC/Edge/server logic. |
| `packages/tournament-engine/ENGINE_RULE_MAPPING.md` | Trace from modern engine helpers back to Laravel behavior. |

## What remains blocked before real Supabase

1. Docker/local Supabase is not available in this environment.
2. `psql` is not available.
3. Supabase migrations/RLS/seed have not been executed against a real database.
4. Seed users/profiles are not linked to real `auth.users` rows.
5. Host/manager tournament assignment model still needs final design.
6. Admin mutation audit/tournament-update logging still needs final production shape.
7. Next/PostCSS advisories remain unresolved until a pre-deployment dependency upgrade pass.
8. Browser screenshot QA is blocked locally by missing Chromium dependency `libnspr4.so`; HTTP/content/build checks are being used instead.

## Recommended next investment

### Best next technical investment

Enable local Supabase execution when Docker is available, then run the existing migrations/seed/RLS locally and start with one read-only query/RPC path.

Why: this converts the current safe mock boundary into a real database proof without touching production.

### Best next product investment

Keep polishing the admin tournament desk around actual operator workflows: registration, add-ons, eliminations, payout correction, flight movement, and audit trail.

Why: this is the highest-value internal workflow and gives Brook/Nacho a practical replacement target before public-site work.

### Best next risk-reduction investment

Resolve the Next/PostCSS audit issue and browser dependency issue before any hosted preview.

Why: these do not block local proof-of-concept work, but they should be cleared before Vercel/public preview.

## Recommended sequencing

1. Keep current mock-route admin app as the demo baseline.
2. When Docker/local Supabase is available, run Supabase migrations and seed locally.
3. Swap one simple read-only route from mock data to Supabase under the existing transport boundary.
4. Add transaction-backed admin mutations one at a time: check-in, add-on, elimination, undo, flight advance.
5. Only after local DB proof: consider Vercel/Supabase cloud preview with non-production data.

## Bottom line

The rebuild has a credible tested core and a safe local admin prototype. The next meaningful spend is not more reverse engineering; it is getting local Supabase running and proving the first real DB-backed slice while keeping production credentials/data untouched.
