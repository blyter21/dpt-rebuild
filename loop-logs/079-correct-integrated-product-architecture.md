# Loop 079 — Correct DPT Product Architecture

## User correction

```text
Admin must be in the same project as the public site.
The rebuild must use live production data/workflows.
Mock data is not the product direction.
The goal is to take over the live production site with the new version.
```

## Authoritative architecture

```text
apps/site
  -> public routes
  -> authenticated /admin routes
  -> shared production-derived repository/domain layer
  -> Supabase staging, then production cutover
```

## Historical path

```text
apps/admin
```

is now explicitly reference/prototype material only and not a deployment target.

## Files updated

```text
GOAL.md
HANDOFF.md
docs/DPT_INTEGRATED_PRODUCT_DIRECTION.md
loop-logs/079-correct-integrated-product-architecture.md
```

## Next loop

Build integrated read-only real-data admin foundations under `apps/site/app/admin`, using the production-derived repository and a Supabase staging contract. Do not add further mock-data product features.
