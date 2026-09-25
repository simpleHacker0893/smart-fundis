# Build loop: one vertical slice at a time

```
00 platform setup (once) ─▶ 05 architecture review (once)
                                  │
   ┌──────────────────────────────▼──────────────────────────────────────┐
   │ for each slice V0 … V5 (brief: planning/slices/V<n>.md)             │
   │ ┌ one session ───────────────────────────────────────┐              │
   │ │ 10 grill ─▶ 20 spec ─▶ 25 design ─▶ 30 tickets      │              │
   │ └─────────────────────────────────────────────────────┘              │
   │ /clear ─▶ /next-task (40 implement + 50 PR) per ticket ─▶ 60 close  │
   └─────────────────────────────────────────────────────────────────────┘
```

| # | Prompt | Who runs it | Skills and agents | Output |
| --- | --- | --- | --- | --- |
| 00 | `00-setup-once.md` | main session, then you run the wizard | wizard | accounts for Clerk, Convex, Vercel, NVIDIA, LangSmith and Hugging Face |
| 05 | `05-architecture-review.md` | main session → architect, designer, rai-reviewer, code-reviewer | 120x-architect, codebase-design, grilling, engineering:architecture (ADRs) | `docs/reviews/architecture.md` and fixes |
| 10 | `10-grill-slice.md` | main session (architect role) | **/grill-with-docs** (grilling + domain-modeling), codebase-design | shared understanding, plus `CONTEXT.md` and ADR updates |
| 20 | `20-spec-slice.md` | same session | **/to-spec** | slice spec issue `V<n> spec: …` |
| 25 | `25-design-slice.md` | same session → architect, designer | codebase-design, the Stitch skills | "Design: modules and screens" comment on the spec |
| 30 | `30-tickets-slice.md` | same session | **/to-tickets** | tickets as sub-issues, with blocking edges |
| 40 | `40-implement-ticket.md` (via `/next-task`) | a fresh subagent per ticket, of the owning role | tdd, convex-reviewer, code-review; `plan-first` uses writing-plans + subagent-driven-development; `ready-for-human` uses wizard | branch, commits, local review |
| 50 | `50-pr-and-review.md` | same session as 40 | finishing-a-development-branch, receiving-code-review | PR, the Architect's manual review (D-10), fixes, a squash-merge by the Architect |
| 60 | `60-close-slice.md` | main session → reviewers | /review-phase, 120x Builder Review, then optionally **/improve-codebase-architecture** | `docs/reviews/<slice>.md`, updated `planning/STATE.md` |

**Bold** skills are slash-only (`disable-model-invocation`). They only run when the message **starts** with the command, so paste those prompts as the first line of a message. Claude and its subagents can't start them for you.

**How to use a prompt:**
1. Open a **fresh** Claude Code session for 00, 05, the 10–30 block, each `/next-task`, and 60.
2. Paste the block from the prompt file, replacing `<SLICE>` (for example `V0`) or `<ISSUE>` (for example `#12`).
3. Run 10, 20, 25 and 30 in **one** session so the grilling stays in context. Otherwise use `/clear` between prompts. GitHub issues and `planning/STATE.md` carry the context from one session to the next.
4. Not sure which skill fits a situation? Type `/mattpocock-skills:ask-matt <what's happening>`.

## V0 run order (scaffold)

1. `00` → run `scripts/wizards/00-setup-once.sh` in Git Bash → paste its summary back.
2. `05`, answer the grilling questions, and let it commit the fixes.
3. One session: `10` V0 → `20` V0 → `25` V0 → `30` V0. The expected tickets are in `planning/slices/V0.md`: the monorepo scaffold, the Next.js shell, Convex `users`, wiring the keys (you, with a wizard), and the sign-in round trip.
4. `/clear`, then `/next-task` once per ticket, reviewing and merging each PR yourself when it says "PR ready for review".
5. `60` V0.

**Before Sunday:** only 00, 05, 10, 20, 25 and 30 are run (specs are allowed as preparation). 40, 50 and 60 are for build day.
