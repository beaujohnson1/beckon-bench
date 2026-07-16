import Link from 'next/link';

type Item = { name: string; value: number; href: string };

// Direct-labeled column chart, single hue per chart (validated palette).
// Fixed-height label wells keep every bar on one baseline regardless of
// how many lines a model name wraps to.
export function BarChart({
  items,
  color,
  plotHeight = 120,
  fmt = (v: number) => String(v),
}: {
  items: Item[];
  color: string;
  plotHeight?: number;
  fmt?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex items-end gap-3 overflow-x-auto pt-2 sm:gap-5">
      {items.map((it) => (
        <Link
          key={it.href + it.name}
          href={it.href}
          title={it.name}
          className="group flex min-w-14 flex-col items-center justify-end"
        >
          <span className="mb-1.5 font-mono text-sm font-bold tabular-nums">{fmt(it.value)}</span>
          <span
            className="w-6 rounded-t-sm transition-all group-hover:brightness-125"
            style={{
              height: Math.max(4, Math.round((it.value / max) * plotHeight)),
              background: `repeating-linear-gradient(to top, ${color} 0 6px, color-mix(in srgb, ${color} 55%, transparent) 6px 8px)`,
            }}
          />
          <span className="mt-2 line-clamp-3 min-h-[3.3em] w-full max-w-24 self-stretch border-t border-border pt-1.5 text-center text-[0.7rem] leading-tight text-muted-foreground group-hover:text-foreground">
            {it.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
