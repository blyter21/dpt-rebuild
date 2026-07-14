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
      'Register player',
      'Check in player',
      'Save add-on',
      'Eliminate player',
      'Undo player result',
      'Audit history',
    ]) {
      expect(source).toContain(expected);
    }
    expect(source).toContain('Confirm the correct player');
  });
});
