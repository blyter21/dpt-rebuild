import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));
import { POST as advance } from '../app/api/admin/tournaments/[id]/flight-advance/route';
import { POST as undo } from '../app/api/admin/tournaments/[id]/flight-advance/undo/route';

const context = { session: { user: { id: 'auth-1' } }, config: {}, accessToken: 'token' };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

beforeEach(() => { getContext.mockReset(); adminFetch.mockReset(); });

describe('authenticated flight advancement APIs', () => {
  it('fail closed before calling Supabase', async () => {
    getContext.mockResolvedValue(null);
    expect((await advance(new NextRequest('http://localhost/api/admin/tournaments/1/flight-advance', { method: 'POST' }), { params: { id: '1' } })).status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('calls only the atomic advance RPC with the route flight id', async () => {
    getContext.mockResolvedValue(context); adminFetch.mockResolvedValue(ok({ advanced_count: 2 }));
    const result = await advance(new NextRequest('http://localhost/api/admin/tournaments/42/flight-advance', { method: 'POST' }), { params: { id: '42' } });
    expect(result.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(context, '/rest/v1/rpc/dpt_admin_advance_flight_players', expect.objectContaining({ body: JSON.stringify({ p_flight_tournament_id: 42 }) }));
  });

  it('calls only the atomic undo RPC and preserves its validation failure', async () => {
    getContext.mockResolvedValue(context); adminFetch.mockResolvedValue(new Response('flight is not closed', { status: 409 }));
    const result = await undo(new NextRequest('http://localhost/api/admin/tournaments/42/flight-advance/undo', { method: 'POST' }), { params: { id: '42' } });
    expect(result.status).toBe(409);
    expect(adminFetch).toHaveBeenCalledWith(context, '/rest/v1/rpc/dpt_admin_undo_flight_advancement', expect.objectContaining({ body: JSON.stringify({ p_flight_tournament_id: 42 }) }));
  });
});
