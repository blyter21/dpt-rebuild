import { NextRequest, NextResponse } from 'next/server';
import { getDptAdminAuthConfig, isSameOriginRequest, safeAdminNext, setDptAdminCookies, type DptAdminAccount } from '../../../../../lib/dpt-admin-auth';
import { buildSupabaseHeaders } from '../../../../../lib/supabase-http';

function failure(status: number) {
  return NextResponse.json({ error: 'Unable to complete sign-in.' }, { status });
}

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 8192;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request) || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return failure(403);
  const config = getDptAdminAuthConfig();
  if (!config) return failure(503);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return failure(400);
  }
  const allowedKeys = new Set(['access_token', 'refresh_token', 'expires_in', 'type', 'next']);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) return failure(400);
  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, type } = body;
  if (!validToken(accessToken) || !validToken(refreshToken) || type !== 'magiclink' || typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) return failure(400);

  const userResponse = await fetch(`${config.url}/auth/v1/user`, { headers: buildSupabaseHeaders(config.anonKey, accessToken), cache: 'no-store' });
  if (!userResponse.ok) return failure(401);
  const user = await userResponse.json() as { id?: string };
  if (!user.id) return failure(401);

  const query = new URLSearchParams({ select: 'legacy_user_id,role_name,can_view_admin,is_active', auth_user_id: `eq.${user.id}`, can_view_admin: 'eq.true', is_active: 'eq.true', limit: '1' });
  const accountResponse = await fetch(`${config.url}/rest/v1/dpt_admin_accounts?${query}`, { headers: buildSupabaseHeaders(config.anonKey, accessToken), cache: 'no-store' });
  if (!accountResponse.ok) return failure(403);
  const accounts = await accountResponse.json() as DptAdminAccount[];
  if (!accounts[0]?.can_view_admin || !accounts[0].is_active) return failure(403);

  const response = NextResponse.json({ next: safeAdminNext(body.next) });
  setDptAdminCookies(response, accessToken, refreshToken, expiresIn);
  return response;
}
