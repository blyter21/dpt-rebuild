# DPT next-three-loop authenticated acceptance — 2026-07-20

## Scope

1. Advanced child flights, qualifier relationships, TOC selection and copy safety
2. Private Supabase Storage media, image variants, associated-player lookup and granular profile role assignment
3. Staging-only simulated email/SMS delivery queue, suppression, attempts, retry, rate limiting and campaign history

Production remained strictly read-only. All mutations and lifecycle verification used `dpt-rebuild-staging`.

## Deployment

- Advanced tournament relationships: `b046629`
- Secure media and role assignment: `5ffe443`
- Notification simulator: `0ced5b4`
- Deployment retry/head: `2ae03bc`
- GitHub Vercel status: successful
- Supabase Preview: successful
- New protected campaign-detail route returns `401` anonymously, proving the deployed route and fail-closed boundary.

## Automated gates

- Site tests: 127 passed
- Tournament engine: 31 passed
- PGlite/RLS/privilege migration chain: 33 migrations passed
- Protected production-data import: passed
- TypeScript: passed
- Next production build: passed

## Loop 1 — advanced tournament relationships

Authenticated Chrome verified the deployed Flights, Qualifiers & Tournament of Champions editor with production labels and 277 relationship/TOC controls.

Rollback lifecycle verified:

- child flight creation and safe pre-runtime edit;
- production qualifier relationship normalization (58 rows);
- TOC type and explicit-tournament selections;
- relationship-safe tournament copy with zero copied relationship rows;
- unchanged runtime flight retention;
- runtime flight edit and removal rejection;
- zero persisted QA tournaments, entries, qualifiers, TOC rows or audits.

## Loop 2 — private media and operator UX

Hosted staging verified:

- private `dpt-admin-media` bucket;
- 10 MiB JPEG/PNG/WebP allowlist;
- four permission-bound Storage policies;
- zero public bucket access;
- real temporary PNG upload through authenticated Chrome/API;
- EXIF/metadata normalization and WebP original plus thumb/card/hero/logo variants;
- authenticated logo preview returned `200 image/webp`;
- private object keys were not exposed to the browser;
- reference-safe delete removed all five objects;
- QA asset/tombstone/audit cleanup left zero bucket objects and zero QA rows.

Authenticated Chrome also verified the restored full Article editor, name-based associated-player chips, media library/logo controls, publication/SEO/body fields, and the Player editor’s five granular admin-role controls.

## Loop 3 — staging-only delivery operations

Rollback lifecycle verified:

- preview writes: 0;
- deterministic recipient/suppression matrix;
- internal delivery records;
- transactional claim leases;
- email limit 30/minute, SMS limit 10/minute, batch max 25;
- immutable attempts;
- exponential retry and manual retry preserving attempt numbers;
- campaign completion and detail history;
- all delivery rows `simulated=true`;
- zero provider/network calls;
- zero rollback residue.

Final authenticated deployed Chrome acceptance used tournament 346:

- preview: 98 recipients, 5 eligible queued simulations, 191 suppressed, zero persisted rows;
- recorded QA campaign: 98 internal sent, 5 external simulated sent, 191 suppressed;
- attempt rows: 5;
- simulated provider IDs: 5;
- non-simulated external deliveries: 0;
- campaign status: completed;
- campaign history rendered recipient, channel, status, attempts, suppression reason and simulation ID;
- no browser errors;
- QA campaign, deliveries, attempts, inbox records, audits and rate windows were removed after acceptance.

Local-only browser evidence:

- `C:\Users\blyte\AppData\Local\Temp\dpt-final-notifications.png`
- `C:\Users\blyte\AppData\Local\Temp\dpt-final-campaign-before.png`
- `C:\Users\blyte\AppData\Local\Temp\dpt-final-campaign-after.png`

These screenshots are intentionally not committed because authenticated operational screens can contain private player information.

## Remaining deliberate boundaries

- No production email/SMS provider adapter or credentials exist in this implementation.
- No scheduled/cron live delivery worker is enabled; staging processing is manual and simulator-only.
- General non-image email attachments remain out of scope pending malware scanning and a separate document threat model.
