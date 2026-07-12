import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const route = readFileSync(new URL('../app/api/dpt/staging-health/route.ts', import.meta.url), 'utf8');

describe('Supabase staging health route', () => {
  it('checks only curated public tables and does not expose credentials', () => {
    for (const table of ['dpt_public_events', 'dpt_public_tournaments', 'dpt_public_venues', 'dpt_public_articles', 'dpt_public_players']) {
      expect(route).toContain(table);
    }
    expect(route).toContain("source: 'supabase-staging'");
    expect(route).not.toContain('service_role');
    expect(route).not.toContain('dpt_admin_accounts');
    expect(route).not.toContain('auth.users');
  });
});
