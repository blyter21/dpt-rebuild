import { describe, expect, it } from 'vitest';
import { adminRpcNames } from '../lib/admin-api-contracts';
import { GET } from '../app/api/dpt/route';

describe('Next route handler /api/dpt index', () => {
  it('returns supported RPC names and links without requiring a specific rpc path', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      name: 'DPT Admin Mock API',
      activeTransport: 'mock-route',
      safeMode: true,
      rpcCount: adminRpcNames.length,
      endpoints: {
        index: '/api/dpt',
        diagnostics: '/api/dpt/diagnostics',
        rpcPattern: '/api/dpt/[rpc]',
        rpcExample: '/api/dpt/dpt_check_in_player'
      },
      diagnostics: {
        href: '/api/dpt/diagnostics',
        supabaseTransportReady: false,
        exposesSecrets: false
      }
    });
    expect(payload.supportedRpcs).toContain('dpt_check_in_player');
    expect(payload.supportedRpcs).toContain('dpt_undo_flight_advancement');
    expect(JSON.stringify(payload)).not.toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});
