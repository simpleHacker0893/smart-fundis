# V2-30 — Cut Version 2 into slice briefs (V7 onwards)

Fresh session. It writes the `planning/slices/V<n>.md` briefs that prompts 10–30 later turn into spec issues and tickets.

```
Use anthropic-skills:120x-architect to plan the next sprint folders, and mattpocock-skills:codebase-design to
check the module seams. Planning only: change no code.

Inputs: the approved V2 spec in docs/superpowers/specs/, docs/reviews/v2-architecture.md, the ADRs, the D-/R-/Q-
rows, CONTEXT.md, and planning/slices/V6.md as the format to copy exactly (header lines, "Demo at the end",
the tickets table, "Stitch screens the designer must produce", "Grill focus", "Risky tickets that need a plan
first", "Human steps").

Cut V2 into vertical slices numbered from V7. Each slice must have a demo a person can do on a phone at
360 px. Start from this hypothesis and change it where the spec says otherwise:
- V7 Role dashboards: /dashboard routing per role; the Fundi dashboard (verification status, the "Add video"
  sheet with record/upload vs YouTube/TikTok Showcase, profile completeness, Listing status); the Expert
  dashboard (queue and history); the Admin dashboard (plain shadcn). No new marketplace data yet.
- V8 Client accounts and Job posts: the Client role, the Client dashboard, posting a Job (Trade, task, county,
  area, optional photos with the consent rules, and a budget labelled "set by the client"), my Jobs, and
  moderation and Reports for Jobs.
- V9 Location and proximity: the location model, the map on /fundis and the Job board, distance ranking with
  verification, and location privacy settings.
- V10 Jobs for Fundis: "Jobs near me" by Trade, expressing interest or quoting, the Client shortlist, and contact
  under ADR-21 rules.
- V11 (only if the spec put it in V2) M-Pesa, plus a Nemotron job-post assistant if the spec approved it.

For each slice: the lane and owners (AGENTS.md folder ownership), "Blocked by", the tickets table (30–90 min
tickets; plan-first on the risky ones; ready-for-human for Stitch, Daraja, map keys and real-phone checks),
the Stitch screens (numbered from 24, continuing design/stitch/prompts/), the grill focus, and the human steps.
Add the cross-slice blocking edges.

Also update: planning/STATE.md (the V2 track and the next action); the /roadmap plan (which "Coming soon"
items move to live, and in which slice), listed but not edited; and planning/prompts/v2/README.md with the
real slice list.

Show me the slice list and edges first, then the briefs. Iterate until I approve. Commit on docs/v2-spec.

Then tell me to run V2-40 (design) in a fresh session. V2-40 can run in parallel with V7's prompt 10.
```
