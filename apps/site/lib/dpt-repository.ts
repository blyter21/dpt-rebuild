import { data, type DptData, videoArticles } from './dpt-data';
import { buildSupabaseHeaders } from './supabase-http';

type MaybePromise<T> = T | Promise<T>;

type VideoArticle = ReturnType<typeof videoArticles>[number];

export type DptPublicRepository = {
  mode: 'json' | 'supabase';
  getHomepageData(): MaybePromise<DptData>;
  getEvents(): MaybePromise<DptData['events']>;
  getEventByAlias(alias: string): MaybePromise<DptData['events'][number] | undefined>;
  getTournaments(): MaybePromise<DptData['tournaments']>;
  getTournamentByAlias(alias: string): MaybePromise<DptData['tournaments'][number] | undefined>;
  getTournamentsForEvent(alias: string): MaybePromise<DptData['tournaments']>;
  getArticles(): MaybePromise<DptData['articles']>;
  getArticleByAlias(alias: string): MaybePromise<DptData['articles'][number] | undefined>;
  getArticlesForTournament(alias: string): MaybePromise<DptData['articles']>;
  getVenues(): MaybePromise<DptData['venues']>;
  getVenueByAlias(alias: string): MaybePromise<DptData['venues'][number] | undefined>;
  getPlayers(): MaybePromise<DptData['players']>;
  getPlayerByAlias(alias: string): MaybePromise<DptData['players'][number] | undefined>;
  getLeaderboard(): MaybePromise<DptData['leaderboard']>;
  getChampions(): MaybePromise<DptData['champions']>;
  getVideos(): MaybePromise<NonNullable<DptData['videos']>>;
  getVideoArticles(): MaybePromise<VideoArticle[]>;
};

export const localDptRepository: DptPublicRepository = {
  mode: 'json',
  getHomepageData() {
    return data;
  },
  getEvents() {
    return data.events;
  },
  getEventByAlias(alias: string) {
    return data.events.find((event) => event.alias === alias);
  },
  getTournaments() {
    return data.tournaments;
  },
  getTournamentByAlias(alias: string) {
    return data.tournaments.find((tournament) => tournament.alias === alias);
  },
  getTournamentsForEvent(alias: string) {
    return data.tournaments.filter((tournament) => tournament.event?.alias === alias);
  },
  getArticles() {
    return data.articles;
  },
  getArticleByAlias(alias: string) {
    return data.articles.find((article) => article.alias === alias);
  },
  getArticlesForTournament(alias: string) {
    return data.articles.filter((article) => article.tournament?.alias === alias);
  },
  getVenues() {
    return data.venues;
  },
  getVenueByAlias(alias: string) {
    return data.venues.find((venue) => venue.alias === alias);
  },
  getPlayers() {
    return data.players;
  },
  getPlayerByAlias(alias: string) {
    return data.players.find((player) => player.alias === alias || String(player.playerId) === alias);
  },
  getLeaderboard() {
    return data.leaderboard;
  },
  getChampions() {
    return data.champions;
  },
  getVideos() {
    return data.videos || [];
  },
  getVideoArticles() {
    return videoArticles();
  },
};

function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

function readMode() {
  return process.env.DPT_DATA_SOURCE === 'supabase' ? 'supabase' : 'json';
}

function supabaseError(table: string, error: { message?: string } | null) {
  if (!error) return;
  throw new Error(`Supabase read failed for ${table}: ${error.message || 'unknown error'}`);
}

function raw<T>(row: Record<string, unknown>): T {
  return ((row.raw && typeof row.raw === 'object') ? row.raw : row) as T;
}

function articleFromRow(row: Record<string, unknown>): DptData['articles'][number] {
  const article = raw<DptData['articles'][number]>(row) as Record<string, unknown>;
  return {
    ...article,
    id: Number(row.legacy_id ?? article.id),
    alias: String(row.alias ?? article.alias ?? ''),
    title: String(row.title ?? article.title ?? ''),
    excerpt: String(row.excerpt ?? article.excerpt ?? ''),
    publishedAt: String(row.published_at ?? article.publishedAt ?? ''),
    imageUrl: String(row.image_url ?? article.imageUrl ?? ''),
    videoUrl: row.video_url ? String(row.video_url) : article.videoUrl ?? null,
  } as DptData['articles'][number];
}

