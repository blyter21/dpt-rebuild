import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const closed = (body as { closed?: unknown })?.closed;
  if (typeof closed !== 'boolean') {
    return NextResponse.json({ error: 'closed must be a boolean' }, { status: 400 });
  }

  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_set_registration_state', {
    method: 'POST',
    body: JSON.stringify({ p_tournament_id: tournamentId, p_closed: closed }),
  });
  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: 'Unable to update registration state', detail }, { status: response.status });
  }

  return NextResponse.json({ tournament: await response.json() });
}
