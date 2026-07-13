#!/usr/bin/env python3
"""Extract public-facing Dakota Poker Tour data from the production SQL dump.

This intentionally outputs a public-site dataset rather than raw/private tables.
It includes names and event/result data needed for the public site, but omits
passwords, OTP records, tokens, emails, and phone numbers.
"""
from __future__ import annotations

from datetime import datetime
from html import unescape
from pathlib import Path
import json
import os
import re
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SQL_PATH = Path(os.environ.get(
    'DPT_PRODUCTION_SQL_PATH',
    '/home/hermes/.hermes/private/dpt/prod_dakotapokertour.sql',
))
OUT_PATH = ROOT / 'apps/site/data/dpt-public.json'

TABLES = {
    'users',
    'dpt_events',
    'dpt_tournaments',
    'dpt_venues',
    'articles',
    'dpt_tournament_players',
    'dpt_tournament_payout_distributions',
    'dpt_seasons',
}


def parse_scalar(token: str) -> Any:
    token = token.strip()
    if token.upper() == 'NULL':
        return None
    if token.startswith("'") and token.endswith("'"):
        value = token[1:-1]
        value = value.replace("\\'", "'").replace('\\\\', '\\')
        value = value.replace('\\r', '\r').replace('\\n', '\n').replace('\\t', '\t')
        return unescape(value)
    if re.fullmatch(r'-?\d+', token):
        try:
            return int(token)
        except ValueError:
            return token
    if re.fullmatch(r'-?\d+\.\d+', token):
        try:
            return float(token)
        except ValueError:
            return token
    return token


def split_tuple(body: str) -> list[str]:
    values: list[str] = []
    cur: list[str] = []
    in_str = False
    esc = False
    for ch in body:
        if in_str:
            cur.append(ch)
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == "'":
                in_str = False
        else:
            if ch == "'":
                in_str = True
                cur.append(ch)
            elif ch == ',':
                values.append(''.join(cur).strip())
                cur = []
            else:
                cur.append(ch)
    values.append(''.join(cur).strip())
    return values


def parse_insert_values(values_sql: str) -> list[list[Any]]:
    rows: list[list[Any]] = []
    depth = 0
    in_str = False
    esc = False
    start: int | None = None
    for idx, ch in enumerate(values_sql):
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == "'":
                in_str = False
            continue
        if ch == "'":
            in_str = True
        elif ch == '(':
            if depth == 0:
                start = idx + 1
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0 and start is not None:
                rows.append([parse_scalar(part) for part in split_tuple(values_sql[start:idx])])
                start = None
    return rows


def load_tables(sql: str) -> dict[str, list[dict[str, Any]]]:
    data = {name: [] for name in TABLES}
    insert_pat = re.compile(r'INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*(.*?);\n', re.S)
    for table, columns_sql, values_sql in insert_pat.findall(sql):
        if table not in TABLES:
            continue
        columns = re.findall(r'`([^`]+)`', columns_sql)
        for row in parse_insert_values(values_sql):
            data[table].append(dict(zip(columns, row)))
    return data


def clean_html(value: Any, limit: int = 240) -> str:
    if not value:
        return ''
    text = str(value)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:limit].rstrip() + ('…' if len(text) > limit else '')


def dt(value: Any) -> datetime:
    if not value:
        return datetime.min
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return datetime.strptime(str(value)[:19 if ' ' in str(value) else 10], fmt)
        except ValueError:
            pass
    return datetime.min


def public_user_name(user: dict[str, Any] | None) -> str:
    if not user:
        return 'Unknown Player'
    nick = (user.get('nick_name') or '').strip()
    first = (user.get('first_name') or '').strip()
    last = (user.get('last_name') or '').strip()
    name = nick or ' '.join(x for x in [first, last] if x).strip()
    return name or (user.get('alias') or 'Unknown Player')


def asset_url(kind: str, filename: Any, variant: str | None = None) -> str:
    if not filename:
        return ''
    value = str(filename).strip()
    if not value:
        return ''
    if value.startswith(('http://', 'https://')):
        return value
    if '/' in value and kind == 'article':
        # Older article rows sometimes already include article/<file> paths.
        return f'https://dakotapokertour.com/storage/{value}'
    folder = kind if variant is None else f'{kind}/{variant}'
    return f'https://dakotapokertour.com/storage/{folder}/{value}'


