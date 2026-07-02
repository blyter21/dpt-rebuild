# DPT Replica Components

This directory holds extracted pieces from the browser-backed DPT admin/public replica shell.

## Modules

| File | Purpose |
|---|---|
| `types.ts` | Shared replica UI/domain view types. |
| `mock-data.ts` | Browser-crawl/authenticated-admin mock data used by the local POC. |
| `utils.ts` | Formatting and current-Laravel-route/rebuilt-target helpers. |
| `ui-primitives.tsx` | Reusable panels, badges, KPIs, buttons, player status. |
| `form-controls.tsx` | Mock-only form fields, notices, create/edit mode controls. |
| `list-controls.tsx` | Search/filter/sort, pagination, row action menus, row action preview panel. |
| `index.ts` | Barrel exports for `admin-simulator.tsx`. |

## Safety

All exported components are local/mock-only. They must not call production DPT routes, write Laravel data, write Supabase, deploy, or send notifications.

## Verification

`apps/admin/tests/admin-replica-shell.test.ts` reads this component directory in addition to `app/admin-simulator.tsx` so content regressions still fail after extraction.
