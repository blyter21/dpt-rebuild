import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

function validBody(value: unknown): value is { confirmationToken: string; confirmation: 'RESET' } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return Object.keys(body).length === 2
    && typeof body.confirmationToken === 'string' && /^[a-f0-9]{32}$/.test(body.confirmationToken)
    && body.confirmation === 'RESET';
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!validBody(body)) return NextResponse.json({ error: 'Confirmation must contain only confirmationToken and confirmation: RESET' }, { status: 400 });
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_reset_tournament', {
    method: 'POST', body: JSON.stringify({ p_tournament_id: tournamentId, p_confirmation_token: body.confirmationToken }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Unable to reset tournament', detail: await response.text() }, { status: response.status });
  return NextResponse.json({ result: await response.json() });
}
