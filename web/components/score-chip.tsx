import { cn } from '@/lib/utils';

// Score chip colored by band — thresholds from the classic site, hues picked
// for the light Win95 surfaces (dark text on pale tint, AA on white).
export function ScoreChip({ score, denom, className }: { score: number; denom?: string; className?: string }) {
  const band =
    score >= 9
      ? 'border-[#2e8b57] bg-[#d9f5e5] text-[#14532d]'
      : score >= 7
        ? 'border-[#a8842f] bg-[#fff3d1] text-[#6b4e00]'
        : score >= 5
          ? 'border-border bg-muted text-foreground'
          : 'border-[#c0281e] bg-[#ffe0de] text-[#8a1a12]';
  return (
    <span
      className={cn(
        'inline-block min-w-8 border px-1.5 py-0.5 text-center font-mono text-sm font-bold tabular-nums',
        band,
        className
      )}
    >
      {score}
      {denom && <span className="font-normal opacity-70">{denom}</span>}
    </span>
  );
}

export function PendingChip() {
  return (
    <span className="inline-block border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      pending
    </span>
  );
}
