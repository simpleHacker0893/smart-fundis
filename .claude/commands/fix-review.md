---
description: Fix open findings from docs/reviews/phase-<N>.md with the owning role, verify each, and update the report
argument-hint: "<phase number> [finding ids, e.g. R3-1 R3-4 — default: all blocker + major]"
---

# /fix-review

Arguments: `$ARGUMENTS`. The first token is the phase number. Any other tokens are finding IDs.

1. Read `docs/reviews/phase-<N>.md`. Pick the findings to fix:
   - If finding IDs were given, fix exactly those.
   - Otherwise fix every `open` finding with severity `blocker` or `major`.
2. For each finding:
   1. **Verify it first.** Read the code at file:line and confirm the failure scenario is real. If it isn't, set the status to `no_change_needed` and add a one-line reason.
   2. Delegate the fix to the subagent that owns the file (see `AGENTS.md` folder ownership). Give it the finding row and the suggested fix.
   3. Re-run the check that exposed the finding: the test, grep, type check or QA step. Capture the output.
   4. Set the status to `fixed (<short sha>)` or `skipped — <reason>`.
3. Update the **Findings** table in place. Recompute the **Verdict** using the rules from `/review-phase`.
4. Commit with the message `fix(review P<N>): <ids>`. Do not push.
5. Report which findings are fixed, which are skipped and why, and the new verdict. If everything is clear, point to `/next-task`.

Never mark a finding fixed without re-running its check.