def is_live(row: dict[str, Any]) -> bool:
    return row.get('deleted_at') in (None, '', 'NULL')


def main() -> None:
    if not SQL_PATH.exists():
        if OUT_PATH.exists():
            existing = json.loads(OUT_PATH.read_text())
            print(json.dumps({
                'out': str(OUT_PATH),
                'skipped': True,
                'reason': f'SQL source not found at {SQL_PATH}; reused existing generated public data.',
                'leaderboard': len(existing.get('leaderboard', [])),
                'players': len(existing.get('players', [])),
                'events': len(existing.get('events', [])),
                'tournaments': len(existing.get('tournaments', [])),
                'venues': len(existing.get('venues', [])),
                'articles': len(existing.get('articles', [])),
                'champions': len(existing.get('champions', [])),
            }, indent=2))
            return
        raise FileNotFoundError(f'SQL source not found at {SQL_PATH} and no generated data exists at {OUT_PATH}')

    sql = SQL_PATH.read_text(errors='replace')
    tables = load_tables(sql)

    users = {row['id']: row for row in tables['users'] if row.get('id') is not None and is_live(row)}
    venues = {row['id']: row for row in tables['dpt_venues'] if row.get('id') is not None and is_live(row)}
    seasons = {row['id']: row for row in tables['dpt_seasons'] if row.get('id') is not None and is_live(row)}
    current_season_ids = [sid for sid, season in seasons.items() if str(season.get('default')) in {'1', 'True', 'true'}]
    if not current_season_ids and seasons:
        current_season_ids = [max(seasons, key=lambda sid: dt(seasons[sid].get('start_date')))]

    events_raw = [row for row in tables['dpt_events'] if is_live(row) and int(row.get('status') or 0) == 1]
    events_raw.sort(key=lambda row: dt(row.get('start_date')), reverse=True)
    events_by_id = {row['id']: row for row in events_raw if row.get('id') is not None}

    tournaments_raw = [row for row in tables['dpt_tournaments'] if is_live(row) and int(row.get('status') or 0) == 1]
    tournaments_raw.sort(key=lambda row: dt(row.get('start_date')), reverse=True)
    tournaments_by_id = {row['id']: row for row in tournaments_raw if row.get('id') is not None}

    articles_raw = [row for row in tables['articles'] if is_live(row) and int(row.get('status') or 0) == 1]
    articles_raw.sort(key=lambda row: dt(row.get('published_at') or row.get('created_at')), reverse=True)

    # Leaderboard: sum scores for the current season if one exists; otherwise all public scored entries.
    valid_tournament_ids = set(tournaments_by_id)
    if current_season_ids:
        valid_tournament_ids = {tid for tid, t in tournaments_by_id.items() if t.get('season_id') in current_season_ids}
    scores: dict[int, int] = {}
    wins: dict[int, int] = {}
    cashes: dict[int, int] = {}
    for entry in tables['dpt_tournament_players']:
        if not is_live(entry):
            continue
        uid = entry.get('user_id')
        tid = entry.get('tournament_id')
        if uid not in users or tid not in valid_tournament_ids:
            continue
        score = int(entry.get('score') or 0)
        scores[uid] = scores.get(uid, 0) + score
        if entry.get('rank') == 1:
            wins[uid] = wins.get(uid, 0) + 1
        if entry.get('rank') and int(entry.get('rank') or 0) > 0:
            cashes[uid] = cashes.get(uid, 0) + 1
    if not scores and current_season_ids:
        # Some dumps mark a future/current season before score-bearing tournament rows exist.
        # Fall back to all scored public tournament rows so the public clone has real leaderboard data.
        valid_tournament_ids = set(tournaments_by_id)
        for entry in tables['dpt_tournament_players']:
            if not is_live(entry):
                continue
            uid = entry.get('user_id')
            tid = entry.get('tournament_id')
            if uid not in users or tid not in valid_tournament_ids:
                continue
            score = int(entry.get('score') or 0)
            if score <= 0:
                continue
            scores[uid] = scores.get(uid, 0) + score
            if entry.get('rank') == 1:
                wins[uid] = wins.get(uid, 0) + 1
            if entry.get('rank') and int(entry.get('rank') or 0) > 0:
                cashes[uid] = cashes.get(uid, 0) + 1

    leaderboard = []
    for rank, (uid, points) in enumerate(sorted(scores.items(), key=lambda item: item[1], reverse=True), start=1):
        user = users[uid]
        leaderboard.append({
            'rank': rank,
            'playerId': uid,
            'name': public_user_name(user),
            'city': user.get('city') or '',
            'state': user.get('state') or '',
            'avatar': user.get('avatar') or '',
            'avatarUrl': asset_url('profile', user.get('avatar'), 'medium'),
            'points': points,
            'wins': wins.get(uid, 0),
            'cashes': cashes.get(uid, 0),
        })

    player_stats: dict[int, dict[str, Any]] = {}
    for entry in tables['dpt_tournament_players']:
        if not is_live(entry):
            continue
        uid = int(entry.get('user_id') or 0)
        if uid not in users:
            continue
        stat = player_stats.setdefault(uid, {
            'points': 0,
            'winnings': 0,
            'cashes': 0,
            'finalTables': 0,
            'titles': 0,
            'tournaments': 0,
        })
        stat['points'] += int(entry.get('score') or 0)
        stat['winnings'] += int(entry.get('winnings') or 0)
        stat['tournaments'] += 1
        rank_value = int(entry.get('rank') or 0)
        if rank_value > 0:
            stat['cashes'] += 1
        if int(entry.get('final_table') or 0) == 1:
            stat['finalTables'] += 1
        if rank_value == 1:
            stat['titles'] += 1

    public_players = []
    for uid, stat in sorted(player_stats.items(), key=lambda item: (-item[1]['points'], public_user_name(users[item[0]]).lower())):
        user = users[uid]
        public_players.append({
            'playerId': uid,
            'alias': user.get('alias') or '',
            'name': public_user_name(user),
            'city': user.get('city') or '',
            'state': user.get('state') or '',
            'avatar': user.get('avatar') or '',
            'avatarUrl': asset_url('profile', user.get('avatar'), 'medium'),
            **stat,
        })

    public_venues = []
    for row in sorted(venues.values(), key=lambda v: v.get('name') or ''):
        public_venues.append({
            'id': row['id'], 'name': row.get('name'), 'alias': row.get('alias'),
            'status': int(row.get('status') or 0),
            'address': row.get('address'), 'city': row.get('city'), 'state': row.get('state'), 'zip': row.get('zip'),
            'phone': row.get('phone'),
            'logo': row.get('logo'), 'bannerImage': row.get('banner_image'), 'website': row.get('website'),
            'imageUrl': asset_url('venue', row.get('logo'), 'medium'), 'bannerUrl': asset_url('venue', row.get('banner_image'), 'medium'),
        })

    public_events = []
    for row in events_raw:
        venue = venues.get(row.get('venue_id'), {})
        public_events.append({
            'id': row['id'], 'name': row.get('name'), 'alias': row.get('alias'),
            'description': clean_html(row.get('description'), 260),
            'startDate': row.get('start_date'), 'endDate': row.get('end_date'),
            'logo': row.get('logo'), 'bannerImage': row.get('banner_image'),
            'imageUrl': asset_url('event', row.get('logo'), 'medium'), 'bannerUrl': asset_url('event', row.get('banner_image'), 'medium'),
            'venue': {'id': venue.get('id'), 'name': venue.get('name'), 'alias': venue.get('alias'), 'city': venue.get('city'), 'state': venue.get('state')},
        })

    public_tournaments = []
    for row in tournaments_raw:
        event = events_by_id.get(row.get('event_id'), {})
        venue = venues.get(row.get('venue_id'), {})
        public_tournaments.append({
            'id': row['id'], 'name': row.get('name'), 'alias': row.get('alias'),
            'shortDescription': clean_html(row.get('short_description') or row.get('long_description'), 240),
            'startDate': row.get('start_date'), 'endDate': row.get('end_date'),
            'registrationStartDate': row.get('registration_start_date'),
            'minimumBuyIn': row.get('minimum_buyin'), 'maximumBuyIn': row.get('maximum_buyin'),
            'totalPrizePool': row.get('total_prize_pool'), 'totalPlayers': row.get('total_no_of_players'),
            'logo': row.get('logo'), 'bannerImage': row.get('banner_image'),
            'imageUrl': asset_url('tournament', row.get('logo'), 'medium'), 'bannerUrl': asset_url('tournament', row.get('banner_image'), 'medium'),
            'event': {'id': event.get('id'), 'name': event.get('name'), 'alias': event.get('alias')},
            'venue': {'id': venue.get('id'), 'name': venue.get('name'), 'alias': venue.get('alias'), 'city': venue.get('city'), 'state': venue.get('state')},
        })

    champions = []
    for entry in tables['dpt_tournament_players']:
        if not is_live(entry) or entry.get('rank') != 1:
            continue
        tournament = tournaments_by_id.get(entry.get('tournament_id'))
        user = users.get(entry.get('user_id'))
        if not tournament or not user:
            continue
        champions.append({
            'player': public_user_name(user),
            'city': user.get('city') or '',
            'state': user.get('state') or '',
            'tournament': tournament.get('name'),
            'tournamentAlias': tournament.get('alias'),
            'date': tournament.get('start_date'),
            'winnings': entry.get('winnings'),
            'score': entry.get('score'),
        })
    champions.sort(key=lambda row: dt(row.get('date')), reverse=True)

    public_articles = []
    for row in articles_raw:
        tournament = tournaments_by_id.get(row.get('tournament_id'), {})
        public_articles.append({
            'id': row['id'], 'title': row.get('title'), 'alias': row.get('alias'),
            'excerpt': clean_html(row.get('introtext') or row.get('fulltext'), 240),
            'content': clean_html(row.get('fulltext') or row.get('introtext'), 12000),
            'publishedAt': row.get('published_at'), 'featured': bool(row.get('featured')),
            'logo': row.get('logo'), 'banner': row.get('banner'), 'videoUrl': row.get('video_url'),
            'imageUrl': asset_url('article', row.get('logo'), 'thumb'), 'bannerUrl': asset_url('article', row.get('banner'), 'medium'),
            'tournament': {'id': tournament.get('id'), 'name': tournament.get('name'), 'alias': tournament.get('alias')},
        })

    data = {
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'source': 'prod_dakotapokertour.sql',
        'counts': {name: len(rows) for name, rows in tables.items()},
        'currentSeasonIds': current_season_ids,
        'navigation': ['Events', 'News', 'Videos', 'Venues', 'Leaderboard', 'Players', 'Champions', 'Join/Login', 'Live Updates'],
        'videos': [
            {
                'title': 'Tri-State Championship Day 1',
                'videoUrl': 'https://www.youtube.com/watch?v=TUj5rdgBHZQ',
                'embedUrl': 'https://www.youtube.com/embed/TUj5rdgBHZQ',
                'source': 'live dakotapokertour.com homepage',
                'thumbnailUrl': '/media/dpt/video/TUj5rdgBHZQ.jpg',
            },
            {
                'title': 'Hype Video - Cactus Jacks Open',
                'videoUrl': 'https://www.youtube.com/watch?v=UJvMmjhOXFc',
                'embedUrl': 'https://www.youtube.com/embed/UJvMmjhOXFc',
                'source': 'live dakotapokertour.com homepage',
                'thumbnailUrl': '/media/dpt/video/UJvMmjhOXFc.jpg',
            },
        ],
        'leaderboard': leaderboard,
        'players': public_players,
        'events': public_events,
        'tournaments': public_tournaments,
        'venues': public_venues,
        'articles': public_articles,
        'champions': champions,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(json.dumps({
        'out': str(OUT_PATH),
        'leaderboard': len(leaderboard),
        'players': len(public_players),
        'events': len(public_events),
        'tournaments': len(public_tournaments),
        'venues': len(public_venues),
        'articles': len(public_articles),
        'champions': len(data['champions']),
        'currentSeasonIds': current_season_ids,
    }, indent=2))


if __name__ == '__main__':
    main()
