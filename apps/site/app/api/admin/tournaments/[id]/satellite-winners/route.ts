import { NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_make_satellite_winners', {
    method: 'POST',
    body: JSON.stringify({ p_tournament_id: tournamentId }),
  });
  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: 'Unable to assign satellite winners', detail }, { status: response.status });
  }

  return NextResponse.json({ result: await response.json() });
}
