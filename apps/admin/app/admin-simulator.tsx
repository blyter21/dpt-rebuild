'use client';

import { useMemo, useState } from 'react';
import type { AdminEntry, AdminRpcName, AdminTournamentState } from '../lib/admin-api-contracts';
import { adminRpcNames } from '../lib/admin-api-contracts';
import { adminApiRuntimeConfig } from '../lib/admin-api-config';
import { getAdminDiagnostics } from '../lib/admin-diagnostics';
import { callStateRpc } from '../lib/admin-api-client';
import {
  createInitialMockState,
  dptGetTocQualifiers,
  dptMaterializeTournamentPayouts,
  getLastDisplayScore,
  getPrizePool
} from '../lib/mock-dpt-services';
import {
  ActionButton,
  RowActionPreviewPanel,
  adminSections,
  defaultDetailDraft,
  legacyRouteFor,
  mockPlayers,
  mockTournaments,
  mockEvents,
  mockVenues,
  mockArticles,
  publicSections,
  rebuiltTargetFor
} from '../components/dpt-replica';
import {
  ArticlesSection,
  DashboardSection,
  EventsSection,
  LiveManagerSection,
  MigrationSection,
  NotificationsSection,
  ParitySection,
  PlayersSection,
  PublicPreviewSection,
  ReportsSection,
  RolesSection,
  StructuresSection,
  TournamentsSection,
  VenuesSection
} from '../components/dpt-replica/sections';
import type {
  AdminSection,
  DetailDraft,
  DetailDraftKey,
  DetailMode,
  ListSort,
  PlayerRecord,
  PublicPreviewPage,
  RowAction,
  RowActionPreview,
  ViewMode
} from '../components/dpt-replica';


function newEntryFromPlayer(player: PlayerRecord): AdminEntry {
  return {
    playerId: player.id,
    eliminated: false,
    totalBuyInAmount: 0,
    initialBuyIn: 0,
    initialChipsCount: 0,
    noOfAddonsBuy: 0,
    totalAddonChips: 0,
    totalChips: 0,
    bounty: 0,
    finalTable: false
  };
}

