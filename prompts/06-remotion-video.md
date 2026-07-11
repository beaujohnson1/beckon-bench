# Test 06 — Remotion Promo Video

- **Measures:** motion design, multi-file project competence, agentic follow-through (the only agentic test in the gauntlet)
- **Attach:** nothing
- **Harness:** the model runs in a coding agent with the Remotion skill available. It may scaffold the project, install dependencies, and render — all inside its single turn. One prompt, zero human follow-ups: if it asks a question instead of finishing, that's the run.
- **Artifact:** the rendered MP4 (plus the project source, saved to output/)
- **Scoring notes:** "Runs first try" = the render completes without human intervention. Remotion and its standard npm dependencies are allowed; any other external asset (stock footage, downloaded images/fonts, network requests at render time) caps Prompt adherence at 0.
- **Video note:** play all models' promo videos back to back — this is the closest the gauntlet gets to judging real client work. Ties into test 03: same fictional product, so you can show "the model designed Nightjar's landing page, now it directs Nightjar's launch video."

## PROMPT (copy verbatim, nothing else)

```
Using Remotion, create a 20-second promotional launch video for a fictional product called "Nightjar" — an app that turns your rambling voice memos into organized, searchable notes. Build the complete Remotion project and render it to MP4 at 1920x1080, 30fps. It should feel like a real product launch video: animated typography, smooth choreographed motion, a consistent visual identity, and a clear story of the product's core promise, ending on the product name. Everything must be drawn with code — no stock footage, downloaded images, or external fonts. Finish by rendering the video and telling me the path to the MP4.
```
