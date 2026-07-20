import { describe, expect, it, vi } from 'vitest';
import { assertSimulationOnly, simulateNotificationDelivery } from '../lib/notifications/simulator';

describe('staging notification simulator', () => {
 it('makes deterministic simulation IDs without any network call', () => {
  const network = vi.stubGlobal('fetch', vi.fn(() => { throw new Error('network must not be called'); }));
  const delivery = { id: '11111111-1111-4111-8111-111111111111', channel: 'email' as const, lease_token: '22222222-2222-4222-8222-222222222222' };
  expect(simulateNotificationDelivery(delivery)).toEqual(simulateNotificationDelivery(delivery));
  expect(globalThis.fetch).not.toHaveBeenCalled();
  network;
 });
 it('has no live transport selection', () => expect(assertSimulationOnly).not.toThrow());
});
