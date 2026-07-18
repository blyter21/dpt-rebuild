import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { POST } from '../app/api/admin/tournaments/[id]/payouts/materialize/route';

describe('admin payout materialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContext.mockResolvedValue({ accessToken: 'token' });
  });

  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/payouts/materialize', {
      method: 'POST', body: JSON.stringify({ payoutTemplateId: 1, totalDistributionAmount: 10000 }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects invalid payout values', async () => {
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/payouts/materialize', {
      method: 'POST', body: JSON.stringify({ payoutTemplateId: 0, totalDistributionAmount: -1 }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(400);
  });

  it('calls the atomic payout RPC', async () => {
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ payout_rows: 12 }), { status: 200 }));
    const request = new NextRequest('http://localhost/api/admin/tournaments/346/payouts/materialize', {
      method: 'POST', body: JSON.stringify({ payoutTemplateId: 1, totalDistributionAmount: 25000 }),
    });
    const response = await POST(request, { params: { id: '346' } });
    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_materialize_payouts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ p_tournament_id: 346, p_payout_template_id: 1, p_total_distribution_amount: 25000 }),
    }));
  });
});
