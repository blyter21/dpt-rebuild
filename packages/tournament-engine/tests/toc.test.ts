import { describe, expect, it } from 'vitest';
import { getTournamentOfChampionsQualifiers } from '../src/index.js';

describe('Tournament of Champions qualification', () => {
  const tournaments = [
    { id: 't1', tournamentType: 'dpt_standard' as const, endDate: '2026-01-01' },
    { id: 't2', tournamentType: 'satellite' as const, endDate: '2026-02-01' },
    { id: 't3', tournamentType: 'freeroll' as const, endDate: '2026-03-01' }
  ];

  const entries = [
    { tournamentId: 't1', playerId: 'p1', rank: 1, preRegistered: false },
    { tournamentId: 't1', playerId: 'p2', rank: 2, preRegistered: false },
    { tournamentId: 't2', playerId: 'p3', rank: 1, preRegistered: false },
    { tournamentId: 't3', playerId: 'p4', rank: 1, preRegistered: true },
    { tournamentId: 't3', playerId: 'p5', rank: 1, preRegistered: false }
  ];

  it('qualifies rank-1 players by selected tournament types', () => {
    expect(getTournamentOfChampionsQualifiers({
      tournaments,
      entries,
      qualifiedTournamentTypes: ['dpt_standard', 'satellite']
    })).toEqual([
      { tournamentId: 't2', playerId: 'p3', rank: 1, tournamentType: 'satellite', endDate: '2026-02-01' },
      { tournamentId: 't1', playerId: 'p1', rank: 1, tournamentType: 'dpt_standard', endDate: '2026-01-01' }
    ]);
  });

  it('qualifies rank-1 players by selected tournament IDs and ignores pre-registrations', () => {
    expect(getTournamentOfChampionsQualifiers({
      tournaments,
      entries,
      qualifiedTournamentIds: ['t3']
    })).toEqual([
      { tournamentId: 't3', playerId: 'p5', rank: 1, tournamentType: 'freeroll', endDate: '2026-03-01' }
    ]);
  });

  it('combines selected tournament types and explicit tournament IDs', () => {
    expect(getTournamentOfChampionsQualifiers({
      tournaments,
      entries,
      qualifiedTournamentTypes: ['dpt_standard'],
      qualifiedTournamentIds: ['t3']
    })).toEqual([
      { tournamentId: 't3', playerId: 'p5', rank: 1, tournamentType: 'freeroll', endDate: '2026-03-01' },
      { tournamentId: 't1', playerId: 'p1', rank: 1, tournamentType: 'dpt_standard', endDate: '2026-01-01' }
    ]);
  });
});
