import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = (request.nextUrl.searchParams.get('q') || '').trim();
  if (!/^[a-zA-Z0-9 '\-]{2,50}$/.test(query)) {
    return NextResponse.json({ error: 'Search requires 2–50 name characters' }, { status: 400 });
  }

  const params = new URLSearchParams({
    select: 'id,legacy_user_id,first_name,last_name,nick_name,avatar_url',
    or: `(first_name.ilike.*${query}*,last_name.ilike.*${query}*,nick_name.ilike.*${query}*)`,
    status: 'eq.active',
    deleted_at: 'is.null',
    order: 'last_name.asc.nullslast,first_name.asc.nullslast',
    limit: '25',
  });
  const response = await dptAdminSupabaseFetch(context, `/rest/v1/profiles?${params}`);
  if (!response.ok) return NextResponse.json({ error: 'Player search failed' }, { status: 502 });

  return NextResponse.json({ players: await response.json() });
}
