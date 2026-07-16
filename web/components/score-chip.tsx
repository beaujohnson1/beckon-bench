import { cn } from '@/lib/utils';

// Score chip colored by band — same thresholds as the classic site.
export function ScoreChip({ score, denom, className }: { score: number; denom?: string; className?: string }) {
  const band =
    score >= 9
      ? 'border-primary-deep/70 bg-primary/10 text-primary shadow-[0_0_10px_rgba(34,242,132,0.25)]'
      : score >= 7
        ? 'border-warn/50 bg-warn/10 text-warn'
        : score >= 5
          ? 'border-border bg-muted text-foreground'
          : 'border-bad/50 bg-bad/10 text-bad';
  return (
    <span
      className={cn(
        'inline-block min-w-8 rounded-md border px-1.5 py-0.5 text-center font-mono text-sm font-bold tabular-nums',
        band,
        className
      )}
    >
      {score}
      {denom && <span className="font-normal opacity-60">{denom}</span>}
    </span>
  );
}

export function PendingChip() {
  return (
    <span className="inline-block rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      pending
    </span>
  );
}
