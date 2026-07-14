import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  let body: { playerId?: unknown; preRegistered?: unknown };
  try {
    body = await request.json() as { playerId?: unknown; preRegistered?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
  if (!uuidPattern.test(playerId)) {
    return NextResponse.json({ error: 'A valid player ID is required' }, { status: 400 });
  }
  if (body.preRegistered !== undefined && typeof body.preRegistered !== 'boolean') {
    return NextResponse.json({ error: 'preRegistered must be boolean' }, { status: 400 });
  }

  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_register_entry', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_player_id: playerId,
      p_pre_registered: body.preRegistered ?? true,
    }),
  });

  if (!response.ok) {
    const status = response.status === 404 ? 404 : 409;
    return NextResponse.json({ error: 'Player could not be registered' }, { status });
  }

  return NextResponse.json({ entry: await response.json() }, { status: 201 });
}
