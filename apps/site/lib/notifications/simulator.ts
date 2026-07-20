import { createHash } from 'node:crypto';

export type SimulatedDelivery = { id: string; channel: 'email' | 'sms'; lease_token: string };
export type SimulationResult = { outcome: 'sent' | 'failed'; providerMessageId?: string; errorCode?: string };

/**
 * The only transport available in this application. It deliberately performs no I/O:
 * no fetch, provider SDK, credentials, destination, or environment-based live switch.
 */
export function assertSimulationOnly(): void {
  // There is intentionally no alternate/live branch. Preview and staging (including a
  // production-mode Next build) can only reach this local deterministic simulator.
  const databaseOwnedMode: string = 'simulated';
  // Referencing the value makes the closed-world invariant explicit without accepting input.
  void databaseOwnedMode;
}

export function simulateNotificationDelivery(delivery: SimulatedDelivery): SimulationResult {
  assertSimulationOnly();
  const digest = createHash('sha256').update(`${delivery.id}:${delivery.channel}:${delivery.lease_token}`).digest('hex');
  // Stable, sparse failures exercise the database retry path without ever contacting a provider.
  if (Number.parseInt(digest.slice(0, 2), 16) === 0) return { outcome: 'failed', errorCode: 'simulated_transient_failure' };
  return { outcome: 'sent', providerMessageId: `sim-${delivery.channel}-${digest.slice(0, 24)}` };
}
