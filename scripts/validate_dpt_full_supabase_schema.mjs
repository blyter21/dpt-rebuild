#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const root = new URL('../', import.meta.url);
const migrationFiles = [
  'supabase/migrations/20260626220600_initial_schema.sql',
  'supabase/migrations/20260626221000_rls_helpers_and_policies.sql',
  'supabase/migrations/20260701171500_dpt_public_schema.sql',
  'supabase/migrations/20260712033000_dpt_admin_auth.sql',
  'supabase/migrations/20260712070000_staging_deploy_marker.sql',
  'supabase/migrations/20260712073000_add_pedro_staging_admin.sql',
  'supabase/migrations/20260712074500_fix_security_lints.sql',
  'supabase/migrations/20260712090000_seed_public_snapshot.sql',
  'supabase/migrations/20260712173000_separate_profiles_auth_identity.sql',
  'supabase/migrations/20260712192000_add_public_player_alias.sql',
  'supabase/migrations/20260712193000_refresh_full_public_dataset.sql',
  'supabase/migrations/20260713010000_enrich_public_details.sql',
  'supabase/migrations/20260713130000_admin_tournament_checkin_rpc.sql',
  'supabase/migrations/20260713150000_admin_tournament_registration_rpc.sql',
  'supabase/migrations/20260713160000_admin_tournament_addon_rpc.sql',
  'supabase/migrations/20260713170000_admin_tournament_elimination_rpc.sql',
  'supabase/migrations/20260713180000_admin_tournament_undo_rpc.sql',
  'supabase/migrations/20260718130000_preserve_payout_legacy_data.sql',
  'supabase/migrations/20260718143000_admin_tournament_registration_state_rpc.sql',
  'supabase/migrations/20260718163000_admin_tournament_payout_materialization_rpc.sql',
  'supabase/migrations/20260718180000_admin_satellite_winners_rpc.sql',
  'supabase/migrations/20260718190000_admin_flight_advancement_rpc.sql',
  'supabase/migrations/20260719100000_admin_bulk_rank_corrections_rpc.sql',
  'supabase/migrations/20260719113000_admin_tournament_reset_rpc.sql',
  'supabase/migrations/20260719123000_admin_tournament_live_updates_rpc.sql',
  'supabase/migrations/20260719133000_admin_configuration_rpc.sql',
  'supabase/migrations/20260719150000_admin_blinds_payouts_rpc.sql',
  'supabase/migrations/20260719170000_admin_tournament_setup_rpc.sql',
  'supabase/migrations/20260719190000_players_permissions_duplicate_merge.sql',
  'supabase/migrations/20260719210000_articles_notifications_templates.sql',
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
  insert into auth.users (id, email, encrypted_password)
  values ('00000000-0000-4000-8000-000000000001', 'pedro@fpngaming.com', '[REDACTED-TEST-HASH]');
`);

for (const file of migrationFiles) {
  let sql = await readFile(new URL(file, root), 'utf8');
  // Supabase includes pgcrypto; the embedded PGlite validator does not ship extension control files.
  sql = sql.replace('create extension if not exists pgcrypto;', '');
  await db.exec(sql);
  console.log(`applied ${file}`);
}

const seedSql = await readFile(new URL('supabase/seed/dpt_public_seed.sql', root), 'utf8');
await db.exec(seedSql);
console.log('applied supabase/seed/dpt_public_seed.sql');

let coreImportCounts = null;
if (process.env.DPT_VALIDATE_PRIVATE_IMPORT === '1') {
  const privateImportPath = process.env.DPT_PRIVATE_IMPORT_PATH || '/home/hermes/.hermes/private/dpt/dpt_core_production_import.sql';
  const privateImportSql = await readFile(privateImportPath, 'utf8');
  await db.exec(privateImportSql);
  console.log(`applied protected core import (${privateImportPath})`);
  const coreResult = await db.query(`
    select
      (select count(*)::int from public.profiles) as profiles,
      (select count(*)::int from public.profile_roles) as profile_roles,
      (select count(*)::int from public.venues) as venues,
      (select count(*)::int from public.events) as events,
      (select count(*)::int from public.tournaments) as tournaments,
      (select count(*)::int from public.blind_structures) as blind_structures,
      (select count(*)::int from public.blind_structures where jsonb_array_length(blind_info) > 0) as blind_structures_with_levels,
      (select count(*)::int from public.payout_templates) as payout_templates,
      (select count(*)::int from public.payout_template_rows) as payout_template_rows,
      (select count(*)::int from public.tournament_payouts) as tournament_payouts,
      (select count(*)::int from public.tournament_entries) as tournament_entries,
      (select count(*)::int from public.tournament_entry_addons) as tournament_entry_addons,
      (select count(*)::int from public.tournament_updates) as tournament_updates
  `);
  coreImportCounts = coreResult.rows[0];
}

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

const securityResult = await db.query(`
  select
    (select bool_and('security_invoker=true' = any(coalesce(reloptions, array[]::text[])))
       from pg_class where relname in ('dpt_public_event_cards','dpt_public_tournament_details','dpt_public_homepage')) as public_views_security_invoker,
    not has_function_privilege('anon', 'private.has_app_role(public.app_role)', 'execute') as anon_cannot_execute_role_helper,
    has_function_privilege('authenticated', 'private.has_app_role(public.app_role)', 'execute') as authenticated_can_execute_role_helper,
    not exists (
      select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
      where pg_namespace.nspname = 'public'
        and pg_proc.proname in ('has_app_role','has_any_app_role','is_admin_operator','is_super_admin','dpt_current_user_can_view_admin')
    ) as no_auth_helpers_in_public,
    exists (
      select 1 from pg_proc join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
      where pg_namespace.nspname = 'public'
        and pg_proc.proname = 'set_updated_at'
        and array_to_string(pg_proc.proconfig, ',') like '%search_path=pg_catalog, public%'
    ) as trigger_search_path_fixed
`);
const security = securityResult.rows[0];

const profileAuthResult = await db.query(`
  select
    exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'auth_user_id'
    ) as has_auth_user_id,
    not exists (
      select 1 from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and conname = 'profiles_id_fkey'
    ) as profile_id_is_domain_identity,
    exists (
      select 1 from public.profiles profile
      join auth.users auth_user on auth_user.id = profile.auth_user_id
      where lower(auth_user.email) = 'pedro@fpngaming.com'
    ) as pedro_auth_link_preserved
