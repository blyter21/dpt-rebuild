import type { AdminSection, PlayerRecord, PublicPreviewPage } from './types';

export const adminSections: Array<{ id: AdminSection; label: string; eyebrow: string }> = [
  { id: 'dashboard', label: 'Dashboard', eyebrow: 'Overview' },
  { id: 'public', label: 'Public Site Preview', eyebrow: 'Fan-facing site' },
  { id: 'tournaments', label: 'Tournaments', eyebrow: 'Tournament Management' },
  { id: 'events', label: 'Events', eyebrow: 'Seasons / Leagues' },
  { id: 'players', label: 'Players', eyebrow: 'User Management' },
  { id: 'venues', label: 'Venues', eyebrow: 'Event hosts' },
  { id: 'articles', label: 'Articles / Live Updates', eyebrow: 'Content' },
  { id: 'notifications', label: 'Notifications', eyebrow: 'Email / SMS' },
  { id: 'structures', label: 'Structures & Payouts', eyebrow: 'Rules / templates' },
  { id: 'reports', label: 'Reports & Activity', eyebrow: 'Ops reporting' },
  { id: 'parity', label: 'Parity Matrix', eyebrow: 'Current vs rebuilt' },
  { id: 'migration', label: 'Migration Readiness', eyebrow: 'Database takeover' },
  { id: 'roles', label: 'Roles & Permissions', eyebrow: 'Admin access' },
  { id: 'live', label: 'Live Tournament Manager', eyebrow: 'Operator desk' }
];

export const publicSections = ['Home', 'Events', 'Calendar', 'News', 'Videos', 'Venues', 'Leaderboard', 'Players', 'Champions', 'Live Updates'];

export const publicPreviewTabs: Array<{ id: PublicPreviewPage; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'events', label: 'Events' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'players', label: 'Players' },
  { id: 'tournament', label: 'Tournament Detail' }
];

export const mockPlayers: PlayerRecord[] = [
  { id: 'Basim Habib', name: 'Basim Habib', city: 'Fargo, ND', phone: '•••-•••-1151', points: 1536, status: 'Active' },
  { id: 'Lester Hauglid', name: 'Lester Hauglid', city: 'Moorhead, MN', phone: '•••-•••-0352', points: 1265, status: 'Active' },
  { id: 'Wade Kyser', name: 'Wade Kyser', city: 'West Fargo, ND', phone: '•••-•••-1044', points: 1164, status: 'Active' },
  { id: 'Ron James', name: 'Ron James', city: 'Bismarck, ND', phone: '•••-•••-9591', points: 1153, status: 'Needs merge review' },
  { id: 'Chase Lardy', name: 'Chase Lardy', city: 'Grand Forks, ND', phone: '•••-•••-3813', points: 1125, status: 'Active' },
  { id: 'Pedro Hermes', name: 'Pedro Hermes', city: 'FPN Admin', phone: 'admin account', points: 0, status: 'New' }
];

export const mockTournaments = [
  { id: 346, name: 'Black Chip Bounty', event: 'Poker Brat Black Chip BOUNTY Tournament', type: 'DPT Standard', venue: 'Windbreak', date: 'Jun 07, 2026', status: 'Published', manage: 'Checked-in players / elimination desk' },
  { id: 345, name: 'Spring Championship MEGASTACK (100K)', event: 'Spring Championship', type: 'DPT Standard', venue: 'Double Tree - West Fargo', date: 'May 17, 2026', status: 'Published', manage: 'Results / payouts' },
  { id: 344, name: 'Friday Night Turbo', event: 'Spring Championship', type: 'Satellite', venue: 'Double Tree - West Fargo', date: 'May 16, 2026', status: 'Published', manage: 'Satellite winners' },
  { id: 343, name: 'Casselton Vets Deep Stack', event: 'Casselton Vets', type: 'DPT Standard', venue: 'Casselton Vets Club', date: 'Apr 18, 2026', status: 'Published', manage: 'Completed' }
];

