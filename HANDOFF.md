# DPT Rebuild Lab — Handoff Summary

Last updated: `2026-07-12T21:32:45Z`

This is the current working handoff for the Dakota Poker Tour rebuild lab. It is intended for Pedro/future agents picking up the local rebuild without rereading every loop log.

## Safety boundaries

- Legacy Laravel reference repo: `/home/hermes/projects/dpt-web`
- Laravel app root: `/home/hermes/projects/dpt-web/src`
- Rebuild lab: `/home/hermes/projects/dpt-rebuild-lab`
- Do **not** push to GitHub without Brook's explicit request.
- Do **not** deploy to Vercel/Supabase production.
- Do **not** use production credentials in this lab.
- Treat the Laravel repo as read-only reference except local reports/spec files.

## Authoritative product architecture

```text
apps/site — single Next.js/Vercel replacement application
  ├── public routes (`/`, `/events`, `/venues`, `/leaderboard`, ...)
  ├── authenticated admin routes (`/admin`, `/admin/...`)
  ├── shared domain/data repository layer
  └── Supabase Postgres/Auth/Storage staging backend → eventual production cutover
```

Source of truth:

```text
Live DakotaPokerTour.com public site
Authenticated production admin workflows
Production SQL-derived schema/data
Production media/content
Legacy Laravel business rules and route behavior
```

Non-target historical path:

```text
apps/admin
  -> mock simulator/prototype/reference only
  -> useful for workflow notes and UI concepts
  -> must not be deployed or treated as the final admin architecture
```

The required end state is one product, one Vercel project, and one integrated public/admin application. Mock data is not the product direction. Supabase staging is not yet connected.

## Current packages/apps

| Path | Purpose |
|---|---|
| `apps/site` | Authoritative integrated replacement app: public site today, real authenticated `/admin` next. |
| `apps/admin` | Historical mock simulator/reference only; not a deployment or product target. |
| `packages/tournament-engine` | Tested TypeScript domain logic extracted from Laravel behavior; reuse where it matches production rules. |
| `supabase` | Draft public schema/seed/RLS work that must become the real staging backend and expand to authenticated admin workflows. |
| `DPT_REBUILD_SPEC` | Entity maps, business rules, schema drafts, migration/RLS/API/test plans. |
| `loop-logs` | Evidence logs for each loop. |

## Current deployed app

Public replacement preview:

```text
https://dpt-rebuild-site.vercel.app
```

Vercel root:

```text
apps/site
```

The current live deployment includes public routes and a passwordless read-only `/admin` review mode so Brook can evaluate admin screens without Supabase password friction. It is intentionally no-write/no-secrets. Real Supabase-authenticated admin remains the production direction and can be restored by setting `DPT_ADMIN_REVIEW_MODE=disabled`. The next admin work belongs inside `apps/site/app/admin`, not in a separate Vercel project.

Local dev when needed:

```bash
npm --workspace apps/site run dev -- --hostname 0.0.0.0
```

Do not present the `apps/admin` mock simulator as the backend preview or final admin.

## API/docs map

Primary docs:

