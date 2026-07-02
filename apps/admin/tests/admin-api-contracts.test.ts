import { describe, expect, it } from 'vitest';
import {
  adminRpcNames,
  isAdminRpcName,
  type AdminRpcBody,
  type AdminRpcName,
  type AdminRpcResponse,
  type AdminTournamentState
} from '../lib/admin-api-contracts';
import { createInitialMockState } from '../lib/mock-dpt-services';

function acceptsRpcName(_rpc: AdminRpcName) {
  return true;
}

function acceptsState(_state: AdminTournamentState) {
  return true;
}

describe('shared admin API contracts', () => {
  it('defines one canonical RPC name list and guard', () => {
    expect(adminRpcNames).toEqual([
      'dpt_check_in_player',
      'dpt_add_tournament_addon',
      'dpt_eliminate_player',
      'dpt_undo_player_stat',
      'dpt_recalculate_manual_ranks',
      'dpt_advance_flight_players',
      'dpt_undo_flight_advancement',
      'dpt_materialize_tournament_payouts',
      'dpt_get_toc_qualifiers',
      'set_flight_carryover_mode',
      'get_prize_pool',
      'get_last_display_score'
    ]);
    expect(isAdminRpcName('dpt_check_in_player')).toBe(true);
    expect(isAdminRpcName('not_real')).toBe(false);
    expect(acceptsRpcName('dpt_check_in_player')).toBe(true);
  });

  it('shares body/state contracts across route, client, mock transport, and tests', () => {
    const state = createInitialMockState();
    const body: AdminRpcBody = { state, playerId: 'Alice', flightMode: 'highest' };

    expect(acceptsState(state)).toBe(true);
    expect(body.state?.entries[0]?.playerId).toBe('Alice');
  });

  it('represents success and error response contracts', () => {
    const success: AdminRpcResponse = {
      ok: true,
      rpc: 'dpt_check_in_player',
      result: { state: createInitialMockState(), message: 'ok' }
    };
    const error: AdminRpcResponse = {
      ok: false,
      rpc: 'missing',
      error: 'Unsupported mock RPC',
      supportedRpcs: adminRpcNames
    };

    expect(success.ok).toBe(true);
    expect(error.ok).toBe(false);
    expect(error.supportedRpcs).toContain('dpt_add_tournament_addon');
  });
});
