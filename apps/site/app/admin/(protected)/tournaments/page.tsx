import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { TournamentManager } from '../../../../components/tournament-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminTournamentsPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Tournaments" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Tournaments">Production-matched tournament setup and operations.</AdminSectionHeader><TournamentManager/></AdminShell>;}
