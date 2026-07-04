# Loop 078 — Admin Simulator Preview Package

## Goal

Deploy a separate internal admin simulator preview from `apps/admin` in mock-data mode, clearly labeled as “Admin Simulator / Mock Data / Not Production,” then verify its core workflow screens so Brook can start testing admin functionality concepts without touching real data.

## Result

Prepared and verified the admin simulator preview package, but could not create the separate Vercel project from Hermes because Vercel CLI is not authenticated in this shell.

## Added / changed

```text
apps/admin/app/admin-simulator.tsx
apps/admin/app/globals.css
apps/admin/vercel.json
apps/admin/.env.vercel.example
docs/DPT_ADMIN_SIMULATOR_PREVIEW.md
apps/admin/tests/admin-replica-shell.test.ts
reports/dpt-admin-simulator-preview-readiness.md
```

## Safety labels

Visible labels added:

```text
Internal Admin Simulator · Mock Data · Not Production
Mock Data / Not Production
No real users, payouts, notifications, tournament writes, Supabase calls, or production data mutations happen in this preview.
Mock data only · Not production
```

## Verification

```text
npm --workspace apps/admin test -> 11 files / 46 tests passed
npm --workspace apps/admin run typecheck -> passed
npm --workspace apps/admin run build -> passed
local HTTP smoke -> passed
browser workflow click-through -> passed
```

Browser sections clicked/verified:

```text
Tournaments
Events
Players
Venues
Articles / Live Updates
Notifications
Structures & Payouts
Reports & Activity
Parity Matrix
Migration Readiness
Roles & Permissions
Live Tournament Manager
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_e7867858138d40e0820ce87243a3d20d.png
```

## Vercel blocker

```text
npx vercel whoami -> Error: No existing credentials found.
```

No Vercel token is available to Hermes, and the desktop/browser Vercel session is not accessible through computer automation in this session.

## Manual/import settings

```text
Project name: dpt-rebuild-admin
Repository: blyter21/dpt-rebuild
Root Directory: apps/admin
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

Env vars:

```text
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

## Next step

Create/import the `dpt-rebuild-admin` Vercel project using the settings above, then have Pedro verify the live preview URL.
