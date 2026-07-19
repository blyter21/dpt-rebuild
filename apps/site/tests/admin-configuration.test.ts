import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));
import { GET, POST } from '../app/api/admin/configuration/[entity]/route';

const request = (body: unknown) => new NextRequest('http://x/api/admin/configuration/events', { method: 'POST', body: JSON.stringify(body) });
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('admin configuration APIs', () => {
  beforeEach(() => { vi.clearAllMocks(); getContext.mockResolvedValue({ accessToken: 'token' }); });

  it('fails closed before reading or mutating configuration', async () => {
    getContext.mockResolvedValue(null);
    expect((await GET(new NextRequest('http://x'), { params: { entity: 'events' } })).status).toBe(401);
    expect((await POST(request({ action: 'delete', id: 1 }), { params: { entity: 'events' } })).status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('returns event records with named season and venue relationship options', async () => {
    adminFetch.mockImplementation(async (_context: unknown, url: string) => {
      if (url.startsWith('/rest/v1/events?')) return jsonResponse([{ id: 1, name: 'Event' }]);
      if (url.startsWith('/rest/v1/leagues?')) return jsonResponse([{ id: 2, name: 'DPT' }]);
      if (url.startsWith('/rest/v1/seasons?')) return jsonResponse([{ id: 3, name: '2026' }]);
      if (url.startsWith('/rest/v1/venues?')) return jsonResponse([{ id: 4, name: 'Venue' }]);
      return jsonResponse({}, 404);
    });
    const response = await GET(new NextRequest('http://x'), { params: { entity: 'events' } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.options.seasons[0].name).toBe('2026');
    expect(body.options.venues[0].name).toBe('Venue');
  });

  it('rejects unknown top-level and entity value fields', async () => {
    for (const body of [
      { action: 'save', values: { name: 'X' }, extra: true },
      { action: 'save', values: { name: 'X', injected: 'no' } },
      { action: 'status', id: 1, status: true, values: {} },
    ]) {
      expect((await POST(request(body), { params: { entity: 'events' } })).status).toBe(400);
    }
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('allows production-style create without exposing an alias field and calls only the save RPC', async () => {
    adminFetch.mockResolvedValue(jsonResponse({ id: 99, name: 'QA Event' }));
    const values = { name: 'QA Event', season_id: '5', venue_id: '4', start_at: '', end_at: '', description: '', rules_description: '', logo_url: '', banner_url: '', facebook_event_url: '' };
    const response = await POST(request({ action: 'save', values }), { params: { entity: 'events' } });
    expect(response.status).toBe(201);
    expect(adminFetch).toHaveBeenCalledWith(expect.anything(), '/rest/v1/rpc/dpt_admin_save_configuration', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ p_entity: 'event', p_id: null, p_values: values }),
    }));
  });

  it('calls guarded status and soft-delete RPCs', async () => {
    adminFetch.mockResolvedValueOnce(jsonResponse({ id: 9 })).mockResolvedValueOnce(jsonResponse({ id: 9 }));
    expect((await POST(request({ action: 'status', id: 9, status: false }), { params: { entity: 'events' } })).status).toBe(200);
    expect((await POST(request({ action: 'delete', id: 9 }), { params: { entity: 'events' } })).status).toBe(200);
    expect(adminFetch.mock.calls[0][1]).toBe('/rest/v1/rpc/dpt_admin_set_configuration_status');
    expect(adminFetch.mock.calls[1][1]).toBe('/rest/v1/rpc/dpt_admin_soft_delete_configuration');
  });

  it('matches captured production columns and create-form fields', async () => {
    const source = await readFile(new URL('../components/configuration-manager.tsx', import.meta.url), 'utf8');
    for (const label of ['Season','League','Start Date','End Date','Address','City','State','Zip','Rules Description','Facebook Event URL','Map Location / Address']) {
      expect(source).toContain(label);
    }
    expect(source).toContain('Soft-delete this record? Active child records block deletion.');
    expect(source).not.toContain('Season ID');
    expect(source).not.toContain('League ID');
  });
});
