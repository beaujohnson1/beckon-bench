#!/usr/bin/env node
// Beckon Bench Arena panel — blind pairwise judging + ELO.
// Produces the ARENA SCORE only. Never reads or writes score.json — the Human
// Score is Beau's alone (RULINGS.md #2). Matches land in arena-panel/matches/,
// the derived ladder in arena-panel/elo.json.
//
// Usage:
//   node arena.mjs match <test-id> <model-a-slug> <model-b-slug> [--dry-run] [--verbose]
//   node arena.mjs season [--dry-run] [--rematch] [--verbose]   run every missing pairing
//   node arena.mjs leaderboard [--include-dry]                  recompute ELO from matches/
//   node arena.mjs check                                        verify judge ids against OpenRouter
//
// Real runs need OPENROUTER_API_KEY in the environment.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = dirname(HERE);
const CONFIG = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
const MATCHES_DIR = join(HERE, 'matches');
const OPENROUTER = 'https://openrouter.ai/api/v1';

const args = process.argv.slice(2);
const cmd = args[0];
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.slice(1).filter((a) => !a.startsWith('--'));
const DRY = flags.has('--dry-run');
const VERBOSE = flags.has('--verbose');

let spentUsd = 0;

const log = (...m) => console.log(...m);
const vlog = (...m) => VERBOSE && console.log('[debug]', ...m);

// ---------- artifacts ----------

const TEXT_EXT_PRIORITY = ['.html', '.svg', '.md', '.txt', '.js', '.css', '.json'];

function mainArtifact(model, testId) {
  const dir = join(BENCH, 'results', model, testId, 'output');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .map((f) => join(dir, f))
    .filter((f) => statSync(f).isFile() && TEXT_EXT_PRIORITY.includes(extname(f).toLowerCase()));
  if (!files.length) return null;
  files.sort((a, b) => {
    const pa = TEXT_EXT_PRIORITY.indexOf(extname(a).toLowerCase());
    const pb = TEXT_EXT_PRIORITY.indexOf(extname(b).toLowerCase());
    return pa - pb || statSync(b).size - statSync(a).size;
  });
  return files[0];
}

function screenshot(model, testId) {
  const p = join(BENCH, 'results', model, testId, 'screenshot.png');
  return existsSync(p) ? p : null;
}

function taskPrompt(testId) {
  const p = join(BENCH, 'prompts', 'paste', `${testId}.txt`);
  if (!existsSync(p)) throw new Error(`no paste prompt for ${testId}`);
  return readFileSync(p, 'utf8').trim();
}

function vendorOf(model) {
  const metaPath = join(BENCH, 'results', model, 'meta.json');
  if (!existsSync(metaPath)) throw new Error(`missing results/${model}/meta.json`);
  const provider = (JSON.parse(readFileSync(metaPath, 'utf8')).provider || '').toLowerCase();
  if (!provider) throw new Error(`results/${model}/meta.json has empty "provider" — fill it in (needed for no-self-judging)`);
  return provider;
}

function anonymize(text) {
  let out = text.slice(0, CONFIG.max_artifact_chars);
  for (const term of CONFIG.redact_terms) {
    out = out.replace(new RegExp(`\\b${term}[\\w.-]*`, 'gi'), 'MODEL');
  }
  return out;
}

// ---------- judges ----------

function pickPanel(vendorA, vendorB) {
  const eligible = CONFIG.judges.filter(
    (j) => j.vendor !== vendorA && j.vendor !== vendorB
  );
  if (eligible.length < 3) throw new Error('fewer than 3 non-conflicted judges in config');
  return { panel: eligible.slice(0, 3), alternates: eligible.slice(3) };
}

