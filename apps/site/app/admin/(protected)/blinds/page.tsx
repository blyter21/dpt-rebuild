import { AdminShell, AdminSectionHeader } from '../../../../components/admin';
import { StructureManager } from '../../../../components/structure-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function BlindsPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Blind Structures" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Blinds List">Production-matched blind structures, levels and breaks.</AdminSectionHeader><StructureManager kind="blinds"/></AdminShell>}
