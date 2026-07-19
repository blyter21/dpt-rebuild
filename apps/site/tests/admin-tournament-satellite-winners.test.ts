import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { POST } from '../app/api/admin/tournaments/[id]/satellite-winners/route';

function invoke(id = '346') {
  return POST(new NextRequest(`http://localhost/api/admin/tournaments/${id}/satellite-winners`, { method: 'POST' }), { params: { id } });
}

describe('admin satellite winner assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContext.mockResolvedValue({ accessToken: 'token' });
  });

  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const response = await invoke();
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid tournament ID before calling the RPC', async () => {
    const response = await invoke('0');
    expect(response.status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('calls the atomic satellite winner RPC without client-supplied ranks or payouts', async () => {
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ tournament_id: 346, winner_count: 3 }), { status: 200 }));
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_make_satellite_winners', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ p_tournament_id: 346 }),
    }));
  });

  it('preserves an RPC validation failure for the operator', async () => {
    adminFetch.mockResolvedValue(new Response('Registration must be closed', { status: 409 }));
    const response = await invoke();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to assign satellite winners',
      detail: 'Registration must be closed',
    });
  });
});
