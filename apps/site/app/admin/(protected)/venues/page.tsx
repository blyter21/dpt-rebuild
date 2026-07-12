import Link from 'next/link';
import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';

export default async function AdminVenuesPage() {
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Venues" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Venues" count={snapshot.venues.length}>Real venue records extracted from the production database.</AdminSectionHeader>
      <div className="dpt-admin-table-wrap">
        <table className="dpt-admin-table">
          <thead><tr><th>ID</th><th>Venue</th><th>Location</th><th>ZIP</th><th>Website</th><th>Public page</th></tr></thead>
          <tbody>{snapshot.venues.map((venue) => (
            <tr key={venue.id}>
              <td>{venue.id}</td>
              <td><strong>{venue.name}</strong><small>{venue.alias}</small></td>
              <td>{venue.city}, {venue.state}</td>
              <td>{venue.zip || '—'}</td>
              <td>{venue.website ? <a href={venue.website} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
              <td><Link href="/venues">View listing</Link></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
