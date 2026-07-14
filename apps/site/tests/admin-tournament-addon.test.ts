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

import { POST } from '../app/api/admin/tournaments/[id]/entries/[entryId]/addons/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

function invoke(body: unknown) {
  const request = new NextRequest('https://dpt.example.test/api/admin/tournaments/10/entries/20/addons', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(request, { params: { id: '10', entryId: '20' } });
}

beforeEach(() => {
  getContext.mockReset();
  adminFetch.mockReset();
});

describe('authenticated tournament addon API', () => {
  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const response = await invoke({ addonBuyInAmount: 110, noOfAddons: 1 });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects zero addon count before loading data', async () => {
    getContext.mockResolvedValue(context);
    const response = await invoke({ addonBuyInAmount: 110, noOfAddons: 0 });
    expect(response.status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('uses the engine and submits database-revalidated totals', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        rebuy_fee: 10,
        rebuy_chips_count: 15_000,
        tournament_types: { code: 'dpt_standard' },
      }]), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: 20,
        checked_in: true,
        eliminated: false,
        initial_buyin: 100,
        initial_chips_count: 20_000,
        total_buy_in_amount: 200,
        no_of_addons_buy: 1,
        total_addon_chips: 15_000,
        total_chips: 35_000,
      }]), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 20, total_buy_in_amount: 300 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));

    const response = await invoke({ addonBuyInAmount: 110, noOfAddons: 1 });

    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledTimes(3);
    expect(adminFetch.mock.calls[2][1]).toBe('/rest/v1/rpc/dpt_admin_add_entry_addon');
    expect(JSON.parse(String(adminFetch.mock.calls[2][2].body))).toEqual({
      p_tournament_id: 10,
      p_entry_id: 20,
      p_addon_buy_in_amount: 110,
      p_addon_count: 1,
      p_next_total_buy_in_amount: 300,
      p_next_no_of_addons: 2,
      p_next_total_addon_chips: 30_000,
      p_next_total_chips: 50_000,
    });
  });
});
