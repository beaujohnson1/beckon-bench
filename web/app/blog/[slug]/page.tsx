import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { posts } from '@/lib/blog';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug);
  if (!p) return { title: 'Gazette' };
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${slug}/` },
    openGraph: { type: 'article', publishedTime: p.date, title: p.title, description: p.description },
  };
}

export default async function PostPage({ params }: any) {
  const { slug } = await params;
  const p = posts.find((x) => x.slug === slug)!;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    author: { '@type': 'Organization', name: 'Beckon Bench' },
    publisher: { '@id': 'https://heybeckon.ai/#org' },
    mainEntityOfPage: `https://www.beckonbench.com/blog/${p.slug}/`,
  };
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <article className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            THE BENCH GAZETTE · {p.date}
          </p>
          <h1 className="mt-2 font-mono text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {p.title}
          </h1>
          <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: p.html }} />
          <p className="mt-10 border-t pt-4 font-mono text-xs">
            <Link href="/blog/" className="text-muted-foreground hover:text-primary">← All Gazette issues</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
