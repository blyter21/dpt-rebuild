import { AdminShell, AdminSectionHeader } from '../../../../components/admin';
import { StructureManager } from '../../../../components/structure-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function PayoutsPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Payout Distributions Template" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Points System List">Production-matched payout distributions and normalized payout ranges.</AdminSectionHeader><StructureManager kind="payouts"/></AdminShell>}
