import { data, type DptData, videoArticles } from './dpt-data';

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
  getArticlesForTournament(alias: string): MaybePromise<DptData['articles']>;
  getVenues(): MaybePromise<DptData['venues']>;
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
  getArticlesForTournament(alias: string) {
    return data.articles.filter((article) => article.tournament?.alias === alias);
  },
  getVenues() {
    return data.venues;
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

  private async select(table: string, query = 'select=*') {
    const url = `${this.config.url}/rest/v1/${table}?${query}`;
    const response = await fetch(url, {
      headers: {
        apikey: this.config.key,
        Authorization: ['Bearer', this.config.key].join(' '),
        accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Supabase read failed for ${table}: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as Array<Record<string, unknown>>;
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

  async getArticlesForTournament(alias: string) {
    const rows = await this.select('dpt_public_articles', `select=*&tournament_alias=eq.${encodeURIComponent(alias)}&order=published_at.desc.nullslast`);
    return rows.map(articleFromRow);
  }

  async getVenues() {
    const rows = await this.select('dpt_public_venues', 'select=*&order=name.asc');
    return rows.map((row) => raw<DptData['venues'][number]>(row));
  }

  async getLeaderboard() {
    const rows = await this.select('dpt_public_leaderboard_entries', 'select=*&order=rank.asc');
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
