import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoteRow } from '@/components/vote-row';
import { tests, matches, comparisonForPair, vurl, nameOfSlug, capTitle } from '@/lib/data';

export const metadata = { title: 'Vote' };

export default function VotePage() {
  return (
    <>
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            PEOPLE&apos;S VOTE · {matches.length} OPEN BALLOTS
          </p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">Cast your votes</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Blind head-to-heads, decided by you. Watch each matchup, then pick your winner — every
            vote is logged publicly.
          </p>
        </section>
        <div className="flex flex-col gap-6">
          {matches.map((m) => {
            const t = tests.find((x) => x.id === m.test);
            const video = comparisonForPair(m.test, m.model_a, m.model_b);
            return (
              <Card key={m.id}>
                <CardHeader>
                  <CardTitle>
                    {t ? `${t.num} · ${capTitle(t)}` : m.test}{' '}
                    <span className="font-normal text-muted-foreground">
                      — {nameOfSlug(m.model_a)} vs {nameOfSlug(m.model_b)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {video ? (
                    <video className="block w-full rounded-lg border border-border bg-black" controls muted loop playsInline preload="metadata" src={vurl(video)} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No side-by-side video for this pairing yet —{' '}
                      <Link href={`/test/${m.test}/`} className="underline decoration-border underline-offset-4 hover:text-primary">see both artifacts</Link>.
                    </p>
                  )}
                  <VoteRow
                    matchId={m.id}
                    aSlug={m.model_a} bSlug={m.model_b}
                    aName={nameOfSlug(m.model_a)} bName={nameOfSlug(m.model_b)}
                  />
                  <p className="mt-3 flex gap-4 font-mono text-xs">
                    <Link href={`/test/${m.test}/`} className="text-muted-foreground hover:text-primary">Full result →</Link>
                    <Link href="/matches/" className="text-muted-foreground hover:text-primary">AI panel votes →</Link>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
