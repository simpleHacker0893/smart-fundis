# 05 — Break V1 into tickets

Same session A, after 04. Send it as a new message that starts with the slash command.

```
/mattpocock-skills:to-tickets Slice: V1. Spec issue: <ISSUE>

- Cut along the module map and screens in the "Design: modules and screens" comment on <ISSUE>.
- Tracer-bullet vertical slices, each demoable. Put prefactoring first. Each ticket takes 30–90 minutes and fits one fresh context window.
- A suggested order, which you should refine:
  1. the schema and seed (Trades, Rubrics, one Expert), with rai-reviewer checking the Rubric text
  2. the claim/callback HTTP actions and the cron (**plan-first**)
  3. the stub worker
  4. the Fundi record flow and consent
  5. upload and the live status
  6. the Assessment result view (the AI Observations and the Nemotron recommendation)
  7. the Expert queue and review with decide
  8. the Badge derivation and the unstyled /f/[id]
  9. `/dashboard` role routing and the role dashboard shells
  10. the minimal Admin
  11. Playwright for the MVP loop at 360 px
  12. the real-phone upload check (**ready-for-human**)
- Labels: ticket, slice:v1, and ready-for-agent or ready-for-human. plan-first on the claim/callback contract. Name the owner in each body: convex, auth, frontend, ai-pipeline or qa.
- Acceptance criteria are checkable and quote the PRD story IDs (US-3.x, 4.1, 5.x).
Show me the breakdown and the blocking edges, and iterate until I approve. Then publish them as sub-issues of <ISSUE> with native blocked_by links. List the frontier. Tell me to /clear and run prompt 06.
```
