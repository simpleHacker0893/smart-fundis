# 25 — Design the slice (modules and screens)

Run this in the **same** session as 10 and 20, after the spec issue is published. It adds the technical design and the screen design to the spec, so that prompt 30 cuts tickets along real module and screen boundaries.

```
Slice: <SLICE>. Spec issue: <ISSUE>

Run two design passes in parallel (superpowers:dispatching-parallel-agents), giving each subagent the spec issue
body and planning/slices/<SLICE>.md:

1. The `architect` subagent uses mattpocock-skills:codebase-design to write the module map for this slice. It
   gives, for each module: its path (web/, convex/ or ai-service/), its public interface (function names and
   signatures), what it hides, the seam it's tested through (spec §10), and who owns it (AGENTS.md folder
   ownership). Prefer a few deep modules over many shallow ones. It flags any interface that forces a caller to
   know about internals.
2. The `designer` subagent writes the screen inventory for this slice: every route and state the slice shows
   (empty, loading, error, success). For each one it gives the Stitch export in design/stitch/exports/ it follows,
   or "plain shadcn" (Admin screens), or "needs a Stitch prompt" for anything missing. It adds the design tokens
   the frontend needs from design/stitch/DESIGN.md (D-9): colours, fonts, spacing and motion rules. It checks the
   honesty rules: "verified by Smart Fundis", never "certified", and nothing that looks live when it isn't.
   If a screen needs a new Stitch run, it writes the prompt in design/stitch/prompts/ and stops for my review
   before any generation.

Show me both results. Iterate until I approve them. Then post them as one comment on <ISSUE> headed
"Design: modules and screens", so they outlive this session. If the module map changes a contract, update the
spec issue body too.

Then tell me to run prompt 30 in this same session.
```
