# Test 07 — The Debug Gauntlet

- **Measures:** real-world usefulness — reading code, finding bugs, fixing without rewriting
- **Attach:** the full contents of `prompts/assets/debug-app/task-tracker.html` (paste it into the prompt or attach the file — or use `prompts/paste/07-debug-gauntlet-FULL.txt`, which has prompt + file pre-combined). NEVER show the model `ANSWER-KEY.md` (judge-only, at `~/.beckon-bench-judge/ANSWER-KEY.md`).
- **Artifact:** the model's written bug report; score against the answer key
- **Scoring (overrides the standard rubric):** 2 pts per seeded bug correctly identified with a correct fix; 1 pt if found but the fix is wrong; −1 per invented bug not on the key (floor 0). Max 10.
- **Video note:** the credibility test — reveal the answer key on screen and tick them off one by one

## PROMPT (copy verbatim, then the file contents)

```
This small web app contains exactly 5 intentionally introduced bugs. Find all 5. For each one: describe the bug, identify where it is in the code, and give the corrected line(s). Do not rewrite the whole app, and do not report more than 5 bugs.
```
