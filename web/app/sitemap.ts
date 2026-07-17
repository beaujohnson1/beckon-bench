import type { MetadataRoute } from 'next';
import { models, tests, matches } from '@/lib/data';
import { posts } from '@/lib/blog';

export const dynamic = 'force-static';

const BASE = 'https://www.beckonbench.com';

// Generated at build time from the same receipts as the pages themselves,
// so every deploy refreshes lastModified along with the content.
export default function sitemap(): MetadataRoute.Sitemap {
  const newestMatch = matches[0]?.date ? new Date(matches[0].date) : new Date();
  const modelDate = (m: any) => (m.meta.run_date ? new Date(m.meta.run_date) : newestMatch);

  return [
    { url: `${BASE}/`, lastModified: newestMatch, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/vote/`, lastModified: newestMatch, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/matches/`, lastModified: newestMatch, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/tests/`, lastModified: newestMatch, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq/`, lastModified: newestMatch, changeFrequency: 'monthly', priority: 0.6 },
    ...models.map((m) => ({
      url: `${BASE}/model/${m.slug}/`,
      lastModified: modelDate(m),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...tests.map((t) => ({
      url: `${BASE}/test/${t.id}/`,
      lastModified: newestMatch,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    { url: `${BASE}/blog/`, lastModified: newestMatch, changeFrequency: 'weekly' as const, priority: 0.8 },
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}/`,
      lastModified: p.date ? new Date(p.date) : newestMatch,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
