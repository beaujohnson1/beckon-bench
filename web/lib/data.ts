// Build-time data layer — a faithful port of site/build.mjs collectors.
// Reads the SAME filesystem receipts (results/, arena-panel/, prompts/) so
// this rebuild can never drift from what the canonical generator publishes.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const BENCH = resolve(process.cwd(), '..');

const readJSON = (p: string) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

// ---------- tests ----------

export type Test = { id: string; num: string; title: string; measures: string; prompt: string };

export const tests: Test[] = readdirSync(join(BENCH, 'prompts'))
  .filter((f) => /^\d\d-.*\.md$/.test(f))
  .sort()
  .map((f) => {
    const md = readFileSync(join(BENCH, 'prompts', f), 'utf8');
    const id = f.replace('.md', '');
    const title = (md.match(/^# (.+)$/m)?.[1] ?? id).replace(/^Test \d+ — /, '');
    const measures = md.match(/\*\*Measures:\*\* (.+)$/m)?.[1] ?? '';
    const prompt = md.match(/```\n([\s\S]*?)```/)?.[1]?.trim() ?? '';
    return { id, num: id.slice(0, 2), title, measures, prompt };
  });

// Landing-page framing (Beau, 2026-07-16): tests read as capabilities.
const CAPABILITY: Record<string, string> = {
  '01': 'Create a game', '02': 'Create an animation', '03': 'Design a landing page',
  '04': 'Draw a self-portrait', '05': 'Recreate a UI', '06': 'Produce a promo video',
  '07': 'Fix seeded bugs', '08': 'Build a 3D scene',
};
export const capTitle = (t: Test) => CAPABILITY[t.num] || t.title;

// Category layer — presentation only; v1 scoring and RULES.md stay frozen.
const CATEGORY_DEFS: [string, string[]][] = [
  ['Game dev', ['01']],
  ['Creative coding', ['02', '04']],
  ['UI & design', ['03', '05']],
  ['Agentic', ['06', '08']],
  ['Debugging', ['07']],
];
export const CATS = CATEGORY_DEFS.map(([name, nums]) => ({ name, tests: tests.filter((t) => nums.includes(t.num)) }));
{
  const stray = tests.filter((t) => !CATS.some((c) => c.tests.includes(t)));
  if (stray.length) CATS.push({ name: 'More', tests: stray });
}
export const orderedTests = CATS.flatMap((c) => c.tests);
export const groupStarts = new Set(CATS.map((c) => c.tests[0]?.id));
export const catName = (t: Test) => CATS.find((c) => c.tests.includes(t))?.name ?? '';

// ---------- models ----------

export type Run = { score: any; outputs: string[]; media: string[] };
export type Model = {
  slug: string; meta: any; runs: Record<string, Run>;
  total: number; testsScored: number; secs: number; toks: number; cost: number; hasCost: boolean;
};

export const models: Model[] = readdirSync(join(BENCH, 'results'))
  .filter((d) => existsSync(join(BENCH, 'results', d, 'meta.json')))
  .map((slug) => {
    const meta = readJSON(join(BENCH, 'results', slug, 'meta.json'));
    const runs: Record<string, Run> = {};
    for (const t of tests) {
      const dir = join(BENCH, 'results', slug, t.id);
      if (!existsSync(dir)) continue;
      const outDir = join(dir, 'output');
      const outputs = existsSync(outDir) ? readdirSync(outDir).filter((f) => statSync(join(outDir, f)).isFile()) : [];
      const media = readdirSync(dir).filter((f) => /\.(png|mp4|webm|mov)$/i.test(f));
      const score = readJSON(join(dir, 'score.json'));
      if (!score && !outputs.length && !media.length) continue;
      runs[t.id] = { score, outputs, media };
    }
    const scored = Object.values(runs).filter((r) => r.score);
    return {
      slug, meta, runs,
      total: scored.reduce((s, r) => s + (r.score.total ?? 0), 0),
      testsScored: scored.length,
      secs: scored.reduce((s, r) => s + (r.score.stats?.time_seconds ?? 0), 0),
      toks: scored.reduce((s, r) => s + (r.score.stats?.output_tokens ?? 0), 0),
      cost: scored.reduce((s, r) => s + (r.score.stats?.cost_usd ?? 0), 0),
      hasCost: scored.some((r) => r.score.stats?.cost_usd != null),
    };
  })
  .sort((a, b) => b.total - a.total || a.cost - b.cost);

export const scoredModels = models.filter((m) => m.testsScored > 0);
export const benchModels = models.filter((m) => m.testsScored === 0);

export const shortName = (m: Model) => {
  const id = m.meta.model_id || m.slug;
  const paren = id.match(/\(([^)]+)\)/)?.[1] ?? '';
  const base = id.replace(/\s*\([^)]*\)/, '');
  return paren && paren.length <= 14 && !paren.includes(',') ? `${base} ${paren}` : base;
};
export const nameOfSlug = (slug: string) => {
  const m = models.find((x) => x.slug === slug);
  return m ? shortName(m) : slug;
};

export const catScore = (m: Model, c: { tests: Test[] }) =>
  c.tests.reduce((s, t) => s + (m.runs[t.id]?.score?.total ?? 0), 0);
export const catScored = (m: Model, c: { tests: Test[] }) =>
  c.tests.filter((t) => m.runs[t.id]?.score).length;

// ---------- comparison videos (multi-matchup: <test>--<a>-vs-<b>.mp4) ----------

const comparisonsDir = join(BENCH, 'results', 'comparisons');
export const comparisons: string[] = existsSync(comparisonsDir)
  ? readdirSync(comparisonsDir).filter((f) => f.endsWith('.mp4'))
  : [];
export const pairOf = (f: string): [string, string] | null => {
  const seg = f.replace(/\.mp4$/, '').split('--')[1];
  const pair = seg ? seg.split('-vs-') : null;
  return pair && pair.length === 2 ? [pair[0], pair[1]] : null;
};
export const comparisonForPair = (testId: string, a: string, b: string) =>
  comparisons.find((f) => f.startsWith(testId) && f.includes(a) && f.includes(b));
export const vurl = (f: string) =>
  `/videos/${f}?v=${Math.round(statSync(join(comparisonsDir, f)).mtimeMs)}`;

// ---------- arena: panel scores, elo, matches ----------

const panelScoresDir = join(BENCH, 'arena-panel', 'scores');
export const panelRecords: any[] = existsSync(panelScoresDir)
  ? readdirSync(panelScoresDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJSON(join(panelScoresDir, f)))
      .filter((r) => r && !r.dry_run && !r.void && r.panel)
  : [];
export const panelFor = (slug: string, testId: string) =>
  panelRecords.find((r) => r.model === slug && r.test === testId);

export const elo = readJSON(join(BENCH, 'arena-panel', 'elo.json'));

const matchesDir = join(BENCH, 'arena-panel', 'matches');
export const matches: any[] = existsSync(matchesDir)
  ? readdirSync(matchesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJSON(join(matchesDir, f)))
      .filter((m) => m && !m.dry_run && !m.void && m.winner)
      .sort((a, b) => b.date.localeCompare(a.date))
  : [];

// ---------- formatting ----------

export const fmtTokens = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : String(v));
export const fmtMins = (v: number) => `${Math.round(v / 60)}m`;
export const fmtTime = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;
