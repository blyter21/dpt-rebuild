import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data/dpt-public.json'), 'utf8'));
const mediaManifest = JSON.parse(readFileSync(join(process.cwd(), 'data/dpt-media-manifest.json'), 'utf8'));
const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const pageSource = read('app/page.tsx') + read('components/site.tsx');

describe('DPT public replacement data extract', () => {
  it('extracts real public data from the production SQL dump', () => {
    expect(data.source).toBe('prod_dakotapokertour.sql');
    expect(data.events.length).toBeGreaterThan(20);
    expect(data.tournaments.length).toBeGreaterThan(20);
    expect(data.venues.length).toBeGreaterThan(20);
    expect(data.articles.length).toBeGreaterThan(20);
    expect(data.leaderboard.length).toBeGreaterThan(5);
    expect(data.champions.length).toBeGreaterThan(5);
  });

  it('uses real DPT entities that appear in the production/live site data', () => {
    expect(data.events.map((event: { name: string }) => event.name)).toContain('Poker Brat Black Chip BOUNTY Tournament');
    expect(data.events.map((event: { name: string }) => event.name)).toContain('Spring Championship');
    expect(data.venues.map((venue: { name: string }) => venue.name)).toContain('Windbreak');
    expect(data.articles.some((article: { title: string }) => article.title.includes('Black Chip Bounty'))).toBe(true);
  });

  it('renders the public site navigation and homepage sections instead of the old mock shell', () => {
    for (const label of ['Events', 'News', 'Videos', 'Venues', 'Leaderboard', 'Players', 'Champions', 'Join/Login', 'Live Updates']) {
      expect(pageSource).toContain(label);
    }
    for (const label of ['Past Events', 'Player of the Year', 'Dakota Poker Tour', 'Latest Posts']) {
      expect(pageSource).toContain(label);
    }
    expect(pageSource).not.toContain('DPT Admin/Public Replica Shell');
    expect(pageSource).not.toContain('mock-route');
    expect(pageSource).not.toContain('New stack replacement');
  });

  it('adds SQL-backed public routes for the main production site sections', () => {
    for (const route of [
      'app/events/page.tsx',
      'app/events/[alias]/page.tsx',
      'app/leaderboard/page.tsx',
      'app/venues/page.tsx',
      'app/news/page.tsx',
      'app/champions/page.tsx',
      'app/tournaments/[alias]/page.tsx'
    ]) {
      expect(existsSync(join(process.cwd(), route))).toBe(true);
    }
    expect(read('app/tournaments/[alias]/page.tsx')).toContain('Tournament Info');
    expect(read('app/events/[alias]/page.tsx')).toContain('Event Schedule');
    expect(read('app/leaderboard/page.tsx')).toContain('Player of the Year Leaderboard');
  });

  it('locates and renders production media asset URLs from the SQL filenames', () => {
    expect(data.events[0].imageUrl).toContain('/storage/event/medium/');
    expect(data.tournaments[0].imageUrl).toContain('/storage/tournament/medium/');
    expect(data.articles[0].imageUrl).toContain('/storage/article/thumb/');
    expect(data.venues[0].imageUrl).toContain('/storage/venue/medium/');
    expect(data.leaderboard[0].avatarUrl).toContain('/storage/profile/medium/');
    const components = read('components/site.tsx');
    expect(components).toContain('brand-logo');
    expect(components).toContain('event-photo');
    expect(components).toContain('leader-avatar');
    expect(components).toContain('venue-logo');
  });

  it('builds a media manifest and local sample set for self-hosting migration', () => {
    expect(mediaManifest.summary.totalAssets).toBeGreaterThan(100);
    expect(mediaManifest.summary.validAssets).toBeGreaterThan(100);
    expect(mediaManifest.summary.downloadedSamples).toBe(mediaManifest.summary.validAssets);
    expect(mediaManifest.assets.filter((asset: { status: number }) => asset.status === 200).every((asset: { downloaded: boolean; localPublicPath?: string }) => asset.downloaded && asset.localPublicPath?.startsWith('/media/dpt/'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'public/media/dpt/logo/logo.png'))).toBe(true);
    const dataHelper = read('lib/dpt-data.ts');
    expect(dataHelper).toContain('mediaUrl');
    expect(dataHelper).toContain('localMediaBySource');
    expect(dataHelper).toContain('brokenMediaSources');
  });

  it('adds real public video embeds and text display cleanup helpers', () => {
    expect(data.videos.length).toBeGreaterThanOrEqual(2);
    expect(data.videos[0].embedUrl).toContain('youtube.com/embed/');
    expect(read('app/page.tsx')).toContain('video-grid');
    expect(read('app/page.tsx')).toContain('VideoCard');
    expect(read('app/videos/page.tsx')).toContain('VideoCard');
    expect(read('components/site.tsx')).toContain('function Icon');
    expect(read('components/site.tsx')).toContain('video-thumb');
    expect(data.videos[0].thumbnailUrl).toContain('/media/dpt/video/');
    expect(existsSync(join(process.cwd(), 'public/media/dpt/video/TUj5rdgBHZQ.jpg'))).toBe(true);
    expect(read('lib/dpt-data.ts')).toContain('displayText');
    expect(read('lib/dpt-data.ts')).toContain('publicMediaUrl');
  });

  it('defines a local Supabase-compatible public data layer and seed path', () => {
    const repo = read('lib/dpt-repository.ts');
    expect(repo).toContain('DptPublicRepository');
    expect(repo).toContain('SupabaseDptRepository');
    expect(repo).toContain('dpt_public_event_cards');
    expect(read('app/page.tsx')).toContain('getDptRepository');
    expect(read('app/events/page.tsx')).toContain('getDptRepository');
    const schema = read('../../supabase/migrations/20260701171500_dpt_public_schema.sql');
    expect(schema).toContain('create table if not exists public.dpt_public_events');
    expect(schema).toContain('create or replace view public.dpt_public_homepage');
    expect(schema).toContain('enable row level security');
    const seed = read('../../supabase/seed/dpt_public_seed.sql');
    expect(seed).toContain('insert into public.dpt_public_events');
    expect(seed).toContain('insert into public.dpt_media_assets');
    expect(seed).toContain('Poker Brat Black Chip BOUNTY Tournament');
  });

  it('documents deployment readiness and safe source modes without deploying', () => {
    expect(read('../../.env.example')).toContain('DPT_DATA_SOURCE=json');
    expect(read('../../.env.supabase.example')).toContain('DPT_DATA_SOURCE=supabase');
    expect(read('.env.example')).toContain('DPT_DATA_SOURCE=json');
    expect(read('.env.supabase.example')).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(read('../../docs/DPT_SOURCE_MODES.md')).toContain('JSON/local fallback');
    expect(read('../../docs/DPT_SUPABASE_SMOKE_TEST.md')).toContain('RLS / anon read behavior');
    expect(read('../../docs/DPT_DEPLOYMENT_READINESS.md')).toContain('Do-not-deploy-yet checklist');
    expect(read('../../docs/DPT_VERCEL_PREVIEW_PACKAGE.md')).toContain('Root Directory: apps/site');
    expect(read('../../docs/DPT_VERCEL_ENV_VARS.md')).toContain('DPT_DATA_SOURCE');
    expect(read('vercel.json')).toContain('nextjs');
    expect(read('../../scripts/verify_dpt_deployment_readiness.sh')).toContain('DPT_VERIFY_HTTP_URL');
    expect(read('../../package.json')).toContain('dpt:verify:public');
  });

  it('creates a no-upload final media storage migration plan', () => {
    const storageManifest = JSON.parse(read('data/dpt-media-storage-manifest.json'));
    expect(storageManifest.mode).toBe('dry-run/no-upload');
    expect(storageManifest.bucket).toBe('dpt-public-media');
    expect(storageManifest.baseUrlEnv).toBe('NEXT_PUBLIC_DPT_MEDIA_BASE_URL');
    expect(storageManifest.summary.totalFiles).toBeGreaterThanOrEqual(312);
    expect(storageManifest.assets.some((asset: { objectPath: string }) => asset.objectPath === 'slider/slider1.jpg')).toBe(true);
    expect(storageManifest.assets.some((asset: { objectPath: string }) => asset.objectPath === 'video/TUj5rdgBHZQ.jpg')).toBe(true);
    expect(read('../../reports/dpt-media-upload-commands.jsonl')).toContain('<UPLOAD_AUTH_HEADER>');
    expect(read('../../reports/dpt-media-storage-migration-plan.md')).toContain('No upload performed');
    expect(read('../../package.json')).toContain('dpt:media:storage-plan');
  });

  it('integrates authenticated production-data administration into apps/site', () => {
    const protectedRoutes = [
      'app/admin/(protected)/page.tsx',
      'app/admin/(protected)/layout.tsx',
      'app/admin/(protected)/events/page.tsx',
      'app/admin/(protected)/tournaments/page.tsx',
      'app/admin/(protected)/venues/page.tsx',
      'app/admin/(protected)/articles/page.tsx',
    ];
    const authRoutes = [
      'app/admin/login/page.tsx',
      'app/api/admin/auth/login/route.ts',
      'app/api/admin/auth/logout/route.ts',
    ];
    for (const route of [...protectedRoutes, ...authRoutes, 'app/admin/layout.tsx']) {
      expect(existsSync(join(process.cwd(), route))).toBe(true);
    }

    const adminSource = protectedRoutes.map(read).join('\n') + read('components/admin.tsx') + read('lib/dpt-admin-repository.ts');
    const authSource = authRoutes.map(read).join('\n') + read('lib/dpt-admin-auth.ts');
    const authMigration = read('../../supabase/migrations/20260712033000_dpt_admin_auth.sql');

    expect(adminSource).toContain('Production-derived data');
    expect(adminSource).toContain('getDptAdminSnapshot');
    expect(adminSource).toContain('dpt_tournament_players');
    expect(adminSource).not.toContain('mock-route');
    expect(adminSource).not.toContain('mockPlayers');
    expect(adminSource).not.toContain('password_resets');
    expect(adminSource).not.toContain('users_otp_auth');
    expect(adminSource).not.toContain('personal_access_tokens');

    expect(read('app/admin/(protected)/layout.tsx')).toContain('requireDptAdminSession');
    expect(read('app/admin/(protected)/layout.tsx')).toContain("dynamic = 'force-dynamic'");
    expect(authSource).toContain("type=\"email\"");
    expect(authSource).toContain("type=\"password\"");
    expect(authSource).toContain('/auth/v1/token?grant_type=password');
    expect(authSource).toContain('can_view_admin');
    expect(authSource).toContain('isDptAdminReadOnlyReviewEnabled');
    expect(authSource).toContain('Read-only review mode');
    expect(authSource).toContain("redirect('/admin/login?next=/admin')");
    expect(authSource).not.toContain('SUPABASE_SERVICE_ROLE_KEY');

    expect(authMigration).toContain('create table if not exists public.dpt_admin_accounts');
    expect(authMigration).toContain("'super admin', 'administrator', 'host', 'venue'");
    expect(authMigration).toContain('enable row level security');
    expect(authMigration).toContain('auth_user_id = auth.uid()');
    expect(authMigration).toContain('dpt_current_user_can_view_admin');
    expect(read('app/admin/layout.tsx')).toContain('index: false');
    expect(data.events[0].name).toContain('Poker Brat Black Chip BOUNTY Tournament');
    expect(data.tournaments[0].name).toBe('Black Chip Bounty');
  });
});
