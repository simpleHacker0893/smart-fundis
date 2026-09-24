# 05 — Architecture review (run once, before V0)

```
You are the main session. Read AGENTS.md, CONTEXT.md, docs/adr/, planning/*.md and
docs/superpowers/specs/2026-09-25-architecture-design.md.

Run three reviews of the architecture spec in parallel (superpowers:dispatching-parallel-agents):

1. The `architect` subagent uses anthropic-skills:120x-architect in Builder Review mode, treating the spec
   as the artifact under review. Check:
   - Contradictions between the spec, the ADRs, CONTEXT.md and the PRD (the spec wins, but flag anything the spec left out).
   - Every contract (claim, callback, status changes, canDecide) is complete enough for a Builder
     to implement without making product decisions.
   - Each slice V0–V5 is truly vertical and demoable, and its blocking edges are right.
   - Any NVIDIA or Cosmos claim that's unmeasured or unsupported. Use nvidia-skill-finder and the links in
     docs/research-links.md. Check especially fps 4 × 90 s against --max-model-len 8192 (RISKS R-3).
2. The `rai-reviewer` subagent runs the PRD §8 checklist against the spec (consent, Co-op, demo tags, wording).
3. The `code-reviewer` subagent runs a security read of the design: secrets, URL exposure, the admin check,
   the stale-callback 409, the atomic claim, and the role-bypass surfaces.

Merge the results into docs/reviews/architecture.md, using the /review-phase format, with findings as
blocker/major/minor and file:section references.

Then use mattpocock-skills:grilling to put each blocker or major finding to me as a numbered question
with your recommended answer. Don't edit the spec until I answer.
After I answer, update the spec, planning/DECISIONS.md, planning/RISKS.md and CONTEXT.md (glossary
changes only), and add an ADR only where all three ADR tests are met. Commit with the message
"docs: architecture review fixes".
```
