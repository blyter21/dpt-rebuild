import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));

import { GET } from '../app/api/admin/players/search/route';

const context = {
  session: { user: { id: 'auth-1' }, profileId: 'profile-1', account: {}, mode: 'authenticated' },
  config: { url: 'https://staging.example.test', anonKey: 'public-key' },
  accessToken: 'access-token',
};

beforeEach(() => { getContext.mockReset(); adminFetch.mockReset(); });

describe('authenticated player search', () => {
  it('fails closed', async () => {
    getContext.mockResolvedValue(null);
    const response = await GET(new NextRequest('https://dpt.example.test/api/admin/players/search?q=Brad'));
    expect(response.status).toBe(401);
  });

  it('rejects short queries', async () => {
    getContext.mockResolvedValue(context);
    const response = await GET(new NextRequest('https://dpt.example.test/api/admin/players/search?q=B'));
    expect(response.status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('returns name-matched profiles', async () => {
    getContext.mockResolvedValue(context);
    adminFetch.mockResolvedValue(new Response(JSON.stringify([{ id: 'player-1', first_name: 'Brad', last_name: 'Pausch' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const response = await GET(new NextRequest('https://dpt.example.test/api/admin/players/search?q=Brad'));
    expect(response.status).toBe(200);
    const path = String(adminFetch.mock.calls[0][1]);
    expect(path).toContain('/rest/v1/profiles?');
    expect(path).toContain('limit=25');
  });
});
