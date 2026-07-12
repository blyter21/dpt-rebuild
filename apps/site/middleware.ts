import { NextRequest, NextResponse } from 'next/server';
import { buildSupabaseHeaders } from './lib/supabase-http';

const ACCESS_COOKIE = 'dpt_admin_access_token';

function readOnlyAdminReviewEnabled() {
  return process.env.DPT_ADMIN_REVIEW_MODE === 'public' || process.env.DPT_DATA_SOURCE !== 'supabase';
}

function adminLoginRedirect(request: NextRequest) {
  const login = new URL('/admin/login', request.url);
  login.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/admin/login') return NextResponse.next();
  if (readOnlyAdminReviewEnabled()) return NextResponse.next();

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!url || !anonKey || !accessToken) return adminLoginRedirect(request);

  const baseUrl = url.replace(/\/$/, '');
  const userResponse = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: buildSupabaseHeaders(anonKey, accessToken),
    cache: 'no-store',
  });
  if (!userResponse.ok) return adminLoginRedirect(request);
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) return adminLoginRedirect(request);

  const query = new URLSearchParams({
    select: 'auth_user_id',
    auth_user_id: `eq.${user.id}`,
    can_view_admin: 'eq.true',
    is_active: 'eq.true',
    limit: '1',
  });
  const accountResponse = await fetch(`${baseUrl}/rest/v1/dpt_admin_accounts?${query}`, {
    headers: buildSupabaseHeaders(anonKey, accessToken),
    cache: 'no-store',
  });
  if (!accountResponse.ok) return adminLoginRedirect(request);
  const accounts = (await accountResponse.json()) as Array<{ auth_user_id?: string }>;
  if (!accounts[0]?.auth_user_id) return adminLoginRedirect(request);

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
