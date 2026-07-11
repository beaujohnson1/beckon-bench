# Beckon Bench

**The vibe-coder's benchmark.** When a new AI model drops, it runs the Beckon Bench gauntlet: eight one-shot tests, identical conditions, scores on the board. No cherry-picking, no retries, receipts on screen.

Part of the Beckon ecosystem for vibe coders.

## How it works

1. A new model launches.
2. It gets the exact same eight prompts every model gets (`prompts/`), one shot each, under the conditions in `RULES.md`.
3. Every output, screenshot, and score lands in `results/<model>/`.
4. The leaderboard updates. That's it.

## Layout

```
RULES.md                  The protocol. Read this first, follow it exactly.
prompts/                  The frozen v1 prompt set (8 tests) + test assets
results/<model>/<test>/   output/, screenshot.png, score.json per run
```

## Current season

**Gauntlet v1** — frozen 2026-07-10. Prompts do not change mid-season; improvements go into v2 with a fresh leaderboard.