| File | Purpose |
|---|---|
| `apps/admin/app/admin-simulator.tsx` | Browser-backed DPT admin/public replica shell, now partially componentized through `components/dpt-replica/`. |
| `apps/admin/components/dpt-replica/` | Extracted reusable types, mock data, utilities, UI primitives, form controls, list/action controls, feature-section entry points, and component README. |
| `apps/admin/components/dpt-replica/sections/` | Feature-section entry points for PublicPreview, Dashboard, Tournaments, Events, Players, Venues, Articles, Notifications, Structures, Reports, Parity, Migration, Roles, and LiveManager. |
| `apps/admin/API.md` | Local mock API route index and RPC docs. |
| `apps/admin/ENVIRONMENT.md` | Exact env vars and safety behavior for transport selection. |
| `supabase/SUPABASE_REPLACEMENT_PLAN.md` | Mapping from local mock API boundary to future Supabase RPC/Edge/server implementation. |
| `packages/tournament-engine/ENGINE_RULE_MAPPING.md` | Mapping between engine functions and Laravel behavior. |
| `GOAL.md` | Running milestone checklist. |
| `PROJECT_STATUS.md` | Concise business-impact status summary for Brook/Nacho. |
| `DPT_CURRENT_PLATFORM_MAP.md` | Browser-authenticated public/admin feature map and replica gap analysis. |
| `DPT_AUTO_ADVANCE_RESULTS.md` | Latest auto-advance results summary and verification evidence. |
| `DPT_COMPONENTIZATION_RESULTS.md` | Componentization auto-advance results for loops 044-053. |
| `DPT_SECTION_EXTRACTION_RESULTS.md` | Feature-section extraction results for loops 054-063. |
| `DPT_REPLACEMENT_SITE_RESULTS.md` | Corrected clean public replacement app results using uploaded production SQL. |
| `loop-logs/065-sql-backed-public-subpages.md` | SQL-backed public subpages/routes for Events, Leaderboard, Venues, News, Champions, and tournament details. |
| `loop-logs/066-production-media-url-mapping.md` | Live production media URL mapping and rendering for logo, events, articles, venues, tournaments, and player avatars. |
| `loop-logs/067-media-manifest-local-samples.md` | Media migration manifest, URL validation, local sample downloads, and local-first media fallback. |
| `loop-logs/068-bulk-media-local-copy.md` | Bulk local copy of all 309 valid production media assets plus broken-assets review. |
| `loop-logs/069-launch-public-polish.md` | Launch-facing public homepage polish: staging-copy removal, video embeds, text cleanup, and fidelity refinements. |
| `loop-logs/070-visual-parity-pass.md` | Live-vs-local visual parity pass: hero/header/POY/sidebar/cards/footer/mobile CSS refinements. |
| `loop-logs/071-icons-video-interactive-qa.md` | SVG icon replacement, local YouTube thumbnail cards, and browser interactive public-route QA. |
| `loop-logs/072-supabase-public-migration-path.md` | Local-only Supabase public schema/views/seed/repository migration path. |
| `loop-logs/073-local-postgres-supabase-repository.md` | PGlite local schema/seed execution validation plus SupabaseRepository with JSON fallback. |
| `loop-logs/074-deployment-readiness-layer.md` | Vercel/Supabase readiness layer: env templates, source-mode docs, smoke-test docs, verifier command. |
| `loop-logs/075-media-storage-migration-plan.md` | Final media storage migration plan: bucket/object mapping, upload command manifest, CDN-base helper. |
| `loop-logs/076-vercel-preview-preflight.md` | Vercel preview package/preflight: app-local vercel config, env docs, final smoke report. |
| `loop-logs/077-vercel-preview-poy-polish.md` | Public preview polish for Player of the Year strip overflow/clipping. |
| `loop-logs/078-admin-simulator-preview-package.md` | Historical admin simulator preview packaging; superseded as product direction by loop 079. |
| `loop-logs/079-correct-integrated-product-architecture.md` | Authoritative correction: single apps/site project, integrated real-data `/admin`, no mock product path. |
| `loop-logs/080-integrated-real-data-admin-foundation.md` | Integrated read-only `/admin` routes in apps/site using production-derived SQL data. |
| `loop-logs/081-faithful-admin-auth-foundation.md` | Legacy-auth parity audit plus fail-closed Supabase email/password admin login and role gate. |
| `loop-logs/082-supabase-migration-safety-audit.md` | Full migration-chain audit and embedded Postgres/RLS/grant validation before remote apply. |
| `loop-logs/083-admin-preview-supabase-team-access-checkpoint.md` | Current checkpoint: live passwordless read-only `/admin`, pushed commit, Supabase Fastball Productions invite accepted, restart-ready handoff. |
| `reports/dpt-supabase-migration-audit.md` | Corrected role/Auth/RLS/grant issues and full validation evidence. |
| `docs/DPT_ADMIN_AUTH_PARITY.md` | Exact public-vs-admin login behavior, production role inventory, and replacement auth contract. |
| `reports/dpt-integrated-admin-foundation-verification.md` | Tests/build/HTTP/browser evidence for integrated real-data admin foundation. |
| `docs/DPT_INTEGRATED_PRODUCT_DIRECTION.md` | Authoritative public/admin/Supabase architecture and migration direction. |
| `docs/DPT_PRODUCTION_SQL_SOURCE.md` | Protected durable SQL source location, checksum, permissions, and extraction behavior. |
| `reports/dpt-public-interactive-qa.md` | Interactive QA report for homepage, public routes, video links, icons, and console state. |
| `reports/dpt-supabase-public-migration-path.md` | Supabase public schema/seed/repository migration path report and validation notes. |
| `reports/dpt-local-postgres-supabase-repository-validation.md` | Local embedded Postgres validation and SupabaseRepository implementation report. |
| `reports/dpt-deployment-readiness-verification.md` | Deployment-readiness verification output and current blockers. |
| `reports/dpt-media-storage-plan-verification.md` | Final no-upload media storage migration verification report. |
| `reports/dpt-vercel-preview-preflight-report.md` | First Vercel preview approval/preflight report. |
| `reports/dpt-vercel-preview-live-verification.md` | Live Vercel preview route/media/browser verification report. |
| `reports/dpt-admin-simulator-preview-readiness.md` | Historical mock simulator QA only; superseded by integrated real-data `/admin` direction. |
| `reports/dpt-vercel-preview-route-media-smoke.json` | Machine-readable final route/media smoke output for preview approval. |
| `docs/DPT_VERCEL_PREVIEW_PACKAGE.md` | Vercel preview project/root/env/checklist notes. |
| `docs/DPT_VERCEL_ENV_VARS.md` | Vercel env var matrix for JSON fallback and future Supabase mode. |
| `apps/site/data/dpt-media-storage-manifest.json` | Final storage object-path manifest for local media assets. |
| `reports/dpt-media-upload-commands.jsonl` | Dry-run upload command templates for future approved storage copy. |
| `reports/dpt-local-postgres-validation.json` | Machine-readable row-count/view validation output from PGlite. |
| `reports/dpt-homepage-parity-side-by-side.png` | Side-by-side live homepage vs local replacement screenshot artifact. |
| `reports/dpt-media-migration-report.md` | Media manifest report: valid/broken asset counts, downloaded local assets, and next storage-copy path. |
| `reports/dpt-broken-assets-review.md` | Review list for 19 missing/broken legacy media references. |
| `apps/site/` | New SQL-backed public DakotaPokerTour.com replacement app path, separate from old mock admin shell. |
| `scripts/extract_public_dpt_data.py` | Extracts public-facing JSON data from uploaded production SQL for the replacement site. |

