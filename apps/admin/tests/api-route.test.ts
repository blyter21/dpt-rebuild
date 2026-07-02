import { describe, expect, it } from 'vitest';
import { createInitialMockState } from '../lib/mock-dpt-services';
import { GET, POST } from '../app/api/dpt/[rpc]/route';

const context = (rpc: string) => ({ params: { rpc } });

describe('Next route handler /api/dpt/[rpc]', () => {
  it('GET returns supported RPC names and local-only note', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true });
    expect(payload.note).toContain('No Supabase connection');
    expect(payload.supportedRpcs).toContain('dpt_check_in_player');
  });

  it('POST dispatches check-in and returns JSON state', async () => {
    const request = new Request('http://localhost/api/dpt/dpt_check_in_player', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: createInitialMockState() })
    });

    const response = await POST(request, context('dpt_check_in_player'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.result.message).toContain('dpt_check_in_player');
    expect(payload.result.state.entries.find((entry: { playerId: string }) => entry.playerId === 'Alice')).toMatchObject({
      totalBuyInAmount: 240,
      totalChips: 40_000
    });
  });

  it('POST rejects unsupported RPC names with 404 JSON', async () => {
    const request = new Request('http://localhost/api/dpt/dpt_missing_rpc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(request, context('dpt_missing_rpc'));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toMatchObject({ ok: false, rpc: 'dpt_missing_rpc' });
    expect(payload.supportedRpcs).toContain('dpt_check_in_player');
  });
});
