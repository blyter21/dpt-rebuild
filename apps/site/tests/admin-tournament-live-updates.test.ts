import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { POST as save } from '../app/api/admin/tournaments/[id]/updates/route';
import { POST as state } from '../app/api/admin/tournaments/[id]/updates/[updateId]/route';

const saveRequest = (body: unknown) => new NextRequest('http://x/api/admin/tournaments/1/updates', { method: 'POST', body: JSON.stringify(body) });
const stateRequest = (body: unknown) => new NextRequest('http://x/api/admin/tournaments/1/updates/8', { method: 'POST', body: JSON.stringify(body) });

describe('admin live updates APIs', () => {
  beforeEach(() => { vi.clearAllMocks(); getContext.mockResolvedValue({ accessToken: 'token' }); });

  it('fails closed without contacting Supabase', async () => {
    getContext.mockResolvedValue(null);
    const response = await save(saveRequest({ title: 'Cards up' }), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('rejects malformed and unknown save fields', async () => {
    for (const body of [{ title: 3 }, { title: 'Cards up', ignored: true }]) {
      const response = await save(saveRequest(body), { params: { id: '1' } });
      expect(response.status).toBe(400);
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('forwards only the guarded save RPC payload', async () => {
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ id: 8 }), { status: 201 }));
    const response = await save(saveRequest({ title: 'Cards up', description: 'Level 1', updateAt: '2026-07-19T12:00:00Z' }), { params: { id: '1' } });
    expect(response.status).toBe(201);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_save_tournament_update', expect.objectContaining({
      body: expect.stringContaining('"p_title":"Cards up"'),
    }));
  });

  it('rejects unsupported or extra state fields and calls the state RPC for an allowed action', async () => {
    for (const body of [{ action: 'hack' }, { action: 'publish', extra: true }]) {
      expect((await state(stateRequest(body), { params: { id: '1', updateId: '8' } })).status).toBe(400);
    }
    expect(adminFetch).not.toHaveBeenCalled();
    adminFetch.mockResolvedValue(new Response(JSON.stringify({ id: 8, status: true }), { status: 200 }));
    expect((await state(stateRequest({ action: 'publish' }), { params: { id: '1', updateId: '8' } })).status).toBe(200);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_set_tournament_update_state', expect.objectContaining({
      body: JSON.stringify({ p_tournament_id: 1, p_update_id: 8, p_action: 'publish' }),
    }));
  });

  it('exposes public updates only through the published-only RLS view', async () => {
    const migration = await readFile(new URL('../../../supabase/migrations/20260719123000_admin_tournament_live_updates_rpc.sql', import.meta.url), 'utf8');
    const repository = await readFile(new URL('../lib/dpt-repository.ts', import.meta.url), 'utf8');
    const page = await readFile(new URL('../app/tournaments/[alias]/page.tsx', import.meta.url), 'utf8');
    expect(migration).toContain('status = true and published_at is not null and deleted_at is null');
    expect(migration).toContain('tournament updates public published select');
    expect(repository).toContain("this.select('dpt_public_tournament_updates'");
    expect(repository).not.toContain("this.select('tournament_updates'");
    expect(page).toContain('getLiveUpdatesForTournament');
  });
});
