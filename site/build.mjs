#!/usr/bin/env node
// Beckon Bench site generator. Static output only: reads results/ + arena-panel/
// + prompts/, writes site/dist/. The filesystem is the source of truth.
//
//   node site/build.mjs
//
// Tolerates missing data (no scores yet, no matches, no youtube_url): renders
// what exists. Chart hues validated (dataviz six checks) on the cream surface:
// gold #a8842f, blue #3b6cc0, green #2e8b57. Every bar is direct-labeled and
// every chart has a table nearby, so color is never the only channel.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, cpSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH = dirname(HERE);
const DIST = join(HERE, 'dist');

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const readJSON = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);

// ---------- collect data ----------

const tests = readdirSync(join(BENCH, 'prompts'))
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

const models = readdirSync(join(BENCH, 'results'))
  .filter((d) => existsSync(join(BENCH, 'results', d, 'meta.json')))
  .map((slug) => {
    const meta = readJSON(join(BENCH, 'results', slug, 'meta.json'));
    const runs = {};
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
      slug,
      meta,
      runs,
      total: scored.reduce((s, r) => s + (r.score.total ?? 0), 0),
      testsScored: scored.length,
      secs: scored.reduce((s, r) => s + (r.score.stats?.time_seconds ?? 0), 0),
      toks: scored.reduce((s, r) => s + (r.score.stats?.output_tokens ?? 0), 0),
      cost: scored.reduce((s, r) => s + (r.score.stats?.cost_usd ?? 0), 0),
      hasCost: scored.some((r) => r.score.stats?.cost_usd != null),
    };
  })
  .sort((a, b) => b.total - a.total || a.cost - b.cost); // cheaper wins ties, per RULES.md

const shortName = (m) => (m.meta.model_id || m.slug).replace(/\s*\(([^)]+)\)/, ' $1');

const comparisonsDir = join(BENCH, 'results', 'comparisons');
const comparisons = existsSync(comparisonsDir) ? readdirSync(comparisonsDir).filter((f) => f.endsWith('.mp4')) : [];
const comparisonFor = (testId) => comparisons.find((f) => f.startsWith(testId));
// mtime query param so browsers refetch re-rendered videos instead of serving stale cache
const vurl = (f, root = '') => `${root}videos/${esc(f)}?v=${Math.round(statSync(join(comparisonsDir, f)).mtimeMs)}`;

const elo = readJSON(join(BENCH, 'arena-panel', 'elo.json'));
const matchesDir = join(BENCH, 'arena-panel', 'matches');
const matches = existsSync(matchesDir)
  ? readdirSync(matchesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJSON(join(matchesDir, f)))
      .filter((m) => !m.dry_run && !m.void && m.winner)
      .sort((a, b) => b.date.localeCompare(a.date))
  : [];

// ---------- shared shell ----------

const NAV = [
  ['index.html', 'Leaderboard'],
  ['matches.html', 'Arena'],
  ['tests.html', 'Tests'],
];

// Deploy domain: beckonbench.com (Namecheap, live via Vercel). og:image must be an
// absolute URL; the card image itself lives at site/og.png and is copied to dist.
const SITE_URL = 'https://www.beckonbench.com';
const DESCRIPTION = "The vibe coder's benchmark. Eight one-shot tests, identical conditions. Every prompt, artifact, and score public.";

function page({ title, body, depth = 0, active }) {
  const root = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Beckon Bench</title>
<meta name="description" content="${DESCRIPTION}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Beckon Bench">
<meta property="og:title" content="${esc(title)} · Beckon Bench">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} · Beckon Bench">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${SITE_URL}/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Poppins:wght@500;600&display=swap">
<link rel="stylesheet" href="${root}style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏟️</text></svg>">
</head>
<body>
<header>
  <a class="brand" href="${root}index.html">Beckon<span>Bench</span></a>
  <nav>${NAV.map(([href, label]) => `<a href="${root}${href}"${label === active ? ' class="on"' : ''}>${label}</a>`).join('')}<a class="cta" href="https://heybeckon.ai">Try Beckon</a></nav>
