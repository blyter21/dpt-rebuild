import { AdminSectionHeader, AdminShell } from '../../../../../components/admin';
import { NotificationCampaignDetail } from '../../../../../components/notification-campaign-detail';
import { getDptAdminSnapshot } from '../../../../../lib/dpt-admin-repository';
export default async function Page({ params }: { params: { id: string } }) { const s = await getDptAdminSnapshot(); return <AdminShell active="Notifications" source={s.source} generatedAt={s.generatedAt} repositoryMode={s.repositoryMode}><AdminSectionHeader title="Campaign simulation history">Staging-only queued email/SMS simulation; no external transport is configured.</AdminSectionHeader><NotificationCampaignDetail id={params.id} /></AdminShell>; }
