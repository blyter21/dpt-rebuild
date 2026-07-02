import { describe, expect, it, vi } from 'vitest';
import { createInitialMockState } from '../lib/mock-dpt-services';
import {
  AdminApiError,
  callMockRouteAdminRpc,
  callMockRouteStateRpc
} from '../lib/admin-api-mock-route';

describe('mock-route admin API transport', () => {
  it('posts to local Next route and returns mutable state', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      rpc: 'dpt_check_in_player',
      result: {
        state: createInitialMockState(),
        message: 'mock route adapter ok'
      }
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const result = await callMockRouteStateRpc('dpt_check_in_player', createInitialMockState(), {}, { fetcher });

    expect(result.message).toBe('mock route adapter ok');
    expect(fetcher).toHaveBeenCalledWith('/api/dpt/dpt_check_in_player', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    }));
  });

  it('throws AdminApiError for route error payloads', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      rpc: 'dpt_missing_rpc',
      error: 'Unsupported mock RPC: dpt_missing_rpc'
    }), { status: 404, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    await expect(callMockRouteAdminRpc('dpt_check_in_player', {}, { fetcher })).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 404,
      rpc: 'dpt_check_in_player'
    } satisfies Partial<AdminApiError>);
  });

  it('throws AdminApiError when route returns read data instead of mutation result', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      rpc: 'get_prize_pool',
      data: 100
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    await expect(callMockRouteAdminRpc('get_prize_pool', {}, { fetcher })).rejects.toBeInstanceOf(AdminApiError);
  });
});
