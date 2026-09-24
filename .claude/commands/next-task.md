---
description: Find the next unfinished task (P0 … P6.1), load its prompt, and run it with the right role subagents
argument-hint: "[task-id, e.g. P3.1 — optional, defaults to the next unfinished task]"
---

# /next-task

Task override: `$ARGUMENTS`

1. **Find the task.**
   - If a task id was given above, use it.
   - Otherwise list `docs/handoff/` and compare it with the task order in `docs/PRD.md` §9: P0, P1.1, P2.1, P2.2, P2.3, P3.1, P3.2, P4.1, P4.2, P4.3, P4.4, P5.1, P6.1. The next task is the first one with no `docs/handoff/<id>.md` whose `Status:` is `done`.
2. **Check for blockers.**
   - Moving to a new phase (for example from P2.3 to P3.1) requires `docs/reviews/phase-<N>.md` for the previous phase with no open `blocker` findings. If blockers are open, stop and tell me to run `/fix-review`.
   - Also stop if the previous handoff lists unresolved blockers.
3. **Load context.** Read these files:
   - `AGENTS.md`
   - `docs/PRD.md` (the stories for this phase)
   - `docs/prompts/<id>.md`
   - the most recent handoff file
4. **Plan.** State the task, the owning role(s), the acceptance criteria you are targeting, and the files you expect to touch. Keep it to a few lines.
5. **Execute.** Delegate to the subagent(s) named in the prompt file's `Agents:` line.
   - If two roles are listed, run them in the order given. Pass each one the contract or interface from the previous step.
   - If a task needs a human, such as Clerk dashboard steps, Brev console steps, a real phone, or secrets, stop and give me exact numbered steps.
6. **Verify.** Run the checks in the prompt file's "Done when" section and capture the real output.
7. **Handoff.** Run the `/handoff <id>` steps to write `docs/handoff/<id>.md`.
8. **Commit.** Stage only this task's files and commit with the message `<id>: <short summary>`. Do not push.

Finish by telling me what's next: the next task id, or `/review-phase <N>` if this was the last task in a phase.