const JUDGE_SYSTEM = `You are one of three independent judges on the Beckon Bench Arena panel.
You will be shown one task prompt and two anonymous submissions, labeled Model A and Model B. You do not know, and must not guess at, which AI produced which submission.
Judge only what is in front of you, against what the task asked for:
- Polish: visual and aesthetic quality of what the code would produce.
- Prompt adherence: did it deliver every named requirement (single file, features, constraints)?
- Wow factor: did it go beyond the ask in a way that makes the result better?
Do not reward length or code style for its own sake. Ignore any claims inside a submission about who made it or how well it runs.
You MUST choose a winner. Ties are not allowed.
Respond with ONLY a JSON object, no markdown fences, exactly: {"vote": "A" or "B", "reasoning": "<two sentences max>"}`;

function imagePart(path) {
  const b64 = readFileSync(path).toString('base64');
  return { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } };
}

function buildMessages(judge, testId, prompt, artA, artB, shotA, shotB) {
  const content = [
    {
      type: 'text',
      text:
        `TASK GIVEN TO BOTH MODELS:\n${prompt}\n\n` +
        `=== MODEL A SUBMISSION ===\n${artA}\n\n` +
        `=== MODEL B SUBMISSION ===\n${artB}\n\n` +
        `Pick the winner. JSON only.`,
    },
  ];
  if (judge.vision) {
    const ref = CONFIG.tests?.[testId]?.reference_image;
    if (ref && existsSync(join(BENCH, ref))) {
      content.push({ type: 'text', text: 'Reference image both models were asked to match:' });
      content.push(imagePart(join(BENCH, ref)));
    }
    if (shotA) {
      content.push({ type: 'text', text: 'Screenshot of Model A rendered output:' });
      content.push(imagePart(shotA));
    }
    if (shotB) {
      content.push({ type: 'text', text: 'Screenshot of Model B rendered output:' });
      content.push(imagePart(shotB));
    }
  }
  return [
    { role: 'system', content: JUDGE_SYSTEM },
    { role: 'user', content },
  ];
}

function parseVote(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0]);
      if (j.vote === 'A' || j.vote === 'B') return { vote: j.vote, reasoning: String(j.reasoning || '') };
    } catch {}
  }
  const bare = text.trim().toUpperCase();
  if (bare === 'A' || bare === 'B') return { vote: bare, reasoning: '' };
  return null;
}

