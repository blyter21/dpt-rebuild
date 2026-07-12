import Link from 'next/link';
import { AdminSectionHeader, AdminShell } from '../../../components/admin';
import { displayText, formatDateRange, money } from '../../../lib/dpt-data';
import { getDptAdminSnapshot } from '../../../lib/dpt-admin-repository';

export default async function AdminTournamentsPage() {
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Tournaments" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Tournaments" count={snapshot.tournaments.length}>Real tournament records extracted from the production database.</AdminSectionHeader>
      <div className="dpt-admin-table-wrap">
        <table className="dpt-admin-table">
          <thead><tr><th>ID</th><th>Tournament</th><th>Event / Venue</th><th>Date</th><th>Players</th><th>Buy-in</th><th>Public page</th></tr></thead>
          <tbody>{snapshot.tournaments.map((tournament) => (
            <tr key={tournament.id}>
              <td>{tournament.id}</td>
              <td><strong>{displayText(tournament.name)}</strong><small>{tournament.alias}</small></td>
              <td>{tournament.event?.name || 'No event'}<small>{tournament.venue ? `${tournament.venue.name} · ${tournament.venue.city}, ${tournament.venue.state}` : 'Venue not assigned'}</small></td>
              <td>{formatDateRange(tournament.startDate, tournament.endDate)}</td>
              <td>{Number(tournament.totalPlayers || 0).toLocaleString()}</td>
              <td>{money(tournament.minimumBuyIn)}</td>
              <td><Link href={`/tournaments/${tournament.alias}`}>View</Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
