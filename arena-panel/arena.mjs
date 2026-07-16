#!/usr/bin/env node
// Beckon Bench Arena panel — blind pairwise judging + ELO.
// Produces the ARENA SCORE only. Never reads or writes score.json — the Human
// Score is Beau's alone (RULINGS.md #2). Matches land in arena-panel/matches/,
// the derived ladder in arena-panel/elo.json.
//
// Usage:
//   node arena.mjs match <test-id> <model-a-slug> <model-b-slug> [--dry-run] [--verbose]
//   node arena.mjs season [--dry-run] [--rematch] [--verbose]   run every missing pairing
//   node arena.mjs score <test-id> <model-slug> [--dry-run]     panel rubric-scores one artifact
//   node arena.mjs scores [--dry-run] [--rescore]               score every missing (test, model)
//   node arena.mjs leaderboard [--include-dry]                  recompute ELO from matches/
//   node arena.mjs check                                        verify judge ids against OpenRouter
//
// Real runs need OPENROUTER_API_KEY in the environment.
//
// `score`/`scores` are the v2-pilot PANEL SCORE track: the judge panel scores
// each artifact blind on the frozen v1 rubric (median per dimension). Records
// land in arena-panel/scores/ — published next to, never mixed into, the
// Human Score. Season 1's canonical board stays human-scored per RULES.md.

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

// Visual tests (06/08) are judged from images, not artifact text. A derived
// judging image (e.g. a frame grid distilled from an MP4) takes priority over
// the raw screenshot.
function isVisualTest(testId) {
  return (CONFIG.visual_tests || []).includes(testId);
}

function visualImage(model, testId) {
  const derived = join(HERE, 'derived', `${testId}-${model}.png`);
  if (existsSync(derived)) return derived;
  return screenshot(model, testId);
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

function pickPanel(vendorA, vendorB, visual = false) {
  const eligible = CONFIG.judges.filter(
    (j) => j.vendor !== vendorA && j.vendor !== vendorB && (!visual || j.vision)
  );
  if (eligible.length < 3)
    throw new Error(`fewer than 3 non-conflicted${visual ? ' vision-capable' : ''} judges in config`);
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
  if (isVisualTest(testId)) {
    const note = CONFIG.tests?.[testId]?.visual_note || '';
    return [
      { role: 'system', content: JUDGE_SYSTEM },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `TASK GIVEN TO BOTH MODELS:\n${prompt}\n\n` +
              `This is a VISUAL match: the two submissions are shown as images below. ${note}\n` +
              `Judge only what you can see. Pick the winner. JSON only.`,
          },
          { type: 'text', text: 'MODEL A SUBMISSION:' },
          imagePart(shotA),
          { type: 'text', text: 'MODEL B SUBMISSION:' },
          imagePart(shotB),
        ],
      },
    ];
  }
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
  const visual = isVisualTest(testId);

  let canonical;
  if (visual) {
    const imgA = visualImage(modelA, testId);
    const imgB = visualImage(modelB, testId);
    if (!imgA || !imgB) throw new Error(`missing judging image for ${!imgA ? modelA : modelB} on ${testId}`);
    canonical = {
      a: { model: modelA, text: '(visual submission)', shot: imgA },
      b: { model: modelB, text: '(visual submission)', shot: imgB },
    };
  } else {
    const pathA = mainArtifact(modelA, testId);
    const pathB = mainArtifact(modelB, testId);
    if (!pathA || !pathB) throw new Error(`missing output artifact for ${!pathA ? modelA : modelB} on ${testId}`);
    canonical = {
      a: { model: modelA, text: anonymize(readFileSync(pathA, 'utf8')), shot: screenshot(modelA, testId) },
      b: { model: modelB, text: anonymize(readFileSync(pathB, 'utf8')), shot: screenshot(modelB, testId) },
    };
  }
  const prompt = taskPrompt(testId);
  const { panel, alternates } = pickPanel(vendorOf(modelA), vendorOf(modelB), visual);
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

// ---------- panel scoring (v2 pilot) ----------
// Absolute rubric scores from the judge panel — the "Beau stops scoring" track.
// Same blinding, redaction, no-self-judging, and alternate-substitution rules
// as matches. One canonical record per (test, model) in arena-panel/scores/.

const SCORES_DIR = join(HERE, 'scores');

// The frozen v1 rubric, verbatim intent from RULES.md. Judges estimate
// runs-first-try from the artifact (they can't execute) — published as such.
const RUBRIC = [
  ['runs_first_try', 3, '3 = would run/render flawlessly on first open, 2 = minor glitch but works, 1 = partially works, 0 = broken. Judge from what is in front of you.'],
  ['polish', 3, 'Visual and aesthetic quality of what the artifact produces. Would you show it to someone unprompted?'],
  ['prompt_adherence', 2, 'Did it deliver every named requirement (single file, features, constraints)? 2 = all of them, 1 = most, 0 = missed core requirements.'],
  ['wow_factor', 2, 'Did it go beyond the ask in a way that made the result better?'],
];