function championFromRow(row: Record<string, unknown>): DptData['champions'][number] {
  const champion = raw<DptData['champions'][number]>(row) as Record<string, unknown>;
  return {
    ...champion,
    tournamentAlias: String(row.tournament_alias ?? champion.tournamentAlias ?? ''),
    tournament: String(row.tournament_name ?? champion.tournament ?? ''),
    player: String(row.player_name ?? champion.player ?? ''),
    winnings: row.winnings == null ? champion.winnings ?? null : Number(row.winnings),
    date: String(row.result_date ?? champion.date ?? ''),
  } as DptData['champions'][number];
}

function leaderboardFromRow(row: Record<string, unknown>): DptData['leaderboard'][number] {
  const item = raw<DptData['leaderboard'][number]>(row);
  return {
    ...item,
    rank: Number(row.rank ?? item.rank),
    playerId: Number(row.player_legacy_id ?? item.playerId),
    name: String(row.display_name ?? item.name ?? ''),
    points: Number(row.points ?? item.points ?? 0),
    wins: Number(row.wins ?? item.wins ?? 0),
    cashes: Number(row.cashes ?? item.cashes ?? 0),
    city: String(row.city ?? item.city ?? ''),
    state: String(row.state ?? item.state ?? ''),
  };
}

function playerFromRow(row: Record<string, unknown>): DptData['players'][number] {
  const item = raw<DptData['players'][number]>(row);
  return {
    ...item,
    playerId: Number(row.legacy_id ?? item.playerId),
    alias: String(row.alias ?? item.alias ?? ''),
    name: String(row.display_name ?? item.name ?? ''),
    city: String(row.city ?? item.city ?? ''),
    state: String(row.state ?? item.state ?? ''),
    avatarUrl: String(row.avatar_url ?? item.avatarUrl ?? ''),
    points: Number(item.points ?? 0),
    winnings: Number(item.winnings ?? 0),
    cashes: Number(item.cashes ?? 0),
    finalTables: Number(item.finalTables ?? 0),
    titles: Number(item.titles ?? 0),
    tournaments: Number(item.tournaments ?? 0),
  };
}

function videoFromRow(row: Record<string, unknown>): NonNullable<DptData['videos']>[number] {
  const item = raw<NonNullable<DptData['videos']>[number]>(row);
  return {
    ...item,
    title: String(row.title ?? item.title ?? ''),
    videoUrl: String(row.video_url ?? item.videoUrl ?? ''),
    embedUrl: String(row.embed_url ?? item.embedUrl ?? ''),
    thumbnailUrl: String(row.local_thumbnail_path ?? row.thumbnail_url ?? item.thumbnailUrl ?? ''),
    source: String(row.source ?? item.source ?? 'supabase'),
  };
}

export class SupabaseDptRepository implements DptPublicRepository {
  mode = 'supabase' as const;
  constructor(private readonly config: { url: string; key: string }) {}

  private async select(table: string, query = 'select=*', range?: { from: number; to: number }) {
    const url = `${this.config.url}/rest/v1/${table}?${query}`;
    const headers = buildSupabaseHeaders(this.config.key, this.config.key);
    if (range) headers.set('range', `${range.from}-${range.to}`);
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Supabase read failed for ${table}: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as Array<Record<string, unknown>>;
  }

