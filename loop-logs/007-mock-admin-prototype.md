# Loop 007 — Mock-data Next.js Admin Prototype

## Goal

Scaffold a mock-data Next.js admin prototype that consumes the standalone `@dpt/tournament-engine` package without connecting to Supabase.

## Files created/updated

- `apps/admin/package.json`
- `apps/admin/tsconfig.json`
- `apps/admin/next.config.mjs`
- `apps/admin/next-env.d.ts`
- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/README.md`
- `packages/tournament-engine/package.json`
- `package.json`
- `package-lock.json`
- `GOAL.md`
- `loop-logs/007-mock-admin-prototype.md`

## Implemented prototype

The admin prototype is a single Next.js App Router dashboard at `/` showing mock-data tournament operations powered by `@dpt/tournament-engine`:

- check-in totals
- add-on totals
- prize pool
- DPT stored/display score
- freeroll score
- manual rank preview
- payout materialization
- flight advancement
- flight undo
- TOC qualifiers
- Supabase disconnected status card

## Important safety boundary

The app does **not** connect to Supabase, Vercel, production, GitHub, or any live service. It uses local mock data and the pure TypeScript tournament engine only.

## Verification commands run

```bash
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
npm audit --omit=dev
curl -s -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000 | grep key dashboard text
```

## Actual verification output

```text
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

npm audit --omit=dev -> 2 vulnerabilities reported in Next.js/PostCSS dependency chain (1 moderate, 1 high). `npm audit fix --force` would upgrade to Next 16, a breaking change for the current Node 18 environment, so this remains a local-prototype risk to revisit before any deployment.

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

Admin prototype powered by the tournament engine
Manual rank preview
Supabase disconnected
Tournament of Champions qualifiers
```

## Browser note

The browser tool could not render the page because local Chromium is missing `libnspr4.so`. This is an environment dependency issue, not an app issue. HTTP and content checks passed via curl.

## Current local server

A Next.js dev server is running locally:

```text
http://127.0.0.1:3000
```

Process session:

```text
proc_b4e0b38f0c45
```

## Next recommended loop

Options:

1. Improve the mock admin prototype UX with interactive client-side controls for check-in/add-on/eliminate/flight undo simulations.
2. Add app-layer mock service modules that mirror the future Supabase RPC boundaries.
3. Resolve local browser dependency (`libnspr4.so`) if we want visual screenshots from browser QA.
4. Wait for Docker/Supabase local stack before connecting data.
