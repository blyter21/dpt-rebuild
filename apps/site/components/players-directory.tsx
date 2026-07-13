'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PublicPlayer } from '../lib/dpt-data';

type SortKey = 'points' | 'winnings' | 'cashes' | 'finalTables' | 'titles' | 'name';

export function PlayersDirectory({ players }: { players: PublicPlayer[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('points');
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = needle
      ? players.filter((player) => [player.name, player.city, player.state].join(' ').toLowerCase().includes(needle))
      : [...players];
    rows.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      return Number(b[sort] || 0) - Number(a[sort] || 0) || a.name.localeCompare(b.name);
    });
    return rows;
  }, [players, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="players-directory">
      <div className="players-directory-controls">
        <label>
          Search
          <input
            type="search"
            value={query}
            placeholder="Player name or location"
            onChange={(event) => { setQuery(event.target.value); resetPage(); }}
          />
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => { setSort(event.target.value as SortKey); resetPage(); }}>
            <option value="points">POY points</option>
            <option value="winnings">Winnings</option>
            <option value="cashes">Cashes</option>
            <option value="finalTables">Final tables</option>
            <option value="titles">Titles</option>
            <option value="name">Player name</option>
          </select>
        </label>
        <label>
          Show
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); resetPage(); }}>
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <strong>{filtered.length.toLocaleString()} players</strong>
      </div>

      <div className="table-scroll">
        <table className="data-table players-table">
          <thead><tr><th>Player</th><th>POY</th><th>Winnings</th><th>Cashes</th><th>Final Table</th><th>Titles</th></tr></thead>
          <tbody>
            {visible.map((player) => (
              <tr key={player.playerId}>
                <td><Link href={`/player/${player.alias || player.playerId}`}><strong>{player.name}</strong></Link><small>{[player.city, player.state].filter(Boolean).join(', ')}</small></td>
                <td>{player.points.toLocaleString()}</td>
                <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(player.winnings)}</td>
                <td>{player.cashes}</td>
                <td>{player.finalTables}</td>
                <td>{player.titles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="players-pagination">
        <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
        <span>Page {safePage} of {pageCount}</span>
        <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
      </div>
    </div>
  );
}
