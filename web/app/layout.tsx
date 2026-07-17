import type { Metadata } from 'next';
import './globals.css';

const DESCRIPTION =
  "The vibe coder's benchmark. Eight one-shot tests, identical conditions. Every prompt, artifact, and vote public.";

export const metadata: Metadata = {
  title: { default: 'Beckon Bench', template: '%s · Beckon Bench' },
  description: DESCRIPTION,
  metadataBase: new URL('https://www.beckonbench.com'),
  openGraph: {
    type: 'website',
    siteName: 'Beckon Bench',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image', description: DESCRIPTION, images: ['/og.png'] },
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
};

import { BenchOS } from '@/components/os/bench-os';
import { models, shortName } from '@/lib/data';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Start-menu data, computed at build time from the receipts.
  // Games: each model's ACTUAL test-01 horror game, playable.
  const games = models
    .map((m) => {
      const run = m.runs['01-haunted-horror-game'];
      const html = run?.outputs.find((f) => f.endsWith('.html'));
      return html ? { name: `${shortName(m)} — Haunted Horror Game`, href: `/a/${m.slug}/01-haunted-horror-game/output/${html}` } : null;
    })
    .filter(Boolean) as { name: string; href: string }[];
  const recent = models.map((m) => ({ name: shortName(m), href: `/model/${m.slug}/` }));

  return (
    <html lang="en">
      <body>
        <BenchOS menu={{ games, recent }}>{children}</BenchOS>
      </body>
    </html>
  );
}
