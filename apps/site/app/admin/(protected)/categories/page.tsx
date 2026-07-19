import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ContentManager } from '../../../../components/content-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function Page(){const s=await getDptAdminSnapshot();return <AdminShell active="Categories" source={s.source} generatedAt={s.generatedAt} repositoryMode={s.repositoryMode}><AdminSectionHeader title="Categories">Hierarchical categories with reference-protected deletion and SEO fields.</AdminSectionHeader><ContentManager resource="categories"/></AdminShell>}
