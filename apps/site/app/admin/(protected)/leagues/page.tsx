import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ConfigurationManager } from '../../../../components/configuration-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminLeaguesPage() { const snapshot = await getDptAdminSnapshot(); return <AdminShell active="Leagues" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Leagues">Production columns: Name, Status, Actions.</AdminSectionHeader><ConfigurationManager kind="leagues" /></AdminShell>; }
