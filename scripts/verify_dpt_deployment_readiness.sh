#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "Environment discovery"
printf 'node: '; node --version
printf 'npm: '; npm --version
printf 'supabase: '; npx supabase --version || true
printf 'docker: '; docker --version 2>/dev/null || echo 'not available'
printf 'psql: '; psql --version 2>/dev/null || echo 'not available'

log "Generate public seed SQL"
npm run dpt:seed:public

log "Validate schema/seed in local embedded Postgres-compatible runtime"
npm run dpt:db:validate

log "Generate final media storage plan"
npm run dpt:media:storage-plan

log "Verify JSON fallback mode tests"
DPT_DATA_SOURCE=json npm --workspace apps/site test

log "Verify JSON fallback mode type safety"
DPT_DATA_SOURCE=json npm --workspace apps/site run typecheck

log "Verify Supabase source mode type safety without credentials"
DPT_DATA_SOURCE=supabase npm --workspace apps/site run typecheck

log "Build public site"
DPT_DATA_SOURCE=json npm --workspace apps/site run build

if [[ -n "${DPT_VERIFY_HTTP_URL:-}" ]]; then
  log "Optional HTTP route smoke checks against ${DPT_VERIFY_HTTP_URL}"
  python3 - <<'PY'
import json
import os
import subprocess
from pathlib import Path
base = os.environ['DPT_VERIFY_HTTP_URL'].rstrip('/')
data = json.loads(Path('apps/site/data/dpt-public.json').read_text())
routes = {
 '/': 'Player of the Year',
 '/events': 'All Events',
 f"/events/{data['events'][0]['alias']}": 'Event Schedule',
 f"/tournaments/{data['tournaments'][0]['alias']}": 'Tournament Info',
 '/leaderboard': 'Player of the Year Leaderboard',
 '/venues': 'Tournament host venues',
 '/news': 'Latest News',
 '/videos': 'Tri-State Championship Day 1',
 '/champions': 'Recent Champions',
 '/players': 'Public player leaderboard tiles',
 '/login': 'Account authentication',
}
for route, needle in routes.items():
    html = subprocess.check_output(['curl', '-s', '--max-time', '10', base + route], text=True)
    assert needle in html, f'{needle} missing from {route}'
print(f'HTTP route smoke checks passed: {len(routes)}')
PY
else
  log "Optional HTTP route smoke checks skipped"
  echo "Set DPT_VERIFY_HTTP_URL=http://127.0.0.1:3001 after starting dev to include route checks."
fi

log "Readiness verification complete"
