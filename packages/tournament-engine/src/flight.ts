import type { ChipCarryoverMode, FlightAdvancement, FlightEntry, MainEntry } from './types';

export interface AdvanceFlightInput {
  flightEntries: FlightEntry[];
  existingMainEntries?: MainEntry[];
  mode: ChipCarryoverMode;
}

export interface AdvanceFlightResult {
  mainEntries: MainEntry[];
  flightEntries: FlightEntry[];
}

export interface UndoFlightAdvancementInput {
  mainEntries: MainEntry[];
  flightEntries: FlightEntry[];
  undoneAdvancements: FlightAdvancement[];
  remainingAdvancements: FlightAdvancement[];
  mode: ChipCarryoverMode;
}

export interface UndoFlightAdvancementResult {
  mainEntries: MainEntry[];
  flightEntries: FlightEntry[];
}

export function rankByChipsDescending(entries: FlightEntry[]): FlightEntry[] {
  const sorted = [...entries].sort((a, b) => b.totalChips - a.totalChips);
  let rank = 0;
  let previousChips: number | null = null;

  return sorted.map((entry) => {
    if (previousChips === null || entry.totalChips !== previousChips) {
      rank += 1;
      previousChips = entry.totalChips;
    }
    return { ...entry, rank };
  });
}

export function advanceFlightPlayers(input: AdvanceFlightInput): AdvanceFlightResult {
  const mainByPlayer = new Map<string, MainEntry>();
  for (const entry of input.existingMainEntries ?? []) {
    mainByPlayer.set(entry.playerId, { ...entry });
  }

  const survivors = input.flightEntries.filter((entry) => !entry.eliminated && !entry.preRegistered);

  for (const survivor of survivors) {
    const existing = mainByPlayer.get(survivor.playerId);
    if (!existing) {
      mainByPlayer.set(survivor.playerId, {
        playerId: survivor.playerId,
        initialChipsCount: survivor.totalChips,
        totalChips: survivor.totalChips
      });
      continue;
    }

    const nextChips = input.mode === 'sum'
      ? existing.totalChips + survivor.totalChips
      : Math.max(existing.totalChips, survivor.totalChips);

    mainByPlayer.set(survivor.playerId, {
      ...existing,
      initialChipsCount: nextChips,
      totalChips: nextChips
    });
  }

  const rankedSurvivors = rankByChipsDescending(survivors).map((entry) => ({
    ...entry,
    qualifiedFlightPlayer: true,
    eliminated: true
  }));
  const rankedByPlayer = new Map(rankedSurvivors.map((entry) => [entry.playerId, entry]));

  return {
    mainEntries: Array.from(mainByPlayer.values()).sort((a, b) => a.playerId.localeCompare(b.playerId)),
    flightEntries: input.flightEntries.map((entry) => rankedByPlayer.get(entry.playerId) ?? entry)
  };
}

function chipsAfterUndo(
  mode: ChipCarryoverMode,
  currentMainChips: number,
  undoneChips: number,
  remainingAdvancements: FlightAdvancement[]
): number | null {
  if (remainingAdvancements.length === 0) return null;

  if (mode === 'sum') {
    return Math.max(0, currentMainChips - undoneChips);
  }

  return Math.max(...remainingAdvancements.map((advancement) => advancement.chipsAdvanced));
}

export function undoFlightAdvancement(input: UndoFlightAdvancementInput): UndoFlightAdvancementResult {
  const mainByPlayer = new Map(input.mainEntries.map((entry) => [entry.playerId, { ...entry }]));
  const remainingByPlayer = new Map<string, FlightAdvancement[]>();

  for (const advancement of input.remainingAdvancements) {
    const list = remainingByPlayer.get(advancement.playerId) ?? [];
    list.push(advancement);
    remainingByPlayer.set(advancement.playerId, list);
  }

  const undoneByPlayer = new Map(input.undoneAdvancements.map((advancement) => [advancement.playerId, advancement]));

  for (const advancement of input.undoneAdvancements) {
    const existing = mainByPlayer.get(advancement.playerId);
    if (!existing) continue;

    const nextChips = chipsAfterUndo(
      input.mode,
      existing.totalChips,
      advancement.chipsAdvanced,
      remainingByPlayer.get(advancement.playerId) ?? []
    );

    if (nextChips === null) {
      mainByPlayer.delete(advancement.playerId);
    } else {
      mainByPlayer.set(advancement.playerId, {
        ...existing,
        initialChipsCount: nextChips,
        totalChips: nextChips
      });
    }
  }

  return {
    mainEntries: Array.from(mainByPlayer.values()).sort((a, b) => a.playerId.localeCompare(b.playerId)),
    flightEntries: input.flightEntries.map((entry) => {
      if (!undoneByPlayer.has(entry.playerId)) return entry;
      return {
        ...entry,
        qualifiedFlightPlayer: false,
        eliminated: false,
        rank: null
      };
    })
  };
}
