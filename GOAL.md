# Standing Goal: DPT Rebuild Lab

## Mission

Create a safe local rebuild lab for Dakota Poker Tour and prove Pedro can rebuild the core poker tournament backend through controlled loops.

## Current goal prompt

Create the local DPT rebuild lab and build the tournament-engine test package first, using the Laravel repo as read-only reference. No production deploys, no live credentials, no GitHub pushes.

## Operating loop

Each loop should end with:

1. What changed
2. Files created/modified
3. Commands/tests run and actual output
4. Known risks/questions
5. Next recommended loop

## Initial milestones

- [x] Formalize current entity map
- [x] Formalize tournament business rules
- [x] Draft Supabase schema
- [x] Draft RLS/security plan
- [x] Scaffold tournament-engine package
- [x] Implement buy-in/add-on/chip tests
- [x] Implement DPT scoring tests
- [x] Implement freeroll scoring tests
- [x] Implement satellite payout tests
- [x] Implement flight advancement + undo tests
- [x] Implement elimination rank tests
- [x] Implement final-table flag tests
- [x] Implement satellite make-winners tests
- [x] Implement undoPlayerStat tests
- [x] Implement manual rank recalculation tests
- [x] Implement payout materialization tests
- [x] Implement Tournament of Champions qualification tests
- [x] Add edge-case tests for duplicate manual ranks
- [x] Add missing payout row tests
- [x] Add satellite remainder-already-assigned tests
- [x] Add bounty/multiplier manual rank tests
- [x] Create engine-to-Laravel rule mapping
- [x] Create initial Supabase migration draft
- [x] Add local Supabase seed data matching engine fixtures
- [x] Draft Supabase RPC signatures for tournament operations
- [x] Initialize local Supabase CLI config
- [x] Document local Supabase Docker prerequisites
- [x] Draft initial RLS helper functions and policies
- [x] Build first mock-data admin prototype after logic tests pass
- [x] Add interactive mock admin workflow controls
- [x] Add app-layer mock service module mirroring future Supabase RPC boundaries
- [x] Add mock admin service-layer tests
- [x] Polish admin workflow UX into tournament desk panels
- [x] Add local Next.js mock API route layer matching RPC signatures
- [x] Add route-handler integration tests and centralized admin API client
- [x] Add Supabase replacement plan for admin API client boundary
- [x] Create shared TypeScript admin API contract types
- [x] Add disabled placeholder Supabase admin API transport
- [x] Add typed admin API transport selection plumbing
- [x] Extract mock-route admin API transport adapter
- [x] Add safe runtime transport config and UI transport indicator
- [x] Document admin transport env vars and Supabase opt-in safety
- [x] Add diagnostics endpoint and panel for active transport/RPC status
- [x] Add /api/dpt route index and local API docs
- [x] Add root handoff summary for architecture/tests/API/blockers
- [x] Add business-impact project status summary for Brook/Nacho
- [x] Add browser-authenticated current platform feature map
- [x] Rebuild prototype into recognizable DPT admin/public replica shell
- [x] Add public-site preview side to DPT replica shell
- [x] Add public/admin view toggle and DPT-style visual branding
- [x] Add mock-only create/edit detail screens for core admin modules
- [x] Add interactive mock detail-screen controls and validation states
- [x] Add mock list filtering/search/sort controls for admin tables
- [x] Add mock pagination and row action menus for admin list tables
- [x] Add row action preview panel with legacy route/rebuild target feedback
- [x] Add notification audience builder preview
- [x] Add richer public tournament detail preview
- [x] Add article/live-update editor preview
- [x] Add structures/payouts/blinds modules
- [x] Add duplicate-player merge preview
- [x] Add reports/activity center
- [x] Add current-vs-rebuilt parity matrix
- [x] Add migration readiness checklist
- [x] Add roles/permissions matrix
- [x] Add auto-advance results summary for loops 034-043
- [x] Extract DPT replica shared types
- [x] Extract DPT replica mock data
- [x] Extract DPT replica utility helpers
- [x] Extract DPT replica UI primitives
- [x] Extract DPT replica form controls
- [x] Extract DPT replica list/action controls
- [x] Update replica shell tests for componentized source
- [x] Add DPT replica component README
- [x] Add componentization results summary for loops 044-053
- [x] Extract DPT replica feature-section entry points
- [x] Add DPT replica sections README
- [x] Update tests for sectionized source
- [x] Add section extraction results summary for loops 054-063
- [x] Create clean SQL-backed public replacement app path
- [x] Extract real public data from uploaded production SQL
- [x] Build first public DakotaPokerTour.com homepage/navigation from real SQL data
- [x] Build SQL-backed Events, Leaderboard, Venues, News, Champions, and Tournament detail routes
- [x] Locate production media URL patterns and render real logo/event/article/venue/player images
- [x] Create media migration manifest and local sample media fallback
- [x] Bulk-download all valid production media assets into local self-hosted paths
- [x] Produce broken-assets review list for missing legacy media references
- [x] Remove staging copy, add video embeds, and clean visible imported text artifacts
- [x] Run live-vs-local visual parity pass and adjust public homepage layout/fidelity
- [x] Replace placeholder symbols with SVG icons, add YouTube thumbnails, and run public interactive QA
- [x] Create local Supabase public schema/seed/repository migration path
- [x] Execute Supabase public schema/seed against a local embedded Postgres-compatible runtime and add SupabaseRepository fallback path
- [x] Add Vercel/Supabase deployment-readiness env templates, docs, and verification command
- [x] Create final media storage migration plan and CDN-base media path abstraction
- [x] Prepare Vercel preview package/preflight without deploying
- [ ] Execute Supabase public schema/seed against a local Docker/Postgres runtime
- [ ] Create/connect a Supabase staging project for the real DPT replacement database
- [x] Integrate read-only production-derived admin routes into `apps/site` under `/admin` in the same Next.js/Vercel project
- [ ] Add Supabase Auth and protected admin roles to the integrated `/admin` routes
- [ ] Rebuild real admin mutations from live production workflows and production-derived schema/data
- [ ] Replace JSON fallback with Supabase-backed reads/writes after staging validation
- [x] Preserve `apps/admin` simulator only as historical workflow/reference material (not a deployment target)

## Authoritative product direction

- One replacement application and one Vercel project: `apps/site`.
- Public routes and authenticated admin routes live in the same Next.js application.
- Admin target route: `/admin` within `apps/site`.
- `/admin` is never anonymously/publicly accessible: login is mandatory and only authorized admin-role users may access admin routes or APIs.
- Do not deploy any admin route until authentication and server-side admin authorization are enforced.
- The live production Laravel/AWS site, production SQL, media, and authenticated admin workflows are the source of truth.
- The final product must use real production-derived data and business rules; mock data is not an acceptable product path.
- `apps/admin` is reference/prototyping material only and must not be deployed as the target admin.
- Supabase Postgres/Auth/Storage is the intended new backend, introduced first through a staging project and validated before cutover.

## Constraints

- Keep Laravel repo as reference, not build target.
- Work in `/home/hermes/projects/dpt-rebuild-lab`.
- Use production SQL/live-site content and workflows as the source of truth.
- Keep public and admin in the same `apps/site` Next.js/Vercel project.
- Do not advance mock data or `apps/admin` as the product architecture.
- Prefer tests before UI.
- Avoid production mutations until Brook explicitly approves staging-to-production cutover steps.
