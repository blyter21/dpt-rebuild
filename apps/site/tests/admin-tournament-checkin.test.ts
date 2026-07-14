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

import { POST } from '../app/api/admin/tournaments/[id]/entries/[entryId]/check-in/route';

const context = {
  session: {
    user: { id: 'auth-user-1', email: 'admin@example.test' },
    profileId: 'profile-1',
    account: {
      legacy_user_id: 1,
      role_name: 'administrator',
      can_view_admin: true,
      is_active: true,
    },
    mode: 'authenticated',
  },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

function request(body: unknown) {
  return new NextRequest('https://dpt.example.test/api/admin/tournaments/10/entries/20/check-in', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function invoke(body: unknown) {
  return POST(request(body), { params: { id: '10', entryId: '20' } });
}

beforeEach(() => {
  getContext.mockReset();
  adminFetch.mockReset();
});

describe('authenticated tournament check-in API', () => {
  it('fails closed before loading tournament data', async () => {
    getContext.mockResolvedValue(null);

    const response = await invoke({
      submittedInitialBuyIn: 120,
      initialChipsCount: 20_000,
    });

    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects inconsistent addon input', async () => {
    getContext.mockResolvedValue(context);

    const response = await invoke({
      submittedInitialBuyIn: 120,
      initialChipsCount: 20_000,
      includeAddons: false,
      totalAddonBuyIn: 100,
      noOfAddons: 1,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Addon totals require includeAddons=true' });
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects addon money without an addon count', async () => {
    getContext.mockResolvedValue(context);

    const response = await invoke({
      submittedInitialBuyIn: 120,
      initialChipsCount: 20_000,
      includeAddons: true,
      totalAddonBuyIn: 100,
      noOfAddons: 0,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Addon buy-in requires at least one addon' });
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('uses the tournament engine and sends calculated totals to the atomic RPC', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: 10,
        dealer_fee: 20,
        rebuy_fee: 10,
        rebuy_chips_count: 15_000,
        tournament_types: { code: 'dpt_standard' },
      }]), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 20,
        tournament_id: 10,
        checked_in: true,
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const response = await invoke({
      submittedInitialBuyIn: 120,
      initialChipsCount: 20_000,
      includeAddons: true,
      totalAddonBuyIn: 110,
      noOfAddons: 1,
    });

    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledTimes(2);
    expect(String(adminFetch.mock.calls[0][1])).toContain('/rest/v1/tournaments?');
    expect(adminFetch.mock.calls[1][1]).toBe('/rest/v1/rpc/dpt_admin_check_in_entry');
    expect(JSON.parse(String(adminFetch.mock.calls[1][2].body))).toEqual({
      p_tournament_id: 10,
      p_entry_id: 20,
      p_initial_buyin: 100,
      p_initial_chips_count: 20_000,
      p_total_buy_in_amount: 200,
      p_no_of_addons: 1,
      p_total_addon_chips: 15_000,
      p_total_chips: 35_000,
    });
    expect(await response.json()).toEqual({
      entry: { id: 20, tournament_id: 10, checked_in: true },
      totals: {
        initialBuyIn: 100,
        totalBuyIn: 200,
        noOfAddons: 1,
        totalAddonChips: 15_000,
        totalChips: 35_000,
      },
    });
  });
});
