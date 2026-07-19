'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';

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
  qualified_flight_player: boolean;
  player: DeskPlayer | null;
};

type DeskData = {
  tournament: {
    id: number;
    name: string;
    starts_at: string | null;
    registration_closed: boolean;
    main_tournament_id: number | null;
    chip_carryover: 'highest' | 'sum' | null;
    minimum_buy_in: number;
    initial_chips_count: number;
    rebuy_amount: number;
    rebuy_fee: number;
    rebuy_chips_count: number;
    payout_template_id: number | null;
    total_registered_players: number | null;
    total_payout_players: number | null;
    total_payout_distribution_amount: number | null;
    event: { id: number; name: string } | null;
    venue: { id: number; name: string; city: string | null; state: string | null } | null;
    tournament_type: { id: number; code: string; name: string } | null;
  };
  entries: DeskEntry[];
  payouts: Array<{ id: number; standing: number; payout_amount: number; points: number | null; prize_description: string | null }>;
  payoutTemplates: Array<{ id: number; name: string; tournament_type_id: number | null; type: string }>;
  updates: Array<{ id: number; title: string; published_at: string | null; featured: boolean; status: boolean }>;
  audit: Array<{ id: number; action: string; entity_type: string; entity_id: string; created_at: string }>;
  metrics: { registered: number; checkedIn: number; remaining: number; eliminated: number; totalBuyIn: number; addonCount: number };
};

function profileName(player: DeskPlayer) {
  return [player.first_name, player.last_name].filter(Boolean).join(' ') || player.nick_name || `Player ${player.legacy_user_id ?? player.id}`;
}

