# 05 — Architecture review (run once, before V0)

```
You are the main session. Read AGENTS.md, CONTEXT.md, docs/adr/, planning/*.md, planning/slices/*.md,
design/stitch/DESIGN.md and docs/superpowers/specs/2026-09-25-architecture-design.md.

Run four reviews of the architecture spec in parallel (superpowers:dispatching-parallel-agents):

1. The `architect` subagent uses anthropic-skills:120x-architect in Builder Review mode, with the spec as the
   artifact under review, and uses mattpocock-skills:codebase-design for the module and seam checks. It checks:
   - Contradictions between the spec, the ADRs, DECISIONS.md, CONTEXT.md and the PRD. The spec wins, but flag
     anything the spec left out or that a later decision (D-1 to D-9) has overtaken.
   - Whether every contract (claim, callback, status changes, canDecide) is complete enough for a Builder
     to implement without making product decisions.
   - Whether each module behind a seam in §10 is deep: a small interface hiding a lot of behaviour. Flag
     shallow pass-through modules.
   - Whether each slice V0–V5 is truly vertical and demoable, and whether its blocking edges are right.
   - Any NVIDIA or Cosmos claim that's unmeasured or unsupported. Use nvidia-skill-finder and the links in
     docs/research-links.md. Check especially fps 4 × 90 s against --max-model-len 8192 (RISKS R-3).
2. The `designer` subagent checks spec §8 and every slice brief against design/stitch/DESIGN.md (D-9) and the
   exports in design/stitch/exports/: colours, fonts, the screen list, and the header and landing order.
   Known drift to confirm: spec §8 still says green/orange and Plus Jakarta Sans.
3. The `rai-reviewer` subagent runs the PRD §8 checklist against the spec: consent, the Co-op, Demo tags
   and wording.
4. The `code-reviewer` subagent does a security read of the design: secrets, URL exposure, the admin check,
   the stale-callback 409, the atomic claim, and the role-bypass surfaces.

Merge the results into docs/reviews/architecture.md in the /review-phase format. Rate each finding as
blocker, major or minor, with a file:section reference.

Then use mattpocock-skills:grilling to put each blocker and major finding to me as a numbered question,
with your recommended answer. Don't edit the spec until I've answered.
After I answer, update the spec, planning/DECISIONS.md, planning/RISKS.md, the affected slice briefs and
CONTEXT.md (glossary changes only). Where all three ADR tests are met, write the ADR in docs/adr/ using the
engineering:architecture skill's ADR format. Commit with "docs: architecture review fixes".
```