export const mockEvents = [
  { name: 'Poker Brat Black Chip BOUNTY Tournament', season: '2026', start: '2026-06-07', end: '2026-06-07', status: 'Published' },
  { name: 'Spring Championship', season: '2026', start: '2026-05-15', end: '2026-05-17', status: 'Published' },
  { name: 'Casselton Vets', season: '2026', start: '2026-04-17', end: '2026-04-18', status: 'Published' }
];

export const mockVenues = [
  { name: 'Double Tree - West Fargo', city: 'West Fargo', state: 'ND', zip: '58078', status: 'Published' },
  { name: 'Dakota Magic Casino', city: 'Hankinson', state: 'ND', zip: '58041', status: 'Published' },
  { name: 'Windbreak', city: 'Fargo', state: 'ND', zip: '58103', status: 'Published' }
];

export const mockArticles = [
  { title: 'Congratulations to Bob Barker — Black Chip Bounty Champion', tournament: 'Black Chip Bounty', category: 'News', status: 'Published' },
  { title: 'Spring Championship winner Eric Kassa', tournament: 'Spring Championship', category: 'News', status: 'Published' },
  { title: 'Live Update: chips are bagged for the night', tournament: 'Spring Championship MEGASTACK', category: 'Live Update', status: 'Published' }
];

export const mockPayoutTemplates = [
  { name: 'DPT Standard 10%', places: 3, charityTake: '10%', status: 'Published' },
  { name: 'Final Table Flat Bonus', places: 9, charityTake: '0%', status: 'Draft/mock' },
  { name: 'Satellite Winner Advancement', places: 1, charityTake: '0%', status: 'Published' }
];

export const mockBlindStructures = [
  { level: 1, small: 100, big: 200, ante: 0, duration: '20 min' },
  { level: 2, small: 200, big: 400, ante: 400, duration: '20 min' },
  { level: 3, small: 300, big: 600, ante: 600, duration: '20 min' },
  { level: 4, small: 500, big: 1000, ante: 1000, duration: '20 min' }
];

export const parityRows = [
  { area: 'Public Home / Events / Leaderboard', current: 'Browser captured', rebuilt: 'Mock shell visible', next: 'Wire real Supabase reads' },
  { area: 'Admin Tournaments / Manage', current: 'Browser + Laravel routes mapped', rebuilt: 'Mock manager + tested RPC boundary', next: 'Supabase tables/RPC implementation' },
  { area: 'Players / Duplicate Merge', current: 'Admin screen mapped', rebuilt: 'Mock merge preview', next: 'Real identity merge rules' },
  { area: 'Notifications', current: 'Admin compose mapped', rebuilt: 'Audience builder preview', next: 'Provider decision + opt-in safeguards' },
  { area: 'Reports / Migration', current: 'Source-backed inventory', rebuilt: 'Readiness checklist', next: 'Data export/import dry run' }
];

export const migrationItems = [
  { item: 'Legacy database export', status: 'Blocked', note: 'Needs approved DB dump / developer handoff' },
  { item: 'Supabase schema ownership', status: 'Ready to draft', note: 'Can be created from Laravel models/migrations' },
  { item: 'Production cutover plan', status: 'Decision needed later', note: 'DNS/deploy only after replica parity and data dry run' },
  { item: 'DKIM/DMARC for Pedro notifications', status: 'Blocked', note: 'Waiting on Cloudflare/domain transfer' },
  { item: 'End-to-end QA dataset', status: 'Mocked', note: 'Needs anonymized production sample' }
];

export const roleRows = [
  { role: 'Super Admin', capabilities: 'All modules, users, settings, reports', rebuilt: 'Mocked permissions matrix' },
  { role: 'Tournament Director', capabilities: 'Manage tournaments, check-in, eliminate, live updates', rebuilt: 'Mocked live desk access' },
  { role: 'Content Manager', capabilities: 'Articles, videos, live updates', rebuilt: 'Mocked CMS access' },
  { role: 'Venue/User Manager', capabilities: 'Venues, players, duplicate review', rebuilt: 'Mocked admin forms' }
];
