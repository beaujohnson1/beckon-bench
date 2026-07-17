import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { posts } from '@/lib/blog';

export const metadata = {
  title: 'Bench Gazette — matchup reports & model drops',
  description:
    'Written reports from the bench: matchup breakdowns, model-drop reviews, judge-panel drama, and the receipts behind every score.',
  alternates: { canonical: '/blog/' },
};

export default function BlogIndex() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">THE BENCH GAZETTE</p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">All the news that's fit to benchmark.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Matchup reports and model-drop reviews, written from the receipts: scores, judge votes,
            run stats, and the artifacts themselves.
          </p>
        </section>
        <div className="flex flex-col gap-6">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}/`} className="group">
              <Card className="transition-transform group-hover:-translate-y-0.5">
                <CardHeader>
                  <p className="font-mono text-xs text-muted-foreground">{p.date}</p>
                  <CardTitle className="text-lg group-hover:text-primary">{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="font-mono text-xs text-primary">Read the report →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