  private async selectAll(table: string, query = 'select=*') {
    const pageSize = 1000;
    const rows: Array<Record<string, unknown>> = [];
    for (let from = 0; ; from += pageSize) {
      const page = await this.select(table, query, { from, to: from + pageSize - 1 });
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
  }

  async getHomepageData() {
    const [events, tournaments, articles, venues, leaderboard, champions, videos] = await Promise.all([
      this.getEvents(),
      this.getTournaments(),
      this.getArticles(),
      this.getVenues(),
      this.getLeaderboard(),
      this.getChampions(),
      this.getVideos(),
    ]);
    return { ...data, events, tournaments, articles, venues, leaderboard, champions, videos };
  }

  async getEvents() {
    const rows = await this.select('dpt_public_event_cards', 'select=*&order=start_date.desc.nullslast');
    return rows.map((row) => raw<DptData['events'][number]>(row));
  }

  async getEventByAlias(alias: string) {
    const rows = await this.select('dpt_public_event_cards', `select=*&alias=eq.${encodeURIComponent(alias)}&limit=1`);
    return rows[0] ? raw<DptData['events'][number]>(rows[0]) : undefined;
  }

  async getTournaments() {
    const rows = await this.select('dpt_public_tournament_details', 'select=*&order=start_date.desc.nullslast');
    return rows.map((row) => raw<DptData['tournaments'][number]>(row));
  }

  async getTournamentByAlias(alias: string) {
    const rows = await this.select('dpt_public_tournament_details', `select=*&alias=eq.${encodeURIComponent(alias)}&limit=1`);
    return rows[0] ? raw<DptData['tournaments'][number]>(rows[0]) : undefined;
  }

  async getTournamentsForEvent(alias: string) {
    const rows = await this.select('dpt_public_tournament_details', `select=*&event_alias=eq.${encodeURIComponent(alias)}&order=start_date.asc.nullslast`);
    return rows.map((row) => raw<DptData['tournaments'][number]>(row));
  }

  async getArticles() {
    const rows = await this.select('dpt_public_articles', 'select=*&order=published_at.desc.nullslast');
    return rows.map(articleFromRow);
  }

  async getArticleByAlias(alias: string) {
    const rows = await this.select('dpt_public_articles', `select=*&alias=eq.${encodeURIComponent(alias)}&limit=1`);
    return rows[0] ? articleFromRow(rows[0]) : undefined;
  }

  async getArticlesForTournament(alias: string) {
    const rows = await this.select('dpt_public_articles', `select=*&tournament_alias=eq.${encodeURIComponent(alias)}&order=published_at.desc.nullslast`);
    return rows.map(articleFromRow);
  }

  async getVenues() {
    const rows = await this.select('dpt_public_venues', 'select=*&order=name.asc');
    return rows.map((row) => raw<DptData['venues'][number]>(row));
  }

  async getVenueByAlias(alias: string) {
    const rows = await this.select('dpt_public_venues', `select=*&alias=eq.${encodeURIComponent(alias)}&limit=1`);
    return rows[0] ? raw<DptData['venues'][number]>(rows[0]) : undefined;
  }

  async getPlayers() {
    const rows = await this.selectAll('dpt_public_players', 'select=*&order=display_name.asc');
    return rows.map(playerFromRow);
  }

  async getPlayerByAlias(alias: string) {
    const rows = await this.select('dpt_public_players', `select=*&alias=eq.${encodeURIComponent(alias)}&limit=1`);
    if (rows[0]) return playerFromRow(rows[0]);
    if (!/^\d+$/.test(alias)) return undefined;
    const byId = await this.select('dpt_public_players', `select=*&legacy_id=eq.${encodeURIComponent(alias)}&limit=1`);
    return byId[0] ? playerFromRow(byId[0]) : undefined;
  }

  async getLeaderboard() {
    const rows = await this.selectAll('dpt_public_leaderboard_entries', 'select=*&order=rank.asc');
    return rows.map(leaderboardFromRow);
  }

  async getChampions() {
    const rows = await this.select('dpt_public_champions', 'select=*&order=result_date.desc.nullslast');
    return rows.map(championFromRow);
  }

  async getVideos() {
    const rows = await this.select('dpt_public_videos', 'select=*&order=created_at.asc');
    return rows.map(videoFromRow);
  }

  async getVideoArticles() {
    const videos = await this.getVideos();
    return videos.map((video) => ({
      id: `video-${video.embedUrl || video.videoUrl}`,
      title: video.title,
      excerpt: 'Live event coverage and feature-table video from Dakota Poker Tour.',
      videoUrl: video.videoUrl,
      embedUrl: video.embedUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      imageUrl: '',
    }));
  }
}

export function createSupabaseDptRepository() {
  const env = requireSupabaseEnv();
  if (!env) return null;
  return new SupabaseDptRepository(env);
}

export function getDptRepository(): DptPublicRepository {
  if (readMode() !== 'supabase') return localDptRepository;
  return createSupabaseDptRepository() || localDptRepository;
}
