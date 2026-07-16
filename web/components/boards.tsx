import Link from 'next/link';
import { CATS, orderedTests, groupStarts, capTitle, shortName, scoredModels, panelFor, type Model } from '@/lib/data';
import { TableShell, Table, Th, Td } from '@/components/ui/table';
import { ScoreChip } from '@/components/score-chip';
import { cn } from '@/lib/utils';

function GroupedHead({ firstCol }: { firstCol: string }) {
  return (
    <thead>
      <tr>
        <Th rowSpan={2} className="align-bottom">{firstCol}</Th>
        {CATS.map((c) => (
          <Th key={c.name} colSpan={c.tests.length} className="border-l border-line text-center">
            {c.name}
          </Th>
        ))}
        <Th rowSpan={2} className="text-right align-bottom">Total</Th>
      </tr>
      <tr>
        {orderedTests.map((t) => (
          <Th key={t.id} title={capTitle(t)} className={cn('text-center', groupStarts.has(t.id) && 'border-l border-line')}>
            {t.num}
          </Th>
        ))}
      </tr>
    </thead>
  );
}

function ModelCell({ m, rank }: { m: Model; rank?: number }) {
  return (
    <Td className="py-3">
      <div className="flex items-center gap-3">
        {rank != null && <span className="font-mono text-xs text-muted">#{rank}</span>}
        <div>
          <Link href={`/model/${m.slug}/`} title={m.meta.model_id || m.slug} className="font-semibold hover:text-primary">
            {shortName(m)}
          </Link>
          <div className="text-xs text-muted">{m.meta.provider || ''}</div>
        </div>
      </div>
    </Td>
  );
}

export function Scoreboard() {
  return (
    <TableShell>
      <Table>
        <GroupedHead firstCol="Model" />
        <tbody>
          {scoredModels.map((m, i) => (
            <tr key={m.slug} className="transition-colors hover:bg-primary/[0.04]">
              <ModelCell m={m} rank={i + 1} />
              {orderedTests.map((t) => {
                const run = m.runs[t.id];
                return (
                  <Td key={t.id} className={cn('text-center', groupStarts.has(t.id) && 'border-l border-line')}>
                    {!run ? (
                      <span className="text-muted">·</span>
                    ) : !run.score ? (
                      <Link href={`/test/${t.id}/`} title="run captured, scoring pending" className="text-muted hover:text-foreground">◌</Link>
                    ) : (
                      <Link href={`/test/${t.id}/`}><ScoreChip score={run.score.total} /></Link>
                    )}
                  </Td>
                );
              })}
              <Td className="text-right font-mono text-base font-bold tabular-nums">
                {m.total}
                <span className="text-xs font-normal text-muted">/{m.testsScored * 10}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
  );
}

export function PanelBoard() {
  const panelModels = scoredModels
    .concat([]) // panel records may exist for unscored models too
    .map((m) => {
      const recs = orderedTests.map((t) => panelFor(m.slug, t.id)).filter(Boolean);
      return { m, recs, total: recs.reduce((s, r) => s + r.panel.total, 0) };
    })
    .filter((x) => x.recs.length)
    .sort((a, b) => b.total - a.total);
  if (!panelModels.length) return null;
  return (
    <TableShell>
      <Table>
        <GroupedHead firstCol="Model" />
        <tbody>
          {panelModels.map(({ m, recs, total }) => (
            <tr key={m.slug} className="transition-colors hover:bg-info/[0.04]">
              <ModelCell m={m} />
              {orderedTests.map((t) => {
                const r = panelFor(m.slug, t.id);
                return (
                  <Td key={t.id} className={cn('text-center', groupStarts.has(t.id) && 'border-l border-line')}>
                    {r ? (
                      <Link href={`/test/${t.id}/`} title={`median of ${r.panel.judges_seated} judges`}>
                        <ScoreChip score={r.panel.total} />
                      </Link>
                    ) : (
                      <span className="text-muted">·</span>
                    )}
                  </Td>
                );
              })}
              <Td className="text-right font-mono text-base font-bold tabular-nums">
                {total}
                <span className="text-xs font-normal text-muted">/{recs.length * 10}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableShell>
  );
}
