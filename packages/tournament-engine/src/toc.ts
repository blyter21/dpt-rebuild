import type { TournamentType } from './types';

export interface TocTournament {
  id: string;
  tournamentType: TournamentType;
  endDate?: string | null;
}

export interface TocEntry {
  tournamentId: string;
  playerId: string;
  rank: number | null;
  preRegistered?: boolean;
}

export interface TocQualifierInput {
  tournaments: TocTournament[];
  entries: TocEntry[];
  qualifiedTournamentTypes?: TournamentType[];
  qualifiedTournamentIds?: string[];
}

export interface TocQualifier {
  tournamentId: string;
  playerId: string;
  rank: 1;
  tournamentType: TournamentType;
  endDate?: string | null;
}

export function getTournamentOfChampionsQualifiers(input: TocQualifierInput): TocQualifier[] {
  const typeSet = new Set(input.qualifiedTournamentTypes ?? []);
  const idSet = new Set(input.qualifiedTournamentIds ?? []);
  const tournamentById = new Map(input.tournaments.map((tournament) => [tournament.id, tournament]));

  const allowedTournamentIds = new Set<string>();
  for (const tournament of input.tournaments) {
    if (idSet.has(tournament.id) || typeSet.has(tournament.tournamentType)) {
      allowedTournamentIds.add(tournament.id);
    }
  }

  return input.entries
    .filter((entry) => !entry.preRegistered && entry.rank === 1 && allowedTournamentIds.has(entry.tournamentId))
    .map((entry): TocQualifier | null => {
      const tournament = tournamentById.get(entry.tournamentId);
      if (!tournament) return null;
      return {
        tournamentId: entry.tournamentId,
        playerId: entry.playerId,
        rank: 1,
        tournamentType: tournament.tournamentType,
        endDate: tournament.endDate
      };
    })
    .filter((qualifier): qualifier is TocQualifier => qualifier !== null)
    .sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''));
}
