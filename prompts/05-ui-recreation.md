# Test 05 — UI Recreation

- **Measures:** visual precision, layout accuracy, instruction following
- **Attach:** `prompts/assets/reference-ui.png` — a screenshot of `prompts/assets/reference-ui.html` taken at 1280px viewport width. Generate the PNG once and reuse the identical image for every model all season. The model must NEVER see the HTML source.
- **Artifact:** single HTML file; score by side-by-side comparison with the reference
- **Video note:** split-screen reference vs. recreation, then overlay-flicker between them

## PROMPT (copy verbatim, attach the screenshot)

```
Recreate the user interface shown in the attached screenshot as a single self-contained HTML file, as close to pixel-accurate as you can. Match the layout, spacing, colors, typography, and every visible element. No external assets or libraries. Static is fine — it needs to look identical, not function.
```
