import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ConfigurationManager } from '../../../../components/configuration-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function AdminEventsPage() { const snapshot = await getDptAdminSnapshot(); return <AdminShell active="Events" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Events" count={snapshot.events.length}>Production-equivalent event administration: search, sorting, pagination, and audited actions.</AdminSectionHeader><ConfigurationManager kind="events" /></AdminShell>; }
