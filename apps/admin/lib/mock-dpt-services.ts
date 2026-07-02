import {
  advanceFlightPlayers,
  applyAddon,
  calculateCheckInTotals,
  calculateDptDisplayScore,
  calculatePrizePool,
  eliminateDptPlayer,
  getTournamentOfChampionsQualifiers,
  materializePayouts,
  recalculateManualRanks,
  undoFlightAdvancement,
  undoPlayerStat
} from '@dpt/tournament-engine';
import type {
  AdminEntry,
  AdminMutationResult as MockServiceResult,
  AdminTournamentState as MockTournamentState
} from './admin-api-contracts';

export type {
  AdminEntry,
  AdminMutationResult as MockServiceResult,
  AdminTournamentState as MockTournamentState
} from './admin-api-contracts';

export const payoutTemplateRows = [
  { standing: 1, payoutPercentage: 50 },
  { standing: 2, payoutPercentage: 30 },
  { standing: 3, payoutPercentage: 20 }
];

export const dptPayouts = [
  { standing: 1, payoutAmount: 500 },
  { standing: 2, payoutAmount: 250 },
  { standing: 3, payoutAmount: 100 }
];

export function createInitialMockState(): MockTournamentState {
  return {
    entries: [
      { playerId: 'Alice', eliminated: false, totalBuyInAmount: 0, initialBuyIn: 0, initialChipsCount: 0, noOfAddonsBuy: 0, totalAddonChips: 0, totalChips: 0, bounty: 25, finalTable: false },
      { playerId: 'Bob', eliminated: false, totalBuyInAmount: 200, initialBuyIn: 140, initialChipsCount: 20_000, noOfAddonsBuy: 1, totalAddonChips: 10_000, totalChips: 30_000, bounty: 10, finalTable: false },
      { playerId: 'Cora', eliminated: false, totalBuyInAmount: 100, initialBuyIn: 100, initialChipsCount: 20_000, noOfAddonsBuy: 0, totalAddonChips: 0, totalChips: 20_000, bounty: 0, finalTable: false }
    ],
    mainEntries: [{ playerId: 'Alice', initialChipsCount: 15_000, totalChips: 15_000 }],
    flightEntries: [
      { playerId: 'Alice', totalChips: 12_000, eliminated: false },
      { playerId: 'Bob', totalChips: 30_000, eliminated: false },
      { playerId: 'Cora', totalChips: 5_000, eliminated: true }
    ],
    flightMode: 'highest'
  };
}

export function dptCheckInPlayer(state: MockTournamentState, playerId = 'Alice'): MockServiceResult {
  const totals = calculateCheckInTotals({
    tournamentType: 'dpt_standard',
    submittedInitialBuyIn: 150,
    dealerFee: 10,
    includeAddons: true,
    totalAddonBuyIn: 120,
    rebuyFee: 10,
    noOfAddons: 2,
    initialChipsCount: 20_000,
    rebuyChipsCount: 10_000
  });

  return {
    state: {
      ...state,
      entries: state.entries.map((entry) => entry.playerId === playerId
        ? { ...entry, initialBuyIn: totals.initialBuyIn, initialChipsCount: 20_000, totalBuyInAmount: totals.totalBuyIn, noOfAddonsBuy: totals.noOfAddons, totalAddonChips: totals.totalAddonChips, totalChips: totals.totalChips }
        : entry)
    },
    message: `dpt_check_in_player: ${playerId} checked in for $${totals.totalBuyIn} and ${totals.totalChips.toLocaleString()} chips.`
  };
}

export function dptAddTournamentAddon(state: MockTournamentState, playerId = 'Alice'): MockServiceResult {
  const entry = state.entries.find((item) => item.playerId === playerId) ?? state.entries[0];
  const updated = applyAddon({
    initialBuyIn: entry.initialBuyIn ?? 0,
    initialChipsCount: entry.initialChipsCount,
    totalBuyInAmount: entry.totalBuyInAmount,
    noOfAddonsBuy: entry.noOfAddonsBuy,
    totalAddonChips: entry.totalAddonChips,
    totalChips: entry.totalChips
  }, {
    tournamentType: 'dpt_standard',
    addonBuyInAmount: 60,
    addonRebuyFee: 10,
    noOfAddons: 1,
    rebuyChipsCount: 10_000
  });

  return {
    state: { ...state, entries: state.entries.map((item) => item.playerId === playerId ? { ...item, ...updated } : item) },
    message: `dpt_add_tournament_addon: ${playerId} add-on saved and totals recalculated.`
  };
}

export function dptEliminatePlayer(state: MockTournamentState, playerId = 'Cora'): MockServiceResult {
  const nextSequence = Math.max(0, ...state.entries.map((entry) => entry.eliminationSequence ?? 0)) + 1;
  return {
    state: {
      ...state,
      entries: eliminateDptPlayer({
        playerId,
        entries: state.entries,
        payouts: dptPayouts,
        nextEliminationSequence: nextSequence,
        pointsMultiplierValue: 2
      }) as AdminEntry[]
    },
    message: `dpt_eliminate_player: ${playerId} eliminated with rank/score rules.`
  };
}

