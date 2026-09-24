# Build loop: one vertical slice at a time

```
00 setup (once) ─▶ 05 architecture review (once)
                          │
      ┌───────────────────▼──────────────────────────────────────────────┐
      │ for each slice V0 … V5 (brief: planning/slices/V<n>.md)          │
      │ 10 grill ─▶ 20 spec ─▶ 30 tickets ─▶ 40 implement (per ticket) ─▶ │
      │   50 PR + review (per ticket) ─▶ 60 close slice                  │
      └──────────────────────────────────────────────────────────────────┘
```

| # | Prompt | Who runs it | Skills | Output |
| --- | --- | --- | --- | --- |
| 00 | `00-setup-once.md` | operator | wizard | Claude GitHub App, secret, branch protection, accounts |
| 05 | `05-architecture-review.md` | main session → architect, rai-reviewer, code-reviewer | 120x-architect, grilling | review of the spec, with fixes |
| 10 | `10-grill-slice.md` | main session (architect role) | grill-with-docs (grilling + domain-modeling) | shared understanding, plus `CONTEXT.md` and ADR updates |
| 20 | `20-spec-slice.md` | main session | to-spec | slice spec issue `V<n> spec: …` |
| 30 | `30-tickets-slice.md` | main session | to-tickets | vertical-slice tickets as sub-issues, with blocking edges |
| 40 | `40-implement-ticket.md` | a fresh subagent for each ticket (role from `AGENTS.md`) | implement → tdd → code-review; `plan-first` tickets use writing-plans + subagent-driven-development | branch, commits, local review |
| 50 | `50-pr-and-review.md` | the same session | finishing-a-development-branch, receiving-code-review | PR, Claude CI review, fixes, and a merge by the Architect |
| 60 | `60-close-slice.md` | main session → reviewers | review-phase, 120x Builder Review | `docs/reviews/<slice>.md`, updated `planning/STATE.md` |

**How to use a prompt:**
1. Open a **fresh** Claude Code session.
2. Paste the block from the prompt file, replacing `<SLICE>` (for example `V1`) or `<ISSUE>` (for example `#12`).
3. Run one prompt per session, and use `/clear` between them. GitHub issues and `planning/STATE.md` carry the context from one session to the next.

**Before Sunday:** only 00, 05, 10, 20 and 30 are run (specs are allowed as preparation). 40, 50 and 60 are for build day.
