# DPT Media Storage Migration Plan Verification

## Scope

Create final media-storage migration planning artifacts for Supabase Storage or a Vercel/public CDN without uploading assets.

## Safety

```text
No upload performed
No Supabase project linked
No Vercel deploy
No production mutation
```

## Added

```text
scripts/build_dpt_media_storage_plan.py
apps/site/data/dpt-media-storage-manifest.json
reports/dpt-media-storage-migration-plan.md
reports/dpt-media-upload-commands.jsonl
```

## Manifest result

```text
totalFiles: 312
totalBytes: 15,992,956
bucket: dpt-public-media
baseUrlEnv: NEXT_PUBLIC_DPT_MEDIA_BASE_URL
mode: dry-run/no-upload
```

By type:

| Type | Files | Bytes |
|---|---:|---:|
| article | 78 | 203,189 |
| event | 59 | 5,185,507 |
| logo | 1 | 16,196 |
| profile | 25 | 523,529 |
| slider | 1 | 22,569 |
| tournament | 72 | 6,328,440 |
| venue | 74 | 3,655,101 |
| video | 2 | 58,425 |

The count is 312 because it includes:

```text
309 valid copied production media assets
1 live slider hero asset
2 local YouTube thumbnail assets
```

## Path mapping

Local path:

```text
/media/dpt/event/example.png
```

Final object path:

```text
dpt-public-media/event/example.png
```

Future CDN env:

```text
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.com/dpt-public-media
```

Future rendered URL:

```text
https://cdn.example.com/dpt-public-media/event/example.png
```

## Upload command templates

Generated:

```text
reports/dpt-media-upload-commands.jsonl
```

These are command templates only and include a literal placeholder:

```text
<UPLOAD_AUTH_HEADER>
```

No command was executed.

## Runtime media abstraction

Updated:

```text
apps/site/lib/dpt-data.ts
```

Added:

```ts
publicMediaUrl(localPublicPath)
```

Behavior:

```text
NEXT_PUBLIC_DPT_MEDIA_BASE_URL unset/blank -> keep /media/dpt/... local path
NEXT_PUBLIC_DPT_MEDIA_BASE_URL set -> rewrite /media/dpt/... to CDN/base URL
```

Updated hero/video local paths to pass through the helper.

## Verification

Ran:

```bash
python3 scripts/build_dpt_media_storage_plan.py
npm --workspace apps/site test
npm --workspace apps/site run typecheck
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.test/dpt-public-media npm --workspace apps/site run typecheck
npm run dpt:verify:public
```

Actual result:

```text
Site tests: 10 passed
Typecheck: passed
Supabase-mode typecheck: passed
CDN-base env typecheck: passed
Readiness verifier: passed
Build: passed
```

After build, restarted dev cleanly and ran route/media smoke:

```text
routes: 11
localImages: 33
remoteStorageImages: 0
cdnExamplePresent: false
```

Browser DOM check:

```text
hero present: true
POY strip present: true
local images: 33
remote storage images: 0
cdn example images: 0
```

Current process:

```text
proc_8b89621f1b51
```
