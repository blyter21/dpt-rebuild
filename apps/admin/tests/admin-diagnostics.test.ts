import { describe, expect, it } from 'vitest';
import { adminRpcNames } from '../lib/admin-api-contracts';
import { readAdminApiRuntimeConfig } from '../lib/admin-api-config';
import { getAdminDiagnostics } from '../lib/admin-diagnostics';
import { GET } from '../app/api/dpt/diagnostics/route';

describe('admin diagnostics', () => {
  it('reports safe default diagnostics without exposing secrets', () => {
    const diagnostics = getAdminDiagnostics(readAdminApiRuntimeConfig());

    expect(diagnostics).toMatchObject({
      ok: true,
      activeTransport: 'mock-route',
      safeMode: true,
      rpcCount: adminRpcNames.length,
      testMode: {
        mockRoute: true,
        supabaseRpcSelected: false,
        supabaseTransportReady: false
      },
      supabase: {
        hasProjectUrl: false,
        hasAnonKey: false,
        exposesSecrets: false
      }
    });
    expect(diagnostics.supportedRpcs).toContain('dpt_check_in_player');
  });

  it('reports Supabase config presence as booleans only', () => {
    const diagnostics = getAdminDiagnostics(readAdminApiRuntimeConfig({
      NEXT_PUBLIC_DPT_ADMIN_API_TRANSPORT: 'supabase-rpc',
      NEXT_PUBLIC_DPT_ENABLE_SUPABASE_TRANSPORT: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'secret-test-key'
    }));

    expect(diagnostics.activeTransport).toBe('supabase-rpc');
    expect(diagnostics.supabase.hasProjectUrl).toBe(true);
    expect(diagnostics.supabase.hasAnonKey).toBe(true);
    expect(JSON.stringify(diagnostics)).not.toContain('secret-test-key');
  });

  it('GET /api/dpt/diagnostics returns diagnostics JSON', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.activeTransport).toBe('mock-route');
    expect(payload.supportedRpcs).toContain('dpt_add_tournament_addon');
    expect(payload.supabase.exposesSecrets).toBe(false);
  });
});
