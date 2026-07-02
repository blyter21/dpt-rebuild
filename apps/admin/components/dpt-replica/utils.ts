import type { RowAction } from './types';

export const format = new Intl.NumberFormat('en-US');

export function money(value: number | undefined | null) {
  return `$${format.format(value ?? 0)}`;
}

export function legacyRouteFor(module: string, action: RowAction, itemName: string) {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const base: Record<string, string> = {
    Tournaments: '/admin/tournaments',
    Events: '/admin/events',
    Players: '/admin/users',
    Venues: '/admin/venues',
    Articles: '/admin/articles'
  };
  const root = base[module] ?? '/admin';
  if (action === 'Manage' && module === 'Tournaments') return `${root}/{id}/index_checkedInPlayers`;
  if (action === 'Duplicate / Save as Copy') return `${root}/{id}/save-as-copy`;
  if (action === 'Edit') return `${root}/{id}/edit`;
  if (action === 'View') return `${root}/${slug || '{id}'}`;
  return `${root}/{id}/delete-disabled`;
}

export function rebuiltTargetFor(module: string, action: RowAction) {
  const target = module.toLowerCase().replace(/\s+\/\s+/g, '-').replace(/\s+/g, '-');
  if (action === 'Manage' && module === 'Tournaments') return 'Next.js Live Tournament Manager + /api/dpt RPC boundary';
  if (action === 'Duplicate / Save as Copy') return `Next.js admin/${target}/copy mock flow`;
  if (action === 'Edit') return `Next.js admin/${target}/detail edit mode`;
  if (action === 'View') return `Next.js admin/${target}/detail view mode`;
  return 'Delete intentionally disabled in replica POC';
}
