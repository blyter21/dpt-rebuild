import { describe, expect, it } from 'vitest';
import { undoFlightAdvancement } from '../src/index.js';

describe('flight advancement undo', () => {
  it('removes player from main when undoing their only qualified flight', () => {
    const result = undoFlightAdvancement({
      mode: 'highest',
      mainEntries: [
        { playerId: 'a', initialChipsCount: 12000, totalChips: 12000 },
        { playerId: 'b', initialChipsCount: 30000, totalChips: 30000 }
      ],
      flightEntries: [
        { playerId: 'a', totalChips: 12000, eliminated: true, qualifiedFlightPlayer: true, rank: 1 }
      ],
      undoneAdvancements: [
        { playerId: 'a', chipsAdvanced: 12000, flightTournamentId: 'flight-a' }
      ],
      remainingAdvancements: []
    });

    expect(result.mainEntries).toEqual([
      { playerId: 'b', initialChipsCount: 30000, totalChips: 30000 }
    ]);
    expect(result.flightEntries).toEqual([
      { playerId: 'a', totalChips: 12000, eliminated: false, qualifiedFlightPlayer: false, rank: null }
    ]);
  });

  it('subtracts chips in sum accumulator mode when other qualified flights remain', () => {
    const result = undoFlightAdvancement({
      mode: 'sum',
      mainEntries: [
        { playerId: 'a', initialChipsCount: 27000, totalChips: 27000 }
      ],
      flightEntries: [
        { playerId: 'a', totalChips: 12000, eliminated: true, qualifiedFlightPlayer: true, rank: 1 }
      ],
      undoneAdvancements: [
        { playerId: 'a', chipsAdvanced: 12000, flightTournamentId: 'flight-a' }
      ],
      remainingAdvancements: [
        { playerId: 'a', chipsAdvanced: 15000, flightTournamentId: 'flight-b' }
      ]
    });

    expect(result.mainEntries).toEqual([
      { playerId: 'a', initialChipsCount: 15000, totalChips: 15000 }
    ]);
  });

  it('resets main stack to highest remaining flight stack in highest-stack mode', () => {
    const result = undoFlightAdvancement({
      mode: 'highest',
      mainEntries: [
        { playerId: 'a', initialChipsCount: 30000, totalChips: 30000 }
      ],
      flightEntries: [
        { playerId: 'a', totalChips: 30000, eliminated: true, qualifiedFlightPlayer: true, rank: 1 }
      ],
      undoneAdvancements: [
        { playerId: 'a', chipsAdvanced: 30000, flightTournamentId: 'flight-a' }
      ],
      remainingAdvancements: [
        { playerId: 'a', chipsAdvanced: 15000, flightTournamentId: 'flight-b' },
        { playerId: 'a', chipsAdvanced: 22000, flightTournamentId: 'flight-c' }
      ]
    });

    expect(result.mainEntries).toEqual([
      { playerId: 'a', initialChipsCount: 22000, totalChips: 22000 }
    ]);
  });
});
