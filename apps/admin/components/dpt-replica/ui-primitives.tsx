import type React from 'react';
import type { Accent } from './types';
import type { AdminEntry } from '../../lib/admin-api-contracts';

export function Kpi({ label, value, accent = 'gold' }: { label: string; value: string | number; accent?: Accent }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong className={accent}>{value}</strong>
    </div>
  );
}

export function ActionButton({ children, onClick, variant = 'default', disabled = false }: { children: React.ReactNode; onClick: () => void | Promise<void>; variant?: 'default' | 'danger' | 'quiet'; disabled?: boolean }) {
  return <button className={`action-button ${variant}`} type="button" disabled={disabled} onClick={onClick}>{children}</button>;
}

export function ModuleStatus({ current = 'Captured', rebuilt = 'Mock UI', next = 'Needs data' }: { current?: string; rebuilt?: string; next?: string }) {
  return (
    <div className="module-status" aria-label="current versus rebuilt status">
      <span>Current: {current}</span>
      <span>Rebuilt: {rebuilt}</span>
      <span>Next: {next}</span>
    </div>
  );
}

export function Panel({ title, eyebrow, children, actions }: { title: string; eyebrow: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="desk-panel">
      <div className="panel-header">
        <div>
          <div className="panel-eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        <div className="panel-actions">
          {actions}
          <ModuleStatus />
        </div>
      </div>
      {children}
    </section>
  );
}

export function PlayerStatus({ entry }: { entry: AdminEntry }) {
  if (entry.eliminated) return <span className="badge red">Eliminated</span>;
  if (entry.rank) return <span className="badge gold">Ranked</span>;
  if (entry.totalBuyInAmount > 0) return <span className="badge green">Checked in</span>;
  return <span className="badge muted">Registered</span>;
}
