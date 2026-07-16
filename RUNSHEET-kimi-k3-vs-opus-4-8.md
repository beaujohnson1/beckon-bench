# Run Sheet — 2026-07-16 — Kimi K3 vs. Claude Opus 4.8

Second matchup of the season. New contenders run the frozen v1 prompts; a fresh face (Kimi K3, released 2 days ago) against Opus 4.8. Producer-only doc — never place in a contestant folder.

## Contenders & harness (Ruling #1)

| | Model | CLI | Working dir | Effort |
|---|---|---|---|---|
| Left | **Kimi K3** | Kimi Code CLI (`kimi`) v0.26.0, model `kimi-code/k3` | `~/bench-arena/kimi-k3` | **max** (K3 is max-only) |
| Right | **Opus 4.8** | Claude Code v2.1.211, 1M context | `~/bench-arena/opus-4-8` | **max** |

- **Both at MAX per Ruling #5** — K3 exposes only a "max" tier, so both run at max for a fair top-tier fight.
- **Contestants launch OUTSIDE the repo** (`~/bench-arena/…`) so neither auto-connects the repo's `buildos` MCP. Verified zero MCP on both for browser tests.
- **Opus launch flag:** `claude --strict-mcp-config --mcp-config ~/bench-arena/empty-mcp.json` (ignores user-scope hermes/blender/etc). For the donut, swap to `~/bench-arena/blender-mcp.json`.
- **Kimi launch:** `kimi --auto -m kimi-code/k3` (auto mode; add Blender via a local `.mcp.json` for the donut).
- Fresh session per test per model. One shot. Paste prompts verbatim.

## Today's three tests

1. **Lava lamp** — frozen v1 test **02**, **SCORED** → leaderboard. Self-contained HTML, runs parallel in both panes. *(opener — in progress)*
2. **Minecraft clone** — **EXHIBITION** (new prompt, off the v1 board). Playable voxel game, single HTML. Comparison video + logged as a v2 game-test candidate. Prompt needs Beau's on-camera approval before firing.
3. **Blender donut** — frozen v1 test **08**, **SCORED** → leaderboard. Sequential (one Blender session at a time). Pre-flight per model: Blender N-sidebar → BlenderMCP → Connect, factory-reset scene, start viewport recording. Both CLIs get Blender MCP (and only Blender).

## Scoring (Ruling #2)

Beau scores every test on camera against the rubric (runs-first-try 0–3, polish 0–3, adherence 0–2, wow 0–2). The AI assistant only transcribes into `score.json` — never assigns or suggests scores. Minecraft is an exhibition, so it's not on the Human leaderboard unless v2 opens.

## After each test

- Collect artifacts → `results/<slug>/<test>/output/` (scored) or `exhibition/<slug>/<test>/output/` (Minecraft).
- Pull real time + output tokens from session logs; API-equivalent cost from OpenRouter rates (K3 $15/1M out, Opus 4.8 $25/1M out).
- Render the labeled side-by-side comparison MP4 (bench-video recipe).
- Transcribe Beau's scores; rebuild + push the site so the leaderboard grows to 4 models.
