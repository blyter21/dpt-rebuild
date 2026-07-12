import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildSupabaseHeaders } from './supabase-http';

export const DPT_ADMIN_ACCESS_COOKIE = 'dpt_admin_access_token';
export const DPT_ADMIN_REFRESH_COOKIE = 'dpt_admin_refresh_token';

export type DptAdminAccount = {
  legacy_user_id: number;
  role_name: 'super admin' | 'administrator' | 'host' | 'venue';
  can_view_admin: boolean;
  is_active: boolean;
};

export type DptAdminSession = {
  user: { id: string; email?: string };
  account: DptAdminAccount;
  mode: 'authenticated' | 'read-only-review';
};

export function getDptAdminAuthConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

export function isDptAdminAuthConfigured() {
  return Boolean(getDptAdminAuthConfig());
}

export function isDptAdminReadOnlyReviewEnabled() {
  return process.env.DPT_ADMIN_REVIEW_MODE === 'public' || process.env.DPT_DATA_SOURCE !== 'supabase';
}

function getDptAdminReviewSession(): DptAdminSession {
  return {
    user: { id: 'read-only-review', email: 'review@dakotapokertour.local' },
    account: {
      legacy_user_id: 0,
      role_name: 'administrator',
      can_view_admin: true,
      is_active: true,
    },
    mode: 'read-only-review',
  };
}

export async function getDptAdminSession(): Promise<DptAdminSession | null> {
  if (isDptAdminReadOnlyReviewEnabled()) return getDptAdminReviewSession();

  const config = getDptAdminAuthConfig();
  const accessToken = cookies().get(DPT_ADMIN_ACCESS_COOKIE)?.value;
  if (!config || !accessToken) return null;

  const userResponse = await fetch(`${config.url}/auth/v1/user`, {
    headers: buildSupabaseHeaders(config.anonKey, accessToken),
    cache: 'no-store',
  });
  if (!userResponse.ok) return null;
  const user = (await userResponse.json()) as { id?: string; email?: string };
  if (!user.id) return null;

  const query = new URLSearchParams({
    select: 'legacy_user_id,role_name,can_view_admin,is_active',
    auth_user_id: `eq.${user.id}`,
    can_view_admin: 'eq.true',
    is_active: 'eq.true',
    limit: '1',
  });
  const accountResponse = await fetch(`${config.url}/rest/v1/dpt_admin_accounts?${query}`, {
    headers: buildSupabaseHeaders(config.anonKey, accessToken),
    cache: 'no-store',
  });
  if (!accountResponse.ok) return null;
  const accounts = (await accountResponse.json()) as DptAdminAccount[];
  if (!accounts[0]?.can_view_admin || !accounts[0].is_active) return null;

  return { user: { id: user.id, email: user.email }, account: accounts[0], mode: 'authenticated' };
}

export async function requireDptAdminSession() {
  const session = await getDptAdminSession();
  if (!session) redirect('/admin/login?next=/admin');
  return session;
}
