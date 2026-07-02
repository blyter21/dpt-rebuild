import type {
  AdminMutationResult,
  AdminRpcBody,
  AdminRpcName,
  AdminTournamentState
} from './admin-api-contracts';
import {
  AdminApiError,
  callMockRouteAdminRpc,
  type MockRouteTransportConfig
} from './admin-api-mock-route';
import { callSupabaseAdminRpc, type SupabaseTransportConfig } from './admin-api-supabase';

export { AdminApiError } from './admin-api-mock-route';

export type AdminApiTransport = 'mock-route' | 'supabase-rpc';

export type { MockRouteTransportConfig } from './admin-api-mock-route';

export type SupabaseRpcTransportConfig = {
  transport: 'supabase-rpc';
  supabase?: Partial<SupabaseTransportConfig>;
};

export type AdminApiClientConfig = MockRouteTransportConfig | SupabaseRpcTransportConfig;

export const defaultAdminApiClientConfig: MockRouteTransportConfig = {
  transport: 'mock-route'
};

function isFetchFunction(value: unknown): value is typeof fetch {
  return typeof value === 'function';
}

function normalizeClientConfig(configOrFetcher?: AdminApiClientConfig | typeof fetch): AdminApiClientConfig {
  if (isFetchFunction(configOrFetcher)) {
    return { transport: 'mock-route', fetcher: configOrFetcher };
  }

  return configOrFetcher ?? defaultAdminApiClientConfig;
}

export async function callAdminRpc(
  rpc: AdminRpcName,
  body: AdminRpcBody = {},
  configOrFetcher?: AdminApiClientConfig | typeof fetch
): Promise<AdminMutationResult> {
  const config = normalizeClientConfig(configOrFetcher);

  if (config.transport === 'supabase-rpc') {
    return callSupabaseAdminRpc(rpc, body, config.supabase ?? {});
  }

  return callMockRouteAdminRpc(rpc, body, config);
}

export function callStateRpc(
  rpc: AdminRpcName,
  state: AdminTournamentState,
  extraBody: Omit<AdminRpcBody, 'state'> = {},
  configOrFetcher?: AdminApiClientConfig | typeof fetch
) {
  return callAdminRpc(rpc, { state, ...extraBody }, configOrFetcher);
}
