import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { RolesManager } from '../../../../components/player-security-managers';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminRolesPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Roles" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Roles">Manage grouped administrative permissions.</AdminSectionHeader><RolesManager/></AdminShell>}