function playerName(entry: DeskEntry) {
  const player = entry.player;
  if (!player) return `Entry ${entry.id}`;
  return profileName(player);
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function AdminTournamentDesk({ tournamentId }: { tournamentId: number }) {
  const [desk, setDesk] = useState<DeskData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [playerQuery, setPlayerQuery] = useState('');
  const [playerResults, setPlayerResults] = useState<DeskPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<DeskPlayer | null>(null);
  const [activeEntry, setActiveEntry] = useState<DeskEntry | null>(null);
  const [actionMode, setActionMode] = useState<'check-in' | 'addon' | 'eliminate' | 'undo' | null>(null);
  const [initialBuyIn, setInitialBuyIn] = useState('');
  const [initialChips, setInitialChips] = useState('');
  const [checkInAddonCount, setCheckInAddonCount] = useState('0');
  const [checkInAddonBuyIn, setCheckInAddonBuyIn] = useState('0');
  const [addonCount, setAddonCount] = useState('1');
  const [addonBuyIn, setAddonBuyIn] = useState('');
  const [payoutTemplateId, setPayoutTemplateId] = useState('');
  const [distributionAmount, setDistributionAmount] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/desk`, { cache: 'no-store' });
      const payload = await response.json() as DeskData & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load tournament desk');
      setDesk(payload);
      const matchingTemplates = (payload.payoutTemplates || []).filter((template) => !template.tournament_type_id || template.tournament_type_id === payload.tournament.tournament_type?.id);
      setPayoutTemplateId(String(payload.tournament.payout_template_id || matchingTemplates[0]?.id || ''));
      setDistributionAmount(String(payload.tournament.total_payout_distribution_amount ?? payload.metrics.totalBuyIn ?? 0));
    } catch (reason) {
      setDesk(null);
      setError(reason instanceof Error ? reason.message : 'Unable to load tournament desk');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const searchPlayers = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    const response = await fetch(`/api/admin/players/search?q=${encodeURIComponent(playerQuery)}`, { cache: 'no-store' });
    const payload = await response.json() as { players?: DeskPlayer[]; error?: string };
    if (!response.ok) { setMessage(payload.error || 'Player search failed'); return; }
    setPlayerResults(payload.players || []);
  };

  const registerPlayer = async () => {
    if (!selectedPlayer) return;
    setBusy(true); setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournamentId}/entries`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerId: selectedPlayer.id, preRegistered: true }),
    });
    const payload = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Player registration failed'); return; }
    setMessage('Player registered.'); setSelectedPlayer(null); setPlayerResults([]); setPlayerQuery(''); await reload();
  };

  const setRegistrationState = async (closed: boolean) => {
    setBusy(true); setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournamentId}/registration`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ closed }),
    });
    const payload = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Registration state update failed'); return; }
    setMessage(closed ? 'Registration closed.' : 'Registration reopened.');
    await reload();
  };

  const materializeTournamentPayouts = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournamentId}/payouts/materialize`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payoutTemplateId: Number(payoutTemplateId), totalDistributionAmount: Number(distributionAmount) }),
    });
    const payload = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Payout materialization failed'); return; }
    setMessage('Payouts materialized and ranked-player scores refreshed.');
    await reload();
  };

  const makeSatelliteWinners = async () => {
    if (!desk || desk.tournament.tournament_type?.code !== 'satellite') return;
    if (!window.confirm('Finalize every remaining checked-in satellite entry? This assigns ranks, winnings and scores, and records an audit entry.')) return;
    setBusy(true); setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournamentId}/satellite-winners`, { method: 'POST' });
    const payload = await response.json() as { error?: string; result?: { winner_count?: number } };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Satellite winner assignment failed'); return; }
    setMessage(`${payload.result?.winner_count ?? 0} satellite winner${payload.result?.winner_count === 1 ? '' : 's'} assigned.`);
    await reload();
  };

  const changeFlightAdvancement = async (undo = false) => {
    if (!desk || desk.tournament.tournament_type?.code !== 'flight') return;
    const action = undo ? 'undo this flight advancement' : 'advance every remaining checked-in flight player into the linked main tournament';
    if (!window.confirm(`Confirm: ${action}. This operation is atomic and recorded in the audit trail.`)) return;
    setBusy(true); setMessage('');
    const response = await fetch(`/api/admin/tournaments/${tournamentId}/flight-advance${undo ? '/undo' : ''}`, { method: 'POST' });
    const payload = await response.json() as { error?: string; result?: { advanced_count?: number; undone_count?: number } };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Flight advancement update failed'); return; }
    setMessage(undo ? `${payload.result?.undone_count ?? 0} flight advancement${payload.result?.undone_count === 1 ? '' : 's'} undone.` : `${payload.result?.advanced_count ?? 0} player${payload.result?.advanced_count === 1 ? '' : 's'} advanced.`);
    await reload();
  };

  const openAction = (entry: DeskEntry, mode: 'check-in' | 'addon' | 'eliminate' | 'undo') => {
    setActiveEntry(entry); setActionMode(mode); setMessage('');
    setInitialBuyIn(String(desk?.tournament.minimum_buy_in || 0));
    setInitialChips(String(desk?.tournament.initial_chips_count || 0));
    setCheckInAddonCount('0'); setCheckInAddonBuyIn('0');
    setAddonCount('1'); setAddonBuyIn(String(desk?.tournament.rebuy_amount || 0));
  };

  const closeAction = () => { setActiveEntry(null); setActionMode(null); };

  const submitEntryAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeEntry || !actionMode) return;
    setBusy(true); setMessage('');
    const base = `/api/admin/tournaments/${tournamentId}/entries/${activeEntry.id}`;
    let path = '';
    let body: Record<string, number> | undefined;
    if (actionMode === 'check-in') {
      path = `${base}/check-in`;
      body = {
        submittedInitialBuyIn: Number(initialBuyIn),
        initialChipsCount: Number(initialChips),
        noOfAddons: Number(checkInAddonCount),
        submittedTotalAddonBuyIn: Number(checkInAddonBuyIn),
      };
    } else if (actionMode === 'addon') {
      path = `${base}/addons`;
      body = { addonBuyInAmount: Number(addonBuyIn), noOfAddons: Number(addonCount) };
    } else if (actionMode === 'eliminate') {
      path = `${base}/eliminate`;
    } else {
      path = `${base}/undo`;
    }
    const response = await fetch(path, {
      method: 'POST',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) { setMessage(payload.error || 'Tournament action failed'); return; }
    setMessage(actionMode === 'check-in' ? 'Player checked in.' : actionMode === 'addon' ? 'Add-on saved.' : actionMode === 'eliminate' ? 'Player eliminated.' : 'Player result restored.');
    closeAction(); await reload();
  };

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
        <div className="dpt-desk-registration-controls">
          <div className={`dpt-desk-registration ${desk.tournament.registration_closed ? 'closed' : 'open'}`}>
            Registration {desk.tournament.registration_closed ? 'closed' : 'open'}
          </div>
          <button type="button" disabled={busy} onClick={() => void setRegistrationState(!desk.tournament.registration_closed)}>
            {busy ? 'Saving…' : desk.tournament.registration_closed ? 'Reopen registration' : 'Close registration'}
          </button>
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

      {message ? <div className="dpt-admin-action-message">{message}</div> : null}

      <section className="dpt-desk-panel dpt-desk-registration-panel">
        <header><div><span>Registration</span><h3>Add player</h3></div></header>
        <div className="dpt-desk-register-body">
          <form onSubmit={searchPlayers} className="dpt-desk-search-form">
            <label>Player name<input value={playerQuery} onChange={(event) => setPlayerQuery(event.target.value)} placeholder="Search first, last or nickname" minLength={2} required /></label>
            <button type="submit" disabled={busy}>Search</button>
          </form>
          {playerResults.length ? <div className="dpt-desk-search-results">{playerResults.map((player) => (
            <button key={player.id} type="button" className={selectedPlayer?.id === player.id ? 'selected' : ''} onClick={() => setSelectedPlayer(player)}>
              <strong>{profileName(player)}</strong><span>{player.nick_name || `Legacy #${player.legacy_user_id ?? '—'}`}</span>
            </button>
          ))}</div> : null}
          {selectedPlayer ? <div className="dpt-desk-selected-player"><span>Selected</span><strong>{profileName(selectedPlayer)}</strong><button type="button" onClick={() => void registerPlayer()} disabled={busy}>{busy ? 'Registering…' : 'Register player'}</button></div> : null}
        </div>
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
                  <td><div className="dpt-desk-row-actions">
                    {!entry.checked_in ? <button type="button" onClick={() => openAction(entry, 'check-in')}>Check in</button> : null}
                    {entry.checked_in && !entry.eliminated ? <button type="button" onClick={() => openAction(entry, 'addon')}>Add-on</button> : null}
                    {entry.checked_in && !entry.eliminated ? <button type="button" className="danger" onClick={() => openAction(entry, 'eliminate')}>Eliminate</button> : null}
                    {entry.eliminated ? <button type="button" onClick={() => openAction(entry, 'undo')}>Undo result</button> : null}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {activeEntry && actionMode ? <form className="dpt-desk-action-form" onSubmit={submitEntryAction}>
            <header><div><span>{actionMode}</span><strong>{playerName(activeEntry)}</strong></div><button type="button" onClick={closeAction}>Close</button></header>
            {actionMode === 'check-in' ? <div className="dpt-desk-form-grid">
              <label>Initial buy-in<input type="number" min="0" value={initialBuyIn} onChange={(event) => setInitialBuyIn(event.target.value)} required /></label>
              <label>Initial chips<input type="number" min="0" value={initialChips} onChange={(event) => setInitialChips(event.target.value)} required /></label>
              <label>Add-on count<input type="number" min="0" value={checkInAddonCount} onChange={(event) => setCheckInAddonCount(event.target.value)} required /></label>
              <label>Total add-on buy-in<input type="number" min="0" value={checkInAddonBuyIn} onChange={(event) => setCheckInAddonBuyIn(event.target.value)} required /></label>
            </div> : null}
            {actionMode === 'addon' ? <div className="dpt-desk-form-grid">
              <label>Add-on count<input type="number" min="1" value={addonCount} onChange={(event) => setAddonCount(event.target.value)} required /></label>
              <label>Total add-on buy-in<input type="number" min="0" value={addonBuyIn} onChange={(event) => setAddonBuyIn(event.target.value)} required /></label>
            </div> : null}
            {actionMode === 'eliminate' ? <p>This assigns the next finishing rank, payout, score, sequence and final-table status. Confirm the correct player before continuing.</p> : null}
            {actionMode === 'undo' ? <p>This clears rank, payout, score, elimination sequence and final-table status. The change is recorded in the audit trail.</p> : null}
            <button className={actionMode === 'eliminate' ? 'danger' : ''} type="submit" disabled={busy}>{busy ? 'Saving…' : actionMode === 'check-in' ? 'Check in player' : actionMode === 'addon' ? 'Save add-on' : actionMode === 'eliminate' ? 'Eliminate player' : 'Undo player result'}</button>
          </form> : null}
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
            <form className="dpt-desk-payout-form" onSubmit={materializeTournamentPayouts}>
              <label>Template<select value={payoutTemplateId} onChange={(event) => setPayoutTemplateId(event.target.value)} required>
                <option value="">Select template</option>
                {desk.payoutTemplates.filter((template) => !template.tournament_type_id || template.tournament_type_id === desk.tournament.tournament_type?.id).map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select></label>
              <label>Distribution amount<input type="number" min="0" step="0.01" value={distributionAmount} onChange={(event) => setDistributionAmount(event.target.value)} required /></label>
              <button type="submit" disabled={busy || !desk.tournament.registration_closed}>{busy ? 'Saving…' : 'Materialize payouts'}</button>
              {!desk.tournament.registration_closed ? <small>Close registration before materializing payouts.</small> : null}
            </form>
            {desk.payouts.length ? <ol className="dpt-desk-payouts">{desk.payouts.map((payout) => <li key={payout.id}><span>#{payout.standing}</span><strong>{money(payout.payout_amount)}</strong></li>)}</ol> : <p>No tournament payouts have been materialized.</p>}
          </article>
          {desk.tournament.tournament_type?.code === 'satellite' ? <article className="dpt-desk-panel">
            <header><div><span>Satellite completion</span><h3>Assign remaining winners</h3></div></header>
            <p>Marks every remaining checked-in player as a winner using the materialized satellite payout rows, including any remainder prize.</p>
            <button type="button" className="danger" disabled={busy || !desk.tournament.registration_closed || desk.payouts.length === 0 || desk.metrics.remaining === 0} onClick={() => void makeSatelliteWinners()}>
              {busy ? 'Saving…' : 'Make satellite winners'}
            </button>
            {!desk.tournament.registration_closed ? <small>Close registration before assigning satellite winners.</small> : null}
            {desk.payouts.length === 0 ? <small>Materialize satellite payouts before assigning winners.</small> : null}
          </article> : null}
          {desk.tournament.tournament_type?.code === 'flight' ? <article className="dpt-desk-panel">
            <header><div><span>Flight completion</span><h3>Advance survivors</h3></div></header>
            <p>Moves checked-in surviving players into the linked main tournament using {desk.tournament.chip_carryover || 'highest'}-stack carryover. This is available only after registration closes.</p>
            <button type="button" className="danger" disabled={busy || !desk.tournament.registration_closed || desk.metrics.remaining === 0} onClick={() => void changeFlightAdvancement()}>{busy ? 'Saving…' : 'Advance flight players'}</button>
            <button type="button" disabled={busy || !desk.entries.some((entry) => entry.qualified_flight_player)} onClick={() => void changeFlightAdvancement(true)}>Undo flight advancement</button>
            {!desk.tournament.registration_closed ? <small>Close registration before advancing flight players.</small> : null}
          </article> : null}
          <article className="dpt-desk-panel">
            <header><div><span>Corrections</span><h3>Audit history</h3></div><strong>{desk.audit.length}</strong></header>
            {desk.audit.length ? <ol className="dpt-desk-audit">{desk.audit.map((item) => <li key={item.id}><strong>{item.action.replaceAll('.', ' ')}</strong><span>Entry {item.entity_id} · {new Date(item.created_at).toLocaleString('en-US')}</span></li>)}</ol> : <p>No staging mutations have been recorded.</p>}
          </article>
        </aside>
      </section>
    </div>
  );
}
