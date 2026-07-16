#!/usr/bin/env node
// Pull the receipts into public/ before every build: brand images, comparison
// videos, and each run's raw artifacts (for sandboxed iframe embeds). Mirrors
// what site/build.mjs copies into dist/.
import { cpSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BENCH = resolve(WEB, '..');
const PUB = join(WEB, 'public');

for (const f of ['favicon.png', 'apple-touch-icon.png', 'brand-hand.png', 'og.png'])
  if (existsSync(join(BENCH, 'site', f))) cpSync(join(BENCH, 'site', f), join(PUB, f));

// exhibits: static one-shot artifacts shown as-is (e.g. K3's site redesign) —
// same URLs as the classic site so published links keep working
if (existsSync(join(BENCH, 'site', 'exhibits')))
  cpSync(join(BENCH, 'site', 'exhibits'), join(PUB, 'exhibits'), { recursive: true });

const comparisons = join(BENCH, 'results', 'comparisons');
if (existsSync(comparisons)) {
  mkdirSync(join(PUB, 'videos'), { recursive: true });
  for (const f of readdirSync(comparisons).filter((f) => f.endsWith('.mp4')))
    cpSync(join(comparisons, f), join(PUB, 'videos', f));
}

rmSync(join(PUB, 'a'), { recursive: true, force: true });
const results = join(BENCH, 'results');
for (const slug of readdirSync(results)) {
  if (!existsSync(join(results, slug, 'meta.json'))) continue;
  for (const test of readdirSync(join(results, slug))) {
    const dir = join(results, slug, test);
    if (!statSync(dir).isDirectory()) continue;
    const out = join(dir, 'output');
    if (existsSync(out)) cpSync(out, join(PUB, 'a', slug, test, 'output'), { recursive: true });
    for (const f of readdirSync(dir))
      if (/\.(png|mp4|webm|mov)$/i.test(f)) cpSync(join(dir, f), join(PUB, 'a', slug, test, f));
  }
}
console.log('synced assets → web/public');
