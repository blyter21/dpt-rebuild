import { adminRpcNames } from './admin-api-contracts';
import { adminApiRuntimeConfig, type AdminApiRuntimeConfig } from './admin-api-config';
import { getSupabaseTransportStatus } from './admin-api-supabase';

export type AdminDiagnostics = {
  ok: true;
  activeTransport: string;
  safeMode: boolean;
  reason: string;
  supportedRpcs: readonly string[];
  rpcCount: number;
  testMode: {
    mockRoute: boolean;
    supabaseRpcSelected: boolean;
    supabaseTransportReady: boolean;
  };
  supabase: {
    disabledReason: string;
    hasProjectUrl: boolean;
    hasAnonKey: boolean;
    exposesSecrets: false;
  };
};

export function getAdminDiagnostics(config: AdminApiRuntimeConfig = adminApiRuntimeConfig): AdminDiagnostics {
  const supabaseConfig = config.clientConfig.transport === 'supabase-rpc' ? config.clientConfig.supabase ?? {} : {};
  const supabaseStatus = getSupabaseTransportStatus(supabaseConfig);

  return {
    ok: true,
    activeTransport: config.activeTransport,
    safeMode: config.safeMode,
    reason: config.reason,
    supportedRpcs: adminRpcNames,
    rpcCount: adminRpcNames.length,
    testMode: {
      mockRoute: config.activeTransport === 'mock-route',
      supabaseRpcSelected: config.activeTransport === 'supabase-rpc',
      supabaseTransportReady: supabaseStatus.ready
    },
    supabase: {
      disabledReason: supabaseStatus.ready ? 'Supabase transport has required placeholder config.' : supabaseStatus.reason,
      hasProjectUrl: Boolean(supabaseConfig.projectUrl),
      hasAnonKey: Boolean(supabaseConfig.anonKey),
      exposesSecrets: false
    }
  };
}