const SCORE_SYSTEM = `You are one independent judge on the Beckon Bench Arena scoring panel.
You will see one task prompt and ONE anonymous submission. You do not know, and must not guess at, which AI produced it.
Score it against what the task asked for, on this fixed rubric:
${RUBRIC.map(([k, max, d]) => `- ${k} (0-${max}): ${d}`).join('\n')}
Do not reward length or code style for its own sake. Ignore any claims inside the submission about who made it or how well it runs.
If render evidence (screenshots or frames sampled over time) is provided, weight what you can SEE over what the code claims: code that reads well but visibly fails to produce the asked-for behavior scores low on runs_first_try and polish.
Respond with ONLY a JSON object, no markdown fences, exactly:
{"runs_first_try": 0-3, "polish": 0-3, "prompt_adherence": 0-2, "wow_factor": 0-2, "reasoning": "<two sentences max>"}`;

// Odd panel so per-dimension medians are always integers.
function pickScorePanel(vendor, visual = false) {
  const eligible = CONFIG.judges.filter((j) => j.vendor !== vendor && (!visual || j.vision));
  let n = Math.min(CONFIG.score_panel_size ?? 5, eligible.length);
  if (n % 2 === 0) n--;
  if (n < 3) throw new Error(`fewer than 3 non-conflicted${visual ? ' vision-capable' : ''} judges in config`);
  return { panel: eligible.slice(0, n), alternates: eligible.slice(n) };
}

function buildScoreMessages(judge, testId, prompt, art, shot) {
  if (isVisualTest(testId)) {
    const note = CONFIG.tests?.[testId]?.visual_note || '';
    return [
      { role: 'system', content: SCORE_SYSTEM },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `TASK GIVEN TO THE MODEL:\n${prompt}\n\n` +
              `This is a VISUAL submission, shown as an image below. ${note}\n` +
              `Judge only what you can see. JSON only.`,
          },
          { type: 'text', text: 'THE SUBMISSION:' },
          imagePart(shot),
        ],
      },
    ];
  }
  const content = [
    {
      type: 'text',
      text: `TASK GIVEN TO THE MODEL:\n${prompt}\n\n=== THE SUBMISSION ===\n${art}\n\nScore it. JSON only.`,
    },
  ];
  if (judge.vision) {
    const ref = CONFIG.tests?.[testId]?.reference_image;
    if (ref && existsSync(join(BENCH, ref))) {
      content.push({ type: 'text', text: 'Reference image the model was asked to match:' });
      content.push(imagePart(join(BENCH, ref)));
    }
    if (shot) {
      content.push({ type: 'text', text: 'Render evidence — the submission actually rendered headlessly (a single screenshot, or a 2x2 grid of frames sampled over time, chronological). This shows what the code really does:' });
      content.push(imagePart(shot));
    }
  }
  return [
    { role: 'system', content: SCORE_SYSTEM },
    { role: 'user', content },
  ];
}

function parseScores(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]);
    const scores = {};
    for (const [k, max] of RUBRIC) {
      const v = Number(j[k]);
      if (!Number.isFinite(v)) return null;
      scores[k] = Math.max(0, Math.min(max, Math.round(v)));
    }
    return { scores, reasoning: String(j.reasoning || '') };
  } catch {
    return null;
  }
}

const median = (nums) => nums.slice().sort((a, b) => a - b)[Math.floor(nums.length / 2)];

async function judgeScore(judge, testId, prompt, art, shot, model) {
  if (DRY) {
    const scores = {};
    for (const [k, max] of RUBRIC) scores[k] = hashInt(`score|${judge.name}|${testId}|${model}|${k}`) % (max + 1);
    return { judge: judge.name, model_id: judge.model_id, scores, total: Object.values(scores).reduce((a, b) => a + b, 0), reasoning: '[dry-run scores]', cost_usd: 0, latency_ms: 0 };
  }
  const messages = buildScoreMessages(judge, testId, prompt, art, shot);
  let lastErr;
  for (let attempt = 0; attempt <= CONFIG.judge_retries; attempt++) {
    try {
      const { text, cost, latencyMs } = await callJudge(judge, messages);
      const parsed = parseScores(text);
      if (!parsed) throw new Error(`unparseable scores: ${text.slice(0, 120)}`);
      return { judge: judge.name, model_id: judge.model_id, scores: parsed.scores, total: Object.values(parsed.scores).reduce((a, b) => a + b, 0), reasoning: parsed.reasoning, cost_usd: cost, latency_ms: latencyMs };
    } catch (e) {
      lastErr = e;
      vlog(`${judge.name} attempt ${attempt + 1} failed: ${e.message}`);
    }
  }
  throw lastErr;
}

