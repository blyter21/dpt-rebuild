#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../', import.meta.url);
const migrationFiles = [
  'supabase/migrations/20260626220600_initial_schema.sql',
  'supabase/migrations/20260626221000_rls_helpers_and_policies.sql',
  'supabase/migrations/20260701171500_dpt_public_schema.sql',
  'supabase/migrations/20260712033000_dpt_admin_auth.sql',
];

const db = new PGlite();
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    encrypted_password text,
    created_at timestamptz default now()
  );
  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $$ select null::uuid $$;
`);

for (const file of migrationFiles) {
  let sql = await readFile(new URL(file, root), 'utf8');
  // Supabase includes pgcrypto; the embedded PGlite validator does not ship extension control files.
  sql = sql.replace('create extension if not exists pgcrypto;', '');
  await db.exec(sql);
  console.log(`applied ${file}`);
}

const seed = await readFile(new URL('supabase/seed/dpt_public_seed.sql', root), 'utf8');
await db.exec(seed);
console.log('applied supabase/seed/dpt_public_seed.sql');

const tableResult = await db.query(`
  select tablename
  from pg_tables
  where schemaname = 'public'
  order by tablename
`);
const tables = tableResult.rows.map((row) => row.tablename);

const enumResult = await db.query(`
  select enumlabel
  from pg_enum
  join pg_type on pg_type.oid = pg_enum.enumtypid
  where pg_type.typname = 'app_role'
  order by enumsortorder
`);
const appRoles = enumResult.rows.map((row) => row.enumlabel);

const policyResult = await db.query(`
  select tablename, policyname
  from pg_policies
  where schemaname = 'public'
  order by tablename, policyname
`);
const policies = policyResult.rows;

const privilegeResult = await db.query(`
  select
    has_table_privilege('anon', 'public.profiles', 'select') as anon_profiles_select,
    has_table_privilege('anon', 'public.tournament_entries', 'select') as anon_entries_select,
    has_table_privilege('anon', 'public.dpt_public_events', 'select') as anon_public_events_select,
    has_table_privilege('authenticated', 'public.dpt_admin_accounts', 'select') as authenticated_admin_account_select
`);
const privileges = privilegeResult.rows[0];

const countResult = await db.query(`
  select
    (select count(*)::int from public.dpt_public_events) as events,
    (select count(*)::int from public.dpt_public_tournaments) as tournaments,
    (select count(*)::int from public.dpt_public_venues) as venues,
    (select count(*)::int from public.dpt_public_articles) as articles,
    (select count(*)::int from public.dpt_public_players) as players,
    (select count(*)::int from public.dpt_admin_accounts) as admin_accounts
`);
const counts = countResult.rows[0];

const expectedRoles = ['super_admin', 'administrator', 'host', 'venue', 'user'];
if (JSON.stringify(appRoles) !== JSON.stringify(expectedRoles)) throw new Error(`Unexpected app roles: ${appRoles}`);
if (privileges.anon_profiles_select || privileges.anon_entries_select) throw new Error('Anon can read a core private table');
if (!privileges.anon_public_events_select) throw new Error('Anon cannot read curated public events');
if (!privileges.authenticated_admin_account_select) throw new Error('Authenticated role cannot read own admin authorization');
if (policies.some((row) => ['profiles', 'tournament_entries', 'tournament_payouts'].includes(row.tablename) && /public/i.test(row.policyname))) {
  throw new Error('Core private table still has a public policy');
}

console.log(JSON.stringify({
  migrations: migrationFiles.length,
  publicTableCount: tables.length,
  appRoles,
  privileges,
  counts,
  policyCount: policies.length,
}, null, 2));

await db.close();