Routes:

| Route | Purpose |
|---|---|
| `GET /api/dpt` | Route index: supported RPC names and links. |
| `GET /api/dpt/diagnostics` | Active transport, supported RPCs, safe-mode/Supabase-disabled status without secrets. |
| `POST /api/dpt/[rpc]` | Mock RPC execution endpoint. |

Supported RPC names:

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

## Transport/env behavior

Safe defaults:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

Supabase **does not enable accidentally**. Setting only:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
```

keeps the app on `mock-route`. Selecting the placeholder Supabase path requires:

```dotenv
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=supabase-rpc
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=true
```

Even then, `admin-api-supabase.ts` is only a disabled/testable placeholder unless explicit adapter/config is supplied.

## Current verification status

### Restart checkpoint — 2026-07-12T21:32:45Z

- Future Hermes sessions are configured for model `gpt-5.6-sol`; this session remained on GPT-5.5 until the checkpoint was written.
- Latest pushed DPT commit: `d945544 Default admin preview to read-only review mode`.
- Remote branch verified with `git ls-remote origin refs/heads/main`: `d9455446056681b5767db442911c63b71ae71bcb`.
- Live admin preview: `https://dpt-rebuild-site.vercel.app/admin`.
- Current admin preview is passwordless/read-only for owner review; no production writes, private user rows, passwords, OTPs, or tokens are exposed.
- Brook confirmed Pedro accepted the Supabase Fastball Productions team invitation for project `dpt-rebuild-staging`.
- Local remote-tracking branch may look stale because `.git/refs/remotes/origin` is owned by `dingo`; use `git ls-remote` as the authoritative push check.

### Current test totals

Latest verified `apps/site` commands for the live integrated public/admin app:

```bash
npm --workspace apps/site run test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
```

Latest observed site output:

```text
Vitest: 2 test files passed, 12 tests passed
TypeScript: tsc --noEmit passed
Next.js production build: compiled successfully; 20 pages generated; admin routes are dynamic
```

Historical simulator/engine output retained for reference:

```bash
npm --workspace apps/admin test
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

Latest known test counts:

| Layer | Test files | Tests |
|---|---:|---:|
| Tournament engine | 6 | 31 |
| Admin service/API/client/contracts/transports/config/diagnostics/routes | 10 | 36 |
| **Total** | **16** | **67** |

Latest actual test output excerpt:

```text
@dpt/admin-prototype test:
Test Files  10 passed (10)
Tests       36 passed (36)

@dpt/tournament-engine test:
Test Files  6 passed (6)
Tests       31 passed (31)
```

## Current known blockers before real Supabase

1. Docker/local Supabase is unavailable in the current environment.
2. `psql` is unavailable in the current environment.
3. Supabase migrations/RLS/seed have not yet been executed against a real local DB.
4. Seed profiles are not linked to real `auth.users` rows yet.
5. Host/manager tournament assignment model is not designed yet.
6. Audit/tournament-update process needs final shape before production-like admin mutation logging.
7. Next/PostCSS audit advisories remain unresolved; `npm audit --omit=dev` reports 2 vulnerabilities and suggests a breaking Next 16 upgrade.
8. Browser screenshot tooling is blocked by missing Chromium dependency `libnspr4.so`; use build output, HTTP status, and content checks until fixed.

## Common commands

```bash
# Engine tests
npm --workspace packages/tournament-engine test

# Admin tests
npm --workspace apps/admin test

# Admin typecheck/build
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build

# Full current verification pattern
npm --workspace apps/admin test \
  && npm --workspace packages/tournament-engine test \
  && npm --workspace apps/admin run typecheck \
  && npm --workspace apps/admin run build

# API smoke checks, with dev server running
curl -s http://127.0.0.1:3000/api/dpt
curl -s http://127.0.0.1:3000/api/dpt/diagnostics
curl -s -X POST -H 'content-type: application/json' -d '{}' \
  http://127.0.0.1:3000/api/dpt/dpt_check_in_player
```

## Dev server caveat

After adding/changing route files, the Next dev server has sometimes returned fallback/error HTML for new route smoke checks. If this happens, restart the tracked dev process and rerun the same curl check before assuming the route code is broken.

## Next recommended loop

A good next loop is one of:

1. Add or maintain `PROJECT_STATUS.md` if Brook/Nacho need a fresh executive summary.
2. Add initial Supabase contract implementation stubs in SQL/TypeScript for the simplest read-only query path.
3. Prepare Docker/local Supabase execution steps, but only if Docker becomes available.
4. Start a public-site mock prototype after the admin/API boundary stabilizes.
