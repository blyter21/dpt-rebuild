import { AdminSectionHeader, AdminShell } from '../../../../components/admin';
import { ContentManager } from '../../../../components/content-manager';
import { getDptAdminSnapshot } from '../../../../lib/dpt-admin-repository';
export default async function Page(){const s=await getDptAdminSnapshot();return <AdminShell active="Email Templates" source={s.source} generatedAt={s.generatedAt} repositoryMode={s.repositoryMode}><AdminSectionHeader title="Email Templates">Versioned, sanitized templates. Copies are always unpublished drafts.</AdminSectionHeader><ContentManager resource="emailtemplates"/></AdminShell>}
