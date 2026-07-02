import { describe, expect, it } from 'vitest';
import { advanceFlightPlayers, rankByChipsDescending } from '../src/index.js';

describe('flight advancement', () => {
  it('ranks flight survivors by total chips with ties sharing rank', () => {
    expect(rankByChipsDescending([
      { playerId: 'a', totalChips: 10000, eliminated: false },
      { playerId: 'b', totalChips: 20000, eliminated: false },
      { playerId: 'c', totalChips: 20000, eliminated: false },
      { playerId: 'd', totalChips: 5000, eliminated: false }
    ])).toEqual([
      { playerId: 'b', totalChips: 20000, eliminated: false, rank: 1 },
      { playerId: 'c', totalChips: 20000, eliminated: false, rank: 1 },
      { playerId: 'a', totalChips: 10000, eliminated: false, rank: 2 },
      { playerId: 'd', totalChips: 5000, eliminated: false, rank: 3 }
    ]);
  });

  it('advances remaining flight players into main using highest stack mode', () => {
    const result = advanceFlightPlayers({
      mode: 'highest',
      existingMainEntries: [
        { playerId: 'a', initialChipsCount: 15000, totalChips: 15000 }
      ],
      flightEntries: [
        { playerId: 'a', totalChips: 12000, eliminated: false },
        { playerId: 'b', totalChips: 30000, eliminated: false },
        { playerId: 'c', totalChips: 5000, eliminated: true }
      ]
    });

    expect(result.mainEntries).toEqual([
      { playerId: 'a', initialChipsCount: 15000, totalChips: 15000 },
      { playerId: 'b', initialChipsCount: 30000, totalChips: 30000 }
    ]);
    expect(result.flightEntries.find((entry) => entry.playerId === 'b')).toMatchObject({
      qualifiedFlightPlayer: true,
      eliminated: true,
      rank: 1
    });
    const eliminatedBeforeAdvance = result.flightEntries.find((entry) => entry.playerId === 'c');
    expect(eliminatedBeforeAdvance).toMatchObject({ eliminated: true });
    expect(eliminatedBeforeAdvance).not.toHaveProperty('qualifiedFlightPlayer');
  });

  it('advances remaining flight players into main using sum accumulator mode', () => {
    const result = advanceFlightPlayers({
      mode: 'sum',
      existingMainEntries: [
        { playerId: 'a', initialChipsCount: 15000, totalChips: 15000 }
      ],
      flightEntries: [
        { playerId: 'a', totalChips: 12000, eliminated: false },
        { playerId: 'b', totalChips: 30000, eliminated: false }
      ]
    });

    expect(result.mainEntries).toEqual([
      { playerId: 'a', initialChipsCount: 27000, totalChips: 27000 },
      { playerId: 'b', initialChipsCount: 30000, totalChips: 30000 }
    ]);
  });
});
