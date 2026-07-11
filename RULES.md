# Beckon Bench — Official Rules (Gauntlet v1)

Frozen 2026-07-10. These rules exist so that a score earned today is comparable to a score earned six months from now. If a rule gets improved, that's Gauntlet v2 and a new leaderboard — never edit v1.

## The one-line pitch

Eight one-shot tests that measure what vibe coders actually care about: does it run first try, does it look good, did it do what I asked, and did it surprise me.

## Protocol: running a new model

1. **Fresh context.** Every test runs in a brand-new session/conversation. No system prompt customization, no memory, no prior context.
2. **Verbatim prompts.** Copy the `PROMPT` block from the test file in `prompts/` exactly. No additions, no "please", no model-specific tweaks. Attach only the asset the test file specifies.
3. **One shot.** The model's first complete response is the scored artifact. No follow-ups, no "make it better", no error pasting.
   - *Environment exception:* if the run fails for reasons that aren't the model's fault (network drop, harness crash, rate limit), the run is void and re-run once. A model-caused failure (broken code, refusal, wrong format) is NOT an environment failure — it scores as-is.
4. **Same harness.** All models in a season run through the same tool with default settings. Record which harness in `score.json`.
5. **Capture everything** before scoring: save the raw output to `results/<model-slug>/<test-id>/output/`, take `screenshot.png` of the rendered result (or a screen recording for animated tests), and record wall-clock time, token counts, and cost if available.
6. **Score immediately** using the rubric below, while the run is fresh. Write `results/<model-slug>/<test-id>/score.json` (template: `results/score-template.json`).

Model slug format: lowercase, hyphens — e.g. `claude-fable-5`, `gpt-6`, `gemini-3-pro`.

## Scoring rubric (per test, 10 points)

| Dimension        | Points | What it means                                                        |
|------------------|--------|----------------------------------------------------------------------|
| Runs first try   | 0–3    | 3 = flawless on first open. 2 = minor glitch, still works. 1 = partially works. 0 = broken or refused. |
| Polish           | 0–3    | Visual/aesthetic quality. Would you show it to someone unprompted?   |
| Prompt adherence | 0–2    | Did it deliver every named requirement (single file, features, constraints)? |
| Wow factor       | 0–2    | Did it go beyond the ask in a way that made the run better?          |

**Season total: 80 points.** Ties broken by total cost (cheaper wins).

**Test 07 (debug gauntlet) exception:** scored as 2 points per seeded bug correctly identified *with a correct fix* (5 bugs × 2 = 10). A bug found but "fixed" wrong = 1 point. Invented bugs that aren't on the answer key: −1 each (floor 0). The other dimensions don't apply.

**Recorded but unscored:** time to complete, tokens, cost. These get reported alongside scores ("it won, but it cost 4× more") but never affect the point total.

## Per-test rules

- Tests 01–05, 07: output must be fully self-contained — **no external libraries, CDNs, fonts, or network requests**. An external dependency caps Prompt adherence at 0 for that run.
- Test 06 (Remotion promo video): **the one agentic test.** The model runs in a coding agent with the Remotion skill available and may scaffold the project, install dependencies, and render — all within its single turn. Still one shot: one prompt, zero human follow-ups; if it stalls or asks a question, the run scores as-is. Remotion and its standard npm dependencies are allowed; any other external asset (stock footage, downloaded images/fonts) caps Prompt adherence at 0. "Runs first try" = the MP4 renders without human intervention.
- Test 04 (SVG self-portrait): the artifact is the SVG itself. "Runs first try" = renders as valid SVG.
- Test 05 (UI recreation): the model receives `prompts/assets/reference-ui.png` (a screenshot of `prompts/assets/reference-ui.html` at 1280px wide — regenerate the PNG from the HTML if missing, and use the same PNG for every model in a season). The model never sees the HTML source.
- Test 07 (debug gauntlet): the model receives the *contents* of `prompts/assets/debug-app/task-tracker.html`. It must never see `ANSWER-KEY.md` (kept outside the repo at `~/.beckon-bench-judge/ANSWER-KEY.md`, since contestants now work inside the bench folder).
- Test 08 (Blender build): **agentic test #2.** The model drives a live Blender session via the blender-mcp addon (same Blender + addon version all season), working step by step inside its single turn. Start every run from an empty scene (delete the default cube setup identically each time). "Runs first try" = a final render is saved with no human intervention. Dumping one giant script instead of building live caps Prompt adherence at 1. Record the viewport for the whole run — the recording is both evidence and footage.

## Judging integrity

- The judge (you, on camera) scores against the rubric before checking anyone else's opinion of the model.
- Show the prompt on screen in the video. The transparency is the brand.
- If a judgment call comes up that the rules don't cover, make the call, then log it in `RULINGS.md` with the date and reasoning — it becomes precedent for the rest of the season.

## Results layout

```
results/
  <model-slug>/
    meta.json                 model id, provider, harness, date of run
    01-haunted-horror-game/
      output/                 raw artifact(s) exactly as produced
      screenshot.png          (or demo.mp4 for animated tests)
      score.json
    02-lava-lamp/
    ...
```

## Versioning

- Prompt set, rubric, and per-test rules are frozen per season (v1 = this file).
- Fixing a typo that can't change model behavior: allowed, log it in RULINGS.md.
- Anything that could change model behavior or scores: bump to v2, start a new leaderboard, keep v1 results archived.
