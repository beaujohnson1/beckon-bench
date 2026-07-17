import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart } from '@/components/bar-chart';
import { Scoreboard, PanelBoard, boardShell, boardTh } from '@/components/boards';
import { Theater } from '@/components/theater';
import {
  tests, models, scoredModels, benchModels, matches, elo, comparisons, pairOf, vurl,
  shortName, nameOfSlug, capTitle, CATS, catScore, catScored, fmtTokens, fmtMins, fmtTime,
} from '@/lib/data';

export const metadata = {
  title: 'Beckon Bench — the vibe coder’s AI model benchmark',
  description:
    'Live leaderboard for AI coding models: eight one-shot tests, identical conditions, human-scored season one, AI judge panel, and a public vote. Every prompt, artifact, and ballot is public.',
  alternates: { canonical: '/' },
};

function SectionTitle({ children, badge, badgeVariant = 'soft', id }: {
  children: React.ReactNode; badge?: string; badgeVariant?: 'soft' | 'info'; id?: string;
}) {
  return (
    <h2 id={id} className="mb-1 mt-16 flex scroll-mt-20 items-center gap-3 font-mono text-xl font-bold">
      <span className="text-primary">❯</span> {children}
      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
    </h2>
  );
}

export default function Home() {
  const newest = [...models].sort((a, b) =>
    String(b.meta.run_date).localeCompare(String(a.meta.run_date))
  )[0];
  const effItems = scoredModels.filter((m) => m.toks && m.total);
  const anyCost = scoredModels.some((m) => m.hasCost);

  // Theater data: one tab per capability, one stage pairing per comparison video.
  const dealias = (s: string) => s.replace(/\bModel [AB]\b/g, 'it').replace(/^it\b/, 'It');
  const theaterTests = tests
    .map((t) => {
      const pairings = comparisons
        .filter((f) => f.startsWith(t.id))
        .map((f) => {
          const pair = pairOf(f);
          if (!pair) return null;
          const pms = pair.map((slug) => models.find((m) => m.slug === slug)).filter(Boolean) as any[];
          const match = matches.find(
            (x) => x.test === t.id && pair.includes(x.model_a) && pair.includes(x.model_b)
          );
          let matchData = null;
          if (match) {
            const tally = match.judges.filter((j: any) => j.vote === match.winner).length;
            const quoteSrc = match.judges.find((j: any) => j.vote === match.winner && j.reasoning);
            matchData = {
              id: match.id, aSlug: match.model_a, bSlug: match.model_b,
              aName: nameOfSlug(match.model_a), bName: nameOfSlug(match.model_b),
              winner: nameOfSlug(match.winner),
              tally: `${tally}–${match.judges.length - tally}`,
              quote: quoteSrc ? dealias(String(quoteSrc.reasoning).split(/(?<=[.!?])\s/)[0]) : undefined,
              judge: quoteSrc?.judge,
            };
          }
          return {
            video: vurl(f),
            models: pms
              .map((m) => ({ slug: m.slug, name: shortName(m), score: m.runs[t.id]?.score?.total ?? null }))
              .sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
            match: matchData,
          };
        })
        .filter(Boolean);
      return { id: t.id, num: t.num, title: capTitle(t), pairings };
    })
    .filter((t) => t.pairings.length) as any[];

  return (
    <>
      <main className="hero-glow mx-auto max-w-6xl px-5 pb-16">
        {/* hero */}
        <section className="grid gap-6 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="reveal-in bevel-out bg-background p-1">
            <div className="os-titlebar flex items-center gap-2 px-2 py-1">
              <span className="font-mono text-xs font-bold">C:\</span>
              <span className="text-sm font-bold tracking-wide">MS-DOS Prompt — beckon</span>
              <span className="ml-auto flex gap-0.5">
                <span className="os-titlebar-btn" aria-hidden>_</span>
                <span className="os-titlebar-btn" aria-hidden>✕</span>
              </span>
            </div>
            <div className="bg-black p-7">
              <p className="font-mono text-xs font-bold tracking-[0.15em] text-[#22f284]">
                <span className="text-[#8f8f9a]">C:\&gt; </span>beckon run bench --tests 8
              </p>
              <h1 className="mt-3 font-mono text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                The <span className="hl text-[#04140b]">vibe coder&apos;s</span> benchmark
                <span className="cursor-blink" />
              </h1>
              <p className="mt-3 max-w-xl text-[#b9b9c0]">
                Eight one-shot tests, identical conditions. Every prompt, artifact, and vote public.
              </p>
              <a
                href="https://heybeckon.ai"
                className="mt-5 inline-flex items-center gap-2 border border-[#3a3a42] px-3.5 py-1.5 font-mono text-xs text-[#b9b9c0] transition-colors hover:border-[#22f284] hover:text-white"
              >
                Runs live inside <b className="text-[#22f284]">Beckon</b>
              </a>
            </div>
          </div>
          <aside className="flex flex-col gap-4">
            {newest && (
              <Link href={`/model/${newest.slug}/`} className="group">
                <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:border-primary/50">
                  <CardContent>
                    <Badge variant="soft" className="mb-2">New run</Badge>
                    <p className="font-mono font-bold">{shortName(newest)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      benchmarked {newest.meta.run_date || ''} — artifacts, stats, and ballots are live
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
            <Link href="/vote/" className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:border-primary/50">
                <CardContent>
                  <Badge variant="info" className="mb-2">Launch</Badge>
                  <p className="font-mono font-bold">The People&apos;s Vote</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    the crowd now decides — {matches.length} open ballots, watch and vote
                  </p>
                </CardContent>
              </Card>
            </Link>
          </aside>
        </section>

        {/* highlights */}
        <section className="grid gap-4 md:grid-cols-3">
          {scoredModels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-good" /> Score
                </CardTitle>
                <CardDescription>Season points, ten per scored test · higher is better</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  color="var(--color-good)"
                  plotHeight={100}
                  items={scoredModels.map((m) => ({ name: shortName(m), value: m.total, href: `/model/${m.slug}/` }))}
                />
              </CardContent>
            </Card>
          )}
          {elo?.ladder?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-info" /> Arena ELO
                </CardTitle>
                <CardDescription>Blind pairwise AI-judge matches · higher is better</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  color="var(--color-info)"
                  plotHeight={100}
                  items={elo.ladder.map((r: any) => ({ name: nameOfSlug(r.model), value: r.elo, href: `/model/${r.model}/` }))}
                />
              </CardContent>
            </Card>
          )}
          {effItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-warn" /> Tokens per point
                </CardTitle>
                <CardDescription>Output tokens per point · lower is better (unrecorded omitted)</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  color="var(--color-warn)"
                  plotHeight={100}
                  fmt={fmtTokens}
                  items={effItems.map((m) => ({ name: shortName(m), value: Math.round(m.toks / m.total), href: `/model/${m.slug}/` }))}
                />
              </CardContent>
            </Card>
          )}
        </section>

        {/* scoreboard */}
        <SectionTitle id="board" badge="per test">Scoreboard</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Runs first try · polish · prompt adherence · wow factor — ten points per test, ties to the
          cheaper run. ◌ run captured, no score. New runs are decided by the People&apos;s Vote and the AI panel.
        </p>
        <Scoreboard />
        <nav className="mt-4 flex flex-wrap gap-4 font-mono text-xs font-semibold">
          {matches.length > 0 && <Link className="text-muted-foreground hover:text-primary" href="/vote/"><span className="text-primary"># </span>Cast your votes</Link>}
          {theaterTests.length > 0 && <a className="text-muted-foreground hover:text-primary" href="#watch"><span className="text-primary"># </span>The Theater</a>}
          <a className="text-muted-foreground hover:text-primary" href="#arena"><span className="text-primary"># </span>Arena</a>
          <a className="text-muted-foreground hover:text-primary" href="#efficiency"><span className="text-primary"># </span>Efficiency</a>
          <Link className="text-muted-foreground hover:text-primary" href="/tests/"><span className="text-primary"># </span>The 8 tests</Link>
        </nav>

        {/* head-to-heads: the theater */}
        {theaterTests.length > 0 && (
          <>
            <SectionTitle id="watch" badge="watch & vote">The Theater</SectionTitle>
            <p className="mb-4 text-sm text-muted-foreground">
              Same prompt, same clock, side by side. Pick a capability, watch the runs, cast your vote.
            </p>
            <Theater tests={theaterTests} />
          </>
        )}

        {/* arena */}
        <SectionTitle id="arena" badge="AI judge panel" badgeVariant="info">Arena</SectionTitle>
        <Tabs defaultValue="elo" className="mt-3">
          <TabsList>
            <TabsTrigger value="elo" className="font-mono text-xs">ELO ladder</TabsTrigger>
            <TabsTrigger value="panel" className="font-mono text-xs">Panel Score</TabsTrigger>
          </TabsList>
          <TabsContent value="elo">
            {elo?.ladder?.length ? (
              <>
                <div className={`${boardShell} max-w-xl`}>
                  <Table>
                    <thead>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className={boardTh}></TableHead>
                        <TableHead className={boardTh}>Model</TableHead>
                        <TableHead className={boardTh}>ELO</TableHead>
                        <TableHead className={boardTh}>Record</TableHead>
                      </TableRow>
                    </thead>
                    <TableBody>
                      {elo.ladder.map((r: any, i: number) => (
                        <TableRow key={r.model} className="hover:bg-info/[0.04]">
                          <TableCell className="px-3 font-mono text-xs text-muted-foreground">#{i + 1}</TableCell>
                          <TableCell className="px-3"><Link href={`/model/${r.model}/`} className="font-semibold hover:text-primary">{nameOfSlug(r.model)}</Link></TableCell>
                          <TableCell className="px-3 font-mono font-bold tabular-nums text-info">{r.elo}</TableCell>
                          <TableCell className="px-3 font-mono tabular-nums text-muted-foreground">{r.w}W–{r.l}L</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {elo.matches} matches, blind pairwise, majority of three judges. Every vote is public on the{' '}
                  <Link href="/matches/" className="underline decoration-border underline-offset-4 hover:text-primary">Arena page</Link>.
                </p>
              </>
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No matches played yet.</p>
            )}
          </TabsContent>
          <TabsContent value="panel">
            <PanelBoard />
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              v2 pilot — five cross-vendor judges score each artifact blind on the frozen v1 rubric,
              with render evidence where it exists; the median of each dimension is published.
            </p>
          </TabsContent>
        </Tabs>

        {/* on the bench */}
        {benchModels.length > 0 && (
          <>
            <SectionTitle badge="scoring in progress">On the bench</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benchModels.map((m) => {
                const captured = Object.keys(m.runs).length;
                return (
                  <Link key={m.slug} href={`/model/${m.slug}/`}>
                    <Card className="border-dashed transition-transform hover:-translate-y-0.5 hover:border-primary/50">
                      <CardContent className="p-5">
                        <p className="font-mono font-bold">{shortName(m)}</p>
                        <p className="text-xs text-muted-foreground">{m.meta.provider || ''}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {captured ? `${captured} of ${tests.length} runs captured · scoring pending` : 'awaiting first run'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* categories */}
        {scoredModels.length > 0 && (
          <>
            <SectionTitle badge="same points, grouped">Category breakdown</SectionTitle>
            <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
              The eight frozen tests, grouped by what they measure. Points are the scores, unchanged —
              no category is scored separately.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATS.map((c) => {
                const scored = scoredModels.filter((m) => catScored(m, c) > 0);
                return (
                  <Card key={c.name}>
                    <CardHeader>
                      <CardTitle>{c.name}</CardTitle>
                      <CardDescription>
                        Test{c.tests.length > 1 ? 's' : ''}{' '}
                        {c.tests.map((t, i) => (
                          <span key={t.id}>
                            {i > 0 && ' · '}
                            <Link href={`/test/${t.id}/`} title={capTitle(t)} className="underline decoration-border underline-offset-4 hover:text-primary">{t.num}</Link>
                          </span>
                        ))}{' '}
                        — out of {c.tests.length * 10}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {scored.length ? (
                        <BarChart
                          color="var(--color-primary)"
                          plotHeight={80}
                          items={scored.map((m) => ({ name: shortName(m), value: catScore(m, c), href: `/model/${m.slug}/` }))}
                        />
                      ) : (
                        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                          <span className="text-border">{'// '}</span>Scoring pending.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* efficiency */}
        <SectionTitle id="efficiency" badge="recorded, never scored" badgeVariant="info">Efficiency</SectionTitle>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {effItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-info" /> Token efficiency</CardTitle>
                <CardDescription>Output tokens per point. Lower is better.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart color="var(--color-info)" plotHeight={80} fmt={fmtTokens}
                  items={effItems.map((m) => ({ name: shortName(m), value: Math.round(m.toks / m.total), href: `/model/${m.slug}/` }))} />
              </CardContent>
            </Card>
          )}
          {scoredModels.some((m) => m.secs) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-warn" /> Time on the bench</CardTitle>
                <CardDescription>Wall clock across scored tests. Lower is better.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart color="var(--color-warn)" plotHeight={80} fmt={fmtMins}
                  items={scoredModels.filter((m) => m.secs).map((m) => ({ name: shortName(m), value: m.secs, href: `/model/${m.slug}/` }))} />
              </CardContent>
            </Card>
          )}
        </div>
        <div className={boardShell}>
          <Table>
            <thead>
              <TableRow className="hover:bg-transparent">
                <TableHead className={boardTh}>Model</TableHead>
                <TableHead className={boardTh}>Points</TableHead>
                <TableHead className={boardTh}>Time</TableHead>
                <TableHead className={boardTh}>Output tokens</TableHead>
                <TableHead className={boardTh}>Tokens / point</TableHead>
                {anyCost && <TableHead className={boardTh}>Cost</TableHead>}
              </TableRow>
            </thead>
            <TableBody>
              {scoredModels.map((m) => (
                <TableRow key={m.slug} className="hover:bg-primary/[0.04]">
                  <TableCell className="px-3"><Link href={`/model/${m.slug}/`} title={m.meta.model_id || m.slug} className="font-semibold hover:text-primary">{shortName(m)}</Link></TableCell>
                  <TableCell className="px-3 font-mono font-bold tabular-nums">{m.total}</TableCell>
                  <TableCell className="px-3 font-mono tabular-nums">{m.secs ? fmtTime(m.secs) : '·'}</TableCell>
                  <TableCell className="px-3 font-mono tabular-nums">{m.toks ? fmtTokens(m.toks) : '·'}</TableCell>
                  <TableCell className="px-3 font-mono tabular-nums">{m.toks && m.total ? fmtTokens(Math.round(m.toks / m.total)) : '·'}</TableCell>
                  {anyCost && <TableCell className="px-3 font-mono tabular-nums">{m.hasCost ? `$${m.cost.toFixed(2)}` : '·'}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
