import Link from 'next/link';
import { CATS, orderedTests, groupStarts, capTitle, shortName, scoredModels, panelFor, type Model } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { ScoreChip } from '@/components/score-chip';
import { cn } from '@/lib/utils';

// Shared board chrome so every table on the site reads identically.
export const boardShell = 'overflow-hidden rounded-xl border bg-card';
export const boardTh =
  'h-auto bg-muted px-3 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground';

function GroupedHead({ firstCol }: { firstCol: string }) {
  return (
    <thead>
      <TableRow className="hover:bg-transparent">
        <TableHead rowSpan={2} className={cn(boardTh, 'align-bottom')}>{firstCol}</TableHead>
        {CATS.map((c) => (
          <TableHead key={c.name} colSpan={c.tests.length} className={cn(boardTh, 'border-l text-center')}>
            {c.name}
          </TableHead>
        ))}
        <TableHead rowSpan={2} className={cn(boardTh, 'text-right align-bottom')}>Total</TableHead>
      </TableRow>
      <TableRow className="hover:bg-transparent">
        {orderedTests.map((t) => (
          <TableHead key={t.id} title={capTitle(t)} className={cn(boardTh, 'text-center', groupStarts.has(t.id) && 'border-l')}>
            {t.num}
          </TableHead>
        ))}
      </TableRow>
    </thead>
  );
}

function ModelCell({ m, rank }: { m: Model; rank?: number }) {
  return (
    <TableCell className="px-3 py-3">
      <div className="flex items-center gap-3">
        {rank != null && <span className="font-mono text-xs text-muted-foreground">#{rank}</span>}
        <div>
          <Link href={`/model/${m.slug}/`} title={m.meta.model_id || m.slug} className="font-semibold hover:text-primary">
            {shortName(m)}
          </Link>
          <div className="text-xs text-muted-foreground">{m.meta.provider || ''}</div>
        </div>
      </div>
    </TableCell>
  );
}

export function Scoreboard() {
  return (
    <div className={boardShell}>
      <Table>
        <GroupedHead firstCol="Model" />
        <TableBody>
          {scoredModels.map((m, i) => (
            <TableRow key={m.slug} className="hover:bg-primary/[0.04]">
              <ModelCell m={m} rank={i + 1} />
              {orderedTests.map((t) => {
                const run = m.runs[t.id];
                return (
                  <TableCell key={t.id} className={cn('px-3 text-center', groupStarts.has(t.id) && 'border-l')}>
                    {!run ? (
                      <span className="text-muted-foreground">·</span>
                    ) : !run.score ? (
                      <Link href={`/test/${t.id}/`} title="run captured, scoring pending" className="text-muted-foreground hover:text-foreground">◌</Link>
                    ) : (
                      <Link href={`/test/${t.id}/`}><ScoreChip score={run.score.total} /></Link>
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="px-3 text-right font-mono text-base font-bold tabular-nums">
                {m.total}
                <span className="text-xs font-normal text-muted-foreground">/{m.testsScored * 10}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PanelBoard() {
  const panelModels = scoredModels
    .map((m) => {
      const recs = orderedTests.map((t) => panelFor(m.slug, t.id)).filter(Boolean);
      return { m, recs, total: recs.reduce((s, r) => s + r.panel.total, 0) };
    })
    .filter((x) => x.recs.length)
    .sort((a, b) => b.total - a.total);
  if (!panelModels.length) return null;
  return (
    <div className={boardShell}>
      <Table>
        <GroupedHead firstCol="Model" />
        <TableBody>
          {panelModels.map(({ m, recs, total }) => (
            <TableRow key={m.slug} className="hover:bg-info/[0.04]">
              <ModelCell m={m} />
              {orderedTests.map((t) => {
                const r = panelFor(m.slug, t.id);
                return (
                  <TableCell key={t.id} className={cn('px-3 text-center', groupStarts.has(t.id) && 'border-l')}>
                    {r ? (
                      <Link href={`/test/${t.id}/`} title={`median of ${r.panel.judges_seated} judges`}>
                        <ScoreChip score={r.panel.total} />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">·</span>
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="px-3 text-right font-mono text-base font-bold tabular-nums">
                {total}
                <span className="text-xs font-normal text-muted-foreground">/{recs.length * 10}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
