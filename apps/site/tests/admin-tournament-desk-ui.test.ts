import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const componentPath = new URL('../components/admin-tournament-desk.tsx', import.meta.url);

describe('tournament desk operator controls', () => {
  it('connects player search, registration, check-in, add-on and elimination actions', async () => {
    const source = await readFile(componentPath, 'utf8');
    for (const expected of [
      '/api/admin/players/search',
      'body: JSON.stringify({ playerId',
      '/check-in',
      '/addons',
      '/eliminate',
      '/undo',
      '/registration',
      '/payouts/materialize',
      '/ranks/bulk',
      'Register player',
      'Check in player',
      'Save add-on',
      'Eliminate player',
      'Undo player result',
      'Close registration',
      'Reopen registration',
      'Materialize payouts',
      'Bulk edit ranks',
      'Confirm and recalculate ranks',
      '/satellite-winners',
      'Make satellite winners',
      '/flight-advance',
      'Advance flight players',
      'Undo flight advancement',
      'Audit history',
    ]) {
      expect(source).toContain(expected);
    }
    expect(source).toContain('Confirm the correct player');
    expect(source).toContain("desk.tournament.tournament_type?.code === 'satellite'");
    expect(source).toContain("desk.tournament.tournament_type?.code === 'flight'");
    expect(source).toContain('window.confirm');
  });
});
