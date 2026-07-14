import { cookies } from 'next/headers';
import {
  DPT_ADMIN_ACCESS_COOKIE,
  getDptAdminAuthConfig,
  getDptAdminSession,
  type DptAdminSession,
} from './dpt-admin-auth';
import { buildSupabaseHeaders } from './supabase-http';

export type DptAdminApiContext = {
  session: DptAdminSession;
  config: NonNullable<ReturnType<typeof getDptAdminAuthConfig>>;
  accessToken: string;
};

export async function getDptAdminApiContext(): Promise<DptAdminApiContext | null> {
  const config = getDptAdminAuthConfig();
  const accessToken = cookies().get(DPT_ADMIN_ACCESS_COOKIE)?.value;
  if (!config || !accessToken) return null;
  const session = await getDptAdminSession();
  if (!session) return null;
  return { session, config, accessToken };
}

export async function dptAdminSupabaseFetch(
  context: DptAdminApiContext,
  path: string,
  init: RequestInit = {},
) {
  const headers = buildSupabaseHeaders(context.config.anonKey, context.accessToken, Boolean(init.body));
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return fetch(`${context.config.url}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}
