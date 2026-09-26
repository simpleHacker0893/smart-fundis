# 11 — Turn the jobs map into slices

Same session B, once every wayfinder decision ticket is resolved. Send it as a new message that starts with the slash command.

```
/mattpocock-skills:to-spec V7 spec: Jobs marketplace. Labels: spec, slice:v7, ready-for-agent.
Collapse the resolved wayfinder decision tickets into one buildable spec. Include:
- user stories for the Client, Fundi, Expert and Admin
- the data model (clients, jobs, jobResponses/quotes, geo index), and the Convex functions with role checks
- the ranking formula
- the geo/privacy rules
- the payment stance
- the AI helper boundaries
- the testing seams, and the Out of Scope list
Add ADRs for the geo index, the matching and the payment stance where the three ADR tests are met.
```

Then:

```
Split V7 into slices, each demoable on its own. For example:
- V7a Client accounts and posting a job
- V7b the Fundi job feed by county and area
- V7c proximity and map
- V7d quotes and response
- V7e trust and safety and moderation
- V7f payments (if in scope)
Write planning/slices/V7a.md onward in the V6.md format: demo, scope, blocked by, grill focus, risky tickets, and the Stitch screens needed.
For each slice: run the normal loop, planning/prompts/10-grill-slice.md → 20 → 25 → 30, then /next-task, then 60. The designer makes the Stitch screens in each slice's prompt 25, with the same honesty rules.
Commit on `plan/v7-jobs`, push, and open a docs PR.
```

**Skills:** **/mattpocock-skills:to-spec**, **/mattpocock-skills:to-tickets** (per slice, via prompt 30), engineering:architecture.
