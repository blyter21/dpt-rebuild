import { NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_tournament_reset_preview', {
    method: 'POST', body: JSON.stringify({ p_tournament_id: tournamentId }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Unable to preview tournament reset', detail: await response.text() }, { status: response.status });
  return NextResponse.json({ preview: await response.json() });
}
