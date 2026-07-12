import Link from 'next/link';
import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { displayText, formatDateRange } from '../../../../lib/dpt-data';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';

export default async function AdminEventsPage() {
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Events" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Events" count={snapshot.events.length}>Real event records extracted from the production database.</AdminSectionHeader>
      <div className="dpt-admin-table-wrap">
        <table className="dpt-admin-table">
          <thead><tr><th>ID</th><th>Event</th><th>Date</th><th>Venue</th><th>Public page</th></tr></thead>
          <tbody>{snapshot.events.map((event) => (
            <tr key={event.id}>
              <td>{event.id}</td>
              <td><strong>{displayText(event.name)}</strong><small>{event.alias}</small></td>
              <td>{formatDateRange(event.startDate, event.endDate)}</td>
              <td>{event.venue ? `${event.venue.name} · ${event.venue.city}, ${event.venue.state}` : 'Venue not assigned'}</td>
              <td><Link href={`/events/${event.alias}`}>View</Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
