import { NextRequest, NextResponse } from 'next/server';
import { DPT_ADMIN_ACCESS_COOKIE, DPT_ADMIN_REFRESH_COOKIE, getDptAdminAuthConfig } from '../../../../../lib/dpt-admin-auth';
import { buildSupabaseHeaders } from '../../../../../lib/supabase-http';

export async function POST(request: NextRequest) {
  const config = getDptAdminAuthConfig();
  const accessToken = request.cookies.get(DPT_ADMIN_ACCESS_COOKIE)?.value;
  if (config && accessToken) {
    await fetch(`${config.url}/auth/v1/logout`, {
      method: 'POST',
      headers: buildSupabaseHeaders(config.anonKey, accessToken),
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303);
  response.cookies.set(DPT_ADMIN_ACCESS_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(DPT_ADMIN_REFRESH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
