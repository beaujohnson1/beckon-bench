import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreChip, PendingChip } from '@/components/score-chip';
import { Artifact } from '@/components/artifact';
import { tests, models, comparisons, vurl, shortName, capTitle, catName, panelFor, fmtTokens } from '@/lib/data';

export function generateStaticParams() {
  return tests.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: any) {
  const { id } = await params;
  const t = tests.find((x) => x.id === id);
  return { title: t ? `${t.num} ${capTitle(t)}` : 'Test' };
}

export default async function TestPage({ params }: any) {
  const { id } = await params;
  const t = tests.find((x) => x.id === id)!;
  const vids = comparisons.filter((f) => f.startsWith(t.id));
  const runs = models
    .filter((m) => m.runs[t.id])
    .sort((a, b) => (b.runs[t.id].score?.total ?? -1) - (a.runs[t.id].score?.total ?? -1));

  return (
    <>
      <SiteHeader active="Leaderboard" />
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            TEST {t.num} · {catName(t).toUpperCase()} · GAUNTLET V1
          </p>
          <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">{capTitle(t)}</h1>
          <p className="mt-3 text-muted-foreground">Measures {t.measures.toLowerCase()}.</p>
        </section>

        {vids.map((f) => (
          <video key={f} className="mb-6 block w-full rounded-lg border border-border bg-black" controls muted loop playsInline preload="metadata" src={vurl(f)} />
        ))}

        <Card className="mb-6">
          <CardHeader><CardTitle>The prompt, verbatim</CardTitle></CardHeader>
          <CardContent>
            {t.prompt ? (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-black p-4 font-mono text-xs leading-relaxed text-foreground/90">{t.prompt}</pre>
            ) : (
              <p className="text-sm text-muted-foreground">Agentic test. Harness rules are in the repo.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {runs.map((m) => {
            const run = m.runs[t.id];
            const s = run.score;
            const pr = panelFor(m.slug, t.id);
            return (
              <Card key={m.slug}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link href={`/model/${m.slug}/`} title={m.meta.model_id || m.slug} className="hover:text-primary">{shortName(m)}</Link>
                    {s ? <ScoreChip score={s.total} denom="/10" /> : <PendingChip />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Artifact m={m} t={t} run={run} />
                  <div className="mt-4 grid gap-4 md:grid-cols-[16rem_1fr]">
                    {s?.scores && Object.keys(s.scores).length ? (
                      <table className="text-sm">
                        <tbody>
                          {Object.entries(s.scores).map(([k, v]: any) => (
                            <tr key={k} className="border-b border-border/60">
                              <td className="py-1 pr-4 capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</td>
                              <td className="py-1 text-right font-mono font-bold tabular-nums">{v}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="py-1 pr-4 font-bold text-primary">total</td>
                            <td className="py-1 text-right font-mono font-bold tabular-nums text-primary">{s.total}</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : <div />}
                    <div className="text-sm">
                      {pr && (
                        <p className="text-muted-foreground">
                          AI panel: <b className="text-foreground">{pr.panel.total}/10</b> — median of {pr.panel.judges_seated} blind judges.
                        </p>
                      )}
                      {s && (
                        <>
                          <p className="mt-1">{s.notes || ''}</p>
                          <p className="mt-1 text-muted-foreground">
                            {s.stats?.time_seconds ? `${Math.round(s.stats.time_seconds / 60)}m. ` : ''}
                            {s.stats?.output_tokens ? `${fmtTokens(s.stats.output_tokens)} output tokens.` : ''}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!runs.length && (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <span className="text-border">{'// '}</span>No runs captured yet.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