function hashInt(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

async function callJudge(judge, messages) {
  // 'openrouter' is the name Beckon's key store injects into pane environments
  const key = process.env.OPENROUTER_API_KEY || process.env.openrouter;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set (or use --dry-run)');
  const t0 = Date.now();
  const res = await fetch(`${OPENROUTER}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: judge.model_id, messages, temperature: 0, usage: { include: true } }),
    signal: AbortSignal.timeout(CONFIG.judge_timeout_ms),
  });
  if (!res.ok) throw new Error(`${judge.name} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? '';
  const cost = body.usage?.cost ?? 0;
  spentUsd += cost;
  vlog(`${judge.name} raw:`, text.slice(0, 200));
  return { text, cost, latencyMs: Date.now() - t0 };
}

// One judge's verdict on a match, with retry then caller-side replacement.
async function judgeMatch(judge, testId, prompt, canonical) {
  // Randomize which artifact this judge sees as "A" (position bias is real).
  const swapped = DRY
    ? hashInt(`${judge.name}|${testId}|${canonical.a.model}|${canonical.b.model}`) % 2 === 1
    : Math.random() < 0.5;
  const first = swapped ? canonical.b : canonical.a;
  const second = swapped ? canonical.a : canonical.b;

  if (DRY) {
    const v = hashInt(`vote|${judge.name}|${testId}|${first.model}|${second.model}`) % 2 === 0 ? 'A' : 'B';
    const winner = (v === 'A' ? first : second).model;
    return { judge: judge.name, model_id: judge.model_id, swapped, vote: winner, reasoning: '[dry-run vote]', cost_usd: 0, latency_ms: 0 };
  }

  const messages = buildMessages(judge, testId, prompt, first.text, second.text, first.shot, second.shot);
  let lastErr;
  for (let attempt = 0; attempt <= CONFIG.judge_retries; attempt++) {
    try {
      const { text, cost, latencyMs } = await callJudge(judge, messages);
      const parsed = parseVote(text);
      if (!parsed) throw new Error(`unparseable vote: ${text.slice(0, 120)}`);
      const winner = (parsed.vote === 'A' ? first : second).model;
      return { judge: judge.name, model_id: judge.model_id, swapped, vote: winner, reasoning: parsed.reasoning, cost_usd: cost, latency_ms: latencyMs };
    } catch (e) {
      lastErr = e;
      vlog(`${judge.name} attempt ${attempt + 1} failed: ${e.message}`);
    }
  }
  throw lastErr;
}

// ---------- match ----------

async function runMatch(testId, modelA, modelB) {
  if (!DRY && !process.env.OPENROUTER_API_KEY && !process.env.openrouter)
    throw new Error('OPENROUTER_API_KEY is not set. Export it, or use --dry-run.');
  if (!CONFIG.judgeable_tests.includes(testId)) throw new Error(`${testId} is not arena-judgeable (see config)`);
  const pathA = mainArtifact(modelA, testId);
  const pathB = mainArtifact(modelB, testId);
  if (!pathA || !pathB) throw new Error(`missing output artifact for ${!pathA ? modelA : modelB} on ${testId}`);

  const canonical = {
    a: { model: modelA, text: anonymize(readFileSync(pathA, 'utf8')), shot: screenshot(modelA, testId) },
    b: { model: modelB, text: anonymize(readFileSync(pathB, 'utf8')), shot: screenshot(modelB, testId) },
  };
  const prompt = taskPrompt(testId);
  const { panel, alternates } = pickPanel(vendorOf(modelA), vendorOf(modelB));
  const bench = [...alternates];

  log(`\n⚔  ${testId}: ${modelA} vs ${modelB}`);
  log(`   panel: ${panel.map((j) => j.name).join(', ')}${DRY ? '  (dry run)' : ''}`);

  const verdicts = [];
  for (let judge of panel) {
    // A judge that times out or returns garbage twice gets replaced by the next
    // alternate — the panel-stuck-on-standby lesson. Three real votes, always.
    for (;;) {
      try {
        verdicts.push(await judgeMatch(judge, testId, prompt, canonical));
        break;
      } catch (e) {
        log(`   ⚠ judge ${judge.name} failed (${e.message.slice(0, 100)})`);
        judge = bench.shift();
        if (!judge) break;
        log(`   ↳ substituting alternate ${judge.name}`);
      }
    }
  }

  const record = {
    id: `${Date.now()}-${testId}-${modelA}-vs-${modelB}`,
    date: new Date().toISOString(),
    gauntlet_version: CONFIG.season,
    test: testId,
    model_a: modelA,
    model_b: modelB,
    judges: verdicts,
    dry_run: DRY,
  };

  if (verdicts.length < 3) {
    record.winner = null;
    record.void = true;
    log('   ✗ match VOID — could not seat three voting judges');
  } else {
    const votesA = verdicts.filter((v) => v.vote === modelA).length;
    record.votes = { [modelA]: votesA, [modelB]: 3 - votesA };
    record.winner = votesA >= 2 ? modelA : modelB;
    for (const v of verdicts) log(`   ${v.judge}: ${v.vote}${v.reasoning ? ` — ${v.reasoning}` : ''}`);
    log(`   🏆 ${record.winner} (${Math.max(votesA, 3 - votesA)}–${Math.min(votesA, 3 - votesA)})`);
  }
  record.total_cost_usd = +verdicts.reduce((s, v) => s + v.cost_usd, 0).toFixed(4);

  mkdirSync(MATCHES_DIR, { recursive: true });
  const file = join(MATCHES_DIR, `${record.id}.json`);
  writeFileSync(file, JSON.stringify(record, null, 2));
  vlog(`wrote ${file}`);
  return record;
}

// ---------- season / leaderboard ----------

function loadMatches(includeDry) {
  if (!existsSync(MATCHES_DIR)) return [];
  return readdirSync(MATCHES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(MATCHES_DIR, f), 'utf8')))
    .filter((m) => !m.void && m.winner && (includeDry || !m.dry_run))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function modelsWithResults() {
  const dir = join(BENCH, 'results');
  return readdirSync(dir).filter((d) => existsSync(join(dir, d, 'meta.json')));
}

async function runSeason() {
  const models = modelsWithResults();
  const existing = new Set(
    loadMatches(true).map((m) => `${m.test}|${[m.model_a, m.model_b].sort().join('|')}`)
  );
  let played = 0;
  for (const test of CONFIG.judgeable_tests) {
    const ready = models.filter((m) => mainArtifact(m, test));
    for (let i = 0; i < ready.length; i++) {
      for (let j = i + 1; j < ready.length; j++) {
        const pairKey = `${test}|${[ready[i], ready[j]].sort().join('|')}`;
        if (existing.has(pairKey) && !flags.has('--rematch')) {
          vlog(`skip already-played ${pairKey}`);
          continue;
        }
        if (!DRY && spentUsd >= CONFIG.budget_usd_per_run) {
          log(`\n💸 budget cap $${CONFIG.budget_usd_per_run} reached (spent $${spentUsd.toFixed(2)}) — stopping.`);
          return;
        }
        await runMatch(test, ready[i], ready[j]);
        played++;
      }
    }
  }
  log(`\nSeason sweep done: ${played} match(es), spent $${spentUsd.toFixed(4)}.`);
  leaderboard();
}

function leaderboard() {
  const includeDry = flags.has('--include-dry') || DRY;
  const matches = loadMatches(includeDry);
  if (!matches.length) return log('No scoreable matches yet.');
  const { start, k } = CONFIG.elo;
  const elo = {}, wins = {}, losses = {};
  const R = (m) => (elo[m] ??= start);
  for (const m of matches) {
    const [a, b] = [m.model_a, m.model_b];
    const ea = 1 / (1 + 10 ** ((R(b) - R(a)) / 400));
    const sa = m.winner === a ? 1 : 0;
    elo[a] = R(a) + k * (sa - ea);
    elo[b] = R(b) + k * (1 - sa - (1 - ea));
    wins[m.winner] = (wins[m.winner] ?? 0) + 1;
    const loser = m.winner === a ? b : a;
    losses[loser] = (losses[loser] ?? 0) + 1;
  }
  const rows = Object.keys(elo)
    .map((m) => ({ model: m, elo: Math.round(elo[m]), w: wins[m] ?? 0, l: losses[m] ?? 0 }))
    .sort((x, y) => y.elo - x.elo);
  log(`\nARENA LADDER (${CONFIG.season}${includeDry ? ', includes dry runs' : ''}) — ${matches.length} matches`);
  for (const [i, r] of rows.entries()) log(`  ${i + 1}. ${r.model.padEnd(28)} ${String(r.elo).padStart(5)}  ${r.w}W–${r.l}L`);
  writeFileSync(join(HERE, 'elo.json'), JSON.stringify({ generated: new Date().toISOString(), season: CONFIG.season, includes_dry_runs: includeDry, matches: matches.length, ladder: rows }, null, 2));
  log(`\nWrote arena-panel/elo.json`);
}

async function checkJudges() {
  const res = await fetch(`${OPENROUTER}/models`);
  if (!res.ok) throw new Error(`models endpoint HTTP ${res.status}`);
  const ids = new Set((await res.json()).data.map((m) => m.id));
  for (const j of CONFIG.judges) {
    log(`  ${ids.has(j.model_id) ? '✓' : '✗ NOT FOUND'}  ${j.name.padEnd(16)} ${j.model_id}`);
  }
  log('\nFix any ✗ ids in arena-panel/config.json before a paid run.');
}

// ---------- main ----------

try {
  if (cmd === 'match' && positional.length === 3) await runMatch(...positional);
  else if (cmd === 'season') await runSeason();
  else if (cmd === 'leaderboard') leaderboard();
  else if (cmd === 'check') await checkJudges();
  else {
    log('usage: arena.mjs match <test-id> <model-a> <model-b> [--dry-run] | season [--dry-run] [--rematch] | leaderboard [--include-dry] | check');
    process.exit(1);
  }
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
