# 20 — Write the slice spec

Run this straight after prompt 10, in the **same** session, so the grilling context is still loaded.

```
Slice: <SLICE>

Run /mattpocock-skills:to-spec for this slice.
- Title: "<SLICE> spec: <slice name from planning/slices/<SLICE>.md>". Labels: spec, slice:<slice lowercased>,
  ready-for-agent.
- Use the CONTEXT.md vocabulary throughout. Follow ADR-18, ADR-19 and the architecture spec.
- Seams: prefer the seams in architecture spec §10 (convex-test, the HTTP actions, the ai-service graph as a
  black box, Playwright at 360 px). Propose any new seam and confirm it with me before publishing.
- "Implementation Decisions" must include every contract this slice adds or uses: function names and args,
  status changes, and payload shapes. A Builder must never have to make a product decision.
- "Testing Decisions" must list the edge cases we settled in the grilling, one test each.
- "Out of Scope" must name the later slices that own what we deferred.

After publishing, add the issue link to planning/slices/<SLICE>.md under "Spec issue".
```
