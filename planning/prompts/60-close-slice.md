# 60 — Close the slice

```
Slice: <SLICE>. All of its tickets are closed.

1. Run /review-phase <SLICE> to get the code-reviewer, rai-reviewer and qa reviews in parallel. The report goes to
   docs/reviews/<SLICE>.md. qa runs the slice's demo from planning/slices/<SLICE>.md on a 360×740 viewport and
   lists the steps I need to check on a real phone.
2. If the verdict is BLOCKED, run /fix-review <SLICE>. Each fix is its own ticket, PR and review, using prompts 40 and 50.
3. Use the `architect` subagent with anthropic-skills:120x-architect in Builder Review mode. It compares what was
   built with the spec issue and the slice brief, and flags drift, anything skipped, and any claim of "done" without evidence.
4. Update planning/STATE.md in place: mark the slice done, and set the next slice and the next action.
   Update planning/RISKS.md and QUESTIONS.md if anything changed.
5. Close the spec issue with a comment linking the review report. Commit
   "docs: close <SLICE>". Tell me the next slice and prompt (10 with the next slice).
```
