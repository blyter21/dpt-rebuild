import {
  createInitialMockState,
  dptAddTournamentAddon,
  dptAdvanceFlightPlayers,
  dptCheckInPlayer,
  dptEliminatePlayer,
  dptGetTocQualifiers,
  dptMaterializeTournamentPayouts,
  dptRecalculateManualRanks,
  dptUndoFlightAdvancement,
  dptUndoPlayerStat,
  getLastDisplayScore,
  getPrizePool,
  setFlightCarryoverMode
} from './mock-dpt-services';
import {
  adminRpcNames,
  isAdminRpcName,
  type AdminRpcBody,
  type AdminRpcName,
  type AdminRpcResponse,
  type AdminTournamentState
} from './admin-api-contracts';

export const supportedRpcNames = adminRpcNames;
export type MockRpcName = AdminRpcName;
export type MockRpcBody = AdminRpcBody;
export type MockRpcResponse = AdminRpcResponse;

function requireState(body: AdminRpcBody): AdminTournamentState {
  return body.state ?? createInitialMockState();
}

export function isMockRpcName(value: string): value is AdminRpcName {
  return isAdminRpcName(value);
}

export function handleMockRpc(rpc: string, body: AdminRpcBody = {}): AdminRpcResponse {
  if (!isAdminRpcName(rpc)) {
    return {
      ok: false,
      rpc,
      error: `Unsupported mock RPC: ${rpc}`,
      code: 'unsupported_rpc',
      supportedRpcs: supportedRpcNames
    };
  }

  const state = requireState(body);

  switch (rpc) {
    case 'dpt_check_in_player':
      return { ok: true, rpc, result: dptCheckInPlayer(state, body.playerId) };
    case 'dpt_add_tournament_addon':
      return { ok: true, rpc, result: dptAddTournamentAddon(state, body.playerId) };
    case 'dpt_eliminate_player':
      return { ok: true, rpc, result: dptEliminatePlayer(state, body.playerId) };
    case 'dpt_undo_player_stat':
      return { ok: true, rpc, result: dptUndoPlayerStat(state, body.playerId) };
    case 'dpt_recalculate_manual_ranks':
      return { ok: true, rpc, result: dptRecalculateManualRanks(state) };
    case 'dpt_advance_flight_players':
      return { ok: true, rpc, result: dptAdvanceFlightPlayers(state) };
    case 'dpt_undo_flight_advancement':
      return { ok: true, rpc, result: dptUndoFlightAdvancement(state) };
    case 'set_flight_carryover_mode':
      return { ok: true, rpc, result: setFlightCarryoverMode(state, body.flightMode ?? 'highest') };
    case 'dpt_materialize_tournament_payouts':
      return { ok: true, rpc, data: dptMaterializeTournamentPayouts() };
    case 'dpt_get_toc_qualifiers':
      return { ok: true, rpc, data: dptGetTocQualifiers(state) };
    case 'get_prize_pool':
      return { ok: true, rpc, data: getPrizePool(state) };
    case 'get_last_display_score':
      return { ok: true, rpc, data: getLastDisplayScore(state) };
  }
}
