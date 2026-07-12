import { requireDptAdminSession } from '../../../lib/dpt-admin-auth';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireDptAdminSession();
  return children;
}
