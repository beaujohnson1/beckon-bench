import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreChip, PendingChip } from '@/components/score-chip';
import { Artifact } from '@/components/artifact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PixelIcon } from '@/components/os/icons';
import { tests, models, capTitle, panelFor, fmtTokens, shortName } from '@/lib/data';

export function generateStaticParams() {
  return models.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const m = models.find((x) => x.slug === slug);
  if (!m) return { title: 'Model' };
  return {
    title: `${shortName(m)} benchmark results`,
    description: `${m.meta.model_id || m.slug} on Beckon Bench: ${m.total} points across ${m.testsScored} scored tests, with playable artifacts, run stats, and AI judge verdicts.`,
    alternates: { canonical: `/model/${slug}/` },
  };
}

export default async function ModelPage({ params }: any) {
  const { slug } = await params;
  const m = models.find((x) => x.slug === slug)!;
  const yt = m.meta.youtube_url;

  return (
    <>
      <main className="hero-glow mx-auto max-w-4xl px-5 pb-16">
        <section className="py-12">
          {/* Properties dialog — right-click a model, hit Properties. */}
          <div className="bevel-out max-w-2xl bg-background p-1">
            <div className="os-titlebar flex items-center gap-2 px-2 py-1">
              <PixelIcon name="leaderboard" size={16} />
              <span className="text-sm font-bold tracking-wide">{shortName(m)} Properties</span>
              <span className="ml-auto"><span className="os-titlebar-btn" aria-hidden>✕</span></span>
            </div>
            <div className="p-3">
              <Tabs defaultValue="general">
                <TabsList>
                  <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                  <TabsTrigger value="scores" className="text-xs">Scores</TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="bg-white p-4">
                  <div className="flex items-start gap-4">
                    <PixelIcon name="beckon" size={48} />
                    <div className="min-w-0 text-sm">
                      <p className="font-mono text-base font-bold">{m.meta.model_id || m.slug}</p>
                      <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-1.5">
                        <dt className="text-muted-foreground">Provider:</dt><dd>{m.meta.provider || '—'}</dd>
                        <dt className="text-muted-foreground">Harness:</dt><dd className="break-words">{m.meta.harness || '—'}</dd>
                        <dt className="text-muted-foreground">Run date:</dt><dd>{m.meta.run_date || '—'}</dd>
                        <dt className="text-muted-foreground">Season:</dt><dd>{m.meta.gauntlet_version || 'v1'}</dd>
                      </dl>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="scores" className="bg-white p-4">
                  <p className="font-mono text-3xl font-extrabold">
                    {m.total}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      /{m.testsScored * 10} points · {m.testsScored} of {tests.length} tests scored
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tests.filter((t) => m.runs[t.id]?.score).map((t) => (
                      <Link key={t.id} href={`/test/${t.id}/`} className="flex items-center gap-1.5 text-sm hover:text-primary">
                        <span className="font-mono text-xs text-muted-foreground">{t.num}</span>
                        <ScoreChip score={m.runs[t.id].score.total} />
                      </Link>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="stats" className="bg-white p-4">
                  <dl className="grid grid-cols-[10rem_1fr] gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">Time on the bench:</dt>
                    <dd className="font-mono tabular-nums">{m.secs ? `${Math.floor(m.secs / 60)}m ${m.secs % 60}s` : 'n/a'}</dd>
                    <dt className="text-muted-foreground">Output tokens:</dt>
                    <dd className="font-mono tabular-nums">{m.toks ? m.toks.toLocaleString() : 'n/a'}</dd>
                    <dt className="text-muted-foreground">Cost:</dt>
                    <dd className="font-mono tabular-nums">{m.hasCost ? `$${m.cost.toFixed(2)} API-equiv` : 'subscription (flat-rate)'}</dd>
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">Recorded, never scored.</p>
                </TabsContent>
              </Tabs>
              {yt && (
                <div className="mt-2 flex justify-end">
                  <a href={yt} className="bevel-out bg-background px-4 py-1 text-sm font-bold">Watch the run ▶</a>
                </div>
              )}
            </div>
          </div>
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
                      <span className="text-muted-foreground">{t.num} ·</span> {capTitle(t)}
                    </Link>
                    {s ? <ScoreChip score={s.total} denom="/10" /> : <PendingChip />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Artifact m={m} t={t} run={run} />
                  <div className="mt-3 text-sm">
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
                </CardContent>
              </Card>
            );
          })}
          {!Object.keys(m.runs).length && (
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
