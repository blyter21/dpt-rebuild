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

import { POST } from '../app/api/admin/tournaments/[id]/registration/route';

describe('admin tournament registration state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContext.mockResolvedValue({ accessToken: 'token' });
  });

  it('fails closed without an administrator session', async () => {
    getContext.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/registration', {
      method: 'POST', body: JSON.stringify({ closed: true }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects a non-boolean state', async () => {
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/registration', {
      method: 'POST', body: JSON.stringify({ closed: 'yes' }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('calls the audited registration-state RPC', async () => {
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ id: 346, registration_closed: true }), { status: 200 }));
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/registration', {
      method: 'POST', body: JSON.stringify({ closed: true }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(
      expect.anything(),
      '/rest/v1/rpc/dpt_admin_set_registration_state',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ p_tournament_id: 346, p_closed: true }) }),
    );
  });
});
