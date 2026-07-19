# DPT authenticated three-loop acceptance — 2026-07-19

## Scope

1. Tournament list/setup/create/edit/copy
2. Players, roles/permissions, duplicate merging and export
3. Articles/categories, notification campaigns/internal inbox and email templates

Production was browser-driven read-only. Rebuild mutations were exercised only in Supabase staging inside rollback transactions. Player/contact screenshots remain local-only and are not committed.

## Verified in authenticated rebuild Chrome

| Surface | Result |
|---|---|
| Tournaments | 10-row paginated list, independent filters, production columns/actions, Create editor opened |
| Tournament Create | Named event/type/venue/blind/payout selectors; dates, buy-ins, rebuys, chips, scoring, media, qualifier/flight flags |
| Players | Protected API returned 10 rows / 2,566 active players; Create editor opened with contact/address/social/preferences |
| Roles | Five roles loaded with grouped permissions and protected system-role actions |
| Fix Duplicate Players | 50 candidates loaded with Primary, Merge Primary, Preview Merge, Merge Accounts and View History controls |
| Articles | 10 rows loaded from 383 operational imports; Create editor opened; two category options and 272 tournament options |
| Categories | Imported category loaded with protected deletion workflow |
| Notifications | Venue/season/event/league/tournament/role selectors, preview and record controls loaded |
| Internal Inbox | Owner-scoped inbox loaded |
| Email Templates | Route/editor loaded; production dump contains zero template records, so zero imported rows is accurate |

## Transaction evidence

### Tournament setup

- Create/update/copy/status/delete lifecycle completed inside rollback.
- Copy was unpublished and contained zero runtime entries, payouts or updates.
- Production setup metadata survived copy.

### Player security

- Player create/preferences/archive completed inside rollback.
- Role create/update and two permission mappings completed inside rollback.
- Merge dry-run returned impact and persisted zero rows.
- Committed merge simulation archived the secondary, preserved the higher-score entry, suppressed the losing entry, reassigned add-ons and wrote one audit row.
- All QA data rolled back; profile count remained 2,591.

### Content and communications

- Category, published article, associated profile, versioned template, copy/archive, campaign preview/record and inbox read completed inside rollback.
- Tournament 346 target preview and record each resolved 98 recipients.
- Preview persisted zero campaign rows.
- Recorded simulation created 98 internal deliveries and **zero external email/SMS sends**.
- HTML sanitizer removed script content.
- Current published article was visible anonymously; future-scheduled article was hidden.
- Anon could read approved article projection columns but not private full-body HTML.
- All QA rows rolled back; operational/public article counts remained 383.

## Remaining gaps after this batch

1. Tournament child-flight creation, qualifier relationship editor and TOC checkbox matrix are not yet as deep as production's large multi-form editor.
2. Article associated-player control currently accepts profile UUIDs; production-style name search/Select2 remains to be added.
3. Article and email-template media metadata tables exist, but direct storage upload/variant processing and attachment upload UI are not yet wired.
4. External email/SMS transport is intentionally suppressed in staging. Production cutover still requires provider workers, rate limits, retries, suppression handling and delivery-outcome QA.
5. Profile-to-custom-admin-role assignment needs a dedicated operator UI; this batch delivers role definitions, permission matrices and server enforcement.
6. Production Email Templates and Internal Notifications browser routes hung during reference capture; template behavior was source-inspected. The production SQL dump contains no `mail_templates` rows.

## Gates

- Site tests: 104 passed
- Tournament engine: 31 passed
- Supabase migrations: 30 passed
- Full private import: passed
- TypeScript: passed
- Next production build: passed
- Vercel: passed
- Supabase Preview: passed
