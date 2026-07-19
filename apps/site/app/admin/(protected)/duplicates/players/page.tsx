import { AdminSectionHeader, AdminShell } from '../../../../../components/admin';
import { DuplicatePlayersManager } from '../../../../../components/player-security-managers';
import { getDptAdminSnapshot } from '../../../../../lib/dpt-admin-repository';
export default async function DuplicatePlayersPage(){const snapshot=await getDptAdminSnapshot();return <AdminShell active="Fix Duplicate Players" source={snapshot.source} generatedAt={snapshot.generatedAt} repositoryMode={snapshot.repositoryMode}><AdminSectionHeader title="Fix Duplicate Players">Select one Primary Player and one or more Merge Primary players, preview impact, then merge atomically.</AdminSectionHeader><DuplicatePlayersManager/></AdminShell>}
