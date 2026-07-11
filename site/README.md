# Beckon Bench site (ARENA.md Phase 1 — implemented)

Static site generated entirely from `results/` + `arena-panel/`. No backend, no database — the filesystem is the source of truth.

```bash
node site/build.mjs        # reads results/, arena-panel/, prompts/ → writes site/dist/
open site/dist/index.html  # local preview
```

Publishing a new model run = drop its folder into `results/`, rebuild, deploy `dist/` anywhere static (Cloudflare Pages, GitHub Pages, S3). Same for arena matches: run `arena-panel/arena.mjs season`, then rebuild.

Pages:
- `index.html` — Human Score leaderboard (canonical, /80, cheaper-wins tiebreak) + Arena ELO ladder
- `model/<slug>.html` — report card: per-test rubric scores, judge notes, stats, and the **live embedded artifacts** (sandboxed iframes, no network) — visitors actually play the horror game each model made
- `matches.html` — the Arena: how judging works + every match with per-judge votes and reasoning
- `tests.html` — the 8 prompts verbatim (transparency is the brand)

The generator tolerates missing data (unscored runs, no matches, no youtube_url) and skips scaffolded-but-empty test folders. Empty states are written so a half-filled season still looks intentional.

Not in scope here (by design): a public "run a model" button. Gauntlet runs are manual per RULES.md/Ruling #1 — native CLI, one shot, human-scored on camera. The site publishes receipts; it doesn't generate them.
