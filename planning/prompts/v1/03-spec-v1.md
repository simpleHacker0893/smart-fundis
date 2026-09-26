# 03 — Write the V1 spec

Same session A, straight after 02. Send it as a new message that starts with the slash command.

```
/mattpocock-skills:to-spec V1 spec: Role dashboards on the MVP loop. Labels: spec, slice:v1, ready-for-agent.

- Use the CONTEXT.md vocabulary. Follow ADR-7, ADR-10, ADR-11, ADR-18, ADR-19, the D-29+ decisions from step 01, and the architecture spec.
- Implementation Decisions must include every contract V1 adds or uses:
  - schema tables: fundiProfiles (minimal), experts, trades, rubrics, assessments, reviews, auditLog
  - `generateUploadUrl`, `assessments.create`, `newLivenessCode`, `listMine`, the detail query
  - `/ai/claim` and `/ai/callback` (the full spec §6 contract), and the requeue/fail cron
  - `reviews.queue`, `reviews.decide` and `canDecide`, the Badge derivation, and `users.me` → role routing
  - the stub worker's canned results
  - for each dashboard route: the data it reads and the actions it takes
- Testing Decisions: one test per edge case settled in 02. The seams (spec §10): convex-test, the HTTP actions, the stub worker, and Playwright at 360×740 for the MVP loop.
- Out of Scope names the owners: the V6 discovery core, the V7 jobs marketplace, V2 real AI, V3 styling already done, and V4 appeals/deletion/overrides.
After publishing, add the link to planning/slices/V1.md under "Spec issue". Tell me to run prompt 04 in this same session.
```
