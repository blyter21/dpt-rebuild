# DPT Admin Simulator Preview

## Purpose

Deploy a separate internal Vercel preview for `apps/admin` so Brook can test admin workflow concepts without touching real data.

## Safety status

```text
Admin Simulator / Mock Data / Not Production
```

The preview must remain mock-only:

```text
No real users
No real payouts
No real notifications
No Supabase writes
No production database/API calls
No custom domain
No DNS changes
```

## Recommended Vercel project

```text
Project name: dpt-rebuild-admin
Repository: blyter21/dpt-rebuild
Root Directory: apps/admin
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## Required env vars

Safe mock-only mode:

```text
NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT=mock-route
NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT=false
```

Do **not** add Supabase URL/keys yet.

## Verification scope

Core screens to test:

```text
Dashboard
Public Preview
Tournaments
Events
Players
Venues
Articles
Notifications
Structures
Reports
Parity
Migration
Roles
Live Manager
```

Expected visible warnings:

```text
Internal Admin Simulator · Mock Data · Not Production
Mock Data / Not Production
Supabase disconnected
Transport: mock-route
Safe local mode
```

## Deploy status

Hermes can push GitHub changes through the repo deploy key, but the Hermes shell is not logged into Vercel CLI. Creating the separate Vercel project still requires either:

```text
1. Brook creates/imports a second Vercel project using the settings above, or
2. Brook provides/sets a Vercel token locally for Hermes (not in chat), or
3. Browser/desktop Vercel session becomes accessible to Hermes automation.
```
