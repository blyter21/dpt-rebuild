import { describe, expect, it } from 'vitest';
import { adminApiRuntimeConfig, readAdminApiRuntimeConfig } from '../lib/admin-api-config';

describe('admin API runtime config', () => {
  it('defaults to safe local mock-route transport', () => {
    expect(adminApiRuntimeConfig.activeTransport).toBe('mock-route');
    expect(adminApiRuntimeConfig.clientConfig).toEqual({ transport: 'mock-route' });
    expect(adminApiRuntimeConfig.safeMode).toBe(true);
  });

  it('does not enable Supabase when only the transport name is requested', () => {
    const config = readAdminApiRuntimeConfig({
      NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT: 'supabase-rpc'
    });

    expect(config.activeTransport).toBe('mock-route');
    expect(config.safeMode).toBe(true);
    expect(config.reason).toContain('ignored');
  });

  it('requires explicit enable flag before selecting supabase-rpc placeholder', () => {
    const config = readAdminApiRuntimeConfig({
      NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT: 'supabase-rpc',
      NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test'
    });

    expect(config.activeTransport).toBe('supabase-rpc');
    expect(config.safeMode).toBe(false);
    expect(config.clientConfig).toMatchObject({
      transport: 'supabase-rpc',
      supabase: {
        enabled: true,
        projectUrl: 'http://localhost:54321',
        anonKey: 'anon-test'
      }
    });
  });
});
