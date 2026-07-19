import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ContentManager } from '../../../../components/content-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function Page(){const s=await getDptAdminSnapshot();return <AdminShell active="Articles" source={s.source} generatedAt={s.generatedAt} repositoryMode={s.repositoryMode}><AdminSectionHeader title="Articles" count={s.articles.length}>Production-matched article fields, public scheduling, sanitized HTML, and audited management.</AdminSectionHeader><ContentManager resource="articles"/></AdminShell>}
