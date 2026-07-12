import { NextResponse } from 'next/server';
import { buildSupabaseHeaders } from '../../../../lib/supabase-http';

export const dynamic = 'force-dynamic';

const tables = {
  events: 'dpt_public_events',
  tournaments: 'dpt_public_tournaments',
  venues: 'dpt_public_venues',
  articles: 'dpt_public_articles',
  players: 'dpt_public_players',
} as const;

function readConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

export async function GET() {
  const config = readConfig();
  if (!config) return NextResponse.json({ ok: false, error: 'Supabase staging is not configured' }, { status: 503 });

  try {
    const entries = await Promise.all(Object.entries(tables).map(async ([label, table]) => {
      const headers = buildSupabaseHeaders(config.key);
      headers.set('prefer', 'count=exact');
      headers.set('range', '0-0');
      const response = await fetch(`${config.url}/rest/v1/${table}?select=legacy_id`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error(`${table} returned ${response.status}`);
      const range = response.headers.get('content-range') || '';
      const count = Number(range.split('/')[1]);
      if (!Number.isFinite(count)) throw new Error(`${table} did not return an exact count`);
      return [label, count] as const;
    }));

    return NextResponse.json({
      ok: true,
      source: 'supabase-staging',
      project: 'ucxdoetoennartsavnut',
      counts: Object.fromEntries(entries),
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Supabase check failed' }, { status: 502 });
  }
}
