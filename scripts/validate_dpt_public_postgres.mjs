import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const schemaPath = resolve(root, 'supabase/migrations/20260701171500_dpt_public_schema.sql');
const seedPath = resolve(root, 'supabase/seed/dpt_public_seed.sql');
const reportPath = resolve(root, 'reports/dpt-local-postgres-validation.json');

function normalizeForPglite(sql) {
  return sql
    .replace(/set session_replication_role = replica;\n/gi, '')
    .replace(/set session_replication_role = DEFAULT;\n/gi, '');
}

async function count(db, table) {
  const result = await db.query(`select count(*)::int as count from public.${table}`);
  return Number(result.rows[0].count);
}

async function main() {
  const db = new PGlite();
  const schemaSql = readFileSync(schemaPath, 'utf8');
  const seedSql = normalizeForPglite(readFileSync(seedPath, 'utf8'));
  const report = {
    runtime: 'PGlite embedded Postgres-compatible runtime',
    schemaExecuted: false,
    seedExecuted: false,
    counts: {},
    homepage: {},
    rls: { checked: false, note: '' },
    errors: [],
  };

  try {
    await db.exec(schemaSql);
    report.schemaExecuted = true;
  } catch (error) {
    report.errors.push({ stage: 'schema', message: String(error?.message || error) });
    // PGlite support for CREATE POLICY/RLS varies by version. Retry with RLS/policy blocks removed
    // so table/view/seed shape can still be validated locally without Docker.
    const withoutPolicies = schemaSql
      .replace(/alter table public\.[^;]+ enable row level security;\n/g, '')
      .replace(/do \$\$[\s\S]*?end \$\$;\n?/m, '');
    await db.exec(withoutPolicies);
    report.schemaExecuted = true;
    report.rls.note = 'RLS/policy SQL was present in migration but stripped for PGlite retry; validate enforcement in Docker/Supabase runtime.';
  }

  try {
    await db.exec(seedSql);
    report.seedExecuted = true;
  } catch (error) {
    report.errors.push({ stage: 'seed', message: String(error?.message || error) });
    throw error;
  }

  const expected = {
    dpt_public_venues: 77,
    dpt_public_events: 60,
    dpt_public_tournaments: 80,
    dpt_public_articles: 80,
    dpt_public_players: 25,
    dpt_public_leaderboard_entries: 25,
    dpt_public_champions: 40,
    dpt_public_videos: 2,
    dpt_media_assets: 328,
  };

  for (const [table, expectedCount] of Object.entries(expected)) {
    const actual = await count(db, table);
    report.counts[table] = { expected: expectedCount, actual, ok: actual === expectedCount };
  }

  const homepage = await db.query("select payload from public.dpt_public_homepage");
  const payload = homepage.rows[0]?.payload || {};
  report.homepage = {
    events: payload.events?.length || 0,
    leaderboard: payload.leaderboard?.length || 0,
    articles: payload.articles?.length || 0,
    venues: payload.venues?.length || 0,
    champions: payload.champions?.length || 0,
    videos: payload.videos?.length || 0,
    ok: Boolean(payload.events?.length && payload.venues?.length && payload.leaderboard?.length),
  };

  const policyText = schemaSql.includes('create policy') && schemaSql.includes('enable row level security');
  report.rls.checked = policyText;
  if (!report.rls.note) {
    report.rls.note = 'Migration contains RLS enable statements and public read policies. PGlite executes schema but does not replace Docker/Supabase role-enforcement QA.';
  }

  const allCountsOk = Object.values(report.counts).every((item) => item.ok);
  if (!allCountsOk || !report.homepage.ok) {
    throw new Error('Local Postgres validation failed count/view checks');
  }

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
