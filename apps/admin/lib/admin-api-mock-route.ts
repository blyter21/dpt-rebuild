import type {
  AdminMutationResult,
  AdminRpcBody,
  AdminRpcName,
  AdminRpcResponse,
  AdminTournamentState
} from './admin-api-contracts';

export type MockRouteTransportConfig = {
  transport?: 'mock-route';
  fetcher?: typeof fetch;
};

export class AdminApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly rpc?: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export async function callMockRouteAdminRpc(
  rpc: AdminRpcName,
  body: AdminRpcBody = {},
  config: MockRouteTransportConfig = {}
): Promise<AdminMutationResult> {
  const fetcher = config.fetcher ?? fetch;
  const response = await fetcher(`/api/dpt/${rpc}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  let payload: AdminRpcResponse;
  try {
    payload = await response.json() as AdminRpcResponse;
  } catch {
    throw new AdminApiError(`RPC ${rpc} returned invalid JSON`, response.status, rpc);
  }

  if ('error' in payload) {
    throw new AdminApiError(payload.error, response.status, rpc);
  }

  if (!response.ok) {
    throw new AdminApiError(`RPC ${rpc} failed with HTTP ${response.status}`, response.status, rpc);
  }

  if (!('result' in payload)) {
    throw new AdminApiError(`RPC ${rpc} did not return mutable state`, response.status, rpc);
  }

  return payload.result;
}

export function callMockRouteStateRpc(
  rpc: AdminRpcName,
  state: AdminTournamentState,
  extraBody: Omit<AdminRpcBody, 'state'> = {},
  config: MockRouteTransportConfig = {}
) {
  return callMockRouteAdminRpc(rpc, { state, ...extraBody }, config);
}
