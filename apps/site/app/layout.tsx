import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dakota Poker Tour',
  description: 'Dakota Poker Tour rebuilt from production data on a new stack.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
