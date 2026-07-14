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

import { POST } from '../app/api/admin/tournaments/[id]/entries/[entryId]/eliminate/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

function invoke() {
  const request = new NextRequest('https://dpt.example.test/api/admin/tournaments/10/entries/20/eliminate', {
    method: 'POST',
  });
  return POST(request, { params: { id: '10', entryId: '20' } });
}

function response(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const entries = [10, 20, 30].map((id) => ({
  id,
  checked_in: true,
  pre_registered: false,
  eliminated: false,
  total_buy_in_amount: id === 20 ? 100 : 80,
  initial_chips_count: 20_000,
  no_of_addons_buy: 0,
  total_chips: 20_000,
  rank: null,
  winnings: null,
  score: null,
  bounty: 0,
  elimination_sequence: null,
  final_table: false,
}));

beforeEach(() => {
  getContext.mockReset();
  adminFetch.mockReset();
});

describe('authenticated tournament elimination API', () => {
  it('fails closed without an admin session', async () => {
    getContext.mockResolvedValue(null);
    const result = await invoke();
    expect(result.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects entries that are not active at the desk', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(response([{
        points_multiplier_enabled: false,
        points_multiplier_value: null,
        participation_bonus_points: 0,
        players_at_final_table: 9,
        tournament_types: { code: 'dpt_standard' },
      }]))
      .mockResolvedValueOnce(response(entries.map((entry) => entry.id === 20 ? { ...entry, checked_in: false } : entry)))
      .mockResolvedValueOnce(response([]));

    const result = await invoke();
    expect(result.status).toBe(409);
    expect(adminFetch).toHaveBeenCalledTimes(3);
  });

  it('calculates rank, payout, score, sequence and final-table state before the atomic RPC', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(response([{
        points_multiplier_enabled: false,
        points_multiplier_value: null,
        participation_bonus_points: 0,
        players_at_final_table: 9,
        tournament_types: { code: 'dpt_standard' },
      }]))
      .mockResolvedValueOnce(response(entries))
      .mockResolvedValueOnce(response([{ standing: 3, payout_amount: 50, points: null }]))
      .mockResolvedValueOnce(response({ id: 20, rank: 3, winnings: 50, score: 150 }));

    const result = await invoke();

    expect(result.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledTimes(4);
    expect(adminFetch.mock.calls[3][1]).toBe('/rest/v1/rpc/dpt_admin_eliminate_entry');
    expect(JSON.parse(String(adminFetch.mock.calls[3][2].body))).toEqual({
      p_tournament_id: 10,
      p_entry_id: 20,
      p_rank: 3,
      p_winnings: 50,
      p_score: 150,
      p_elimination_sequence: 1,
      p_final_table: true,
    });
  });
});
