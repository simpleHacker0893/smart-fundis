# 07 — Close V1

Run this in a fresh session once every V1 ticket is merged.

```
/review-phase V1
```

It runs code-reviewer, rai-reviewer and qa in parallel, and writes `docs/reviews/V1.md`. qa runs the V1 demo from `planning/slices/V1.md` at 360×740 and lists the real-phone steps for you.

Then paste:

```
Slice V1 is reviewed. If the verdict is BLOCKED, run /fix-review V1 (each fix gets its own ticket, PR and review through prompts 40 and 50).
Once it's clear:
1. The `architect` subagent does an anthropic-skills:120x-architect Builder Review. It compares what was built with the V1 spec issue and the slice brief, and flags drift, skipped items and "done" without evidence.
2. The `rai-reviewer` subagent does a final pass on every AI-facing string on the dashboards (Observations, AI recommendation, caps, consent).
3. Update planning/STATE.md: V1 done, and the next slice is the V6 discovery core (D-27). Update RISKS.md and QUESTIONS.md.
4. Close the V1 spec issue with a link to the review, and commit "docs: close V1".
Tell me the next step: the V6 core via planning/prompts/10–30, then /next-task.
```

Optional, from V1 on, as the first line of a fresh session:
```
/mattpocock-skills:improve-codebase-architecture Scope: the code V1 added (convex/assessments, reviews, ai, badges; web dashboards). Read CONTEXT.md and the V1 spec first.
```
