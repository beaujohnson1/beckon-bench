// Original Win95-style pixel icons, hand-drawn on a 16x16 grid (real Windows
// icons are Microsoft's copyrighted artwork — these are ours). Rendered as
// crisp-edge SVG rects, scaled to 40px on the desktop.
type Px = [number, number, number, number, string]; // x, y, w, h, fill

const K = '#0a0a0a', W = '#fff', S = '#c0c0c0', G = '#808080', N = '#000080',
  T = '#008080', GD = '#e8a33d', GDD = '#9c6b1e', GR = '#2e8b57', R = '#c0281e', BL = '#3b6cc0';

function frame(x = 1, y = 2, w = 14, h = 12): Px[] {
  return [
    [x, y, w, h, K],
    [x + 1, y + 1, w - 2, h - 2, S],
    [x + 1, y + 1, w - 2, 2, N],
    [x + 2, y + 4, w - 4, h - 6, W],
  ];
}

const ICONS: Record<string, Px[]> = {
  // monitor showing a bar chart
  leaderboard: [
    ...frame(1, 1, 14, 11),
    [4, 8, 2, 3, GR], [7, 6, 2, 5, BL], [10, 4, 2, 7, R],
    [6, 12, 4, 1, G], [4, 13, 8, 2, K], [5, 13, 6, 1, S],
  ],
  // ballot box with a paper going in
  vote: [
    [6, 1, 4, 3, W], [6, 1, 4, 1, K], [7, 2, 2, 1, G],
    [2, 4, 12, 2, N], [6, 4, 4, 1, K],
    [2, 6, 12, 8, K], [3, 7, 10, 6, T], [4, 8, 8, 1, W], [4, 10, 6, 1, W],
  ],
  // trophy — the arena ladder
  arena: [
    [4, 2, 8, 1, K], [4, 3, 8, 3, GD], [5, 6, 6, 2, GD], [6, 8, 4, 1, GDD],
    [2, 3, 2, 3, GDD], [12, 3, 2, 3, GDD],
    [7, 9, 2, 2, GDD], [5, 11, 6, 1, GD], [4, 12, 8, 2, K], [5, 12, 6, 1, GDD],
  ],
  // stacked text files, folded corner
  tests: [
    [5, 1, 8, 11, G], [4, 3, 8, 12, K], [5, 4, 6, 10, W],
    [11, 3, 1, 3, W], [10, 3, 2, 1, S],
    [6, 6, 4, 1, G], [6, 8, 4, 1, G], [6, 10, 3, 1, G],
  ],
  // speech bubble — Discord
  discord: [
    [2, 3, 12, 8, K], [3, 4, 10, 6, N],
    [5, 6, 2, 2, W], [9, 6, 2, 2, W],
    [4, 11, 3, 2, K], [4, 11, 2, 1, N],
  ],
  // terminal window with the beckon prompt
  beckon: [
    [1, 2, 14, 12, K], [2, 3, 12, 10, K], [2, 3, 12, 2, T],
    [3, 6, 2, 1, '#22f284'], [6, 6, 4, 1, '#22f284'],
    [3, 8, 5, 1, GR], [3, 10, 7, 1, GR],
  ],
  // BenchAmp — speaker box with a note
  amp: [
    [2, 3, 12, 11, K], [3, 4, 10, 9, S],
    [4, 5, 3, 3, K], [5, 6, 1, 1, GR],
    [4, 9, 3, 3, K], [5, 10, 1, 1, GR],
    [9, 5, 3, 7, N], [10, 6, 1, 5, T],
    [11, 2, 1, 4, K], [10, 2, 3, 1, K],
  ],
  // messenger — two buddies, one conversation
  msn: [
    [2, 4, 5, 5, K], [3, 5, 3, 3, GR], [3, 10, 3, 4, GR], [2, 10, 1, 4, K], [6, 10, 1, 4, K],
    [9, 4, 5, 5, K], [10, 5, 3, 3, N], [10, 10, 3, 4, N], [9, 10, 1, 4, K], [13, 10, 1, 4, K],
    [6, 2, 4, 1, W], [5, 3, 2, 1, W], [9, 3, 2, 1, W],
  ],
  // bonsai buddy — do not click. (a literal bonsai; any resemblance to
  // helpful purple animals is your own traumatic memory)
  bonsai: [
    [6, 1, 5, 3, GR], [4, 2, 4, 3, GR], [9, 3, 4, 3, GR], [3, 3, 3, 2, '#1d6b43'], [10, 2, 2, 2, '#1d6b43'],
    [7, 4, 2, 2, GDD], [6, 6, 2, 1, GDD], [8, 7, 2, 1, GDD], [7, 5, 2, 3, GDD],
    [4, 8, 8, 1, K], [5, 9, 6, 3, R], [5, 9, 6, 1, '#8a1a12'], [4, 12, 8, 1, K],
  ],
  // recycle bin — where voided runs go
  bin: [
    [4, 2, 8, 1, G], [3, 3, 10, 1, K],
    [4, 4, 8, 10, S], [4, 4, 8, 10, G],
    [5, 4, 1, 10, S], [7, 4, 1, 10, S], [9, 4, 1, 10, S], [11, 4, 1, 10, S],
    [4, 13, 8, 1, K], [6, 6, 4, 5, GR], [7, 7, 2, 3, S],
  ],
};

export function PixelIcon({ name, size = 40 }: { name: keyof typeof ICONS | string; size?: number }) {
  const px = ICONS[name] ?? ICONS.tests;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      {px.map(([x, y, w, h, f], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={f} />
      ))}
    </svg>
  );
}
