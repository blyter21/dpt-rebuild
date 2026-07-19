import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { POST } from '../app/api/admin/tournaments/[id]/ranks/bulk/route';

const correction = { entry_id: 20, rank: 1, total_buy_in_amount: 250, bounty: 25 };

describe('admin bulk rank corrections', () => {
  beforeEach(() => { vi.clearAllMocks(); getContext.mockResolvedValue({ accessToken: 'token' }); });

  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const response = await POST(new NextRequest('http://localhost/api/admin/tournaments/10/ranks/bulk', { method: 'POST', body: JSON.stringify({ corrections: [correction] }) }), { params: { id: '10' } });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects malformed, unsafe, and duplicate corrections before the RPC', async () => {
    for (const corrections of [[], [{ ...correction, rank: 0 }], [{ ...correction, unknown: true }], [correction, correction]]) {
      const response = await POST(new NextRequest('http://localhost/api/admin/tournaments/10/ranks/bulk', { method: 'POST', body: JSON.stringify({ corrections }) }), { params: { id: '10' } });
      expect(response.status).toBe(400);
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('passes only correction fields to the atomic RPC', async () => {
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ corrected_count: 1 }), { status: 200 }));
    const response = await POST(new NextRequest('http://localhost/api/admin/tournaments/10/ranks/bulk', { method: 'POST', body: JSON.stringify({ corrections: [{ ...correction, ignored: 'not allowed' }] }) }), { params: { id: '10' } });
    expect(response.status).toBe(400);
    const success = await POST(new NextRequest('http://localhost/api/admin/tournaments/10/ranks/bulk', { method: 'POST', body: JSON.stringify({ corrections: [correction] }) }), { params: { id: '10' } });
    expect(success.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_bulk_correct_ranks', expect.objectContaining({ method: 'POST', body: JSON.stringify({ p_tournament_id: 10, p_corrections: [correction] }) }));
  });
});
