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
import { models, shortName, nameOfSlug, elo, matches } from '@/lib/data';

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
  // live bench facts for Beckon's IM small talk
  const top = elo?.ladder?.[0];
  const stats = {
    leader: top ? nameOfSlug(top.model) : '',
    elo: top?.elo ?? null,
    ballots: matches.length,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Beckon Bench',
        url: 'https://www.beckonbench.com/',
        description:
          "The vibe coder's benchmark: AI coding models run eight one-shot tests under identical conditions. Every prompt, artifact, and vote is public.",
        publisher: { '@id': 'https://heybeckon.ai/#org' },
      },
      {
        '@type': 'Organization',
        '@id': 'https://heybeckon.ai/#org',
        name: 'Beckon',
        url: 'https://heybeckon.ai/',
        logo: 'https://www.beckonbench.com/brand-hand.png',
      },
      {
        '@type': 'Dataset',
        name: 'Beckon Bench results',
        description:
          'Benchmark results for AI coding models: per-test scores, AI judge panel verdicts, public vote tallies, and raw artifacts for eight one-shot coding tests.',
        url: 'https://www.beckonbench.com/',
        creator: { '@id': 'https://heybeckon.ai/#org' },
        isAccessibleForFree: true,
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: 'https://github.com/beaujohnson1/beckon-bench',
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <BenchOS menu={{ games, recent, stats }}>{children}</BenchOS>
      </body>
    </html>
  );
}
