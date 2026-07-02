import type {
  AdminMutationResult,
  AdminRpcBody,
  AdminRpcName,
  AdminRpcResponse,
  AdminTournamentState
} from './admin-api-contracts';

export const SUPABASE_TRANSPORT_ENABLED = false as const;

export class SupabaseTransportDisabledError extends Error {
  constructor(public readonly rpc: AdminRpcName, public readonly reason = 'Supabase transport is disabled until local DB/credentials are available.') {
    super(reason);
    this.name = 'SupabaseTransportDisabledError';
  }
}

export type SupabaseRpcAdapter = <Name extends AdminRpcName>(
  rpc: Name,
  body: AdminRpcBody
) => Promise<AdminRpcResponse>;

export interface SupabaseTransportConfig {
  enabled: boolean;
  projectUrl?: string;
  anonKey?: string;
  adapter?: SupabaseRpcAdapter;
}

export function getSupabaseTransportStatus(config: Partial<SupabaseTransportConfig> = {}) {
  const enabled = config.enabled === true;
  return {
    enabled,
    ready: enabled && Boolean(config.projectUrl && config.anonKey && config.adapter),
    reason: enabled
      ? 'Supabase transport requested; project URL, anon key, and adapter are required.'
      : 'Supabase transport is disabled until local DB/credentials are available.'
  };
}

export async function callSupabaseAdminRpc(
  rpc: AdminRpcName,
  body: AdminRpcBody = {},
  config: Partial<SupabaseTransportConfig> = {}
): Promise<AdminMutationResult> {
  const status = getSupabaseTransportStatus(config);
  if (!status.ready || !config.adapter) {
    throw new SupabaseTransportDisabledError(rpc, status.reason);
  }

  const payload = await config.adapter(rpc, body);

  if ('error' in payload) {
    throw new Error(payload.error);
  }

  if (!('result' in payload)) {
    throw new Error(`Supabase RPC ${rpc} did not return mutable state.`);
  }

  return payload.result;
}

export function callSupabaseStateRpc(
  rpc: AdminRpcName,
  state: AdminTournamentState,
  extraBody: Omit<AdminRpcBody, 'state'> = {},
  config: Partial<SupabaseTransportConfig> = {}
) {
  return callSupabaseAdminRpc(rpc, { state, ...extraBody }, config);
}
