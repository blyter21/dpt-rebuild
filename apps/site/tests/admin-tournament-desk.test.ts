import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getContext, adminFetch } = vi.hoisted(() => ({
  getContext: vi.fn(),
  adminFetch: vi.fn(),
}));

vi.mock('../lib/dpt-admin-api', () => ({
  getDptAdminApiContext: getContext,
  dptAdminSupabaseFetch: adminFetch,
}));

import { GET } from '../app/api/admin/tournaments/[id]/desk/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

function response(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  getContext.mockReset();
  adminFetch.mockReset();
});

describe('authenticated tournament desk API', () => {
  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const result = await GET(new Request('https://dpt.example.test'), { params: { id: '10' } });
    expect(result.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('combines operational records into desk metrics', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(response([{ id: 10, name: 'Championship', registration_closed: false }]))
      .mockResolvedValueOnce(response([
        { id: 1, checked_in: true, eliminated: false, total_buy_in_amount: 200 },
        { id: 2, checked_in: true, eliminated: true, total_buy_in_amount: 300 },
        { id: 3, checked_in: false, eliminated: false, total_buy_in_amount: 0 },
      ]))
      .mockResolvedValueOnce(response([{ id: 1, addon_count: 2 }]))
      .mockResolvedValueOnce(response([{ id: 1, standing: 1, payout_amount: 500 }]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 1, action: 'tournament_entry.check_in' }]));

    const result = await GET(new Request('https://dpt.example.test'), { params: { id: '10' } });
    const payload = await result.json();

    expect(result.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledTimes(6);
    expect(payload.metrics).toEqual({
      registered: 3,
      checkedIn: 2,
      remaining: 1,
      eliminated: 1,
      totalBuyIn: 500,
      addonCount: 2,
    });
  });
});
