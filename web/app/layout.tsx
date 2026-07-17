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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BenchOS>{children}</BenchOS>
      </body>
    </html>
  );
}
