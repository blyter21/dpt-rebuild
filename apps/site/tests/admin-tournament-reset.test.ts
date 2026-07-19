import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));
import { GET as preview } from '../app/api/admin/tournaments/[id]/reset/preview/route';
import { POST as reset } from '../app/api/admin/tournaments/[id]/reset/route';

const context = { session: { user: { id: 'auth-1' } }, config: {}, accessToken: 'token' };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
beforeEach(() => { getContext.mockReset(); adminFetch.mockReset(); });

describe('protected tournament full reset APIs', () => {
  it('fails closed without auth and never contacts Supabase', async () => {
    getContext.mockResolvedValue(null);
    expect((await preview(new Request('http://localhost'), { params: { id: '1' } })).status).toBe(401);
    expect((await reset(new NextRequest('http://localhost', { method: 'POST', body: '{}' }), { params: { id: '1' } })).status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it('uses the read-only preview RPC with only the route id', async () => {
    getContext.mockResolvedValue(context); adminFetch.mockResolvedValue(ok({ confirmation_token: 'a'.repeat(32), counts: {} }));
    const response = await preview(new Request('http://localhost'), { params: { id: '42' } });
    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(context, '/rest/v1/rpc/dpt_admin_tournament_reset_preview', expect.objectContaining({ body: JSON.stringify({ p_tournament_id: 42 }) }));
  });
  it('rejects malformed, missing and extra reset payload fields before RPC', async () => {
    getContext.mockResolvedValue(context);
    for (const body of [{}, { confirmationToken: 'a'.repeat(32), confirmation: 'NO' }, { confirmationToken: 'a'.repeat(32), confirmation: 'RESET', extra: true }]) {
      expect((await reset(new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify(body) }), { params: { id: '42' } })).status).toBe(400);
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it('requires typed RESET and forwards only the preview token to the atomic RPC', async () => {
    getContext.mockResolvedValue(context); adminFetch.mockResolvedValue(ok({ reset: true }));
    const response = await reset(new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify({ confirmationToken: 'a'.repeat(32), confirmation: 'RESET' }) }), { params: { id: '42' } });
    expect(response.status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(context, '/rest/v1/rpc/dpt_admin_reset_tournament', expect.objectContaining({ body: JSON.stringify({ p_tournament_id: 42, p_confirmation_token: 'a'.repeat(32) }) }));
  });
  it('preserves stale preview failure status', async () => {
    getContext.mockResolvedValue(context); adminFetch.mockResolvedValue(new Response('Reset preview is stale', { status: 409 }));
    const response = await reset(new NextRequest('http://localhost', { method: 'POST', body: JSON.stringify({ confirmationToken: 'a'.repeat(32), confirmation: 'RESET' }) }), { params: { id: '42' } });
    expect(response.status).toBe(409);
  });
});
