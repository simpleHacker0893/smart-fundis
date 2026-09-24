# 40 — Implement one ticket

Use `/next-task` to pick the frontier ticket automatically, or paste this with an explicit issue number.

```
Ticket: <ISSUE>

1. Run `gh issue view <ISSUE> --comments` and read the parent spec issue. Check that every "Blocked by" issue is
   closed. If one isn't, stop and tell me.
2. Claim it: `gh issue edit <ISSUE> --add-assignee @me`. Branch from main: `v<n>/<ISSUE#>-<slug>`.
3. If the ticket is labelled `ready-for-human`, write numbered steps for me with /mattpocock-skills:wizard,
   wait for me to confirm each one, then go to step 6.
4. If the ticket is labelled `plan-first`, use superpowers:writing-plans to write
   docs/superpowers/plans/<date>-<slug>.md, show it to me, then run it with
   superpowers:subagent-driven-development.
   Otherwise, dispatch a fresh subagent of the owning role (AGENTS.md) with:
   "Run /mattpocock-skills:implement on issue <ISSUE>. Work test-first at the seams named in the spec
   (/mattpocock-skills:tdd). Typecheck and run each test file as you go, and the full suite at the end.
   Fetch live docs before using any API. Use the CONTEXT.md terms. Commit to the current branch."
5. When the subagent finishes, run /mattpocock-skills:code-review against main, checking standards
   (AGENTS.md) and the spec (the ticket's acceptance criteria). Fix every finding that holds up, then re-run it.
6. Run superpowers:verification-before-completion: run the checks and paste the real output for every
   acceptance criterion.
7. Write docs/handoff/<ISSUE#>.md with /handoff, then continue with prompt 50.
```
