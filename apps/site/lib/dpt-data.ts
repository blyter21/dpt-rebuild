import data from '../data/dpt-public.json';
import mediaManifest from '../data/dpt-media-manifest.json';

export type DptData = typeof data;
export type LeaderboardPlayer = DptData['leaderboard'][number];
export type PublicEvent = DptData['events'][number];
export type PublicTournament = DptData['tournaments'][number];
export type PublicArticle = DptData['articles'][number];
export type PublicVenue = DptData['venues'][number];
export type PublicChampion = DptData['champions'][number];

export { data };

const localMediaBySource = new Map(
  mediaManifest.assets
    .filter((asset) => asset.downloaded && asset.localPublicPath)
    .map((asset) => [asset.sourceUrl, asset.localPublicPath as string])
);

const brokenMediaSources = new Set(
  mediaManifest.assets
    .filter((asset) => asset.status !== 200)
    .map((asset) => asset.sourceUrl)
);

const finalMediaBaseUrl = process.env.NEXT_PUBLIC_DPT_MEDIA_BASE_URL?.replace(/\/$/, '');

export function publicMediaUrl(localPublicPath?: string | null) {
  if (!localPublicPath) return '';
  if (!finalMediaBaseUrl || !localPublicPath.startsWith('/media/dpt/')) return localPublicPath;
  return `${finalMediaBaseUrl}/${localPublicPath.replace('/media/dpt/', '')}`;
}

export function mediaUrl(sourceUrl?: string | null) {
  if (!sourceUrl || brokenMediaSources.has(sourceUrl)) return '';
  const localPath = localMediaBySource.get(sourceUrl) as string | undefined;
  if (localPath) return publicMediaUrl(localPath);
  return sourceUrl;
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return 'Date TBA';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  if (!endDate || startDate.toDateString() === endDate.toDateString()) return fmt.format(startDate);
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
}

export function money(value: unknown) {
  const numeric = Number(value || 0);
  if (!numeric) return 'Prize TBA';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numeric);
}

export function byAlias<T extends { alias?: string | null }>(items: T[], alias: string): T | undefined {
  return items.find((item) => item.alias === alias);
}

export function tournamentsForEvent(alias: string) {
  return data.tournaments.filter((tournament) => tournament.event?.alias === alias);
}

export function articlesForTournament(alias: string) {
  return data.articles.filter((article) => article.tournament?.alias === alias);
}

export function displayText(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/[�□]+/g, '')
    .replace(/[\u2600-\u27BF]/gu, '')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function youtubeUrlFromText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (!value) continue;
    const match = value.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/);
    if (match) return match[0];
  }
  return '';
}

export function videoArticles() {
  const seededVideos = (data.videos || []).map((video) => ({
    id: `video-${video.embedUrl}`,
    title: video.title,
    excerpt: 'Live event coverage and feature-table video from Dakota Poker Tour.',
    videoUrl: video.videoUrl,
    embedUrl: video.embedUrl,
    thumbnailUrl: video.thumbnailUrl || '',
    imageUrl: '',
  }));

  const articleVideos = data.articles
    .map((article) => ({ ...article, videoUrl: article.videoUrl || youtubeUrlFromText(article.title, article.excerpt), embedUrl: '' }))
    .filter((article) => article.videoUrl);

  return [...seededVideos, ...articleVideos].slice(0, 8);
}
