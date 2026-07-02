#!/usr/bin/env python3
"""Build DPT media migration manifest and local sample assets.

Reads apps/site/data/dpt-public.json, lists every production media URL referenced
by the SQL-backed public dataset, validates URLs, and downloads a bounded sample
set to apps/site/public/media/dpt/ so the replacement site can prefer local
assets where available and fall back to the live production URL otherwise.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import re
import shutil
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'apps/site/data/dpt-public.json'
MANIFEST_PATH = ROOT / 'apps/site/data/dpt-media-manifest.json'
PUBLIC_ROOT = ROOT / 'apps/site/public'
LOCAL_MEDIA_ROOT = PUBLIC_ROOT / 'media/dpt'
REPORT_PATH = ROOT / 'reports/dpt-media-migration-report.md'

USER_AGENT = 'Mozilla/5.0 DPT migration media manifest'
# Full local copy mode: download every valid asset referenced by the manifest.
# This is still a local-only copy under apps/site/public/media/dpt/; no AWS/Supabase writes.
SAMPLE_LIMITS = {
    'logo': 9999,
    'event': 9999,
    'tournament': 9999,
    'article': 9999,
    'venue': 9999,
    'profile': 9999,
    'other': 9999,
}


def infer_type(url: str) -> str:
    path = urlparse(url).path
    if '/images/logo' in path:
        return 'logo'
    if '/storage/event/' in path:
        return 'event'
    if '/storage/tournament/' in path:
        return 'tournament'
    if '/storage/article/' in path:
        return 'article'
    if '/storage/venue/' in path:
        return 'venue'
    if '/storage/profile/' in path:
        return 'profile'
    return 'other'


def safe_filename(url: str) -> str:
    raw = unquote(Path(urlparse(url).path).name) or 'asset'
    return re.sub(r'[^A-Za-z0-9._()\-]+', '-', raw)


def public_path_for(url: str) -> str:
    kind = infer_type(url)
    return f'/media/dpt/{kind}/{safe_filename(url)}'


def local_path_for(url: str) -> Path:
    return PUBLIC_ROOT / public_path_for(url).lstrip('/')


def add_ref(refs: dict[str, dict], url: str | None, source_type: str, source_id: object, source_name: str | None, field: str) -> None:
    if not url:
        return
    url = str(url).strip()
    if not url.startswith(('http://', 'https://')):
        return
    entry = refs.setdefault(url, {
        'sourceUrl': url,
        'assetType': infer_type(url),
        'filename': safe_filename(url),
        'suggestedPublicPath': public_path_for(url),
        'downloaded': False,
        'status': None,
        'contentType': None,
        'contentLength': None,
        'error': None,
        'references': [],
    })
    entry['references'].append({
        'sourceType': source_type,
        'sourceId': source_id,
        'sourceName': source_name,
        'field': field,
    })


def collect_refs(data: dict) -> dict[str, dict]:
    refs: dict[str, dict] = {}
    add_ref(refs, 'https://dakotapokertour.com/images/logo.png', 'site', 'logo', 'Dakota Poker Tour logo', 'logo')
    for event in data.get('events', []):
        add_ref(refs, event.get('imageUrl'), 'event', event.get('id'), event.get('name'), 'imageUrl')
        add_ref(refs, event.get('bannerUrl'), 'event', event.get('id'), event.get('name'), 'bannerUrl')
    for tournament in data.get('tournaments', []):
        add_ref(refs, tournament.get('imageUrl'), 'tournament', tournament.get('id'), tournament.get('name'), 'imageUrl')
        add_ref(refs, tournament.get('bannerUrl'), 'tournament', tournament.get('id'), tournament.get('name'), 'bannerUrl')
    for article in data.get('articles', []):
        add_ref(refs, article.get('imageUrl'), 'article', article.get('id'), article.get('title'), 'imageUrl')
        add_ref(refs, article.get('bannerUrl'), 'article', article.get('id'), article.get('title'), 'bannerUrl')
    for venue in data.get('venues', []):
        add_ref(refs, venue.get('imageUrl'), 'venue', venue.get('id'), venue.get('name'), 'imageUrl')
        add_ref(refs, venue.get('bannerUrl'), 'venue', venue.get('id'), venue.get('name'), 'bannerUrl')
    for player in data.get('leaderboard', []):
        add_ref(refs, player.get('avatarUrl'), 'profile', player.get('playerId'), player.get('name'), 'avatarUrl')
    return refs


def request(url: str, method: str = 'HEAD'):
    req = urllib.request.Request(url, method=method, headers={'User-Agent': USER_AGENT})
    return urllib.request.urlopen(req, timeout=12)


def validate(entry: dict) -> None:
    url = entry['sourceUrl']
    try:
        with request(url, 'HEAD') as response:
            entry['status'] = response.status
            entry['contentType'] = response.headers.get('content-type')
            length = response.headers.get('content-length')
            entry['contentLength'] = int(length) if length and length.isdigit() else None
            entry['error'] = None
            return
    except Exception:
        # Some endpoints disallow HEAD. Try a GET open without persisting body.
        try:
            with request(url, 'GET') as response:
                entry['status'] = response.status
                entry['contentType'] = response.headers.get('content-type')
                length = response.headers.get('content-length')
                entry['contentLength'] = int(length) if length and length.isdigit() else None
                entry['error'] = None
                return
        except Exception as exc:
            entry['status'] = getattr(exc, 'code', None)
            entry['error'] = f'{type(exc).__name__}: {exc}'


def download(entry: dict) -> None:
    if entry.get('status') != 200:
        return
    destination = local_path_for(entry['sourceUrl'])
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with request(entry['sourceUrl'], 'GET') as response, destination.open('wb') as fh:
            shutil.copyfileobj(response, fh)
        entry['downloaded'] = True
        entry['localPublicPath'] = entry['suggestedPublicPath']
        entry['localBytes'] = destination.stat().st_size
    except Exception as exc:
        entry['downloaded'] = False
        entry['downloadError'] = f'{type(exc).__name__}: {exc}'


def write_report(manifest: dict) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    entries = manifest['assets']
    by_type = defaultdict(list)
    for entry in entries:
        by_type[entry['assetType']].append(entry)
    lines = ['# DPT Media Migration Report', '', f"Generated: {manifest['generatedAt']}", '']
    lines.append('## Summary')
    lines.append('')
    lines.append(f"- Total unique production asset URLs: {manifest['summary']['totalAssets']}")
    lines.append(f"- Valid HTTP 200 assets: {manifest['summary']['validAssets']}")
    lines.append(f"- Missing/broken assets: {manifest['summary']['brokenAssets']}")
    lines.append(f"- Downloaded local assets: {manifest['summary']['downloadedSamples']}")
    lines.append('')
    lines.append('## By type')
    lines.append('')
    lines.append('| Type | Total | Valid | Downloaded local assets |')
    lines.append('|---|---:|---:|---:|')
    for kind in sorted(by_type):
        items = by_type[kind]
        lines.append(f"| `{kind}` | {len(items)} | {sum(1 for item in items if item.get('status') == 200)} | {sum(1 for item in items if item.get('downloaded'))} |")
    broken = [entry for entry in entries if entry.get('status') != 200]
    lines.append('')
    lines.append('## Broken/missing assets')
    lines.append('')
    if broken:
        lines.append('| Status | Type | URL | First reference |')
        lines.append('|---:|---|---|---|')
        for entry in broken[:100]:
            first = entry['references'][0] if entry['references'] else {}
            lines.append(f"| {entry.get('status') or ''} | `{entry['assetType']}` | {entry['sourceUrl']} | {first.get('sourceType')} {first.get('sourceName')} |")
    else:
        lines.append('No broken assets detected in validation pass.')
    lines.append('')
    lines.append('## Local media path')
    lines.append('')
    lines.append('```text')
    lines.append('apps/site/public/media/dpt/')
    lines.append('```')
    lines.append('')
    lines.append('## Next migration path')
    lines.append('')
    lines.append('Copy every valid `sourceUrl` to the matching `suggestedPublicPath` in our new-stack storage bucket, then rewrite the manifest generation to point `localPublicPath` at the new bucket/CDN path.')
    REPORT_PATH.write_text('\n'.join(lines))


def main() -> None:
    data = json.loads(DATA_PATH.read_text())
    refs = collect_refs(data)
    entries = list(refs.values())

    for entry in entries:
        validate(entry)

    downloaded_by_type: dict[str, int] = defaultdict(int)
    for entry in entries:
        kind = entry['assetType']
        if downloaded_by_type[kind] >= SAMPLE_LIMITS.get(kind, 0):
            continue
        if entry.get('status') == 200:
            download(entry)
            if entry.get('downloaded'):
                downloaded_by_type[kind] += 1

    manifest = {
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'sourceData': str(DATA_PATH.relative_to(ROOT)),
        'localMediaRoot': 'apps/site/public/media/dpt',
        'summary': {
            'totalAssets': len(entries),
            'validAssets': sum(1 for entry in entries if entry.get('status') == 200),
            'brokenAssets': sum(1 for entry in entries if entry.get('status') != 200),
            'downloadedSamples': sum(1 for entry in entries if entry.get('downloaded')),
        },
        'sampleLimits': SAMPLE_LIMITS,
        'assets': entries,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    write_report(manifest)
    print(json.dumps({
        'manifest': str(MANIFEST_PATH),
        'report': str(REPORT_PATH),
        **manifest['summary'],
    }, indent=2))


if __name__ == '__main__':
    main()
