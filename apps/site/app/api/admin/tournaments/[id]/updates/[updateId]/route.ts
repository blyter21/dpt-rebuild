import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../lib/dpt-admin-api';
export const dynamic = 'force-dynamic';
const actions = new Set(['publish', 'unpublish', 'feature', 'unfeature', 'delete']);
export async function POST(request: NextRequest, { params }: { params: { id: string; updateId: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tournamentId = Number(params.id), updateId = Number(params.updateId);
  if (![tournamentId, updateId].every((id) => Number.isSafeInteger(id) && id > 0)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  let body: { action?: unknown }; try { body = await request.json() as { action?: unknown }; } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.action !== 'string' || !actions.has(body.action)) return NextResponse.json({ error: 'Invalid update action' }, { status: 400 });
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_set_tournament_update_state', { method: 'POST', body: JSON.stringify({ p_tournament_id: tournamentId, p_update_id: updateId, p_action: body.action }) });
  if (!response.ok) return NextResponse.json({ error: 'Live update state could not be changed' }, { status: response.status === 404 ? 404 : 409 });
  return NextResponse.json({ update: await response.json() });
}
