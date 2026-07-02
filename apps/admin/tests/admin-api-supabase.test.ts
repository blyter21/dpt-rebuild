import { describe, expect, it, vi } from 'vitest';
import { createInitialMockState } from '../lib/mock-dpt-services';
import {
  SUPABASE_TRANSPORT_ENABLED,
  SupabaseTransportDisabledError,
  callSupabaseAdminRpc,
  callSupabaseStateRpc,
  getSupabaseTransportStatus
} from '../lib/admin-api-supabase';

describe('placeholder Supabase admin API transport', () => {
  it('is explicitly disabled by default', () => {
    expect(SUPABASE_TRANSPORT_ENABLED).toBe(false);
    expect(getSupabaseTransportStatus()).toEqual({
      enabled: false,
      ready: false,
      reason: 'Supabase transport is disabled until local DB/credentials are available.'
    });
  });

  it('throws a typed disabled error without adapter/credentials', async () => {
    await expect(callSupabaseAdminRpc('dpt_check_in_player', {})).rejects.toBeInstanceOf(SupabaseTransportDisabledError);
    await expect(callSupabaseStateRpc('dpt_check_in_player', createInitialMockState())).rejects.toMatchObject({
      name: 'SupabaseTransportDisabledError',
      rpc: 'dpt_check_in_player'
    });
  });

  it('conforms to contracts when an adapter is explicitly injected later', async () => {
    const adapter = vi.fn(async () => ({
      ok: true as const,
      rpc: 'dpt_check_in_player' as const,
      result: {
        state: createInitialMockState(),
        message: 'supabase placeholder adapter ok'
      }
    }));

    const result = await callSupabaseStateRpc('dpt_check_in_player', createInitialMockState(), {}, {
      enabled: true,
      projectUrl: 'http://localhost:54321',
      anonKey: 'test-anon-key',
      adapter
    });

    expect(result.message).toContain('placeholder adapter ok');
    expect(adapter).toHaveBeenCalledWith('dpt_check_in_player', expect.objectContaining({ state: expect.any(Object) }));
  });

  it('is not ready unless enabled, credentials, and adapter are all present', () => {
    expect(getSupabaseTransportStatus({ enabled: true })).toMatchObject({ enabled: true, ready: false });
    expect(getSupabaseTransportStatus({ enabled: true, projectUrl: 'url', anonKey: 'key' })).toMatchObject({ ready: false });
    expect(getSupabaseTransportStatus({ enabled: true, projectUrl: 'url', anonKey: 'key', adapter: async () => ({ ok: false, error: 'x' }) })).toMatchObject({ ready: true });
  });
});
