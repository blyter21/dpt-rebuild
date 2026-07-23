import { NextRequest, NextResponse } from 'next/server';
import { getDptAdminAuthConfig, isSameOriginRequest, safeAdminNext } from '../../../../../lib/dpt-admin-auth';
import { buildSupabaseHeaders } from '../../../../../lib/supabase-http';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sentRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL('/admin/login?sent=1', request.url), 303);
}

export async function POST(request: NextRequest) {
  // Deliberately use the same reply for invalid, unknown, and known accounts.
  if (!isSameOriginRequest(request)) return sentRedirect(request);
  const config = getDptAdminAuthConfig();
  if (!config) return sentRedirect(request);

  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const next = safeAdminNext(String(form.get('next') || '/admin'));
  if (!EMAIL.test(email) || email.length > 254) return sentRedirect(request);

  const callback = new URL('/admin/auth/callback', request.url);
  callback.searchParams.set('next', next);
  try {
    await fetch(`${config.url}/auth/v1/otp?redirect_to=${encodeURIComponent(callback.toString())}`, {
      method: 'POST',
      headers: buildSupabaseHeaders(config.anonKey, undefined, true),
      body: JSON.stringify({ email, create_user: false }),
      cache: 'no-store',
    });
  } catch {
    // Keep the browser response generic and avoid exposing provider details.
  }
  return sentRedirect(request);
}
