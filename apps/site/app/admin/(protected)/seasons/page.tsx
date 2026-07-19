import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ConfigurationManager } from '../../../../components/configuration-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminSeasonsPage() { const snapshot = await getDptAdminSnapshot(); return <AdminShell active="Seasons" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Seasons">Production columns: Name, League, Start Date, End Date, Status, Actions.</AdminSectionHeader><ConfigurationManager kind="seasons" /></AdminShell>; }
