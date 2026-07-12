import { data, type DptData } from './dpt-data';
import { getDptRepository } from './dpt-repository';

export type DptAdminSnapshot = {
  source: string;
  generatedAt: string;
  repositoryMode: 'json' | 'supabase';
  sourceCounts: DptData['counts'];
  events: DptData['events'];
  tournaments: DptData['tournaments'];
  venues: DptData['venues'];
  articles: DptData['articles'];
  leaderboard: DptData['leaderboard'];
  champions: DptData['champions'];
};

/**
 * Read-only admin snapshot backed by the same production-derived repository as
 * the public site. It deliberately exposes no password, OTP, token, email, or
 * phone fields. Supabase can replace the JSON transport without changing the
 * integrated /admin routes.
 */
export async function getDptAdminSnapshot(): Promise<DptAdminSnapshot> {
  const repository = getDptRepository();
  const [events, tournaments, venues, articles, leaderboard, champions] = await Promise.all([
    repository.getEvents(),
    repository.getTournaments(),
    repository.getVenues(),
    repository.getArticles(),
    repository.getLeaderboard(),
    repository.getChampions(),
  ]);

  return {
    source: data.source,
    generatedAt: data.generatedAt,
    repositoryMode: repository.mode,
    sourceCounts: data.counts,
    events,
    tournaments,
    venues,
    articles,
    leaderboard,
    champions,
  };
}
