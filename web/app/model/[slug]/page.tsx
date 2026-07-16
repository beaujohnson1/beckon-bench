import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreChip, PendingChip } from '@/components/score-chip';
import { Artifact } from '@/components/artifact';
import { tests, models, capTitle, panelFor, fmtTokens } from '@/lib/data';

export function generateStaticParams() {
  return models.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const m = models.find((x) => x.slug === slug);
  return { title: m ? m.meta.model_id || m.slug : 'Model' };
}

export default async function ModelPage({ params }: any) {
  const { slug } = await params;
  const m = models.find((x) => x.slug === slug)!;
  const yt = m.meta.youtube_url;

  return (
    <>
      <SiteHeader active="Leaderboard" />
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            {(m.meta.gauntlet_version || 'V1').toUpperCase()} · {m.meta.run_date || ''}
          </p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            {m.meta.model_id || m.slug}
          </h1>
          <p className="mt-2 text-muted">{m.meta.provider || ''}. {m.meta.harness || ''}</p>
          <p className="mt-4 font-mono text-4xl font-extrabold">
            {m.total}
            <span className="ml-2 text-base font-normal text-muted">
              /{m.testsScored * 10} points, {m.testsScored} of {tests.length} tests scored
            </span>
          </p>
          {yt && (
            <a href={yt} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-mono text-sm font-bold text-[#04140b] shadow-[0_0_18px_rgba(34,242,132,0.3)] hover:bg-primary-deep">
              Watch the gauntlet run
            </a>
          )}
        </section>
        <div className="flex flex-col gap-6">
          {tests.filter((t) => m.runs[t.id]).map((t) => {
            const run = m.runs[t.id];
            const s = run.score;
            const pr = panelFor(m.slug, t.id);
            return (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link href={`/test/${t.id}/`} className="hover:text-primary">
                      <span className="text-muted">{t.num} ·</span> {capTitle(t)}
                    </Link>
                    {s ? <ScoreChip score={s.total} denom="/10" /> : <PendingChip />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Artifact m={m} t={t} run={run} />
                  <div className="mt-3 text-sm">
                    {pr && (
                      <p className="text-muted">
                        AI panel: <b className="text-foreground">{pr.panel.total}/10</b> — median of {pr.panel.judges_seated} blind judges.
                      </p>
                    )}
                    {s && (
                      <>
                        <p className="mt-1">{s.notes || ''}</p>
                        <p className="mt-1 text-muted">
                          {s.stats?.time_seconds ? `${Math.round(s.stats.time_seconds / 60)}m. ` : ''}
                          {s.stats?.output_tokens ? `${fmtTokens(s.stats.output_tokens)} output tokens.` : ''}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!Object.keys(m.runs).length && (
            <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              <span className="text-line">{'// '}</span>No runs captured yet.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