`);
const profileAuth = profileAuthResult.rows[0];

const workflowSecurityResult = await db.query(`
  select
    exists (
      select 1 from pg_class
      where oid = 'public.dpt_admin_audit_log'::regclass
        and relrowsecurity = true
    ) as audit_log_has_rls,
    exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'dpt_admin_audit_log'
        and policyname = 'dpt admin audit readable by operators'
    ) as audit_log_has_admin_policy,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_check_in_entry(bigint,bigint,integer,integer,integer,integer,integer,integer)',
      'execute'
    ) as anon_cannot_check_in,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_check_in_entry(bigint,bigint,integer,integer,integer,integer,integer,integer)',
      'execute'
    ) as authenticated_can_call_check_in,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_register_entry(bigint,uuid,boolean)',
      'execute'
    ) as anon_cannot_register,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_register_entry(bigint,uuid,boolean)',
      'execute'
    ) as authenticated_can_call_register,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_add_entry_addon(bigint,bigint,integer,integer,integer,integer,integer,integer)',
      'execute'
    ) as anon_cannot_add_addon,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_add_entry_addon(bigint,bigint,integer,integer,integer,integer,integer,integer)',
      'execute'
    ) as authenticated_can_call_addon,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_eliminate_entry(bigint,bigint,integer,integer,integer,integer,boolean)',
      'execute'
    ) as anon_cannot_eliminate,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_eliminate_entry(bigint,bigint,integer,integer,integer,integer,boolean)',
      'execute'
    ) as authenticated_can_call_eliminate,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_undo_entry_result(bigint,bigint,integer)',
      'execute'
    ) as anon_cannot_undo_result,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_undo_entry_result(bigint,bigint,integer)',
      'execute'
    ) as authenticated_can_call_undo_result,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_set_registration_state(bigint,boolean)',
      'execute'
    ) as anon_cannot_set_registration_state,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_set_registration_state(bigint,boolean)',
      'execute'
    ) as authenticated_can_set_registration_state,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_materialize_payouts(bigint,bigint,numeric)',
      'execute'
    ) as anon_cannot_materialize_payouts,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_materialize_payouts(bigint,bigint,numeric)',
      'execute'
    ) as authenticated_can_materialize_payouts,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_make_satellite_winners(bigint)',
      'execute'
    ) as anon_cannot_make_satellite_winners,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_make_satellite_winners(bigint)',
      'execute'
    ) as authenticated_can_make_satellite_winners,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_advance_flight_players(bigint)',
      'execute'
    ) as anon_cannot_advance_flight,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_advance_flight_players(bigint)',
      'execute'
    ) as authenticated_can_advance_flight,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_undo_flight_advancement(bigint)',
      'execute'
    ) as anon_cannot_undo_flight,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_undo_flight_advancement(bigint)',
      'execute'
    ) as authenticated_can_undo_flight,
    not has_function_privilege(
      'anon',
      'public.dpt_admin_bulk_correct_ranks(bigint,jsonb)',
      'execute'
    ) as anon_cannot_bulk_correct_ranks,
    not has_function_privilege('anon', 'public.dpt_admin_tournament_reset_preview(bigint)', 'execute') as anon_cannot_preview_reset,
    has_function_privilege('authenticated', 'public.dpt_admin_tournament_reset_preview(bigint)', 'execute') as authenticated_can_preview_reset,
    not has_function_privilege('anon', 'public.dpt_admin_reset_tournament(bigint,text)', 'execute') as anon_cannot_reset,
    has_function_privilege('authenticated', 'public.dpt_admin_reset_tournament(bigint,text)', 'execute') as authenticated_can_reset,
    not has_table_privilege('anon', 'public.dpt_tournament_reset_snapshots', 'select') as anon_cannot_read_reset_snapshots,
    has_function_privilege(
      'authenticated',
      'public.dpt_admin_bulk_correct_ranks(bigint,jsonb)',
      'execute'
    ) as authenticated_can_bulk_correct_ranks,
    not has_function_privilege('anon', 'public.dpt_admin_save_tournament_update(bigint,bigint,text,text,timestamptz,text,text)', 'execute') as anon_cannot_save_live_update,
    has_function_privilege('authenticated', 'public.dpt_admin_save_tournament_update(bigint,bigint,text,text,timestamptz,text,text)', 'execute') as authenticated_can_save_live_update,
    not has_function_privilege('anon', 'public.dpt_admin_set_tournament_update_state(bigint,bigint,text)', 'execute') as anon_cannot_change_live_update_state,
    has_function_privilege('authenticated', 'public.dpt_admin_set_tournament_update_state(bigint,bigint,text)', 'execute') as authenticated_can_change_live_update_state,
    has_table_privilege('anon', 'public.dpt_public_tournament_updates', 'select') as anon_can_read_published_live_updates,
    not has_function_privilege('anon', 'public.dpt_admin_save_configuration(text,bigint,jsonb)', 'execute') as anon_cannot_save_configuration,
    has_function_privilege('authenticated', 'public.dpt_admin_save_configuration(text,bigint,jsonb)', 'execute') as authenticated_can_save_configuration,
    not has_function_privilege('anon', 'public.dpt_admin_set_configuration_status(text,bigint,boolean)', 'execute') as anon_cannot_set_configuration_status,
    has_function_privilege('authenticated', 'public.dpt_admin_set_configuration_status(text,bigint,boolean)', 'execute') as authenticated_can_set_configuration_status,
    not has_function_privilege('anon', 'public.dpt_admin_soft_delete_configuration(text,bigint)', 'execute') as anon_cannot_delete_configuration,
    has_function_privilege('authenticated', 'public.dpt_admin_soft_delete_configuration(text,bigint)', 'execute') as authenticated_can_delete_configuration,
    not has_function_privilege('anon','public.dpt_admin_save_blind_structure(bigint,jsonb)','execute') as anon_cannot_save_blinds,
    has_function_privilege('authenticated','public.dpt_admin_save_blind_structure(bigint,jsonb)','execute') as authenticated_can_save_blinds,
    not has_function_privilege('anon','public.dpt_admin_status_blind_structure(bigint,boolean)','execute') as anon_cannot_status_blinds,
    has_function_privilege('authenticated','public.dpt_admin_status_blind_structure(bigint,boolean)','execute') as authenticated_can_status_blinds,
    not has_function_privilege('anon','public.dpt_admin_delete_blind_structure(bigint)','execute') as anon_cannot_delete_blinds,
    has_function_privilege('authenticated','public.dpt_admin_delete_blind_structure(bigint)','execute') as authenticated_can_delete_blinds,
    not has_function_privilege('anon','public.dpt_admin_copy_blind_structure(bigint)','execute') as anon_cannot_copy_blinds,
    has_function_privilege('authenticated','public.dpt_admin_copy_blind_structure(bigint)','execute') as authenticated_can_copy_blinds,
    not has_function_privilege('anon','public.dpt_admin_save_payout_template(bigint,jsonb)','execute') as anon_cannot_save_payout_templates,
    has_function_privilege('authenticated','public.dpt_admin_save_payout_template(bigint,jsonb)','execute') as authenticated_can_save_payout_templates,
    not has_function_privilege('anon','public.dpt_admin_delete_payout_template(bigint)','execute') as anon_cannot_delete_payout_templates,
    has_function_privilege('authenticated','public.dpt_admin_delete_payout_template(bigint)','execute') as authenticated_can_delete_payout_templates,
    not has_function_privilege('anon','public.dpt_admin_copy_payout_template(bigint)','execute') as anon_cannot_copy_payout_templates,
    has_function_privilege('authenticated','public.dpt_admin_copy_payout_template(bigint)','execute') as authenticated_can_copy_payout_templates,
    not has_function_privilege('anon','public.dpt_admin_save_tournament(bigint,jsonb)','execute') as anon_cannot_save_tournaments,
    has_function_privilege('authenticated','public.dpt_admin_save_tournament(bigint,jsonb)','execute') as authenticated_can_save_tournaments,
    not has_function_privilege('anon','public.dpt_admin_copy_tournament(bigint)','execute') as anon_cannot_copy_tournaments,
    has_function_privilege('authenticated','public.dpt_admin_copy_tournament(bigint)','execute') as authenticated_can_copy_tournaments,
    not has_function_privilege('anon','public.dpt_admin_set_tournament_status(bigint,boolean)','execute') as anon_cannot_status_tournaments,
    has_function_privilege('authenticated','public.dpt_admin_set_tournament_status(bigint,boolean)','execute') as authenticated_can_status_tournaments,
    not has_function_privilege('anon','public.dpt_admin_soft_delete_tournament(bigint)','execute') as anon_cannot_delete_tournaments,
    has_function_privilege('authenticated','public.dpt_admin_soft_delete_tournament(bigint)','execute') as authenticated_can_delete_tournaments,
    not has_function_privilege('anon','public.dpt_admin_save_player(uuid,jsonb)','execute') as anon_cannot_save_players,
    has_function_privilege('authenticated','public.dpt_admin_save_player(uuid,jsonb)','execute') as authenticated_can_save_players,
    not has_function_privilege('anon','public.dpt_admin_archive_player(uuid)','execute') as anon_cannot_archive_players,
    has_function_privilege('authenticated','public.dpt_admin_archive_player(uuid)','execute') as authenticated_can_archive_players,
    not has_function_privilege('anon','public.dpt_admin_save_role(bigint,jsonb)','execute') as anon_cannot_save_roles,
    has_function_privilege('authenticated','public.dpt_admin_save_role(bigint,jsonb)','execute') as authenticated_can_save_roles,
    not has_function_privilege('anon','public.dpt_admin_delete_role(bigint)','execute') as anon_cannot_delete_roles,
    has_function_privilege('authenticated','public.dpt_admin_delete_role(bigint)','execute') as authenticated_can_delete_roles,
    not has_function_privilege('anon','public.dpt_admin_merge_players(uuid,uuid[],uuid,boolean)','execute') as anon_cannot_merge_players,
    has_function_privilege('authenticated','public.dpt_admin_merge_players(uuid,uuid[],uuid,boolean)','execute') as authenticated_can_merge_players,
    (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('admin_roles','admin_permissions','admin_role_permissions','profile_admin_roles','profile_notification_preferences','notifications','player_merges','player_merge_sources','player_merge_pending_references')) as player_security_tables_have_rls,
    not has_function_privilege('anon','public.dpt_admin_save_category(bigint,jsonb)','execute') as anon_cannot_save_categories,
    has_function_privilege('authenticated','public.dpt_admin_save_category(bigint,jsonb)','execute') as authenticated_can_save_categories,
    not has_function_privilege('anon','public.dpt_admin_save_article(bigint,jsonb)','execute') as anon_cannot_save_articles,
    has_function_privilege('authenticated','public.dpt_admin_save_article(bigint,jsonb)','execute') as authenticated_can_save_articles,
    not has_function_privilege('anon','public.dpt_admin_create_notification(jsonb,uuid)','execute') as anon_cannot_create_notifications,
    has_function_privilege('authenticated','public.dpt_admin_create_notification(jsonb,uuid)','execute') as authenticated_can_create_notifications,
    not has_function_privilege('anon','public.dpt_admin_mark_internal_notification_read(uuid)','execute') as anon_cannot_read_notifications,
    has_function_privilege('authenticated','public.dpt_admin_mark_internal_notification_read(uuid)','execute') as authenticated_can_read_notifications,
    not has_function_privilege('anon','public.dpt_admin_save_email_template(uuid,jsonb)','execute') as anon_cannot_save_templates,
    has_function_privilege('authenticated','public.dpt_admin_save_email_template(uuid,jsonb)','execute') as authenticated_can_save_templates,
    not has_function_privilege('anon','public.dpt_admin_archive_email_template(uuid)','execute') as anon_cannot_archive_templates,
    has_function_privilege('authenticated','public.dpt_admin_archive_email_template(uuid)','execute') as authenticated_can_archive_templates,
    (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('article_categories','articles','article_profiles','media_assets','notification_campaigns','notification_recipients','notification_deliveries','internal_notifications','email_templates','email_template_versions','email_template_attachments')) as content_tables_have_rls,
    has_table_privilege('anon','public.dpt_public_published_articles','select') as anon_can_read_published_articles,
    has_column_privilege('anon','public.articles','title','select') as anon_can_read_public_article_title,
    not has_column_privilege('anon','public.articles','body_html','select') as anon_cannot_read_private_article_body
