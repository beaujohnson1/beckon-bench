import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TableShell, Table, Th, Td } from '@/components/ui/table';
import { BarChart } from '@/components/bar-chart';
import { Scoreboard, PanelBoard } from '@/components/boards';
import { ScoreChip } from '@/components/score-chip';
import { VoteRow } from '@/components/vote-row';
import {
  tests, models, scoredModels, benchModels, matches, elo, comparisons, pairOf, vurl,
  shortName, nameOfSlug, capTitle, CATS, catScore, catScored, fmtTokens, fmtMins, fmtTime,
} from '@/lib/data';

function SectionTitle({ children, badge, badgeVariant = 'default', id }: {
  children: React.ReactNode; badge?: string; badgeVariant?: 'default' | 'info'; id?: string;
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

  const versusCards = comparisons
    .map((f) => {
      const t = tests.find((x) => f.startsWith(x.id));
      const pair = pairOf(f);
      if (!t || !pair) return null;
      const pairModels = pair.map((slug) => models.find((m) => m.slug === slug)).filter(Boolean);
      const scored = pairModels
        .filter((m) => m!.runs[t.id]?.score)
        .sort((a, b) => b!.runs[t.id].score.total - a!.runs[t.id].score.total);
      const match = matches.find(
        (x) => x.test === t.id && pair.includes(x.model_a) && pair.includes(x.model_b)
      );
      return { f, t, pairModels, scored, match };
    })
    .filter(Boolean) as any[];

  return (
    <>
      <SiteHeader active="Leaderboard" />
      <main className="hero-glow mx-auto max-w-6xl px-5 pb-16">
        {/* hero */}
        <section className="grid gap-6 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="reveal-in overflow-hidden rounded-xl border border-line bg-panel shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-bad" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="ml-2 font-mono text-xs tracking-wider text-muted">
                beckon-bench — live results
              </span>
            </div>
            <div className="p-7">
              <p className="font-mono text-xs font-bold tracking-[0.15em] text-primary">
                <span className="text-muted">$ </span>beckon run bench --tests 8
              </p>
              <h1 className="mt-2 font-mono text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                The vibe coder&apos;s benchmark
                <span className="cursor-blink" />
              </h1>
              <p className="mt-3 max-w-xl text-muted">
                Eight one-shot tests, identical conditions. Every prompt, artifact, and vote public.
              </p>
              <a
                href="https://heybeckon.ai"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-primary hover:text-foreground"
              >
                Runs live inside <b className="text-primary">Beckon</b>
              </a>
            </div>
          </div>
          <aside className="flex flex-col gap-4">
            {newest && (
              <Link href={`/model/${newest.slug}/`} className="group">
                <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <Badge className="mb-2">New run</Badge>
                    <p className="font-mono font-bold">{shortName(newest)}</p>
                    <p className="mt-1 text-sm text-muted">
                      benchmarked {newest.meta.run_date || ''} — artifacts, stats, and ballots are live
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
            <Link href="/vote/" className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:border-primary/50">
                <CardContent className="p-5">
                  <Badge variant="info" className="mb-2">Launch</Badge>
                  <p className="font-mono font-bold">The People&apos;s Vote</p>
                  <p className="mt-1 text-sm text-muted">
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
                  <span className="h-2.5 w-2.5 bg-primary" /> Score
                </CardTitle>
                <CardDescription>Season points, ten per scored test · higher is better</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  color="var(--color-primary)"
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
        <p className="mb-4 text-sm text-muted">
          Runs first try · polish · prompt adherence · wow factor — ten points per test, ties to the
          cheaper run. ◌ run captured, no score. New runs are decided by the People&apos;s Vote and the AI panel.
        </p>
        <Scoreboard />
        <nav className="mt-4 flex flex-wrap gap-4 font-mono text-xs font-semibold">
          {matches.length > 0 && <Link className="text-muted hover:text-primary" href="/vote/"><span className="text-primary"># </span>Cast your votes</Link>}
          {versusCards.length > 0 && <a className="text-muted hover:text-primary" href="#watch"><span className="text-primary"># </span>Head-to-heads</a>}
          <a className="text-muted hover:text-primary" href="#arena"><span className="text-primary"># </span>Arena</a>
          <a className="text-muted hover:text-primary" href="#efficiency"><span className="text-primary"># </span>Efficiency</a>
          <Link className="text-muted hover:text-primary" href="/tests/"><span className="text-primary"># </span>The 8 tests</Link>
        </nav>

        {/* head-to-heads */}
        {versusCards.length > 0 && (
          <>
            <SectionTitle id="watch" badge="side by side">Head-to-heads</SectionTitle>
            <p className="mb-4 text-sm text-muted">Same prompt, same clock, side by side.</p>
            <div className="grid gap-5 lg:grid-cols-2">
              {versusCards.map(({ f, t, pairModels, scored, match }: any) => {
                const tally = match ? match.judges.filter((j: any) => j.vote === match.winner).length : 0;
                return (
                  <Card key={f} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>
                        <span className="text-muted">{t.num} ·</span> {capTitle(t)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <video
                        className="block w-full rounded-lg border border-line bg-black"
                        controls muted loop playsInline preload="metadata"
                        src={vurl(f)}
                      />
                      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {(scored.length ? scored : pairModels).map((m: any, i: number) => (
                          <span key={m.slug} className="flex items-center gap-2">
                            {i > 0 && <span className="text-muted">vs</span>}
                            <span className="font-semibold">{shortName(m)}</span>
                            {m.runs[t.id]?.score && <ScoreChip score={m.runs[t.id].score.total} />}
                          </span>
                        ))}
                        <Link href={`/test/${t.id}/`} className="ml-auto font-mono text-xs text-muted hover:text-primary">
                          Full result →
                        </Link>
                      </p>
                      {match && (
                        <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm">
                          <Badge variant="info">AI panel</Badge>
                          <span className="font-semibold">{nameOfSlug(match.winner)}</span>
                          <b className="font-mono tabular-nums">{tally}–{match.judges.length - tally}</b>
                          <Link href="/matches/" className="ml-auto font-mono text-xs text-muted hover:text-primary">
                            Votes →
                          </Link>
                        </p>
                      )}
                      {match && (
                        <VoteRow
                          matchId={match.id}
                          aSlug={match.model_a} bSlug={match.model_b}
                          aName={nameOfSlug(match.model_a)} bName={nameOfSlug(match.model_b)}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* arena */}
        <SectionTitle id="arena" badge="AI judge panel" badgeVariant="info">Arena</SectionTitle>
        {elo?.ladder?.length ? (
          <>
            <TableShell className="max-w-xl">
              <Table>
                <thead>
                  <tr><Th></Th><Th>Model</Th><Th>ELO</Th><Th>Record</Th></tr>
                </thead>
                <tbody>
                  {elo.ladder.map((r: any, i: number) => (
                    <tr key={r.model} className="hover:bg-info/[0.04]">
                      <Td className="font-mono text-xs text-muted">#{i + 1}</Td>
                      <Td><Link href={`/model/${r.model}/`} className="font-semibold hover:text-primary">{nameOfSlug(r.model)}</Link></Td>
                      <Td className="font-mono font-bold tabular-nums text-info">{r.elo}</Td>
                      <Td className="font-mono tabular-nums text-muted">{r.w}W–{r.l}L</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
            <p className="mt-2 text-sm text-muted">
              {elo.matches} matches. Every vote is public on the <Link href="/matches/" className="underline decoration-line underline-offset-4 hover:text-primary">Arena page</Link>.
            </p>
          </>
        ) : null}
        <h3 className="mb-1 mt-8 flex items-center gap-2 font-mono text-base font-bold">
          Panel Score <Badge variant="info">v2 pilot</Badge>
        </h3>
        <p className="mb-4 max-w-3xl text-sm text-muted">
          Five cross-vendor judges score each artifact blind on the frozen v1 rubric, with render
          evidence where it exists; the median of each dimension is published.
        </p>
        <PanelBoard />

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
                        <p className="text-xs text-muted">{m.meta.provider || ''}</p>
                        <p className="mt-2 text-sm text-muted">
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
            <p className="mb-4 max-w-3xl text-sm text-muted">
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
                            <Link href={`/test/${t.id}/`} title={capTitle(t)} className="underline decoration-line underline-offset-4 hover:text-primary">{t.num}</Link>
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
                        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
                          <span className="text-line">{'// '}</span>Scoring pending.
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
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Model</Th><Th>Points</Th><Th>Time</Th><Th>Output tokens</Th><Th>Tokens / point</Th>
                {anyCost && <Th>Cost</Th>}
              </tr>
            </thead>
            <tbody>
              {scoredModels.map((m) => (
                <tr key={m.slug} className="hover:bg-primary/[0.04]">
                  <Td><Link href={`/model/${m.slug}/`} title={m.meta.model_id || m.slug} className="font-semibold hover:text-primary">{shortName(m)}</Link></Td>
                  <Td className="font-mono font-bold tabular-nums">{m.total}</Td>
                  <Td className="font-mono tabular-nums">{m.secs ? fmtTime(m.secs) : '·'}</Td>
                  <Td className="font-mono tabular-nums">{m.toks ? fmtTokens(m.toks) : '·'}</Td>
                  <Td className="font-mono tabular-nums">{m.toks && m.total ? fmtTokens(Math.round(m.toks / m.total)) : '·'}</Td>
                  {anyCost && <Td className="font-mono tabular-nums">{m.hasCost ? `$${m.cost.toFixed(2)}` : '·'}</Td>}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </main>
      <SiteFooter />
    </>
  );
}
