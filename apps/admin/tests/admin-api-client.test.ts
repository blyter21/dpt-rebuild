import { describe, expect, it, vi } from 'vitest';
import {
  AdminApiError,
  defaultAdminApiClientConfig,
  callAdminRpc,
  callStateRpc,
  type AdminApiClientConfig
} from '../lib/admin-api-client';
import { SupabaseTransportDisabledError } from '../lib/admin-api-supabase';
import { createInitialMockState } from '../lib/mock-dpt-services';

describe('admin API client', () => {
  it('defaults to safe local mock-route transport', async () => {
    expect(defaultAdminApiClientConfig).toEqual({ transport: 'mock-route' });

    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      rpc: 'dpt_check_in_player',
      result: {
        state: createInitialMockState(),
        message: 'dpt_check_in_player: ok'
      }
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const result = await callStateRpc('dpt_check_in_player', createInitialMockState(), {}, { transport: 'mock-route', fetcher });

    expect(result.message).toContain('dpt_check_in_player');
    expect(fetcher).toHaveBeenCalledWith('/api/dpt/dpt_check_in_player', expect.objectContaining({ method: 'POST' }));
  });

  it('keeps backward-compatible fetcher shorthand for mock route tests', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      rpc: 'dpt_check_in_player',
      result: {
        state: createInitialMockState(),
        message: 'dpt_check_in_player: shorthand ok'
      }
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const result = await callStateRpc('dpt_check_in_player', createInitialMockState(), {}, fetcher);
    expect(result.message).toContain('shorthand ok');
  });

  it('throws typed error for unsupported mock-route RPC responses', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      rpc: 'dpt_missing_rpc',
      error: 'Unsupported mock RPC: dpt_missing_rpc'
    }), { status: 404, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    await expect(callAdminRpc('dpt_check_in_player', {}, { transport: 'mock-route', fetcher })).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 404,
      rpc: 'dpt_check_in_player'
    } satisfies Partial<AdminApiError>);
  });

  it('throws typed error when a read-style mock-route RPC is used where mutable state is required', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      rpc: 'dpt_materialize_tournament_payouts',
      data: []
    }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    await expect(callAdminRpc('dpt_materialize_tournament_payouts', {}, { transport: 'mock-route', fetcher })).rejects.toBeInstanceOf(AdminApiError);
  });

  it('can select disabled supabase-rpc transport through typed config', async () => {
    const config: AdminApiClientConfig = { transport: 'supabase-rpc' };
    await expect(callAdminRpc('dpt_check_in_player', {}, config)).rejects.toBeInstanceOf(SupabaseTransportDisabledError);
  });

  it('can select supabase-rpc transport with an injected adapter later', async () => {
    const adapter = vi.fn(async () => ({
      ok: true as const,
      rpc: 'dpt_check_in_player' as const,
      result: {
        state: createInitialMockState(),
        message: 'supabase selected adapter ok'
      }
    }));

    const result = await callAdminRpc('dpt_check_in_player', {}, {
      transport: 'supabase-rpc',
      supabase: {
        enabled: true,
        projectUrl: 'http://localhost:54321',
        anonKey: 'test-anon-key',
        adapter
      }
    });

    expect(result.message).toContain('supabase selected adapter ok');
    expect(adapter).toHaveBeenCalledWith('dpt_check_in_player', {});
  });
});
