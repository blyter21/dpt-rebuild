'use client';

import { useCallback, useEffect, useState } from 'react';

export type DeskPlayer = {
  id: string;
  legacy_user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  nick_name: string | null;
  avatar_url: string | null;
};

export type DeskEntry = {
  id: number;
  player_id: string | null;
  pre_registered: boolean;
  checked_in: boolean;
  initial_buyin: number;
  initial_chips_count: number;
  total_buy_in_amount: number;
  no_of_addons_buy: number;
  total_addon_chips: number;
  total_chips: number;
  rank: number | null;
  winnings: number | null;
  score: number | null;
  bounty: number;
  eliminated: boolean;
  elimination_sequence: number | null;
  final_table: boolean;
  player: DeskPlayer | null;
};

type DeskData = {
  tournament: {
    id: number;
    name: string;
    starts_at: string | null;
    registration_closed: boolean;
    minimum_buy_in: number;
    initial_chips_count: number;
    rebuy_amount: number;
    rebuy_fee: number;
    rebuy_chips_count: number;
    event: { id: number; name: string } | null;
    venue: { id: number; name: string; city: string | null; state: string | null } | null;
    tournament_type: { id: number; code: string; name: string } | null;
  };
  entries: DeskEntry[];
  payouts: Array<{ id: number; standing: number; payout_amount: number; points: number | null; prize_description: string | null }>;
  updates: Array<{ id: number; title: string; published_at: string | null; featured: boolean; status: boolean }>;
  audit: Array<{ id: number; action: string; entity_type: string; entity_id: string; created_at: string }>;
  metrics: { registered: number; checkedIn: number; remaining: number; eliminated: number; totalBuyIn: number; addonCount: number };
};

function playerName(entry: DeskEntry) {
  const player = entry.player;
  if (!player) return `Entry ${entry.id}`;
  return [player.first_name, player.last_name].filter(Boolean).join(' ') || player.nick_name || `Player ${player.legacy_user_id ?? entry.id}`;
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function AdminTournamentDesk({ tournamentId }: { tournamentId: number }) {
  const [desk, setDesk] = useState<DeskData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/desk`, { cache: 'no-store' });
      const payload = await response.json() as DeskData & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load tournament desk');
      setDesk(payload);
    } catch (reason) {
      setDesk(null);
      setError(reason instanceof Error ? reason.message : 'Unable to load tournament desk');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { void reload(); }, [reload]);

  if (loading) return <div className="dpt-desk-state">Loading tournament desk…</div>;
  if (error) return <div className="dpt-desk-state error"><strong>Tournament desk unavailable</strong><span>{error}</span><button onClick={() => void reload()}>Retry</button></div>;
  if (!desk) return null;

  return (
    <div className="dpt-desk">
      <section className="dpt-desk-banner">
        <div>
          <span>{desk.tournament.event?.name || 'Standalone tournament'}</span>
          <h2>{desk.tournament.name}</h2>
          <p>{desk.tournament.venue ? `${desk.tournament.venue.name} · ${desk.tournament.venue.city || ''}, ${desk.tournament.venue.state || ''}` : 'Venue not assigned'}</p>
        </div>
        <div className={`dpt-desk-registration ${desk.tournament.registration_closed ? 'closed' : 'open'}`}>
          Registration {desk.tournament.registration_closed ? 'closed' : 'open'}
        </div>
      </section>

      <section className="dpt-desk-metrics" aria-label="Tournament desk metrics">
        <article><span>Registered</span><strong>{desk.metrics.registered}</strong></article>
        <article><span>Checked in</span><strong>{desk.metrics.checkedIn}</strong></article>
        <article><span>Remaining</span><strong>{desk.metrics.remaining}</strong></article>
        <article><span>Eliminated</span><strong>{desk.metrics.eliminated}</strong></article>
        <article><span>Total buy-in</span><strong>{money(desk.metrics.totalBuyIn)}</strong></article>
        <article><span>Add-ons</span><strong>{desk.metrics.addonCount}</strong></article>
      </section>

      <section className="dpt-desk-grid">
        <article className="dpt-desk-panel dpt-desk-players">
          <header><div><span>Operations</span><h3>Registered players</h3></div><strong>{desk.entries.length} entries</strong></header>
          <div className="dpt-admin-table-wrap">
            <table className="dpt-admin-table">
              <thead><tr><th>Player</th><th>Status</th><th>Buy-in</th><th>Chips</th><th>Rank</th><th>Winnings</th><th>Points</th><th>Actions</th></tr></thead>
              <tbody>{desk.entries.map((entry) => (
                <tr key={entry.id}>
                  <td><strong>{playerName(entry)}</strong>{entry.player?.nick_name ? <small>{entry.player.nick_name}</small> : null}</td>
                  <td>{entry.eliminated ? 'Eliminated' : entry.checked_in ? 'Checked in' : 'Registered'}</td>
                  <td>{money(entry.total_buy_in_amount)}</td>
                  <td>{Number(entry.total_chips || 0).toLocaleString()}</td>
                  <td>{entry.rank ?? '—'}</td>
                  <td>{money(entry.winnings)}</td>
                  <td>{Number(entry.score || 0).toLocaleString()}</td>
                  <td><span className="dpt-desk-action-placeholder">Actions in Loop 088</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </article>

        <aside className="dpt-desk-side">
          <article className="dpt-desk-panel">
            <header><div><span>Configuration</span><h3>Desk settings</h3></div></header>
            <dl className="dpt-desk-definition">
              <div><dt>Type</dt><dd>{desk.tournament.tournament_type?.name || desk.tournament.tournament_type?.code || 'Not configured'}</dd></div>
              <div><dt>Buy-in</dt><dd>{money(desk.tournament.minimum_buy_in)}</dd></div>
              <div><dt>Initial chips</dt><dd>{Number(desk.tournament.initial_chips_count || 0).toLocaleString()}</dd></div>
              <div><dt>Rebuy</dt><dd>{money(desk.tournament.rebuy_amount)}</dd></div>
              <div><dt>Rebuy chips</dt><dd>{Number(desk.tournament.rebuy_chips_count || 0).toLocaleString()}</dd></div>
            </dl>
          </article>
          <article className="dpt-desk-panel">
            <header><div><span>Prize structure</span><h3>Payouts</h3></div><strong>{desk.payouts.length}</strong></header>
            {desk.payouts.length ? <ol className="dpt-desk-payouts">{desk.payouts.map((payout) => <li key={payout.id}><span>#{payout.standing}</span><strong>{money(payout.payout_amount)}</strong></li>)}</ol> : <p>No tournament payouts have been materialized.</p>}
          </article>
        </aside>
      </section>
    </div>
  );
}
