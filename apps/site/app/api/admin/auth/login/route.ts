import { NextRequest, NextResponse } from 'next/server';
import { DPT_ADMIN_ACCESS_COOKIE, DPT_ADMIN_REFRESH_COOKIE, getDptAdminAuthConfig, type DptAdminAccount } from '../../../../../lib/dpt-admin-auth';
import { buildSupabaseHeaders } from '../../../../../lib/supabase-http';

function loginRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(error)}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const config = getDptAdminAuthConfig();
  if (!config) return loginRedirect(request, 'configuration');

  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  const requestedNext = String(form.get('next') || '/admin');
  const next = requestedNext.startsWith('/admin') && !requestedNext.startsWith('//') ? requestedNext : '/admin';
  if (!email || !password) return loginRedirect(request, 'invalid');

  const tokenResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: buildSupabaseHeaders(config.anonKey, undefined, true),
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  if (!tokenResponse.ok) return loginRedirect(request, 'invalid');

  const token = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id?: string };
  };
  if (!token.access_token || !token.refresh_token || !token.user?.id) return loginRedirect(request, 'invalid');

  const query = new URLSearchParams({
    select: 'legacy_user_id,role_name,can_view_admin,is_active',
    auth_user_id: `eq.${token.user.id}`,
    can_view_admin: 'eq.true',
    is_active: 'eq.true',
    limit: '1',
  });
  const accountResponse = await fetch(`${config.url}/rest/v1/dpt_admin_accounts?${query}`, {
    headers: buildSupabaseHeaders(config.anonKey, token.access_token),
    cache: 'no-store',
  });
  if (!accountResponse.ok) return loginRedirect(request, 'unauthorized');
  const accounts = (await accountResponse.json()) as DptAdminAccount[];
  if (!accounts[0]?.can_view_admin || !accounts[0].is_active) return loginRedirect(request, 'unauthorized');

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  const secure = process.env.NODE_ENV === 'production';
  const accessMaxAge = Math.max(60, Number(token.expires_in || 3600));
  const refreshMaxAge = form.get('remember') === '1' ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  response.cookies.set(DPT_ADMIN_ACCESS_COOKIE, token.access_token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: accessMaxAge });
  response.cookies.set(DPT_ADMIN_REFRESH_COOKIE, token.refresh_token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });
  return response;
}
