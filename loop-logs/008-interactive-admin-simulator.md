# Loop 008 — Interactive Admin Simulator

## Goal

Improve the mock-data Next.js admin prototype with interactive client-side controls for check-in, add-on, eliminate, manual rank edit, flight advance, and flight undo simulations using the tournament-engine package.

## Files created/updated

- `apps/admin/app/admin-simulator.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/README.md`
- `GOAL.md`
- `loop-logs/008-interactive-admin-simulator.md`

## Implemented UI behavior

The admin prototype now has live client-side state and action buttons:

- Check in Alice
- Add Alice add-on
- Eliminate Cora
- Manual rank edit
- Undo Cora stat
- Toggle flight carryover mode: highest stack vs accumulator sum
- Advance flight
- Undo Bob flight
- Reset mock state

The UI displays live mock state from the engine:

- active players
- prize pool
- payout rows
- TOC qualifiers
- main flight entries
- DPT display score
- tournament entries table
- action log
- flight main entries
- TOC qualifiers table

## Safety boundary

Still no Supabase connection, no Vercel deployment, no GitHub push, and no production writes. The prototype uses mock local state and `@dpt/tournament-engine` only.

## Verification commands run

```bash
npm --workspace packages/tournament-engine test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
curl -s -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000
```

## Actual verification output

```text
Test Files  6 passed (6)
Tests       31 passed (31)

@dpt/admin-prototype typecheck -> tsc --noEmit passed
@dpt/admin-prototype build -> next build passed

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

Verified page HTML includes:
Interactive admin simulator
Check in Alice
Advance flight
Undo Bob flight
Supabase disconnected
```

## Known issues

- Browser screenshot tooling still cannot render because local Chromium is missing `libnspr4.so`.
- `npm audit --omit=dev` reports Next/PostCSS advisory issues; acceptable for local-only prototype, but must be resolved before deployment.

## Next recommended loop

Add app-layer mock service modules mirroring future Supabase RPC boundaries so UI event handlers call services rather than direct engine functions. This will make the later Supabase integration cleaner.