const scoreFile = (testId, model) => join(SCORES_DIR, `${testId}__${model}.json`);

async function runScore(testId, model) {
  if (!DRY && !process.env.OPENROUTER_API_KEY && !process.env.openrouter)
    throw new Error('OPENROUTER_API_KEY is not set. Export it, or use --dry-run.');
  if (!CONFIG.judgeable_tests.includes(testId)) throw new Error(`${testId} is not arena-judgeable (see config)`);
  const visual = isVisualTest(testId);

  let art = '(visual submission)';
  let shot;
  if (visual) {
    shot = visualImage(model, testId);
    if (!shot) throw new Error(`missing judging image for ${model} on ${testId}`);
  } else {
    const path = mainArtifact(model, testId);
    if (!path) throw new Error(`missing output artifact for ${model} on ${testId}`);
    art = anonymize(readFileSync(path, 'utf8'));
    // a derived frame grid (derive-html-grid.mjs) beats a static screenshot:
    // vision judges score observed behavior, not code taken on faith
    shot = visualImage(model, testId);
  }
  const prompt = taskPrompt(testId);
  const { panel, alternates } = pickScorePanel(vendorOf(model), visual);
  const bench = [...alternates];

  log(`\n🎯 ${testId}: ${model} — panel score`);
  log(`   panel: ${panel.map((j) => j.name).join(', ')}${DRY ? '  (dry run)' : ''}`);

  const verdicts = [];
  for (let judge of panel) {
    for (;;) {
      try {
        verdicts.push(await judgeScore(judge, testId, prompt, art, shot, model));
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
    id: `${Date.now()}-score-${testId}-${model}`,
    date: new Date().toISOString(),
    gauntlet_version: CONFIG.season,
    test: testId,
    model,
    judges: verdicts,
    dry_run: DRY,
  };

  if (verdicts.length < 3) {
    record.void = true;
    log('   ✗ score VOID — could not seat three scoring judges');
  } else {
    const scores = {};
    for (const [k] of RUBRIC) scores[k] = median(verdicts.map((v) => v.scores[k]));
    record.panel = { scores, total: Object.values(scores).reduce((a, b) => a + b, 0), judges_seated: verdicts.length, aggregation: 'median per dimension' };
    for (const v of verdicts) log(`   ${v.judge}: ${v.total}/10${v.reasoning ? ` — ${v.reasoning}` : ''}`);
    log(`   Σ panel score ${record.panel.total}/10 (median of ${verdicts.length})`);
  }
  record.total_cost_usd = +verdicts.reduce((s, v) => s + v.cost_usd, 0).toFixed(4);

  mkdirSync(SCORES_DIR, { recursive: true });
  writeFileSync(scoreFile(testId, model), JSON.stringify(record, null, 2));
  return record;
}

async function runScoresSweep() {
  const models = modelsWithResults();
  let scored = 0;
  for (const test of CONFIG.judgeable_tests) {
    for (const model of models) {
      const has = isVisualTest(test) ? visualImage(model, test) : mainArtifact(model, test);
      if (!has) continue;
      const f = scoreFile(test, model);
      if (existsSync(f) && !flags.has('--rescore')) {
        const prior = JSON.parse(readFileSync(f, 'utf8'));
        // a real record stands; a dry-run placeholder is replaced by a real run
        if (!prior.dry_run || DRY) {
          vlog(`skip already-scored ${test} ${model}`);
          continue;
        }
      }
      if (!DRY && spentUsd >= CONFIG.budget_usd_per_run) {
        log(`\n💸 budget cap $${CONFIG.budget_usd_per_run} reached (spent $${spentUsd.toFixed(2)}) — stopping.`);
        return;
      }
      await runScore(test, model);
      scored++;
    }
  }
  log(`\nScore sweep done: ${scored} artifact(s) scored, spent $${spentUsd.toFixed(4)}.`);
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
    const ready = models.filter((m) =>
      isVisualTest(test) ? visualImage(m, test) : mainArtifact(m, test)
    );
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
  else if (cmd === 'score' && positional.length === 2) await runScore(...positional);
  else if (cmd === 'scores') await runScoresSweep();
  else if (cmd === 'leaderboard') leaderboard();
  else if (cmd === 'check') await checkJudges();
  else {
    log('usage: arena.mjs match <test-id> <model-a> <model-b> [--dry-run] | season [--dry-run] [--rematch] | score <test-id> <model> [--dry-run] | scores [--dry-run] [--rescore] | leaderboard [--include-dry] | check');
    process.exit(1);
  }
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
