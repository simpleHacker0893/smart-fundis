---
description: Find the next unchecked task in the current phase's plan, run it with the right role subagents, write the handoff and commit
argument-hint: "[task id from the plan, e.g. 1.3 — optional, defaults to the next unchecked task]"
---

# /next-task

Task override: `$ARGUMENTS`

1. **Find the plan and the task.**
   - The current plan is the newest file in `docs/superpowers/plans/`.
   - If a task id was given above, use it. Otherwise take the first task in the plan whose checkbox is not ticked.
   - If there is no plan for the current phase, stop. Tell me to brainstorm it first (`superpowers:brainstorming`, then `superpowers:writing-plans`).
2. **Check for blockers.**
   - Starting a new phase requires `docs/reviews/phase-<N>.md` for the previous phase with no open `blocker` findings. If blockers are open, stop and tell me to run `/fix-review`.
3. **Load context.** Read `AGENTS.md`, `CONTEXT.md`, the phase spec in `docs/superpowers/specs/`, the plan, and the most recent file in `docs/handoff/`.
4. **Execute** with `superpowers:subagent-driven-development`.
   - Delegate to the role subagent that owns the files (see the folder ownership table in `AGENTS.md`), and work test-first (`mattpocock-skills:tdd`).
   - If the task needs a human, such as a Clerk, Convex or Brev dashboard step, secrets, a real phone, or running a Stitch prompt, stop and give me exact numbered steps.
5. **Verify.** Run the task's checks and capture the real output (`superpowers:verification-before-completion`).
6. **Handoff.** Tick the task in the plan, then run the `/handoff <id>` steps.
7. **Commit.** Stage only this task's files and commit with the message `<id>: <short summary>`. Do not push.

Finish by telling me what's next: the next task id, or `/review-phase <N>` if the plan is complete.
