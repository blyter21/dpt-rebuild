import { NextResponse } from 'next/server';
import { adminRpcNames } from '../../../lib/admin-api-contracts';
import { getAdminDiagnostics } from '../../../lib/admin-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = getAdminDiagnostics();

  return NextResponse.json({
    ok: true,
    name: 'DPT Admin Mock API',
    activeTransport: diagnostics.activeTransport,
    safeMode: diagnostics.safeMode,
    supportedRpcs: adminRpcNames,
    rpcCount: adminRpcNames.length,
    endpoints: {
      index: '/api/dpt',
      diagnostics: '/api/dpt/diagnostics',
      rpcPattern: '/api/dpt/[rpc]',
      rpcExample: '/api/dpt/dpt_check_in_player'
    },
    diagnostics: {
      href: '/api/dpt/diagnostics',
      supabaseTransportReady: diagnostics.testMode.supabaseTransportReady,
      supabaseDisabledReason: diagnostics.supabase.disabledReason,
      exposesSecrets: false
    },
    note: 'Local mock API index. No Supabase secrets are exposed.'
  });
}
