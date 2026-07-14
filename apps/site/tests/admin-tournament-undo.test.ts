import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { POST } from '../app/api/admin/tournaments/[id]/entries/[entryId]/undo/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

function invoke() {
  return POST(new NextRequest('https://dpt.example.test/api/admin/tournaments/10/entries/20/undo', { method: 'POST' }), {
    params: { id: '10', entryId: '20' },
  });
}
function response(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => { getContext.mockReset(); adminFetch.mockReset(); });

describe('authenticated tournament result undo', () => {
  it('fails closed', async () => {
    getContext.mockResolvedValue(null);
    const result = await invoke();
    expect(result.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('restores flight chips and sends the database-validated undo', async () => {
    getContext.mockResolvedValue(context);
    adminFetch
      .mockResolvedValueOnce(response([{ rebuy_chips_count: 15_000, tournament_types: { code: 'flight' } }]))
      .mockResolvedValueOnce(response([{
        id: 20,
        eliminated: true,
        initial_chips_count: 20_000,
        no_of_addons_buy: 2,
        total_chips: 12_000,
        total_buy_in_amount: 300,
        rank: 1,
        winnings: 500,
        score: 800,
        elimination_sequence: 1,
        final_table: true,
      }]))
      .mockResolvedValueOnce(response({ id: 20, eliminated: false, total_chips: 50_000 }));

    const result = await invoke();

    expect(result.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledTimes(3);
    expect(adminFetch.mock.calls[2][1]).toBe('/rest/v1/rpc/dpt_admin_undo_entry_result');
    expect(JSON.parse(String(adminFetch.mock.calls[2][2].body))).toEqual({
      p_tournament_id: 10,
      p_entry_id: 20,
      p_next_total_chips: 50_000,
    });
  });
});
