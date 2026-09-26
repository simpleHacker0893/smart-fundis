# V2-25 — Review the V2 architecture

Fresh session. It mirrors prompt 05, but for the V2 spec.

```
Review the Version 2 design before any slice is cut. Planning only: change no code.

Inputs: docs/superpowers/specs/<DATE>-v2-marketplace-design.md, the new ADRs in docs/adr/ (0023+), the new
D-/R-/Q- rows, CONTEXT.md, the V2 research in docs/research/, and the MVP architecture spec.

Use superpowers:dispatching-parallel-agents to run these reviewers at the same time. Give each one the paths
above and tell it to report findings as blocker / should-fix / nit, with file:line references:

1. rai-reviewer: PRD §8 against V2. Client-account and Job-post consent, location precision and fuzzing, AI
   output shown to each role (ADR-11, "the AI recommends"), honesty wording ("verified by Smart Fundis", "not
   verified" labels on Rates, budgets and Showcase links), children and third parties in Job photos, the
   Kenya DPA and ODPC findings from the research, and whether anything looks live that isn't.
2. convex:convex-reviewer, then code-reviewer: the data model, indexes, the geo approach, server-side role
   checks for the new Client role, rate limits on Job posts and contact, and whether every write path calls
   syncListing (R-16).
3. architect: interfaces between web/, convex/ and ai-service/. Does Nemotron job-structuring fit the pull
   model (ADR-9: no inbound port on Brev)? Is the slice order safe? Are any seams missing from spec §10?
4. designer: can every screen in the spec be built with the Instrument system (D-9), mobile-first at 360 px,
   and with a map that works on a low-end Android phone on 3G?

Then use mattpocock-skills:grilling on me for every blocker that needs a decision. Write
docs/reviews/v2-architecture.md (findings, decisions and fixes), apply the agreed fixes to the spec, ADRs and
planning files, and commit on the docs/v2-spec branch.

Then tell me to open a fresh session and run V2-30.
```
