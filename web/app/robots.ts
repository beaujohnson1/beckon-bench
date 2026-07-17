import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// /a/ holds the raw model-produced artifacts (sandboxed iframe content).
// They stay publicly reachable, but crawling them would fill the index with
// model output instead of the bench's own pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/a/'] }],
    sitemap: 'https://www.beckonbench.com/sitemap.xml',
  };
}
