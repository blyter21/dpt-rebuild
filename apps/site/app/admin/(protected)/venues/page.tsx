import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ConfigurationManager } from '../../../../components/configuration-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminVenuesPage() { const snapshot = await getDptAdminSnapshot(); return <AdminShell active="Venues" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Venues" count={snapshot.venues.length}>Production-equivalent venue list with safe, authenticated configuration actions.</AdminSectionHeader><ConfigurationManager kind="venues" /></AdminShell>; }
