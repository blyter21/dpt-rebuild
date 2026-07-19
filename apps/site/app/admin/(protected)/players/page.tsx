import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { PlayersManager } from '../../../../components/player-security-managers';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminPlayersPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Players" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Players">Search, sort, paginate, export and manage the private player directory.</AdminSectionHeader><PlayersManager/></AdminShell>}
