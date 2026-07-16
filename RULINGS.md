# Beckon Bench — Rulings Log (Gauntlet v1)

Judgment calls the rules didn't cover, logged with date and reasoning. Each ruling is precedent for the rest of the season.

## Ruling #1 — 2026-07-10 — "Same harness" means same environment, native CLI per model

RULES.md says all models run through the same tool. GPT models can't run in Claude Code and Claude models can't run in Codex, so a literal reading is impossible for cross-vendor matchups. **Ruling:** every run happens inside the same Beckon canvas on the same machine, with each model driven by its vendor's own flagship CLI (Codex for OpenAI models, Claude Code for Anthropic models) at default settings plus whatever MCP servers the test requires (identical MCP servers for all models). Rationale: vibe coders use each model through its native tool — the model+harness pair IS the product being benchmarked. Record the exact CLI in each `meta.json`. **Precedent extension (2026-07-16):** Moonshot models run in **Kimi Code CLI** (`kimi`), Moonshot's own flagship agent — not Kimi bolted into Claude Code via a base-URL swap, which would put two contestants in one vendor's tool and break the spirit of this ruling.

## Ruling #5 — 2026-07-16 — Kimi K3 vs Opus 4.8 runs at MAX effort (K3 is max-only)

Kimi K3, via its native Kimi Code CLI managed provider (`kimi-code/k3`), exposes only a single effort tier: its config declares `support_efforts = ["max"]`, `default_effort = "max"`. The season's "high" default (Ruling #3) is simply not selectable for K3. **Ruling (Beau):** to preserve Ruling #1 parity *within the matchup*, both contestants run at **max** — Opus 4.8 at max effort, K3 at its only tier. Consequence: this matchup's effort differs from the Sol-vs-Fable runs (high), so cross-matchup leaderboard comparisons carry that asterisk; within this head-to-head, parity holds. Each `meta.json`/`score.json` records the actual effort used, and the published efficiency stats (time/tokens/cost) make the setting transparent. Prompts stay frozen — this is a harness setting, not a test change.

## Ruling #3 — 2026-07-11 — Effort tier dropped to "high" for day 2 onward

Day 1 ran Sol at ultra and Fable at max reasoning effort; runtimes (up to ~69 min for a single test) proved impractical to film. **Ruling (Beau):** from day 2 (tests 01, 06, 08) onward, both contestants run at **high** reasoning effort — applied identically to both per Ruling #1. Scores still count toward the same season leaderboard. Caveat on the record: day-1 scores (tests 02, 04) were earned under ultra/max configs; each affected score.json records the actual effort used, and the site's efficiency table shows time/tokens per test so the change is transparent. Prompts remain frozen — this is a harness setting, not a test change.

## Ruling #6 — 2026-07-16 — The Human Score retires; the People's Vote is the public verdict

Effective today, Beau no longer scores gauntlet runs. **Ruling (Beau):** every Human Score published before this date stands as history — nothing is rescored or removed — and no new Human Scores will be issued (test 08 of the Kimi K3 vs Opus 4.8 matchup is the first run published without one). Going forward the public verdict is the **People's Vote**: blind head-to-head voting on the website's match cards, logged verbatim (per-vote records in the site's database), published alongside the AI Arena panel's verdicts. What does not change: Ruling #2's constraint on AI assistants — they still never assign or suggest scores, and additionally never touch vote data; the producer's job remains running tests, securing artifacts, and publishing receipts. Run stats (time, tokens, API-equivalent cost) continue to be recorded and published for every run — never scored, never voted. Open item on the record: vote-integrity policy (dedup, rate limits, brigade resistance) is required before vote tallies are presented as authoritative rather than indicative.

## Ruling #4 — 2026-07-11 — Fable's test-01 MCP exposure counts as-is

During test 01, Fable's session had the buildos MCP server enabled (the project consent dialog was answered "use" instead of "continue without"), breaking Ruling #1 parity with Sol, and the model read the shared `rules` memory note before building — learning that outputs are rendered into comparison videos with time and output-token stats. It did not read scores, the handoff, or judge preferences. **Ruling (Beau):** the run counts as-is; the breach is disclosed here and on the test-01 scorecard rather than voided. Producer action going forward: buildos MCP will be disabled for contestant arena projects after this session so the dialog cannot recur.

## Ruling #2 — 2026-07-10 — The judge is human

Scoring is done by Beau on camera, per the rubric. AI assistants may transcribe scores into `score.json` and organize results, but never assign or suggest scores for Gauntlet runs — especially not a model from a vendor that's competing (which, for Claude models, includes the assistant running the bench). The AI judge panel is a separate, clearly-labeled Arena Score (see ARENA.md) and never touches the Human Score leaderboard.
