import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoteRow } from '@/components/vote-row';
import { matches, comparisonForPair, vurl, nameOfSlug } from '@/lib/data';

export const metadata = { title: 'Arena' };

export default function MatchesPage() {
  return (
    <>
      <SiteHeader active="Arena" />
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">THE ARENA</p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">Models judging models.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Two artifacts, same test, three AI judges from vendors with no horse in the race. Judges
            see anonymous submissions in randomized order and must pick a winner. Majority decides.
            Winners climb an ELO ladder. Every vote and every judge&apos;s reasoning is published.
          </p>
        </section>
        <div className="flex flex-col gap-6">
          {matches.map((m) => {
            const video = comparisonForPair(m.test, m.model_a, m.model_b);
            const tallies = m.votes ? Object.values(m.votes).sort((a: any, b: any) => b - a).join(' to ') : '';
            return (
              <Card key={m.id}>
                <CardHeader>
                  <CardTitle>
                    <span className="text-muted-foreground">{m.test} ·</span>{' '}
                    <Link href={`/model/${m.model_a}/`} className="hover:text-primary">{nameOfSlug(m.model_a)}</Link>
                    <span className="text-muted-foreground"> vs </span>
                    <Link href={`/model/${m.model_b}/`} className="hover:text-primary">{nameOfSlug(m.model_b)}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {video && (
                    <video className="mb-4 block w-full rounded-lg border border-border bg-black" controls muted loop playsInline preload="metadata" src={vurl(video)} />
                  )}
                  <p className="text-sm">
                    Winner <b>{nameOfSlug(m.winner)}</b>{tallies ? ` (${tallies})` : ''},{' '}
                    <span className="text-muted-foreground">{m.date?.slice(0, 10) ?? ''}</span>
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {m.judges.map((j: any, i: number) => (
                      <li key={i} className="border-t border-border pt-2 text-sm">
                        <span className="text-primary">&gt; </span>
                        <b className="font-mono">{j.judge}</b> voted {nameOfSlug(j.vote)}
                        {j.reasoning && <span className="text-muted-foreground">. {j.reasoning}</span>}
                      </li>
                    ))}
                  </ul>
                  <VoteRow
                    matchId={m.id}
                    aSlug={m.model_a} bSlug={m.model_b}
                    aName={nameOfSlug(m.model_a)} bName={nameOfSlug(m.model_b)}
                  />
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
