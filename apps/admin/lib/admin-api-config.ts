import type { AdminApiClientConfig, AdminApiTransport } from './admin-api-client';

export type AdminApiRuntimeConfig = {
  activeTransport: AdminApiTransport;
  clientConfig: AdminApiClientConfig;
  label: string;
  safeMode: boolean;
  reason: string;
};

export type AdminApiEnvironment = {
  NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT?: string;
  NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export function readAdminApiRuntimeConfig(env: AdminApiEnvironment = {}): AdminApiRuntimeConfig {
  const requestedTransport = env.NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT;
  const explicitlyEnabled = env.NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT === 'true';

  if (requestedTransport === 'supabase-rpc' && explicitlyEnabled) {
    return {
      activeTransport: 'supabase-rpc',
      clientConfig: {
        transport: 'supabase-rpc',
        supabase: {
          enabled: true,
          projectUrl: env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      },
      label: 'supabase-rpc',
      safeMode: false,
      reason: 'Supabase RPC transport explicitly requested and enabled. Adapter/credentials must be supplied before live use.'
    };
  }

  if (requestedTransport === 'supabase-rpc' && !explicitlyEnabled) {
    return {
      activeTransport: 'mock-route',
      clientConfig: { transport: 'mock-route' },
      label: 'mock-route',
      safeMode: true,
      reason: 'Supabase RPC was requested but ignored because NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT is not true.'
    };
  }

  return {
    activeTransport: 'mock-route',
    clientConfig: { transport: 'mock-route' },
    label: 'mock-route',
    safeMode: true,
    reason: 'Safe local mock-route transport is active by default.'
  };
}

export const adminApiRuntimeConfig = readAdminApiRuntimeConfig({
  NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT: process.env.NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT,
  NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT: process.env.NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});
