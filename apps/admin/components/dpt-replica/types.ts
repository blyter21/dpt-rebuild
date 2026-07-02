export type Accent = 'gold' | 'green' | 'red' | 'muted';
export type ViewMode = 'admin' | 'public';
export type AdminSection = 'dashboard' | 'public' | 'tournaments' | 'events' | 'players' | 'venues' | 'articles' | 'notifications' | 'structures' | 'reports' | 'parity' | 'migration' | 'roles' | 'live';
export type PublicPreviewPage = 'home' | 'events' | 'leaderboard' | 'players' | 'tournament';
export type ListSort = 'newest' | 'name' | 'status';
export type RowAction = 'View' | 'Edit' | 'Duplicate / Save as Copy' | 'Manage' | 'Delete disabled';
export type RowActionPreview = { action: RowAction; itemName: string; module: string; legacyRoute: string; rebuiltTarget: string; };
export type DetailMode = 'create' | 'edit';

export type PlayerRecord = {
  id: string;
  name: string;
  city: string;
  phone: string;
  points: number;
  status: 'Active' | 'Needs merge review' | 'New';
};

export const defaultDetailDraft = {
  tournamentName: 'Black Chip Bounty',
  eventName: 'Poker Brat Black Chip BOUNTY Tournament',
  venueName: 'Double Tree - West Fargo',
  playerEmail: 'pedro@fpngaming.com'
};

export type DetailDraft = typeof defaultDetailDraft;
export type DetailDraftKey = keyof DetailDraft;
