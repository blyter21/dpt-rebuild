import Link from 'next/link';
import type { ReactNode } from 'react';

const adminNavigation = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/tournaments', label: 'Tournaments' },
  { href: '/admin/venues', label: 'Venues' },
  { href: '/admin/articles', label: 'Articles' },
];

export function AdminShell({
  active,
  source,
  generatedAt,
  repositoryMode,
  children,
}: {
  active: string;
  source: string;
  generatedAt: string;
  repositoryMode: 'json' | 'supabase';
  children: ReactNode;
}) {
  return (
    <main className="dpt-admin-app">
      <header className="dpt-admin-header">
        <div>
          <span className="dpt-admin-eyebrow">Dakota Poker Tour</span>
          <h1>Administration</h1>
          <p>Integrated administration backed by Supabase staging and production-derived reference data.</p>
        </div>
        <div className="dpt-admin-source">
          <strong>Production-derived data</strong>
          <span>Source: {source}</span>
          <span>Repository: {repositoryMode}</span>
          <span>Snapshot: {new Date(generatedAt).toLocaleString('en-US')}</span>
        </div>
      </header>

      <div className="dpt-admin-safety" role="note">
        <strong>Staging operations</strong>
        <span>Authenticated tournament actions write only to Supabase staging. Production remains read-only.</span>
      </div>

      <nav className="dpt-admin-nav" aria-label="DPT administration">
        {adminNavigation.map((item) => (
          <Link key={item.href} href={item.href} className={active === item.label ? 'active' : ''}>
            {item.label}
          </Link>
        ))}
        <Link href="/" className="dpt-admin-public-link">View public site</Link>
        <form action="/api/admin/auth/logout" method="post" className="dpt-admin-logout">
          <button type="submit">Sign out</button>
        </form>
      </nav>

      <section className="dpt-admin-content">{children}</section>
    </main>
  );
}

export function AdminSectionHeader({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="dpt-admin-section-head">
      <div><span>Production SQL snapshot</span><h2>{title}</h2>{children ? <p>{children}</p> : null}</div>
      {typeof count === 'number' ? <strong>{count.toLocaleString()} records</strong> : null}
    </div>
  );
}

export function AdminMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <article className="dpt-admin-metric"><span>{label}</span><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong><p>{detail}</p></article>;
}
