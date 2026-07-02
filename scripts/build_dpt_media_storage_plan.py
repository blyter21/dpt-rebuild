#!/usr/bin/env python3
"""Create final DPT media storage migration plan without uploading.

Inputs:
- apps/site/data/dpt-media-manifest.json
- apps/site/public/media/dpt/**

Outputs:
- apps/site/data/dpt-media-storage-manifest.json
- reports/dpt-media-storage-migration-plan.md
- reports/dpt-media-upload-commands.jsonl

No network writes. No Supabase/Vercel mutations.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any
import hashlib
import json
import mimetypes

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / 'apps/site/public'
MEDIA_ROOT = PUBLIC_ROOT / 'media/dpt'
SOURCE_MANIFEST = ROOT / 'apps/site/data/dpt-media-manifest.json'
OUT_MANIFEST = ROOT / 'apps/site/data/dpt-media-storage-manifest.json'
OUT_REPORT = ROOT / 'reports/dpt-media-storage-migration-plan.md'
OUT_COMMANDS = ROOT / 'reports/dpt-media-upload-commands.jsonl'
BUCKET = 'dpt-public-media'
BASE_ENV = 'NEXT_PUBLIC_DPT_MEDIA_BASE_URL'


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_source_assets() -> dict[str, dict[str, Any]]:
    data = json.loads(SOURCE_MANIFEST.read_text())
    by_local = {}
    for asset in data.get('assets', []):
        local = asset.get('localPublicPath')
        if local:
            by_local[local] = asset
    return by_local


def classify(rel: str) -> str:
    return rel.split('/', 1)[0] if '/' in rel else 'misc'


def main() -> None:
    source_by_local = load_source_assets()
    files = sorted(p for p in MEDIA_ROOT.rglob('*') if p.is_file())
    assets: list[dict[str, Any]] = []
    command_rows: list[dict[str, Any]] = []

    for path in files:
        rel = path.relative_to(MEDIA_ROOT).as_posix()
        public_path = '/media/dpt/' + rel
        source = source_by_local.get(public_path, {})
        content_type = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        asset_type = source.get('assetType') or classify(rel)
        object_path = rel
        cdn_url_template = f'${{{BASE_ENV}}}/{object_path}'
        supabase_public_url_template = f'${{NEXT_PUBLIC_SUPABASE_URL}}/storage/v1/object/public/{BUCKET}/{object_path}'
        item = {
            'assetType': asset_type,
            'filename': path.name,
            'localFile': str(path.relative_to(ROOT)),
            'localPublicPath': public_path,
            'bucket': BUCKET,
            'objectPath': object_path,
            'storagePublicPath': f'/{BUCKET}/{object_path}',
            'cdnUrlTemplate': cdn_url_template,
            'supabasePublicUrlTemplate': supabase_public_url_template,
            'contentType': content_type,
            'bytes': path.stat().st_size,
            'sha256': sha256(path),
            'sourceUrl': source.get('sourceUrl'),
            'sourceStatus': source.get('status'),
            'references': source.get('references') or [],
            'uploadCommandTemplate': ' '.join([
                'curl', '-f', '-X', 'POST',
                f'"${{SUPABASE_URL}}/storage/v1/object/{BUCKET}/{object_path}"',
                '-H', '"<UPLOAD_AUTH_HEADER>"',
                '-H', f'"Content-Type: {content_type}"',
                '--data-binary', f'"@{path.relative_to(ROOT).as_posix()}"',
            ]),
        }
        assets.append(item)
        command_rows.append({
            'localFile': item['localFile'],
            'bucket': BUCKET,
            'objectPath': object_path,
            'contentType': content_type,
            'bytes': item['bytes'],
            'sha256': item['sha256'],
            'commandTemplate': item['uploadCommandTemplate'],
        })

    by_type: dict[str, dict[str, int]] = {}
    total_bytes = 0
    for asset in assets:
        stats = by_type.setdefault(asset['assetType'], {'count': 0, 'bytes': 0})
        stats['count'] += 1
        stats['bytes'] += int(asset['bytes'])
        total_bytes += int(asset['bytes'])

    manifest = {
        'generatedBy': 'scripts/build_dpt_media_storage_plan.py',
        'mode': 'dry-run/no-upload',
        'bucket': BUCKET,
        'baseUrlEnv': BASE_ENV,
        'localRoot': 'apps/site/public/media/dpt',
        'summary': {
            'totalFiles': len(assets),
            'totalBytes': total_bytes,
            'byType': by_type,
        },
        'assets': assets,
    }

    OUT_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    OUT_COMMANDS.write_text('\n'.join(json.dumps(row, ensure_ascii=False) for row in command_rows) + '\n')

    type_rows = '\n'.join(f"| `{kind}` | {stats['count']} | {stats['bytes']:,} |" for kind, stats in sorted(by_type.items()))
    sample_rows = '\n'.join(
        f"| `{a['localPublicPath']}` | `{a['bucket']}` | `{a['objectPath']}` |"
        for a in assets[:12]
    )
    OUT_REPORT.write_text(f"""# DPT Media Storage Migration Plan

## Scope

Create the final media-storage migration plan for Supabase Storage or Vercel/public CDN without uploading anything.

## Safety

```text
No upload performed
No Supabase project linked
No Vercel deploy
No production mutation
```

## Outputs

```text
apps/site/data/dpt-media-storage-manifest.json
reports/dpt-media-upload-commands.jsonl
```

## Target storage shape

Default bucket:

```text
{BUCKET}
```

Object paths preserve the local public media structure after `/media/dpt/`:

```text
apps/site/public/media/dpt/event/example.png
        -> bucket: {BUCKET}
        -> object: event/example.png
```

Future CDN/base URL env:

```text
{BASE_ENV}=https://cdn.example.com/dpt-public-media
```

Then runtime URLs become:

```text
${{{BASE_ENV}}}/event/example.png
```

## Summary

```text
totalFiles: {len(assets)}
totalBytes: {total_bytes:,}
```

| Type | Files | Bytes |
|---|---:|---:|
{type_rows}

## Sample mappings

| Local public path | Bucket | Object path |
|---|---|---|
{sample_rows}

## Upload commands

Upload command templates are written to:

```text
reports/dpt-media-upload-commands.jsonl
```

They use placeholders and are **not executed**:

```text
SUPABASE_URL
UPLOAD_BEARER_TOKEN
```

A future approved upload loop should:

```text
1. Create/choose bucket {BUCKET}.
2. Confirm service-role usage is local/admin-only, never public frontend env.
3. Run upload commands against staging/preview first.
4. Set {BASE_ENV} to the final public base URL.
5. Run npm run dpt:verify:public.
```

## Vercel/public-CDN alternative

If staying on Vercel static assets for preview, no upload is required: current paths already serve from:

```text
/media/dpt/...
```

A CDN can mirror the same object paths and use `{BASE_ENV}` later.
""")

    print(json.dumps(manifest['summary'], indent=2))
    print(str(OUT_MANIFEST))
    print(str(OUT_COMMANDS))
    print(str(OUT_REPORT))


if __name__ == '__main__':
    main()
