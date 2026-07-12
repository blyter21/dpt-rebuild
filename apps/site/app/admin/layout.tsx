import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DPT Administration',
  description: 'Integrated Dakota Poker Tour administration built from production-derived data.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
