# DPT Replica Sections

Feature-level sections extracted from `apps/admin/app/admin-simulator.tsx`.

Sections remain local/mock-only and receive a shared `ReplicaSectionContext` from the simulator shell. This keeps the current POC behavior stable while making the major public/admin modules easier to split into real routes later.

## Extracted sections

```text
PublicPreviewSection.tsx
DashboardSection.tsx
TournamentsSection.tsx
EventsSection.tsx
PlayersSection.tsx
VenuesSection.tsx
ArticlesSection.tsx
NotificationsSection.tsx
StructuresSection.tsx
ReportsSection.tsx
ParitySection.tsx
MigrationSection.tsx
RolesSection.tsx
LiveManagerSection.tsx
```

## Barrel

`index.tsx` re-exports the section components so the app shell can import them from one location.

## Safety

These sections remain local/mock-only. They must not save to Laravel, write Supabase, send notifications, deploy, or mutate production DPT data.
