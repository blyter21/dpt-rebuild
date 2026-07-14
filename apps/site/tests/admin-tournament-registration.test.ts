import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({
  getContext: vi.fn(),
  adminFetch: vi.fn(),
}));

vi.mock('../lib/dpt-admin-api', () => ({
  getDptAdminApiContext: getContext,
  dptAdminSupabaseFetch: adminFetch,
}));

import { POST } from '../app/api/admin/tournaments/[id]/entries/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};
const playerId = '11111111-1111-4111-8111-111111111111';

function invoke(body: unknown, tournamentId = '10') {
  const request = new NextRequest(`https://dpt.example.test/api/admin/tournaments/${tournamentId}/entries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(request, { params: { id: tournamentId } });
}

beforeEach(() => {
  getContext.mockReset();
  adminFetch.mockReset();
});

describe('authenticated tournament registration API', () => {
  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const response = await invoke({ playerId });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects invalid player IDs before calling Supabase', async () => {
    getContext.mockResolvedValue(context);
    const response = await invoke({ playerId: 'not-a-uuid' });
    expect(response.status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('registers through the atomic RPC with pre-registration enabled by default', async () => {
    getContext.mockResolvedValue(context);
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ id: 55, tournament_id: 10, player_id: playerId }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const response = await invoke({ playerId });

    expect(response.status).toBe(201);
    expect(adminFetch.mock.calls[0][1]).toBe('/rest/v1/rpc/dpt_admin_register_entry');
    expect(JSON.parse(String(adminFetch.mock.calls[0][2].body))).toEqual({
      p_tournament_id: 10,
      p_player_id: playerId,
      p_pre_registered: true,
    });
  });
});
