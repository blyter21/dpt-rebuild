import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = [
  'app/admin-simulator.tsx',
  'components/dpt-replica/types.ts',
  'components/dpt-replica/mock-data.ts',
  'components/dpt-replica/utils.ts',
  'components/dpt-replica/ui-primitives.tsx',
  'components/dpt-replica/form-controls.tsx',
  'components/dpt-replica/list-controls.tsx',
  'components/dpt-replica/sections/PublicPreviewSection.tsx',
  'components/dpt-replica/sections/DashboardSection.tsx',
  'components/dpt-replica/sections/TournamentsSection.tsx',
  'components/dpt-replica/sections/EventsSection.tsx',
  'components/dpt-replica/sections/PlayersSection.tsx',
  'components/dpt-replica/sections/VenuesSection.tsx',
  'components/dpt-replica/sections/ArticlesSection.tsx',
  'components/dpt-replica/sections/NotificationsSection.tsx',
  'components/dpt-replica/sections/StructuresSection.tsx',
  'components/dpt-replica/sections/ReportsSection.tsx',
  'components/dpt-replica/sections/ParitySection.tsx',
  'components/dpt-replica/sections/MigrationSection.tsx',
  'components/dpt-replica/sections/RolesSection.tsx',
  'components/dpt-replica/sections/LiveManagerSection.tsx',
  'components/dpt-replica/sections/impl.tsx'
].map((file) => readFileSync(join(process.cwd(), file), 'utf8')).join('\n');
const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

describe('DPT replica shell UI content', () => {
  it('exposes the browser-backed admin/public modules Brook expects to see', () => {
    for (const label of [
      'DPT Admin Simulator',
      'Mock Data / Not Production',
      'Dashboard',
      'Public Site Preview',
      'Tournaments',
      'Events',
      'Players',
      'Venues',
      'Articles / Live Updates',
      'Notifications',
      'Live Tournament Manager'
    ]) {
      expect(source).toContain(label);
    }
  });

  it('models the missing player database and selected-player elimination workflows', () => {
    for (const label of [
      'Player database → tournament',
      'Add selected player to tournament',
      'click row to select',
      'Eliminate selected player',
      'Undo selected player stat',
      'Preview & edit eliminated ranks'
    ]) {
      expect(source).toContain(label);
    }
  });

  it('adds a public-site preview with home, events, leaderboard, players, and tournament detail pages', () => {
    for (const label of [
      'Dakota Poker Tour fan-facing replica',
      'Home',
      'Events',
      'Leaderboard',
      'Players',
      'Tournament Detail',
      'Pre-Registration Details',
      'Tournament Results'
    ]) {
      expect(source).toContain(label);
    }
  });

  it('adds visual-brand scaffolding and current-vs-rebuilt status badges', () => {
    for (const label of [
      'Admin View',
      'Public View',
      'Open admin replica',
      'Current: {current}',
      'Rebuilt: {rebuilt}',
      'Next: {next}'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.view-toggle', '.dpt-brand-header', '.dpt-brand-footer', '.module-status']) {
      expect(css).toContain(selector);
    }
  });

  it('adds mock-only create/edit detail screens using authenticated admin form fields', () => {
    for (const label of [
      'Mock tournament detail screen',
      'Mock event detail screen',
      'Mock venue detail screen',
      'Mock player detail screen',
      'Mock-only detail screen · no save/write actions',
      'Choose Tournament Type *',
      'Dealer Appreciation Fee *',
      'Select Location/City/Address',
      'Notification Preferences'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.detail-form-grid', '.mock-field', '.mock-only-notice']) {
      expect(css).toContain(selector);
    }
  });

  it('makes detail screens interactive without saving', () => {
    for (const label of [
      'Create Mode',
      'Edit Mode',
      'Unsaved mock changes',
      'No unsaved mock changes',
      'Validate mock form',
      'Clear required fields',
      'Cancel edits',
      'Reset detail demo',
      'Mock validation errors: required fields need values before a real save would be allowed.',
      'Required in mock validation'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.detail-mode-controls', '.dirty-indicator', '.mock-validation-summary', '.validation-indicator']) {
      expect(css).toContain(selector);
    }
  });

  it('adds mock list search/filter/sort controls for admin tables without mutating data', () => {
    for (const label of [
      'Search {module}',
      'Status filter',
      'Sort',
      'All statuses',
      'Newest / admin default',
      'Name A-Z',
      'Reset list controls',
      'mock rows'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.list-controls', '.list-control-summary', '.filtered-result-strip']) {
      expect(css).toContain(selector);
    }
  });

  it('adds mock pagination and row action menus matching current admin action patterns', () => {
    for (const label of [
      'PaginationControls',
      'RowActionMenu',
      'View',
      'Edit',
      'Duplicate / Save as Copy',
      'Manage',
      'Delete disabled',
      'mock-only; no write',
      'Previous',
      'Next'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.row-action-menu', '.pagination-controls', '.row-action-log']) {
      expect(css).toContain(selector);
    }
  });

  it('adds a mock row action preview panel with legacy route and rebuild target feedback', () => {
    for (const label of [
      'RowActionPreviewPanel',
      'Row action preview',
      'Legacy route pattern',
      'Modern rebuild target',
      'No save, delete, or production mutation executed.',
      'Clear preview',
      'legacyRouteFor',
      'rebuiltTargetFor'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.row-action-preview-panel', '.row-action-preview-grid']) {
      expect(css).toContain(selector);
    }
  });

  it('adds deeper reverse-engineering modules for notifications, structures, reports, parity, migration, and roles', () => {
    for (const label of [
      'Audience Builder Preview',
      'Send disabled in replica POC',
      'Mock CMS detail screen',
      'Payout Distributions Template',
      'Blind Structure Preview',
      'Operator Metrics & Activity',
      'DPT Feature Parity Matrix',
      'Database Takeover Checklist',
      'Roles & Permissions Matrix',
      'Pre-registration',
      'Venue card',
      'Results card',
      'Mock duplicate-player merge preview',
      'Merge disabled'
    ]) {
      expect(source).toContain(label);
    }

    for (const selector of ['.audience-builder-grid', '.notification-preview-box']) {
      expect(css).toContain(selector);
    }
  });
});
