import Link from 'next/link';
import { AdminMetric, AdminSectionHeader, AdminShell } from '../../components/admin';
import { getDptAdminSnapshot } from '../../lib/dpt-admin-repository';

export default async function AdminDashboardPage() {
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Dashboard" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Production Data Dashboard">
        This dashboard uses records extracted from the live Dakota Poker Tour production database—not sample or mock records.
      </AdminSectionHeader>

      <div className="dpt-admin-metrics">
        <AdminMetric label="Production users" value={snapshot.sourceCounts.users} detail="Count only; private user rows are not exposed in this preview." />
        <AdminMetric label="Tournament entries" value={snapshot.sourceCounts.dpt_tournament_players} detail="Historical production tournament-player records." />
        <AdminMetric label="Production tournaments" value={snapshot.sourceCounts.dpt_tournaments} detail={`${snapshot.tournaments.length} curated records currently available to the integrated repository.`} />
        <AdminMetric label="Production events" value={snapshot.sourceCounts.dpt_events} detail={`${snapshot.events.length} curated records currently available to the integrated repository.`} />
        <AdminMetric label="Production venues" value={snapshot.sourceCounts.dpt_venues} detail={`${snapshot.venues.length} production-derived venue records available.`} />
        <AdminMetric label="Production articles" value={snapshot.sourceCounts.articles} detail={`${snapshot.articles.length} production-derived articles available.`} />
      </div>

      <div className="dpt-admin-grid">
        <article className="dpt-admin-panel">
          <span className="dpt-admin-panel-label">Integrated modules</span>
          <h3>Read-only production views</h3>
          <div className="dpt-admin-module-links">
            <Link href="/admin/events">Events <strong>{snapshot.events.length}</strong></Link>
            <Link href="/admin/tournaments">Tournaments <strong>{snapshot.tournaments.length}</strong></Link>
            <Link href="/admin/venues">Venues <strong>{snapshot.venues.length}</strong></Link>
            <Link href="/admin/articles">Articles <strong>{snapshot.articles.length}</strong></Link>
          </div>
        </article>
        <article className="dpt-admin-panel">
          <span className="dpt-admin-panel-label">Next backend milestone</span>
          <h3>Supabase staging + authentication</h3>
          <p>The next phase replaces the local production snapshot transport with Supabase staging, adds admin login/roles, and then enables audited writes one module at a time.</p>
          <ul>
            <li>No fake records</li>
            <li>No production writes</li>
            <li>No private user fields in this deployment</li>
            <li>Same Next.js/Vercel project as the public site</li>
          </ul>
        </article>
      </div>
    </AdminShell>
  );
}
