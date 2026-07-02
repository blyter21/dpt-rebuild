import { describe, expect, it } from 'vitest';
import { createInitialMockState } from '../lib/mock-dpt-services';
import { handleMockRpc, supportedRpcNames } from '../lib/mock-dpt-rpc';

describe('mock DPT RPC dispatcher', () => {
  it('lists supported RPC names matching the local API surface', () => {
    expect(supportedRpcNames).toContain('dpt_check_in_player');
    expect(supportedRpcNames).toContain('dpt_add_tournament_addon');
    expect(supportedRpcNames).toContain('dpt_eliminate_player');
    expect(supportedRpcNames).toContain('dpt_undo_player_stat');
    expect(supportedRpcNames).toContain('dpt_recalculate_manual_ranks');
    expect(supportedRpcNames).toContain('dpt_advance_flight_players');
    expect(supportedRpcNames).toContain('dpt_undo_flight_advancement');
    expect(supportedRpcNames).toContain('dpt_materialize_tournament_payouts');
    expect(supportedRpcNames).toContain('dpt_get_toc_qualifiers');
  });

  it('dispatches a mutating check-in RPC and returns updated state', () => {
    const response = handleMockRpc('dpt_check_in_player', { state: createInitialMockState() });

    expect(response.ok).toBe(true);
    if (!response.ok || !('result' in response)) throw new Error('expected result');

    expect(response.result.message).toContain('dpt_check_in_player');
    expect(response.result.state.entries.find((entry) => entry.playerId === 'Alice')).toMatchObject({
      totalBuyInAmount: 240,
      totalChips: 40_000
    });
  });

  it('dispatches flight mode and flight advancement RPCs', () => {
    const modeResponse = handleMockRpc('set_flight_carryover_mode', { state: createInitialMockState(), flightMode: 'sum' });
    expect(modeResponse.ok).toBe(true);
    if (!modeResponse.ok || !('result' in modeResponse)) throw new Error('expected mode result');
    expect(modeResponse.result.state.flightMode).toBe('sum');

    const advanceResponse = handleMockRpc('dpt_advance_flight_players', { state: modeResponse.result.state });
    expect(advanceResponse.ok).toBe(true);
    if (!advanceResponse.ok || !('result' in advanceResponse)) throw new Error('expected advance result');
    expect(advanceResponse.result.state.mainEntries.find((entry) => entry.playerId === 'Bob')).toMatchObject({ totalChips: 30_000 });
  });

  it('dispatches read-style RPCs and rejects unsupported RPC names', () => {
    const payoutResponse = handleMockRpc('dpt_materialize_tournament_payouts', {});
    expect(payoutResponse.ok).toBe(true);
    if (!payoutResponse.ok || !('data' in payoutResponse)) throw new Error('expected data');
    expect(payoutResponse.data).toEqual(expect.arrayContaining([expect.objectContaining({ standing: 1, payoutAmount: 500 })]));

    const badResponse = handleMockRpc('dpt_missing_rpc', {});
    expect(badResponse).toMatchObject({ ok: false, rpc: 'dpt_missing_rpc' });
  });
});