export function dptUndoPlayerStat(state: MockTournamentState, playerId = 'Cora'): MockServiceResult {
  return {
    state: {
      ...state,
      entries: undoPlayerStat({ playerId, tournamentType: 'dpt_standard', rebuyChipsCount: 10_000, entries: state.entries }) as AdminEntry[]
    },
    message: `dpt_undo_player_stat: ${playerId} result state cleared.`
  };
}

export function dptRecalculateManualRanks(state: MockTournamentState): MockServiceResult {
  return {
    state: {
      ...state,
      entries: recalculateManualRanks({
        tournamentType: 'dpt_standard',
        playersAtFinalTable: 2,
        pointsMultiplierValue: 2,
        payouts: dptPayouts,
        edits: [
          { playerId: 'Alice', rank: 1, totalBuyInAmount: state.entries.find((entry) => entry.playerId === 'Alice')?.totalBuyInAmount ?? 300, bounty: 25, totalChips: 0 },
          { playerId: 'Bob', rank: 2, totalBuyInAmount: 200, bounty: 10, totalChips: 0 },
          { playerId: 'Cora', rank: null, totalBuyInAmount: 100, bounty: 0, totalChips: 5_000 }
        ],
        entries: state.entries
      }) as AdminEntry[]
    },
    message: 'dpt_recalculate_manual_ranks: manual rank edit applied.'
  };
}

export function dptAdvanceFlightPlayers(state: MockTournamentState): MockServiceResult {
  const result = advanceFlightPlayers({ mode: state.flightMode, existingMainEntries: state.mainEntries, flightEntries: state.flightEntries });
  return {
    state: { ...state, mainEntries: result.mainEntries, flightEntries: result.flightEntries },
    message: `dpt_advance_flight_players: flight advanced using ${state.flightMode} mode.`
  };
}

export function dptUndoFlightAdvancement(state: MockTournamentState): MockServiceResult {
  const result = undoFlightAdvancement({
    mode: state.flightMode,
    mainEntries: state.mainEntries,
    flightEntries: state.flightEntries,
    undoneAdvancements: [{ playerId: 'Bob', chipsAdvanced: 30_000, flightTournamentId: 'flight-a' }],
    remainingAdvancements: state.flightMode === 'highest'
      ? [{ playerId: 'Bob', chipsAdvanced: 22_000, flightTournamentId: 'flight-b' }]
      : [{ playerId: 'Bob', chipsAdvanced: 15_000, flightTournamentId: 'flight-b' }]
  });
  return {
    state: { ...state, mainEntries: result.mainEntries, flightEntries: result.flightEntries },
    message: `dpt_undo_flight_advancement: Bob flight advancement undone using ${state.flightMode} mode.`
  };
}

export function setFlightCarryoverMode(state: MockTournamentState, flightMode: MockTournamentState['flightMode']): MockServiceResult {
  return { state: { ...state, flightMode }, message: `set_flight_carryover_mode: ${flightMode}` };
}

export function dptMaterializeTournamentPayouts() {
  return materializePayouts({
    tournamentId: 'dpt-standard-seed',
    structureId: 'dpt-percent-seed',
    totalDistributionAmount: 1000,
    templateRows: payoutTemplateRows
  });
}

export function dptGetTocQualifiers(state: MockTournamentState) {
  return getTournamentOfChampionsQualifiers({
    tournaments: [
      { id: 't1', tournamentType: 'dpt_standard', endDate: '2026-01-01' },
      { id: 't2', tournamentType: 'satellite', endDate: '2026-02-01' },
      { id: 't3', tournamentType: 'freeroll', endDate: '2026-03-01' }
    ],
    entries: [
      ...state.entries.filter((entry) => entry.rank === 1).map((entry) => ({ tournamentId: 't1', playerId: entry.playerId, rank: 1 as const, preRegistered: false })),
      { tournamentId: 't3', playerId: 'Freeroll Champ', rank: 1 as const, preRegistered: false }
    ],
    qualifiedTournamentTypes: ['dpt_standard'],
    qualifiedTournamentIds: ['t3']
  });
}

export function getPrizePool(state: MockTournamentState): number {
  return calculatePrizePool({
    playerBuyIns: state.entries.filter((entry) => !entry.preRegistered).map((entry) => entry.totalBuyInAmount),
    tournamentFeePercent: 10,
    totalBounty: state.entries.reduce((sum, entry) => sum + (entry.bounty ?? 0), 0)
  });
}

export function getLastDisplayScore(state: MockTournamentState): number {
  const entry = state.entries[0];
  return calculateDptDisplayScore({
    totalBuyInAmount: entry?.totalBuyInAmount ?? 0,
    winnings: entry?.winnings ?? 0,
    bounty: entry?.bounty ?? 0,
    pointsMultiplierValue: 2
  });
}