export default function AdminSimulator() {
  const [state, setState] = useState<AdminTournamentState>(() => createInitialMockState());
  const [activeView, setActiveView] = useState<ViewMode>('admin');
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [publicPreviewPage, setPublicPreviewPage] = useState<PublicPreviewPage>('home');
  const [selectedDatabasePlayerId, setSelectedDatabasePlayerId] = useState(mockPlayers[0].id);
  const [selectedLivePlayerId, setSelectedLivePlayerId] = useState('Bob');
  const [log, setLog] = useState<string[]>(['Replica shell opened from browser-backed DPT feature map.']);
  const [pendingRpc, setPendingRpc] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('edit');
  const [detailDraft, setDetailDraft] = useState<DetailDraft>(defaultDetailDraft);
  const [showMockValidation, setShowMockValidation] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState('all');
  const [listSort, setListSort] = useState<ListSort>('newest');
  const [listPage, setListPage] = useState(1);
  const [rowActionLog, setRowActionLog] = useState<string[]>(['Row action menus are mock-only; Delete is intentionally disabled.']);
  const [rowActionPreview, setRowActionPreview] = useState<RowActionPreview | null>(null);

  const pushLog = (message: string) => setLog((current) => [message, ...current].slice(0, 10));

  const detailDirty = JSON.stringify(detailDraft) !== JSON.stringify(defaultDetailDraft);
  const requiredDetailKeys: DetailDraftKey[] = ['tournamentName', 'eventName', 'venueName', 'playerEmail'];
  const hasMockValidationErrors = showMockValidation && requiredDetailKeys.some((key) => !detailDraft[key].trim());

  function updateDetailDraft(key: DetailDraftKey, value: string) {
    setDetailDraft((current) => ({ ...current, [key]: value }));
  }

  function cancelDetailEdits() {
    setDetailDraft(defaultDetailDraft);
    setShowMockValidation(false);
    pushLog('Cancelled mock detail edits; no save was attempted.');
  }

  function resetDetailDemo() {
    setDetailMode('edit');
    setDetailDraft(defaultDetailDraft);
    setShowMockValidation(false);
    pushLog('Reset mock detail screen demo.');
  }

  function clearRequiredDetailFields() {
    setDetailDraft((current) => ({ ...current, tournamentName: '', eventName: '', venueName: '', playerEmail: '' }));
    setShowMockValidation(true);
    pushLog('Triggered mock validation errors by clearing required detail fields.');
  }

  function validationError(key: DetailDraftKey) {
    return showMockValidation && !detailDraft[key].trim() ? 'Required in mock validation' : undefined;
  }

  function listText(item: Record<string, unknown>) {
    return Object.values(item).join(' ').toLowerCase();
  }

  function resetListControls() {
    setListQuery('');
    setListStatusFilter('all');
    setListSort('newest');
    setListPage(1);
    pushLog('Reset mock list filter/search/sort controls.');
  }

  function updateListQuery(query: string) {
    setListQuery(query);
    setListPage(1);
  }

  function updateListStatusFilter(status: string) {
    setListStatusFilter(status);
    setListPage(1);
  }

  function updateListSort(sort: ListSort) {
    setListSort(sort);
    setListPage(1);
  }

  function captureRowAction(action: RowAction, itemName: string, module: string) {
    const message = `${module}: ${action} selected for ${itemName} (mock-only; no write)`;
    setRowActionPreview({ action, itemName, module, legacyRoute: legacyRouteFor(module, action, itemName), rebuiltTarget: rebuiltTargetFor(module, action) });
    setRowActionLog((current) => [message, ...current].slice(0, 6));
    pushLog(message);
    if (action === 'Manage' && module === 'Tournaments') setActiveSection('live');
  }

  function paginateList<T>(items: T[]) {
    const pageSize = 2;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(listPage, totalPages);
    return { pageSize, safePage, rows: items.slice((safePage - 1) * pageSize, safePage * pageSize) };
  }

  function filterAndSortList<T extends Record<string, unknown>>(items: T[], nameKey: keyof T, newestKey?: keyof T) {
    const query = listQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const statusValue = String(item.status ?? '');
      const statusMatch = listStatusFilter === 'all' || statusValue === listStatusFilter;
      const queryMatch = query.length === 0 || listText(item).includes(query);
      return statusMatch && queryMatch;
    });

    return [...filtered].sort((a, b) => {
      if (listSort === 'name') return String(a[nameKey] ?? '').localeCompare(String(b[nameKey] ?? ''));
      if (listSort === 'status') return String(a.status ?? '').localeCompare(String(b.status ?? ''));
      if (newestKey) return String(b[newestKey] ?? '').localeCompare(String(a[newestKey] ?? ''));
      return 0;
    });
  }

  const filteredTournaments = useMemo(() => filterAndSortList(mockTournaments, 'name', 'date'), [listQuery, listStatusFilter, listSort]);
  const filteredEvents = useMemo(() => filterAndSortList(mockEvents, 'name', 'start'), [listQuery, listStatusFilter, listSort]);
  const filteredPlayers = useMemo(() => filterAndSortList(mockPlayers, 'name', 'points'), [listQuery, listStatusFilter, listSort]);
  const filteredVenues = useMemo(() => filterAndSortList(mockVenues, 'name', 'city'), [listQuery, listStatusFilter, listSort]);
  const filteredArticles = useMemo(() => filterAndSortList(mockArticles, 'title', 'title'), [listQuery, listStatusFilter, listSort]);


  async function runRpc(rpc: AdminRpcName, extraBody: { playerId?: string; flightMode?: AdminTournamentState['flightMode'] } = {}) {
    setPendingRpc(rpc);
    try {
      const result = await callStateRpc(rpc, state, extraBody, adminApiRuntimeConfig.clientConfig);
      setState(result.state);
      pushLog(`local route /api/dpt/${rpc}: ${result.message}`);
    } catch (error) {
      pushLog(`local route error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPendingRpc(null);
    }
  }

  const selectedDatabasePlayer = mockPlayers.find((player) => player.id === selectedDatabasePlayerId) ?? mockPlayers[0];
  const selectedLiveEntry = state.entries.find((entry) => entry.playerId === selectedLivePlayerId) ?? state.entries[0];
  const payoutRows = useMemo(() => dptMaterializeTournamentPayouts(), []);
  const prizePool = useMemo(() => getPrizePool(state), [state]);
  const tocQualifiers = useMemo(() => dptGetTocQualifiers(state), [state]);
  const displayScore = useMemo(() => getLastDisplayScore(state), [state]);
  const diagnostics = useMemo(() => getAdminDiagnostics(adminApiRuntimeConfig), []);

  const activePlayers = state.entries.filter((entry) => !entry.eliminated).length;
  const checkedInPlayers = state.entries.filter((entry) => entry.totalBuyInAmount > 0).length;
  const eliminatedPlayers = state.entries.filter((entry) => entry.eliminated).length;
  const totalChips = state.entries.reduce((sum, entry) => sum + entry.totalChips, 0);

  function reset() {
    const initial = createInitialMockState();
    setState(initial);
    setSelectedLivePlayerId('Bob');
    setSelectedDatabasePlayerId(mockPlayers[0].id);
    setLog(['Reset DPT replica shell mock state.']);
  }

  function addSelectedPlayerToTournament() {
    const alreadyInTournament = state.entries.some((entry) => entry.playerId === selectedDatabasePlayer.id);
    if (alreadyInTournament) {
      setSelectedLivePlayerId(selectedDatabasePlayer.id);
      pushLog(`${selectedDatabasePlayer.name} is already in selected tournament; selected in live player list.`);
      return;
    }

    setState((current) => ({
      ...current,
      entries: [...current.entries, newEntryFromPlayer(selectedDatabasePlayer)]
    }));
    setSelectedLivePlayerId(selectedDatabasePlayer.id);
    pushLog(`Added ${selectedDatabasePlayer.name} from Player Database to Black Chip Bounty.`);
  }


  const sectionContext = {
    state,
    setState,
    activeView,
    setActiveView,
    activeSection,
    setActiveSection,
    publicPreviewPage,
    setPublicPreviewPage,
    selectedDatabasePlayerId,
    setSelectedDatabasePlayerId,
    selectedLivePlayerId,
    setSelectedLivePlayerId,
    log,
    setLog,
    pendingRpc,
    setPendingRpc,
    detailMode,
    setDetailMode,
    detailDraft,
    setDetailDraft,
    showMockValidation,
    setShowMockValidation,
    listQuery,
    setListQuery,
    listStatusFilter,
    setListStatusFilter,
    listSort,
    setListSort,
    listPage,
    setListPage,
    rowActionLog,
    setRowActionLog,
    rowActionPreview,
    setRowActionPreview,
    pushLog,
    detailDirty,
    requiredDetailKeys,
    hasMockValidationErrors,
    updateDetailDraft,
    cancelDetailEdits,
    resetDetailDemo,
    clearRequiredDetailFields,
    validationError,
    listText,
    resetListControls,
    updateListQuery,
    updateListStatusFilter,
    updateListSort,
    captureRowAction,
    paginateList,
    filterAndSortList,
    filteredTournaments,
    filteredEvents,
    filteredPlayers,
    filteredVenues,
    filteredArticles,
    runRpc,
    selectedDatabasePlayer,
    selectedLiveEntry,
    payoutRows,
    prizePool,
    tocQualifiers,
    displayScore,
    diagnostics,
    activePlayers,
    checkedInPlayers,
    eliminatedPlayers,
    totalChips,
    reset,
    addSelectedPlayerToTournament
  };

  function renderPublicPreview() {
    return <PublicPreviewSection ctx={sectionContext} />;
  }

  function renderDashboard() {
    return <DashboardSection ctx={sectionContext} />;
  }

  function renderTournaments() {
    return <TournamentsSection ctx={sectionContext} />;
  }


  function renderEvents() {
    return <EventsSection ctx={sectionContext} />;
  }


  function renderPlayers() {
    return <PlayersSection ctx={sectionContext} />;
  }


  function renderVenues() {
    return <VenuesSection ctx={sectionContext} />;
  }


  function renderArticles() {
    return <ArticlesSection ctx={sectionContext} />;
  }

  function renderNotifications() {
    return <NotificationsSection ctx={sectionContext} />;
  }

  function renderStructures() {
    return <StructuresSection ctx={sectionContext} />;
  }

  function renderReports() {
    return <ReportsSection ctx={sectionContext} />;
  }

  function renderParity() {
    return <ParitySection ctx={sectionContext} />;
  }

  function renderMigration() {
    return <MigrationSection ctx={sectionContext} />;
  }

  function renderRoles() {
    return <RolesSection ctx={sectionContext} />;
  }

  function renderLiveManager() {
    return <LiveManagerSection ctx={sectionContext} />;
  }

  function renderPublicChrome() {
    return (
      <section className="dpt-public-shell">
        <header className="dpt-brand-header">
          <div>
            <div className="dpt-logo-mark">DPT</div>
            <div>
              <strong>Dakota Poker Tour</strong>
              <span>Modern replica preview · public site mode</span>
            </div>
          </div>
          <nav className="dpt-brand-nav" aria-label="DPT public navigation">
            {publicSections.map((section) => <button key={section} type="button" onClick={() => setPublicPreviewPage(section === 'Leaderboard' ? 'leaderboard' : section === 'Players' ? 'players' : section === 'Events' ? 'events' : section === 'Live Updates' ? 'tournament' : 'home')}>{section}</button>)}
          </nav>
          <ActionButton onClick={() => setActiveView('admin')} variant="quiet">Open admin replica</ActionButton>
        </header>
        {renderPublicPreview()}
        <footer className="dpt-brand-footer">
          <strong>Dakota Poker Tour</strong>
          <span>The Dakota Poker Tour is brought to you by FPN Gaming, Inc. · Licensed Charitable Gaming Distributor</span>
          <span>Footer replica target: FPNGaming.com, social links, old website link, and quick links.</span>
        </footer>
      </section>
    );
  }

  function renderActiveSection() {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'public': return renderPublicPreview();
      case 'tournaments': return renderTournaments();
      case 'events': return renderEvents();
      case 'players': return renderPlayers();
      case 'venues': return renderVenues();
      case 'articles': return renderArticles();
      case 'notifications': return renderNotifications();
      case 'structures': return renderStructures();
      case 'reports': return renderReports();
      case 'parity': return renderParity();
      case 'migration': return renderMigration();
      case 'roles': return renderRoles();
      case 'live': return renderLiveManager();
    }
  }

  return (
    <main className="shell replica-shell">
      <section className="desk-hero replica-hero">
        <div>
          <div className="eyebrow">Internal Admin Simulator · Mock Data · Not Production</div>
          <h1>DPT Admin Simulator</h1>
          <div className="mock-production-warning" role="note" aria-label="Admin simulator safety warning">
            <strong>Mock Data / Not Production</strong>
            <span>No real users, payouts, notifications, tournament writes, Supabase calls, or production data mutations happen in this preview.</span>
          </div>
          <p>
            Internal workflow simulator based on the live DPT admin feature map. Use it to test tournament desk concepts, registration, player lists, payouts, structures, notifications, reports, and live-manager flows before any real backend connection.
          </p>
          <div className="view-toggle" aria-label="public/admin view toggle">
            <button className={activeView === 'admin' ? 'active' : ''} type="button" onClick={() => setActiveView('admin')}>Admin View</button>
            <button className={activeView === 'public' ? 'active' : ''} type="button" onClick={() => setActiveView('public')}>Public View</button>
          </div>
        </div>
        <div className="status-stack">
          <span className="badge green">Admin feature map applied</span>
          <span className="badge gold">View: {activeView === 'admin' ? 'Admin replica' : 'Public site replica'}</span>
          <span className="badge red">Supabase disconnected</span>
          <span className="badge green">Transport: {adminApiRuntimeConfig.label}</span>
          <span className="badge muted">{adminApiRuntimeConfig.safeMode ? 'Safe local mode' : 'Explicit transport override'}</span>
          <ActionButton onClick={reset} variant="quiet" disabled={pendingRpc !== null}>Reset mock state</ActionButton>
        </div>
      </section>

      {activeView === 'public' ? renderPublicChrome() : (
        <section className="replica-layout">
          <aside className="admin-nav">
            <div className="nav-brand">DPT Admin</div>
            {adminSections.map((section) => (
              <button key={section.id} className={activeSection === section.id ? 'active' : ''} type="button" onClick={() => setActiveSection(section.id)}>
                <span>{section.eyebrow}</span>
                <strong>{section.label}</strong>
              </button>
            ))}
          </aside>
          <div className="replica-content">
            {renderActiveSection()}
            <RowActionPreviewPanel preview={rowActionPreview} onClear={() => setRowActionPreview(null)} />
          </div>
        </section>
      )}
    </main>
  );
}
