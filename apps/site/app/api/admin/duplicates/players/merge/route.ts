import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The database function authorizes and performs the all-or-nothing merge. */
export async function POST(request: NextRequest) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as { primary?: string; secondaries?: string[]; idempotency?: string; dryRun?: boolean } | null;
  if (!body || Object.keys(body).some((key) => !['primary','secondaries','idempotency','dryRun'].includes(key)) || !UUID.test(body.primary || '') || !UUID.test(body.idempotency || '') || !Array.isArray(body.secondaries) || !body.secondaries.length || body.secondaries.some((id) => !UUID.test(id)) || body.secondaries.includes(body.primary!) || new Set(body.secondaries).size !== body.secondaries.length || (body.dryRun !== undefined && typeof body.dryRun !== 'boolean')) {
    return NextResponse.json({ error: 'A primary player, one or more different secondary players, and an idempotency key are required.' }, { status: 400 });
  }
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_merge_players', {
    method: 'POST',
    body: JSON.stringify({ p_primary: body.primary, p_secondaries: [...new Set(body.secondaries)].sort(), p_idempotency: body.idempotency, p_dry_run: Boolean(body.dryRun) }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Player merge was rejected.' }, { status: response.status === 401 || response.status === 403 ? 403 : 422 });
  return NextResponse.json({ merge: await response.json() });
}
