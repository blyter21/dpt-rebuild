#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import uuid
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get('DPT_PRODUCTION_SQL_PATH', '/home/hermes/.hermes/private/dpt/prod_dakotapokertour.sql'))
OUTPUT = Path(os.environ.get('DPT_PRIVATE_IMPORT_PATH', '/home/hermes/.hermes/private/dpt/dpt_core_production_import.sql'))
CHUNK_DIR = Path(os.environ.get('DPT_PRIVATE_IMPORT_CHUNK_DIR', '/home/hermes/.hermes/private/dpt/import-chunks'))
REPORT = ROOT / 'reports' / 'dpt-core-import-summary.json'
PARSER_PATH = ROOT / 'scripts' / 'extract_public_dpt_data.py'
NAMESPACE = uuid.UUID('f9dfb9c5-0a16-4b89-9ef9-1f010d74ce30')

TABLES = {
    'users', 'roles', 'model_has_roles',
    'dpt_leagues', 'dpt_seasons', 'dpt_venues', 'dpt_events',
    'dpt_tournament_types', 'dpt_blind_structures', 'dpt_tournaments',
    'dpt_payout_distributions', 'dpt_payout_structures', 'dpt_tournament_payout_distributions',
    'dpt_tournament_players', 'dpt_tournament_players_addon', 'dpt_tournament_updates',
}
SENSITIVE_USER_FIELDS = {'password', 'remember_token', 'archived_details'}


def load_parser():
    spec = importlib.util.spec_from_file_location('dpt_extract', PARSER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f'Unable to load parser: {PARSER_PATH}')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    setattr(module, 'TABLES', TABLES)
    return module


def sanitize(value: Any) -> Any:
    if isinstance(value, str):
        return value.replace('\x00', '')
    if isinstance(value, list):
        return [sanitize(item) for item in value]
    if isinstance(value, dict):
        return {str(key): sanitize(item) for key, item in value.items()}
    return value


def quote(value: Any) -> str:
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace('\x00', '').replace("'", "''")
    return f"'{text}'"


def json_literal(value: Any) -> str:
    text = json.dumps(sanitize(value), ensure_ascii=False, separators=(',', ':')).replace("'", "''")
    return f"'{text}'::jsonb"


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip().replace('\x00', '')
    return text or None


def clean_date(value: Any) -> str | None:
    text = clean_text(value)
    if not text or text.startswith('0000-00-00'):
        return None
    return text


def required_timestamp(primary: Any, fallback: Any = None) -> str:
    return clean_date(primary) or clean_date(fallback) or '1970-01-01 00:00:00'


def integer(value: Any, default: int = 0) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return default


def number(value: Any, default: float = 0) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def truthy(value: Any) -> bool:
    return str(value).strip().lower() in {'1', 'true', 't', 'yes'}


