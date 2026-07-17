---
title: Kimi K3 vs Opus 4.8 — the lava lamp that played dead, and an $8 donut
description: Moonshot's Kimi K3 and Anthropic's Claude Opus 4.8 face the bench: a lava lamp showdown that forced a same-day re-review, a Blender donut duel decided by sprinkle shape, and the last Human Score ever issued.
date: 2026-07-16
---

Matchup two on the bench: **Kimi K3** (Moonshot, via its native Kimi Code CLI) against **Claude Opus 4.8** (Anthropic, via Claude Code, 1M context). Per [Ruling #5](/tests/), both ran at **max effort** — K3 only ships one gear, so parity within the matchup required Opus match it. Same machine, same prompts, one shot each.

This matchup also made history for a different reason: partway through, [Ruling #6](/tests/) retired the Human Score entirely. The lava lamp below carries the last human verdicts ever issued on this bench. From here on out, the verdicts belong to the AI judge panel — and to you, on the [voting booth](/vote/).

## Test 02: the lava lamp that played dead

The prompt: build a mesmerizing lava lamp animation in a single HTML file. No libraries, no shortcuts, wax that heats, rises, deforms, merges.

<video controls muted loop playsinline preload="metadata" src="/videos/02-lava-lamp--kimi-k3-vs-claude-opus-4-8.mp4"></video>

**Both models scored 10/10.** But it wasn't a boring tie — it was nearly a disaster. K3's lamp initially *appeared completely dead* in the production preview pane and was scored a zero. On same-day re-review in a real browser — the environment the prompt itself specifies — the wax moved, merged, and split exactly as asked. The zero was a viewer artifact, not a model failure, and the score was revised on the record (the revision note is published verbatim in the [score receipt](/test/02-lava-lamp/)). Opus went from 9 to 10 in the same re-review session, judged under identical conditions.

The bench keeps its receipts, including the embarrassing ones. That's the point of the bench.

The AI judge panel, seeing both artifacts blind, was less diplomatic than the scores suggest: **Opus took the head-to-head 3–0.** The judges' reasoning came down to rendering tech — Opus shipped a WebGL metaball shader with real lighting:

> "[Opus] delivers superior polish with a realistic metallic lamp frame, glass sheen, and WebGL metaballs that produce smooth, organic wax deformation." — grok-4-5, arena judge

The efficiency ledger tells its own story: **K3 finished in 14m 55s**; **Opus took 20m 47s** and 180.8k output tokens (about **$4.52** at API output rates — the run itself was on a flat-rate subscription). K3's CLI doesn't report token usage, so its column reads n/a — honestly.

## Test 08: the donut duel

The Blender build: drive a live Blender session through MCP, model a glazed donut with sprinkles, light it, render it. This was the first run published under Ruling #6 — **no human score exists for it**. Panel and people only.

<video controls muted loop playsinline preload="metadata" src="/videos/08-blender-build--kimi-k3-vs-claude-opus-4-8.mp4"></video>

The panel split for the first time in the matchup: **Opus 2–1**, and the deciding argument was, genuinely, sprinkle physics:

> "[Opus] delivers superior polish with realistic rod-shaped sprinkles, textured soft dough, glossy icing drips, and a ceramic plate under soft lighting." — grok-4-5

> "[K3]'s render has more realistic lighting and shadowing, with a richer wood texture and more natural icing drips." — qwen3-vl-235b, dissenting

Rod-shaped sprinkles versus spheres. This is what frontier model evaluation looks like in 2026.

The cost gap was the real headline: **K3 built its donut in 8m 42s**. **Opus took 31m 8s and 329k tokens — roughly $8.22 in API-equivalent output**. Whether Opus's win is worth a 3.5x time budget and an $8 donut is exactly the kind of question the bench exists to surface — and exactly what the [efficiency board](/#efficiency) records without ever scoring.

## The scoreboard, so far

Across the matchup's scored tests, the pattern is consistent: **Opus wins the panel's eye for polish; K3 wins the clock, every single time.** On the season [ELO ladder](/matches/), Opus sits at 1002 and K3 at 935 — both still chasing Fable 5 Max (1054) and Sol Ultra (1008) from matchup one.

Your turn: **[fifteen ballots are open](/vote/)**. Watch the runs side by side and cast your vote — every ballot lands in a public log, one vote per matchup per person.

*Every prompt, artifact, score revision, and judge vote referenced here is published in full — click any test for the receipts. Run inside [Beckon](https://heybeckon.ai).*
