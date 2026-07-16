#!/usr/bin/env node
// Derive a judging image for an HTML artifact: load it once in a real headless
// browser and screenshot the SAME session at several elapsed times, tiled
// chronologically into a 2x2 grid. Gives the Arena's vision judges observed
// behavior instead of code to take on faith — and because all frames come from
// one continuous run, a sim that never moves shows four identical frames
// (separate page loads would re-roll randomized layouts and fake "motion").
// Output lands in arena-panel/derived/<test-id>-<model>.png, the same slot the
// 06/08 grids use, so arena.mjs picks it up automatically.
//
//   node derive-html-grid.mjs <test-id> <model-slug> [--times 2,10,25,45]
//
// Uses playwright-core from tools/render-comparison (Chrome channel) + ffmpeg.

import { readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = dirname(HERE);
const { chromium } = createRequire(join(BENCH, 'tools', 'render-comparison', 'package.json'))('playwright-core');

const args = process.argv.slice(2);
const [testId, model] = args.filter((a) => !a.startsWith('--'));
const timesArg = args.find((a) => a.startsWith('--times'));
const times = (timesArg ? timesArg.split('=')[1] ?? args[args.indexOf(timesArg) + 1] : '2,10,25,45')
  .split(',')
  .map(Number);

if (!testId || !model || times.length !== 4 || times.some((t) => !Number.isFinite(t))) {
  console.error('usage: derive-html-grid.mjs <test-id> <model-slug> [--times 2,10,25,45]  (exactly 4 times)');
  process.exit(1);
}

const outDir = join(BENCH, 'results', model, testId, 'output');
const html = existsSync(outDir)
  ? readdirSync(outDir)
      .filter((f) => extname(f).toLowerCase() === '.html')
      .map((f) => join(outDir, f))
      .sort((a, b) => statSync(b).size - statSync(a).size)[0]
  : null;
if (!html) {
  console.error(`no HTML artifact for ${model} on ${testId}`);
  process.exit(1);
}

const work = join(tmpdir(), `bench-grid-${process.pid}`);
mkdirSync(work, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
await page.goto('file://' + html);

const frames = [];
let elapsed = 0;
for (const t of times) {
  await page.waitForTimeout(Math.max(0, (t - elapsed) * 1000));
  elapsed = t;
  const frame = join(work, `t${t}.png`);
  await page.screenshot({ path: frame });
  frames.push(frame);
  console.log(`  frame @ ${t}s`);
}
await browser.close();

mkdirSync(join(HERE, 'derived'), { recursive: true });
const out = join(HERE, 'derived', `${testId}-${model}.png`);
execFileSync('ffmpeg', [
  '-y',
  ...frames.flatMap((f) => ['-i', f]),
  '-filter_complex', '[0][1]hstack[top];[2][3]hstack[bot];[top][bot]vstack',
  out,
], { stdio: 'pipe' });
rmSync(work, { recursive: true, force: true });
console.log(`wrote ${out} (one session, frames at ${times.join('s, ')}s)`);
