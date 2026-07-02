import type { MainEntry, PayoutRow, TournamentEntry, TournamentType } from '@dpt/tournament-engine';

export type AdminEntry = TournamentEntry & {
  initialBuyIn?: number;
  initialChipsCount: number;
  noOfAddonsBuy: number;
  totalAddonChips: number;
  totalChips: number;
  totalBuyInAmount: number;
};

export type AdminFlightEntry = {
  playerId: string;
  totalChips: number;
  eliminated: boolean;
  preRegistered?: boolean;
  qualifiedFlightPlayer?: boolean;
  rank?: number | null;
};

export interface AdminTournamentState {
  entries: AdminEntry[];
  mainEntries: MainEntry[];
  flightEntries: AdminFlightEntry[];
  flightMode: 'highest' | 'sum';
}

export interface AdminMutationResult {
  state: AdminTournamentState;
  message: string;
  auditId?: number;
}

export interface TocQualifierContract {
  tournamentId: string;
  playerId: string;
  rank: 1;
  tournamentType: TournamentType;
  endDate?: string | null;
}

export const adminRpcNames = [
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
] as const;

export type AdminRpcName = typeof adminRpcNames[number];

export interface CheckInPlayerInput {
  state: AdminTournamentState;
  playerId?: string;
}

export interface AddTournamentAddonInput {
  state: AdminTournamentState;
  playerId?: string;
}

export interface PlayerOperationInput {
  state: AdminTournamentState;
  playerId?: string;
}

export interface StateOnlyInput {
  state: AdminTournamentState;
}

export interface SetFlightCarryoverModeInput {
  state: AdminTournamentState;
  flightMode?: AdminTournamentState['flightMode'];
}

export interface EmptyInput {}

export type AdminRpcInputMap = {
  dpt_check_in_player: CheckInPlayerInput;
  dpt_add_tournament_addon: AddTournamentAddonInput;
  dpt_eliminate_player: PlayerOperationInput;
  dpt_undo_player_stat: PlayerOperationInput;
  dpt_recalculate_manual_ranks: StateOnlyInput;
  dpt_advance_flight_players: StateOnlyInput;
  dpt_undo_flight_advancement: StateOnlyInput;
  dpt_materialize_tournament_payouts: EmptyInput;
  dpt_get_toc_qualifiers: StateOnlyInput;
  set_flight_carryover_mode: SetFlightCarryoverModeInput;
  get_prize_pool: StateOnlyInput;
  get_last_display_score: StateOnlyInput;
};

export type AdminRpcOutputMap = {
  dpt_check_in_player: AdminMutationResult;
  dpt_add_tournament_addon: AdminMutationResult;
  dpt_eliminate_player: AdminMutationResult;
  dpt_undo_player_stat: AdminMutationResult;
  dpt_recalculate_manual_ranks: AdminMutationResult;
  dpt_advance_flight_players: AdminMutationResult;
  dpt_undo_flight_advancement: AdminMutationResult;
  dpt_materialize_tournament_payouts: PayoutRow[];
  dpt_get_toc_qualifiers: TocQualifierContract[];
  set_flight_carryover_mode: AdminMutationResult;
  get_prize_pool: number;
  get_last_display_score: number;
};

export type AdminRpcBody = Partial<AdminRpcInputMap[AdminRpcName]> & {
  state?: AdminTournamentState;
  playerId?: string;
  flightMode?: AdminTournamentState['flightMode'];
};

export type AdminRpcSuccessResponse =
  | { ok: true; rpc: AdminRpcName; result: AdminMutationResult }
  | { ok: true; rpc: AdminRpcName; data: AdminRpcOutputMap[AdminRpcName] };

export type AdminRpcErrorResponse = {
  ok: false;
  rpc?: string;
  error: string;
  code?: string;
  supportedRpcs?: readonly AdminRpcName[];
};

export type AdminRpcResponse =
  | AdminRpcSuccessResponse
  | AdminRpcErrorResponse;

export function isAdminRpcName(value: string): value is AdminRpcName {
  return (adminRpcNames as readonly string[]).includes(value);
}