def parse_json(value: Any, fallback: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    text = clean_text(value)
    if not text:
        return fallback
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            return json.loads(text.replace('\\"', '"'))
        except json.JSONDecodeError:
            return fallback


def profile_uuid(legacy_user_id: Any) -> str:
    return str(uuid.uuid5(NAMESPACE, f'dpt-user:{integer(legacy_user_id)}'))


def user_reference(value: Any, known_users: set[int]) -> str | None:
    user_id = integer(value)
    return profile_uuid(user_id) if user_id in known_users else None


def insert_batches(table: str, columns: list[str], records: Iterable[list[Any]], conflict: str, batch_size: int = 400) -> tuple[list[str], int]:
    rows = list(records)
    statements: list[str] = []
    for offset in range(0, len(rows), batch_size):
        batch = rows[offset:offset + batch_size]
        values = []
        for record in batch:
            rendered = []
            for column, value in zip(columns, record):
                rendered.append(json_literal(value) if column == 'legacy_data' or column in {'config', 'blind_info'} else quote(value))
            values.append('(' + ','.join(rendered) + ')')
        statements.append(
            f"insert into public.{table} ({','.join(columns)}) values\n  "
            + ',\n  '.join(values)
            + f"\n{conflict};"
        )
    return statements, len(rows)


def write_api_chunks(statements: list[str], max_bytes: int = 800_000) -> list[dict[str, Any]]:
    """Write ordered, idempotent transaction chunks below the Management API body limit."""
    body_statements = [
        statement for statement in statements
        if statement.strip().lower() not in {'begin;', 'commit;', 'set statement_timeout = 0;'}
    ]
    chunks: list[list[str]] = []
    current: list[str] = []
    current_bytes = 0
    for statement in body_statements:
        size = len(statement.encode('utf-8')) + 2
        if size > max_bytes:
            raise RuntimeError(f'Private import statement exceeds chunk limit: {size} bytes')
        if current and current_bytes + size > max_bytes:
            chunks.append(current)
            current = []
            current_bytes = 0
        current.append(statement)
        current_bytes += size
    if current:
        chunks.append(current)

    CHUNK_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(CHUNK_DIR, 0o700)
    for old_file in CHUNK_DIR.glob('*.sql'):
        old_file.unlink()

    manifest: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks, start=1):
        content = 'begin;\nset statement_timeout = 0;\n\n' + '\n\n'.join(chunk) + '\n\ncommit;\n'
        path = CHUNK_DIR / f'{index:03d}.sql'
        path.write_text(content)
        os.chmod(path, 0o600)
        manifest.append({
            'index': index,
            'file': path.name,
            'bytes': path.stat().st_size,
            'statements': len(chunk),
            'sha256': hashlib.sha256(content.encode('utf-8')).hexdigest(),
        })
    manifest_path = CHUNK_DIR / 'manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    os.chmod(manifest_path, 0o600)
    return manifest


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f'Production SQL source not found: {SOURCE}')

    parser = load_parser()
    tables = parser.load_tables(SOURCE.read_text(errors='replace'))
    users = tables['users']
    known_users = {integer(row['id']) for row in users}
    statements = ['begin;', "set statement_timeout = 0;"]
    counts: dict[str, int] = {}
    skipped: dict[str, int] = {}

    profile_columns = ['id','legacy_user_id','auth_user_id','first_name','last_name','nick_name','email','mobile','country_code','alias','avatar_url','status','created_at','updated_at','deleted_at','legacy_data']
    profile_records = []
    for row in users:
        safe = {key: value for key, value in row.items() if key not in SENSITIVE_USER_FIELDS}
        profile_records.append([
            profile_uuid(row['id']), integer(row['id']), None,
            clean_text(row.get('first_name')), clean_text(row.get('last_name')), clean_text(row.get('nick_name')),
            clean_text(row.get('email')), clean_text(row.get('mobile')), clean_text(row.get('country_code')),
            clean_text(row.get('alias')), clean_text(row.get('avatar')),
            'active' if truthy(row.get('status')) and not clean_date(row.get('deleted_at')) else 'inactive',
            clean_date(row.get('created_at')), clean_date(row.get('updated_at')), clean_date(row.get('deleted_at')), safe,
        ])
    profile_conflict = "on conflict (legacy_user_id) do update set first_name=excluded.first_name,last_name=excluded.last_name,nick_name=excluded.nick_name,email=excluded.email,mobile=excluded.mobile,country_code=excluded.country_code,alias=excluded.alias,avatar_url=excluded.avatar_url,status=excluded.status,created_at=excluded.created_at,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,legacy_data=excluded.legacy_data"
    sql, counts['profiles'] = insert_batches('profiles', profile_columns, profile_records, profile_conflict)
    statements.extend(sql)

    role_names = {integer(row['id']): clean_text(row.get('name')) for row in tables['roles']}
    role_map = {'super admin': 'super_admin', 'administrator': 'administrator', 'host': 'host', 'venue': 'venue', 'user': 'user'}
    role_records = []
    for row in tables['model_has_roles']:
        legacy_id = integer(row.get('model_id'))
        role = role_map.get(role_names.get(integer(row.get('role_id'))) or '')
        if legacy_id in known_users and role:
            role_records.append([profile_uuid(legacy_id), role])
    sql, counts['profile_roles'] = insert_batches('profile_roles', ['profile_id','role'], role_records, 'on conflict (profile_id,role) do nothing')
    statements.extend(sql)

    entity_specs = [
        ('dpt_leagues','leagues',['id','name','alias','description','status','created_at','updated_at','deleted_at','legacy_data'],
         lambda r:[integer(r['id']),clean_text(r.get('name')),clean_text(r.get('alias')),clean_text(r.get('description')),truthy(r.get('status')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r]),
        ('dpt_seasons','seasons',['id','league_id','name','alias','description','is_default','start_at','end_at','status','created_at','updated_at','deleted_at','legacy_data'],
         lambda r:[integer(r['id']),integer(r.get('league_id')) or None,clean_text(r.get('name')),clean_text(r.get('alias')),clean_text(r.get('description')),truthy(r.get('default')),clean_date(r.get('start_date')),clean_date(r.get('end_date')),truthy(r.get('status')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r]),
        ('dpt_venues','venues',['id','name','alias','address','city','state','zip','phone','website','latitude','longitude','status','created_at','updated_at','deleted_at','legacy_data'],
         lambda r:[integer(r['id']),clean_text(r.get('name')),clean_text(r.get('alias')),clean_text(r.get('address')),clean_text(r.get('city')),clean_text(r.get('state')),clean_text(r.get('zip')),clean_text(r.get('phone')),clean_text(r.get('website')),number(r.get('map_location_latitude')) or None,number(r.get('map_location_longitude')) or None,truthy(r.get('status')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r]),
        ('dpt_events','events',['id','season_id','venue_id','name','alias','description','start_at','end_at','status','rules_description','created_at','updated_at','deleted_at','legacy_data'],
         lambda r:[integer(r['id']),integer(r.get('season_id')) or None,integer(r.get('venue_id')) or None,clean_text(r.get('name')),clean_text(r.get('alias')),clean_text(r.get('description')),clean_date(r.get('start_date')),clean_date(r.get('end_date')),truthy(r.get('status')),clean_text(r.get('rules_description')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r]),
    ]
    for source, target, columns, mapper in entity_specs:
        sql, counts[target] = insert_batches(target, columns, (mapper(row) for row in tables[source]), 'on conflict (id) do nothing')
        statements.extend(sql)

    type_codes = {1:'dpt_standard',2:'satellite',3:'freeroll',4:'flight'}
    type_columns = ['id','code','name','config','legacy_data']
    type_records = [[integer(r['id']),type_codes[integer(r['id'])],clean_text(r.get('name')),parse_json(r.get('config'),{}),r] for r in tables['dpt_tournament_types']]
    sql, counts['tournament_types'] = insert_batches('tournament_types', type_columns, type_records, 'on conflict (id) do nothing')
    statements.extend(sql)

    blind_columns = ['id','name','blind_info','blind_intervals','is_copy','status','description','created_at','updated_at','deleted_at','legacy_data']
    blind_records = [[integer(r['id']),clean_text(r.get('name')),parse_json(r.get('blind_info'),[]),integer(r.get('blind_intervals')) or None,truthy(r.get('copied_blind')),truthy(r.get('status')),clean_text(r.get('description')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r] for r in tables['dpt_blind_structures']]
    sql, counts['blind_structures'] = insert_batches('blind_structures', blind_columns, blind_records, 'on conflict (id) do nothing')
    statements.extend(sql)

    payout_template_columns = ['id','name','tournament_type_id','type','created_at','updated_at','deleted_at','legacy_data']
    payout_template_records = [[
        integer(r['id']), clean_text(r.get('name')), integer(r.get('tournament_type_id')) or None,
        clean_text(r.get('type')) or 'range', required_timestamp(r.get('created_at'), r.get('updated_at')),
        required_timestamp(r.get('updated_at'), r.get('created_at')), clean_date(r.get('deleted_at')), r,
    ] for r in tables['dpt_payout_distributions']]
    payout_template_ids = {record[0] for record in payout_template_records}
    sql, counts['payout_templates'] = insert_batches(
        'payout_templates', payout_template_columns, payout_template_records,
        'on conflict (id) do update set name=excluded.name,tournament_type_id=excluded.tournament_type_id,type=excluded.type,created_at=excluded.created_at,updated_at=excluded.updated_at,deleted_at=excluded.deleted_at,legacy_data=excluded.legacy_data',
    )
    statements.extend(sql)

    payout_row_columns = ['id','payout_template_id','player_count_start','player_count_end','winners_count','standing','payout_percentage','payout_amount','prize_description','points','created_at','legacy_data']
    payout_row_records = []
    payout_row_ids: set[int] = set()
    payout_row_lookup: dict[tuple[int, int], int] = {}
    payout_row_occurrences: dict[tuple[int, int], int] = {}
    for structure in tables['dpt_payout_structures']:
        structure_id = integer(structure['id'])
        payout_template_id = integer(structure.get('payout_id'))
        rows = parse_json(structure.get('structures'), [])
        if not isinstance(rows, list):
            continue
        if payout_template_id not in payout_template_ids:
            skipped['orphan_payout_structures'] = skipped.get('orphan_payout_structures', 0) + 1
            skipped['orphan_payout_structure_rows'] = skipped.get('orphan_payout_structure_rows', 0) + len(rows)
            continue
        for source_row in rows:
            if not isinstance(source_row, dict):
                continue
            rank_start = max(1, integer(source_row.get('rank_start')))
            rank_end = max(rank_start, integer(source_row.get('rank_end')) or rank_start)
            for standing in range(rank_start, rank_end + 1):
                lookup_key = (structure_id, standing)
                occurrence = payout_row_occurrences.get(lookup_key, 0) + 1
                payout_row_occurrences[lookup_key] = occurrence
                row_id = structure_id * 1_000_000 + standing * 100 + occurrence
                payout_row_ids.add(row_id)
                payout_row_lookup.setdefault(lookup_key, row_id)
                payout_row_records.append([
                    row_id, payout_template_id, integer(structure.get('player_count_start')) or None,
                    integer(structure.get('player_count_end')) or None, integer(structure.get('winners_count')) or None,
                    standing, number(source_row.get('percentage')) or None, number(source_row.get('amount')) or None,
                    clean_text(source_row.get('prize_description')), integer(source_row.get('points')) or None,
                    required_timestamp(structure.get('created_at'), structure.get('updated_at')),
                    {
                        'source_structure_id': structure_id,
                        'source_payout_id': integer(structure.get('payout_id')),
                        'source_player_count_start': integer(structure.get('player_count_start')) or None,
                        'source_player_count_end': integer(structure.get('player_count_end')) or None,
                        'source_winners_count': integer(structure.get('winners_count')) or None,
                        'source_occurrence': occurrence,
                        'source_row': source_row,
                    },
                ])
    sql, counts['payout_template_rows'] = insert_batches(
        'payout_template_rows', payout_row_columns, payout_row_records,
        'on conflict (id) do update set payout_template_id=excluded.payout_template_id,player_count_start=excluded.player_count_start,player_count_end=excluded.player_count_end,winners_count=excluded.winners_count,standing=excluded.standing,payout_percentage=excluded.payout_percentage,payout_amount=excluded.payout_amount,prize_description=excluded.prize_description,points=excluded.points,created_at=excluded.created_at,legacy_data=excluded.legacy_data', 100,
    )
    statements.extend(sql)

    tournament_columns = ['id','event_id','venue_id','tournament_type_id','blind_structure_id','name','alias','short_description','long_description','rules_description','starts_at','ends_at','registration_starts_at','registration_ends_at','registration_closed','registration_closed_by','registration_closed_at','dealer_fee','minimum_buyin','maximum_buyin','allow_rebuy','rebuy_amount','rebuy_fee','rebuy_chips_count','initial_chips_count','players_at_final_table','points_multiplier_enabled','points_multiplier_value','participation_bonus_points','allow_search_registration','status','created_at','updated_at','deleted_at','legacy_data']
    tournament_records = []
    for r in tables['dpt_tournaments']:
        tournament_records.append([
            integer(r['id']),integer(r.get('event_id')) or None,integer(r.get('venue_id')) or None,integer(r.get('tournament_type_id')) or None,integer(r.get('blind_id')) or None,
            clean_text(r.get('name')),clean_text(r.get('alias')),clean_text(r.get('short_description')),clean_text(r.get('long_description')),clean_text(r.get('rules_description')),
            clean_date(r.get('start_date')),clean_date(r.get('end_date')),clean_date(r.get('registration_start_date')),clean_date(r.get('registration_end_date')),
            truthy(r.get('registration_closed')),user_reference(r.get('registration_closed_by'),known_users),clean_date(r.get('registration_closed_date')),
            integer(r.get('dealer_fee')),integer(r.get('minimum_buyin')),integer(r.get('maximum_buyin')) or None,truthy(r.get('allow_rebuy')),integer(r.get('rebuy_amount')),integer(r.get('rebuy_fee')),integer(r.get('rebuy_chips_count')),integer(r.get('initial_chips_count')),integer(r.get('players_at_final_table')) or None,
            truthy(r.get('points_multiplier')),number(r.get('points_multiplier_value')) or None,integer(r.get('participation_bonus_points')),truthy(r.get('allow_search_registration')),truthy(r.get('status')),
            clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r,
        ])
    sql, counts['tournaments'] = insert_batches('tournaments', tournament_columns, tournament_records, 'on conflict (id) do nothing', 150)
    statements.extend(sql)

    tournament_payout_columns = ['id','tournament_id','payout_template_row_id','standing','payout_percentage','payout_amount','prize_description','points','created_at','updated_at','legacy_data']
    tournament_payout_records = []
    for payout in tables['dpt_tournament_payout_distributions']:
        standing = max(1, integer(payout.get('standing')))
        structure_id = integer(payout.get('structure_id'))
        row_id = payout_row_lookup.get((structure_id, standing)) if structure_id else None
        tournament_payout_records.append([
            integer(payout['id']), integer(payout.get('tournament_id')), row_id if row_id in payout_row_ids else None,
            standing, number(payout.get('payout_percentage')) or None, number(payout.get('payout_amount')),
            clean_text(payout.get('prize_description')), integer(payout.get('points')) or None,
            required_timestamp(payout.get('created_at'), payout.get('updated_at')),
            required_timestamp(payout.get('updated_at'), payout.get('created_at')), payout,
        ])
    sql, counts['tournament_payouts'] = insert_batches(
        'tournament_payouts', tournament_payout_columns, tournament_payout_records,
        'on conflict (id) do update set tournament_id=excluded.tournament_id,payout_template_row_id=excluded.payout_template_row_id,standing=excluded.standing,payout_percentage=excluded.payout_percentage,payout_amount=excluded.payout_amount,prize_description=excluded.prize_description,points=excluded.points,created_at=excluded.created_at,updated_at=excluded.updated_at,legacy_data=excluded.legacy_data', 250,
    )
    statements.extend(sql)

    entry_columns = ['id','tournament_id','player_id','legacy_user_id','pre_registered','checked_in','checked_in_by','initial_buyin','initial_chips_count','total_buy_in_amount','no_of_addons_buy','total_addon_chips','total_chips','rank','winnings','score','bounty','eliminated','elimination_sequence','final_table','duplicate_status','qualified_flight_player','created_at','updated_at','deleted_at','legacy_data']
    entry_records = []
    entry_by_pair: dict[tuple[int,int],list[int]] = {}
    for r in tables['dpt_tournament_players']:
        raw_user_id=r.get('user_id')
        user_id,tournament_id,entry_id=integer(raw_user_id),integer(r.get('tournament_id')),integer(r.get('id'))
        player_id=profile_uuid(user_id) if user_id in known_users else None
        legacy_user_id=user_id if raw_user_id is not None else None
        if player_id:
            entry_by_pair.setdefault((tournament_id,user_id), []).append(entry_id)
        entry_records.append([entry_id,tournament_id,player_id,legacy_user_id,truthy(r.get('pre_registration')),truthy(r.get('checked_in')),user_reference(r.get('checked_in_by'),known_users),integer(r.get('initial_buyin')),integer(r.get('initial_chips_count')),integer(r.get('total_buy_in_amount')),integer(r.get('no_of_addons_buy')),integer(r.get('total_addon_chips')),integer(r.get('total_chips')),integer(r.get('rank')) or None,integer(r.get('winnings')) or None,integer(r.get('score')) or None,integer(r.get('bounty')),truthy(r.get('eliminated')),integer(r.get('elimination_sequence')) or None,truthy(r.get('final_table')),truthy(r.get('duplicate_status')),truthy(r.get('qualified_flight_player')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),clean_date(r.get('deleted_at')),r])
    sql, counts['tournament_entries'] = insert_batches('tournament_entries', entry_columns, entry_records, 'on conflict (id) do nothing', 250)
    statements.extend(sql)

    addon_columns = ['id','tournament_entry_id','tournament_id','player_id','legacy_user_id','addon_buy_in_amount','addon_chips_count','addon_count','created_by','created_at','legacy_data']
    addon_records=[]
    for r in tables['dpt_tournament_players_addon']:
        raw_user_id=r.get('user_id')
        tournament_id,user_id=integer(r.get('tournament_id')),integer(raw_user_id)
        player_id=profile_uuid(user_id) if user_id in known_users else None
        legacy_user_id=user_id if raw_user_id is not None else None
        matching_entries=entry_by_pair.get((tournament_id,user_id), []) if player_id else []
        unambiguous_entry_id=matching_entries[0] if len(matching_entries)==1 else None
        if len(matching_entries)>1:
            skipped['addons_ambiguous_entry_preserved_by_pair'] = skipped.get('addons_ambiguous_entry_preserved_by_pair',0)+1
        addon_records.append([integer(r['id']),unambiguous_entry_id,tournament_id,player_id,legacy_user_id,integer(r.get('addon_buy_in_amount')),integer(r.get('addon_chips_count')),1,user_reference(r.get('created_by'),known_users),required_timestamp(r.get('created_at'),r.get('updated_at')),r])
    sql, counts['tournament_entry_addons'] = insert_batches('tournament_entry_addons', addon_columns, addon_records, 'on conflict (id) do nothing', 300)
    statements.extend(sql)

    update_columns=['id','tournament_id','title','description','update_at','image_url','video_url','featured','status','created_at','updated_at','legacy_data']
    update_records=[[integer(r['id']),integer(r.get('tournament_id')) or None,clean_text(r.get('title')),clean_text(r.get('description')),clean_date(r.get('update_date')),clean_text(r.get('image')),clean_text(r.get('video_url')),truthy(r.get('featured')),truthy(r.get('status')),clean_date(r.get('created_at')),clean_date(r.get('updated_at')),r] for r in tables['dpt_tournament_updates']]
    sql, counts['tournament_updates'] = insert_batches('tournament_updates', update_columns, update_records, 'on conflict (id) do nothing')
    statements.extend(sql)

    for table in ['leagues','seasons','venues','events','tournament_types','blind_structures','payout_templates','payout_template_rows','tournaments','tournament_payouts','tournament_entries','tournament_entry_addons','tournament_updates']:
        statements.append(f"select setval(pg_get_serial_sequence('public.{table}','id'), coalesce((select max(id) from public.{table}),1), true);")
    statements.append('commit;')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text('\n\n'.join(statements) + '\n')
    os.chmod(OUTPUT, 0o600)
    chunk_manifest = write_api_chunks(statements)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({'source': SOURCE.name, 'outputStoredOutsideGit': True, 'counts': counts, 'skipped': skipped, 'excludedSensitiveFields': sorted(SENSITIVE_USER_FIELDS)}, indent=2) + '\n')
    print(json.dumps({'output': str(OUTPUT), 'bytes': OUTPUT.stat().st_size, 'chunks': {'directory': str(CHUNK_DIR), 'count': len(chunk_manifest), 'maxBytes': max(item['bytes'] for item in chunk_manifest)}, 'counts': counts, 'skipped': skipped, 'report': str(REPORT)}, indent=2))


if __name__ == '__main__':
    main()