</header>
<main>
${body}
</main>
<script>
(() => {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
</script>
<footer>
  <p>Gauntlet v1, frozen 2026-07-10. Human scores by Beau, on camera. Arena scores by a cross-vendor AI judge panel. <a href="${root}tests.html">The protocol</a> is public.</p>
  <p>Every run happens inside <a href="https://heybeckon.ai">Beckon</a>. Say the word. Your agents build.</p>
</footer>
</body>
</html>`;
}

// ---------- charts (validated hues, direct labels, table nearby) ----------

const HUES = { gold: '#22f284', blue: '#59b0ff', green: '#ffcc66' };

function columnChart({ items, hue, plotHeight = 150, fmt = (v) => String(v) }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const cols = items
    .map((it) => {
      const h = Math.max(4, Math.round((it.value / max) * plotHeight));
      return `<a class="col" href="${it.href}">
  <span class="val">${esc(fmt(it.value))}</span>
  <span class="bar" style="height:${h}px;background:${hue}"></span>
  <span class="name">${esc(it.name)}</span>
</a>`;
    })
    .join('\n');
  return `<div class="chart" style="--plot-h:${plotHeight}px">\n${cols}\n</div>`;
}

const fmtTokens = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : String(v));
const fmtMins = (v) => `${Math.round(v / 60)}m`;

// ---------- index ----------

function highlightCard({ label, sub, hue, items, fmt }) {
  return `<article class="hcard reveal">
<p class="hlabel"><span class="swatch" style="background:${hue}"></span>${esc(label)}</p>
<p class="hsub">${esc(sub)}</p>
${columnChart({ items, hue, plotHeight: 110, fmt })}
</article>`;
}

const scoredModels = models.filter((m) => m.testsScored > 0);

const highlights = scoredModels.length
  ? `<section class="hgrid">
${highlightCard({
      label: 'Human Score',
      sub: 'Points this season. Higher is better.',
      hue: HUES.gold,
      items: scoredModels.map((m) => ({ name: shortName(m), value: m.total, href: `model/${m.slug}.html` })),
      fmt: String,
    })}
${highlightCard({
      label: 'Token efficiency',
      sub: 'Output tokens per point. Lower is better.',
      hue: HUES.blue,
      items: scoredModels.filter((m) => m.toks && m.total).map((m) => ({ name: shortName(m), value: Math.round(m.toks / m.total), href: `model/${m.slug}.html` })),
      fmt: fmtTokens,
    })}
${highlightCard({
      label: 'Time on the bench',
      sub: 'Wall clock across scored tests. Lower is better.',
      hue: HUES.green,
      items: scoredModels.filter((m) => m.secs).map((m) => ({ name: shortName(m), value: m.secs, href: `model/${m.slug}.html` })),
      fmt: fmtMins,
    })}
</section>`
  : '';

function scoreChip(model, t) {
  const run = model.runs[t.id];
  if (!run) return '<td class="dim">·</td>';
  if (!run.score) return `<td><a class="dim" href="test/${t.id}.html" title="run captured, scoring pending">◌</a></td>`;
  return `<td><a class="chiplink" href="test/${t.id}.html"><span class="chip s${Math.min(10, run.score.total)}">${run.score.total}</span></a></td>`;
}

const leaderboardTable = `<div class="scroll"><table class="board">
<thead><tr><th></th><th>Model</th>${tests.map((t) => `<th title="${esc(t.title)}">${t.num}</th>`).join('')}<th>Total</th></tr></thead>
<tbody>${models
  .map(
    (m, i) => `<tr>
  <td class="rank">${i + 1}</td>
  <td><a class="model" href="model/${esc(m.slug)}.html">${esc(m.meta.model_id || m.slug)}</a><div class="sub">${esc(m.meta.provider || '')}</div></td>
  ${tests.map((t) => scoreChip(m, t)).join('\n  ')}
  <td class="total">${m.total}<span class="dim">/${m.testsScored * 10}</span></td>
</tr>`
  )
  .join('\n')}</tbody>
</table></div>`;

const versus = tests
  .filter((t) => comparisonFor(t.id))
  .map((t) => {
    const scored = models
      .filter((m) => m.runs[t.id]?.score)
      .sort((a, b) => b.runs[t.id].score.total - a.runs[t.id].score.total);
    const chips = scored
      .map((m) => `${esc(shortName(m))} <span class="chip s${Math.min(10, m.runs[t.id].score.total)}">${m.runs[t.id].score.total}</span>`)
      .join(' <span class="dim">vs</span> ');
    // Arena verdict line: winner + tally on every judged card; when the panel
    // disagrees with a decisive human score, that's the story — add a pull-quote.
    const match = matches.find((x) => x.test === t.id);
    let verdict = '';
    if (match) {
      const tally = match.judges.filter((j) => j.vote === match.winner).length;
      const winModel = models.find((m) => m.slug === match.winner);
      const humanDecisive =
        scored.length === 2 && scored[0].runs[t.id].score.total !== scored[1].runs[t.id].score.total;
      const split = humanDecisive && scored[0].slug !== match.winner;
      const quoteSrc = split ? match.judges.find((j) => j.vote === match.winner && j.reasoning) : null;
      // judges saw randomized "Model A/B" labels — meaningless to visitors
      const dealias = (s) => s.replace(/\bModel [AB]\b/g, 'it').replace(/^it\b/, 'It');
      const quote = quoteSrc
        ? `<p class="pullquote">&ldquo;${esc(dealias(quoteSrc.reasoning.split(/(?<=[.!?])\s/)[0]))}&rdquo; <span class="dim">— ${esc(quoteSrc.judge)}</span></p>`
        : '';
      verdict = `<p class="versus-line verdict${split ? ' split' : ''}"><span class="tag alt">AI panel</span> ${esc(winModel ? shortName(winModel) : match.winner)} <b>${tally}&ndash;${match.judges.length - tally}</b>${split ? ' <span class="dim">— the panel overturned the human verdict</span>' : ''}<a class="more" href="matches.html">Votes</a></p>${quote}`;
    }
    return `<article class="card reveal versus">
<h3>${t.num} · ${esc(t.title)}</h3>
<video class="artifact" controls muted loop playsinline preload="metadata" src="${vurl(comparisonFor(t.id))}"></video>
<p class="versus-line">${chips}<a class="more" href="test/${t.id}.html">Full result</a></p>
${verdict}
</article>`;
  })
  .join('\n');

const arenaLadder = elo?.ladder?.length
  ? `<table class="ladder">
<thead><tr><th></th><th>Model</th><th>ELO</th><th>Record</th></tr></thead>
<tbody>${elo.ladder
      .map(
        (r, i) =>
          `<tr><td class="rank">${i + 1}</td><td><a class="model" href="model/${esc(r.model)}.html">${esc(r.model)}</a></td><td class="elo">${r.elo}</td><td>${r.w}W&ndash;${r.l}L</td></tr>`
      )
      .join('')}</tbody>
</table>
<p class="dim">${elo.matches} matches. Every vote is public on the <a href="matches.html">Arena page</a>.</p>`
  : `<p class="empty">Three cross-vendor AI judges compare artifacts blind and vote. Winners climb an ELO ladder. First matches land after this season's filmed runs. <a href="matches.html">How it works</a></p>`;

const indexBody = `
<section class="hero">
  <div class="term">
    <div class="term-bar"><span class="term-dot"></span><span class="term-dot"></span><span class="term-dot"></span><span class="term-title">beckon-bench — season 1 — gauntlet v1</span></div>
    <div class="term-body">
      <div class="season">beckon run gauntlet --season 1 --tests 8</div>
      <h1>The vibe coder's benchmark<span class="cursor"></span></h1>
      <p>Eight one-shot tests, identical conditions. Every prompt, artifact, and score public.</p>
      <a class="powered" href="https://heybeckon.ai">Runs live inside <b>Beckon</b></a>
    </div>
  </div>
</section>

${highlights}

<section class="reveal">
  <h2>Leaderboard <span class="tag">human, canonical</span></h2>
  <p class="dim">Scored on camera: runs first try, polish, prompt adherence, wow factor. Ten points per test. Ties go to the cheaper run.</p>
  ${scoredModels.length ? columnChart({
    items: scoredModels.map((m) => ({ name: shortName(m), value: m.total, href: `model/${m.slug}.html` })),
    hue: HUES.gold,
    plotHeight: 190,
  }) : ''}
  ${leaderboardTable}
  <p class="dim">◌ run captured, scoring pending. Chips open the full test result.</p>
</section>

${versus ? `<section class="reveal">
  <h2>Head-to-heads <span class="tag">watch the runs</span></h2>
  <p class="dim">Same prompt, same clock, side by side.</p>
  <div class="versus-grid">
${versus}
  </div>
</section>` : ''}

<section class="reveal">
  <h2>Efficiency <span class="tag alt">recorded, never scored</span></h2>
  <div class="scroll"><table class="board">
  <thead><tr><th>Model</th><th>Points</th><th>Time</th><th>Output tokens</th><th>Tokens / point</th><th>Cost</th></tr></thead>
  <tbody>${models
    .map(
      (m) => `<tr>
  <td><a class="model" href="model/${esc(m.slug)}.html">${esc(m.meta.model_id || m.slug)}</a></td>
  <td class="total">${m.total}</td>
  <td>${m.secs ? `${Math.floor(m.secs / 60)}m ${m.secs % 60}s` : '·'}</td>
  <td>${m.toks ? fmtTokens(m.toks) : '·'}</td>
  <td>${m.toks && m.total ? fmtTokens(Math.round(m.toks / m.total)) : '·'}</td>
  <td>${m.hasCost ? `$${m.cost.toFixed(2)}` : '·'}</td>
</tr>`
    )
    .join('\n')}</tbody>
  </table></div>
</section>

<section class="reveal">
  <h2>Arena <span class="tag alt">AI judge panel</span></h2>
  ${arenaLadder}
</section>`;

// ---------- per-test result pages ----------

function testPage(t) {
  const video = comparisonFor(t.id);
  const runs = models.filter((m) => m.runs[t.id]);
  const cards = runs
    .sort((a, b) => (b.runs[t.id].score?.total ?? -1) - (a.runs[t.id].score?.total ?? -1))
    .map((m) => {
      const run = m.runs[t.id];
      const s = run.score;
      return `<article class="card reveal">
<h3><a class="model" href="../model/${esc(m.slug)}.html">${esc(m.meta.model_id || m.slug)}</a> ${s ? `<span class="chip s${Math.min(10, s.total)}">${s.total}/10</span>` : '<span class="chip pending">pending</span>'}</h3>
${artifactEmbed(m, t, run, '../')}
<div class="cols">
${scoreTable(s)}
${s ? `<div><p class="notes">${esc(s.notes || '')}</p><p class="dim">${s.stats?.time_seconds ? `${Math.round(s.stats.time_seconds / 60)}m. ` : ''}${s.stats?.output_tokens ? `${fmtTokens(s.stats.output_tokens)} output tokens.` : ''}</p></div>` : ''}
</div>
</article>`;
    })
    .join('\n');

  return page({
    title: `${t.num} ${t.title}`,
    active: 'Leaderboard',
    depth: 1,
    body: `
<section class="hero small">
  <div class="season">TEST ${t.num} · GAUNTLET v1</div>
  <h1>${esc(t.title)}</h1>
  <p>Measures ${esc(t.measures.toLowerCase())}.</p>
</section>
${video ? `<video class="artifact reveal" controls muted loop playsinline preload="metadata" src="${vurl(video, '../')}"></video>` : ''}
<section class="reveal">
  <h2>The prompt, verbatim</h2>
  ${t.prompt ? `<pre>${esc(t.prompt)}</pre>` : '<p class="dim">Agentic test. Harness rules are in the repo.</p>'}
</section>
${cards || '<p class="empty">No runs captured yet.</p>'}`,
  });
}

// ---------- model report cards ----------

function artifactEmbed(m, t, run, root) {
  const aDir = `${root}a/${m.slug}/${t.id}`;
  const html = run.outputs.find((f) => f.endsWith('.html'));
  const svg = run.outputs.find((f) => f.endsWith('.svg'));
  const video = run.media.find((f) => /\.(mp4|webm|mov)$/i.test(f));
  const shot = run.media.find((f) => f.endsWith('.png'));
  if (html)
    return `<iframe class="artifact" sandbox="allow-scripts" loading="lazy" src="${aDir}/output/${esc(html)}" title="${esc(t.title)}"></iframe>
<p class="dim">Live artifact. Exactly what the model produced, sandboxed, no network.</p>`;
  if (svg) return `<img class="artifact" loading="lazy" src="${aDir}/output/${esc(svg)}" alt="${esc(t.title)} SVG artifact">`;
  if (video) return `<video class="artifact" controls preload="none" src="${aDir}/${esc(video)}"></video>`;
  if (shot) return `<img class="artifact" loading="lazy" src="${aDir}/${esc(shot)}" alt="${esc(t.title)} screenshot">`;
  return '';
}

function scoreTable(score) {
  if (!score) return `<p class="empty">Run captured. Not scored yet.</p>`;
  if (score.scores && Object.keys(score.scores).length) {
    const rows = Object.entries(score.scores)
      .map(([k, v]) => `<tr><td>${esc(k.replace(/_/g, ' '))}</td><td>${v}</td></tr>`)
      .join('');
    return `<table class="rubric">${rows}<tr class="sum"><td>total</td><td>${score.total}</td></tr></table>`;
  }
  return `<table class="rubric"><tr class="sum"><td>total</td><td>${score.total}</td></tr></table>`;
}

function modelPage(m) {
  const cards = tests
    .filter((t) => m.runs[t.id])
    .map((t) => {
      const run = m.runs[t.id];
      const s = run.score;
      return `<article class="card reveal">
<h3><a class="model" href="../test/${t.id}.html">${t.num} · ${esc(t.title)}</a> ${s ? `<span class="chip s${Math.min(10, s.total)}">${s.total}/10</span>` : '<span class="chip pending">pending</span>'}</h3>
${artifactEmbed(m, t, run, '../')}
<div class="cols">
${scoreTable(s)}
${s ? `<div><p class="notes">${esc(s.notes || '')}</p><p class="dim">${s.stats?.time_seconds ? `${Math.round(s.stats.time_seconds / 60)}m. ` : ''}${s.stats?.output_tokens ? `${fmtTokens(s.stats.output_tokens)} output tokens.` : ''}</p></div>` : ''}
</div>
</article>`;
    })
    .join('\n');

  const yt = m.meta.youtube_url
    ? `<p><a class="btn" href="${esc(m.meta.youtube_url)}">Watch the gauntlet run</a></p>`
    : '';

  return page({
    title: m.meta.model_id || m.slug,
    active: 'Leaderboard',
    depth: 1,
    body: `
<section class="hero small">
  <div class="season">${esc(m.meta.gauntlet_version || 'v1')} · ${esc(m.meta.run_date || '')}</div>
  <h1>${esc(m.meta.model_id || m.slug)}</h1>
  <p>${esc(m.meta.provider || '')}. ${esc(m.meta.harness || '')}</p>
  <p class="bigscore">${m.total}<span class="dim">/${m.testsScored * 10} points, ${m.testsScored} of 8 tests scored</span></p>
  ${yt}
</section>
${cards || '<p class="empty">No runs captured yet.</p>'}`,
  });
}

// ---------- matches / arena ----------

const matchCards = matches
  .map((m) => {
    const votes = m.judges
      .map((j) => `<li><b>${esc(j.judge)}</b> voted ${esc(j.vote)}${j.reasoning ? `<span class="dim">. ${esc(j.reasoning)}</span>` : ''}</li>`)
      .join('');
    const video = comparisonFor(m.test);
    return `<article class="card reveal">
<h3>${esc(m.test)} · <a href="model/${esc(m.model_a)}.html">${esc(m.model_a)}</a> vs <a href="model/${esc(m.model_b)}.html">${esc(m.model_b)}</a></h3>
${video ? `<video class="artifact" controls muted loop playsinline preload="metadata" src="${vurl(video)}"></video>` : ''}
<p>Winner <b>${esc(m.winner)}</b> (${m.votes ? Object.values(m.votes).sort((a, b) => b - a).join(' to ') : ''}), ${esc(m.date?.slice(0, 10) ?? '')}.</p>
<ul class="votes">${votes}</ul>
</article>`;
  })
  .join('\n');

const matchesBody = `
<section class="hero small">
  <div class="season">THE ARENA</div>
  <h1>Models judging models.</h1>
  <p>Two artifacts, same test, three AI judges from vendors with no horse in the race. Judges see anonymous submissions in randomized order and must pick a winner. Majority decides. Winners climb an ELO ladder. Every vote and every judge's reasoning is published. The Arena Score never touches the Human Score.</p>
</section>
<section class="reveal">
${matchCards || `<p class="empty">Season 1 matches have not been played yet. The first matchup, Claude Fable 5 Max vs GPT 5.6 Sol Ultra, lands after the filmed gauntlet run.</p>`}
</section>`;

// ---------- tests explainer ----------

const testsBody = `
<section class="hero small">
  <div class="season">FULL TRANSPARENCY</div>
  <h1>Eight tests, verbatim.</h1>
  <p>Each prompt is frozen for the season and pasted into a fresh session. One shot, no follow-ups. What you see on the leaderboard is the first thing the model said back.</p>
</section>
${tests
  .map(
    (t) => `<article class="card reveal">
<h3><a class="model" href="test/${t.id}.html">${t.num} · ${esc(t.title)}</a></h3>
<p class="dim">Measures ${esc(t.measures.toLowerCase())}.</p>
${t.prompt ? `<pre>${esc(t.prompt)}</pre>` : '<p class="dim">Agentic test. Harness rules are in the repo.</p>'}
</article>`
  )
  .join('\n')}`;

// ---------- write ----------

mkdirSync(join(DIST, 'model'), { recursive: true });
mkdirSync(join(DIST, 'test'), { recursive: true });

for (const m of models) {
  for (const t of tests) {
    const run = m.runs[t.id];
    if (!run) continue;
    const src = join(BENCH, 'results', m.slug, t.id);
    const dst = join(DIST, 'a', m.slug, t.id);
    if (run.outputs.length) cpSync(join(src, 'output'), join(dst, 'output'), { recursive: true });
    for (const f of run.media) cpSync(join(src, f), join(dst, f));
  }
}
if (comparisons.length) {
  mkdirSync(join(DIST, 'videos'), { recursive: true });
  for (const f of comparisons) cpSync(join(comparisonsDir, f), join(DIST, 'videos', f));
}

if (existsSync(join(HERE, 'og.png'))) cpSync(join(HERE, 'og.png'), join(DIST, 'og.png'));
else console.warn('WARN: site/og.png missing; social cards will 404 until it exists');

writeFileSync(join(DIST, 'style.css'), readFileSync(join(HERE, 'style.css')));
writeFileSync(join(DIST, 'index.html'), page({ title: 'Leaderboard', active: 'Leaderboard', body: indexBody }));
writeFileSync(join(DIST, 'matches.html'), page({ title: 'Arena', active: 'Arena', body: matchesBody }));
writeFileSync(join(DIST, 'tests.html'), page({ title: 'Tests', active: 'Tests', body: testsBody }));
for (const m of models) writeFileSync(join(DIST, 'model', `${m.slug}.html`), modelPage(m));
for (const t of tests) writeFileSync(join(DIST, 'test', `${t.id}.html`), testPage(t));

console.log(`built site/dist: ${models.length} models, ${tests.length} test pages, ${matches.length} matches, ${comparisons.length} videos`);
