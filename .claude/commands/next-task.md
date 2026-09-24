---
description: Pick the next frontier ticket of the current slice from GitHub Issues and run prompts 40 and 50 on it
argument-hint: "[issue number, e.g. 12 — optional, defaults to the first unblocked, unassigned ticket]"
---

# /next-task

Override: `$ARGUMENTS`

1. **Find the current slice.** Read `planning/STATE.md` for it.
   - If no spec issue exists for that slice yet, stop. Tell me to run `planning/prompts/10-grill-slice.md` and `20-spec-slice.md` first.
2. **Pick the ticket.** If an issue number was given above, use it. Otherwise list the open issues labelled `ticket` and `slice:<current>` (`docs/agents/issue-tracker.md`). Drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`) or an assignee, and take the first one left.
   - If nothing is left and every ticket is closed, tell me to run `planning/prompts/60-close-slice.md`.
3. **Run it.** Follow `planning/prompts/40-implement-ticket.md` and then `50-pr-and-review.md` exactly, with this issue.
4. **Stop at "PR ready for merge".** Never merge it yourself.
