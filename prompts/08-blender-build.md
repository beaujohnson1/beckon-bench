# Test 08 — The Blender Build (live)

- **Measures:** 3D spatial reasoning, tool-calling stamina, working in an unfamiliar live environment (agentic test #2)
- **Attach:** nothing
- **Harness:** a coding agent connected to a **live Blender session via the blender-mcp addon** (https://github.com/ahujasid/blender-mcp). Same Blender version + addon version for every model all season. One prompt, zero human follow-ups; the model drives Blender itself, step by step, inside its single turn.
- **Artifact:** the final rendered image + the .blend file, saved to output/ — plus a **screen recording of the Blender viewport during the build** (this recording IS the video segment)
- **Scoring notes:** "Runs first try" = a final render gets saved with no human intervention. A model that dumps one giant script instead of working step-by-step in the live scene violates the prompt — cap Prompt adherence at 1.
- **Setup (one-time, before filming):** install Blender, install the blender-mcp addon in Blender, connect the harness to the MCP server, verify with a throwaway "add a cube" session. Record the viewport for every run.
- **Video note:** the crown jewel. Every Blender beginner on earth has made The Donut — now the AIs have to. Timelapse the viewport recording with a score reveal at the render.

## PROMPT (copy verbatim, nothing else)

```
You are connected to a live Blender session through MCP tools. Build the classic Blender beginner scene: a delicious-looking donut with icing and sprinkles, sitting on a plate on a wooden table. Model the donut and its icing, scatter individual sprinkles, create convincing materials (soft dough, glossy icing, ceramic plate, wood), set up lighting and a camera for an appetizing composition, then render a final image at 1920x1080 and save it to disk, telling me the file path. Work step by step in the live scene so your progress is visible as you go — do not just execute one giant script at the end.
```
