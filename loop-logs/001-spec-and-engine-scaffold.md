# Loop 001 — Spec Split + Tournament Engine Scaffold

## Goal

Start the DPT rebuild loop by turning the deep-dive report into structured specs and creating a tested standalone tournament-engine package.

## Files created/updated

### Spec package

- `DPT_REBUILD_SPEC/01-current-entity-map.md`
- `DPT_REBUILD_SPEC/02-tournament-business-rules.md`
- `DPT_REBUILD_SPEC/03-supabase-schema-draft.sql`
- `DPT_REBUILD_SPEC/04-rls-policy-plan.md`
- `DPT_REBUILD_SPEC/05-api-routes-and-services.md`
- `DPT_REBUILD_SPEC/06-migration-plan.md`
- `DPT_REBUILD_SPEC/07-test-cases.md`

### Tournament engine

- `package.json`
- `packages/tournament-engine/package.json`
- `packages/tournament-engine/tsconfig.json`
- `packages/tournament-engine/vitest.config.ts`
- `packages/tournament-engine/src/types.ts`
- `packages/tournament-engine/src/calculations.ts`
- `packages/tournament-engine/src/flight.ts`
- `packages/tournament-engine/src/index.ts`
- `packages/tournament-engine/tests/calculations.test.ts`
- `packages/tournament-engine/tests/flight.test.ts`
- `packages/tournament-engine/README.md`

## Implemented first-loop logic

- DPT/Freeroll check-in buy-in and chip calculations
- Post-check-in add-on totals
- Running and closed prize pool calculations
- DPT stored/display score including bounty and multiplier behavior
- Freeroll score with participation bonus and multiplier
- Satellite rank helper for normal/remainder/non-winner cases
- Flight survivor rank by chip count with tie handling
- Flight advancement into main tournament using highest-stack or sum/accumulator mode

## Commands run

```bash
node --version
# v18.19.1

npm --version
# 9.2.0

npm install
# added 80 packages, audited 82 packages
# 4 dev dependency vulnerabilities reported by npm install

npm audit --omit=dev
# found 0 vulnerabilities

npm --workspace packages/tournament-engine test
# 2 test files passed
# 12 tests passed

npm --workspace packages/tournament-engine run typecheck
# tsc --noEmit passed

npm --workspace packages/tournament-engine run build
# tsc build passed
```

## Actual verification output

```text
Test Files  2 passed (2)
Tests       12 passed (12)
```

## Notes

- The first test run exposed a test assertion issue around an absent optional property; fixed and reran successfully.
- Typecheck initially needed `rootDir` adjusted from `src` to `.` because tests are included in TypeScript checking.
- `npm install` reported 4 vulnerabilities in dev dependencies, but production dependency audit is clean with `npm audit --omit=dev`.

## Next recommended loop

Implement the next tournament-engine slice:

1. elimination rank assignment for DPT/Flight
2. final-table flag calculation
3. freeroll elimination score assignment
4. satellite make-winners/remainder behavior
5. begin undo flight advancement tests
