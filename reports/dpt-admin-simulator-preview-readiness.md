# DPT Admin Simulator Preview Readiness

## Purpose

Prepare a separate internal Vercel preview for the admin simulator from `apps/admin`.

## Safety label

The app now visibly states:

```text
Internal Admin Simulator · Mock Data · Not Production
Mock Data / Not Production
No real users, payouts, notifications, tournament writes, Supabase calls, or production data mutations happen in this preview.
```

## Safe transport

Verified visible status:

```text
Supabase disconnected
Transport: mock-route
Safe local mode
```

Diagnostics endpoint:

```text
/api/dpt/diagnostics
```

returned:

```text
ok: true
activeTransport: mock-route
safeMode: true
```

## Local verification

Commands:

```bash
npm --workspace apps/admin test
npm --workspace apps/admin run typecheck
npm --workspace apps/admin run build
```

Results:

```text
Tests: 11 files passed / 46 tests passed
Typecheck: passed
Build: passed
```

Local HTTP smoke:

```text
homepage contains mock-only labels, safe mode, mock-route, and all workflow nav sections
/api/dpt/diagnostics contains mock-route and safeMode
```

Browser workflow click-through verified sections:

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

## Vercel project settings

Hermes shell is not logged into Vercel CLI, so it could not create/deploy the separate project directly.

When creating/importing the separate Vercel project, use:

```text
Project name: dpt-rebuild-admin
Repository: blyter21/dpt-rebuild
Root Directory: apps/admin
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

Environment variables:

```text
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

Do not add Supabase URL/key yet.