`);
const workflowSecurity = workflowSecurityResult.rows[0];

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
if (!Object.values(security).every(Boolean)) throw new Error(`Security lint assertion failed: ${JSON.stringify(security)}`);
if (!Object.values(profileAuth).every(Boolean)) throw new Error(`Profile/Auth separation assertion failed: ${JSON.stringify(profileAuth)}`);
if (!Object.values(workflowSecurity).every(Boolean)) throw new Error(`Tournament workflow security assertion failed: ${JSON.stringify(workflowSecurity)}`);
if (Number(counts.admin_accounts) !== 1) throw new Error(`Expected one staging admin mapping, found ${counts.admin_accounts}`);
const expectedPublicCounts = { events: 80, tournaments: 261, venues: 78, articles: 383, players: 2369 };
for (const [key, expected] of Object.entries(expectedPublicCounts)) {
  if (Number(counts[key]) !== expected) throw new Error(`Public data count mismatch for ${key}: ${counts[key]} != ${expected}`);
}
if (policies.some((row) => ['profiles', 'tournament_entries', 'tournament_payouts'].includes(row.tablename) && /public/i.test(row.policyname))) {
  throw new Error('Core private table still has a public policy');
}
if (coreImportCounts) {
  const expectedCoreCounts = {
    profiles: 2591,
    profile_roles: 2606,
    venues: 78,
    events: 82,
    tournaments: 271,
    blind_structures: 8,
    blind_structures_with_levels: 8,
    payout_templates: 5,
    payout_template_rows: 2461,
    tournament_payouts: 1940,
    tournament_entries: 11019,
    tournament_entry_addons: 7832,
    tournament_updates: 24,
  };
  for (const [key, expected] of Object.entries(expectedCoreCounts)) {
    if (Number(coreImportCounts[key]) !== expected) throw new Error(`Core import count mismatch for ${key}: ${coreImportCounts[key]} != ${expected}`);
  }
}

console.log(JSON.stringify({
  migrations: migrationFiles.length,
  publicTableCount: tables.length,
  appRoles,
  privileges,
  security,
  profileAuth,
  workflowSecurity,
  counts,
  coreImportCounts,
  policyCount: policies.length,
}, null, 2));

await db.close();
