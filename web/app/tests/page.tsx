import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tests, capTitle, catName } from '@/lib/data';

export const metadata = { title: 'Tests' };

export default function TestsPage() {
  return (
    <>
      <SiteHeader active="Tests" />
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">FULL TRANSPARENCY</p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">Eight tests, verbatim.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Each prompt is frozen for the season and pasted into a fresh session. One shot, no
            follow-ups. What you see on the leaderboard is the first thing the model said back.
          </p>
        </section>
        <div className="flex flex-col gap-6">
          {tests.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Link href={`/test/${t.id}/`} className="hover:text-primary">
                    <span className="text-muted-foreground">{t.num} ·</span> {capTitle(t)}
                  </Link>
                  <Badge variant="soft">{catName(t)}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Measures {t.measures.toLowerCase()}.</p>
              </CardHeader>
              <CardContent>
                {t.prompt ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-black p-4 font-mono text-xs leading-relaxed text-foreground/90">
                    {t.prompt}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Agentic test. Harness rules are in the repo.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
