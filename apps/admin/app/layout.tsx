import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DPT Admin Prototype',
  description: 'Mock-data Dakota Poker Tour admin prototype powered by the tournament engine.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
