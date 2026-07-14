import Link from 'next/link';
import { AdminSectionHeader, AdminShell } from '../../../../../components/admin';
import { AdminTournamentDesk } from '../../../../../components/admin-tournament-desk';
import { getDptAdminSnapshot } from '../../../../../lib/dpt-admin-repository';

export default async function AdminTournamentDeskPage({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);
  const snapshot = await getDptAdminSnapshot();
  return (
    <AdminShell active="Tournaments" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}>
      <AdminSectionHeader title="Tournament desk">
        Authenticated staging operations. <Link href="/admin/tournaments">Return to tournaments</Link>
      </AdminSectionHeader>
      {Number.isSafeInteger(tournamentId) && tournamentId > 0
        ? <AdminTournamentDesk tournamentId={tournamentId} />
        : <div className="dpt-desk-state error">Invalid tournament ID.</div>}
    </AdminShell>
  );
}
