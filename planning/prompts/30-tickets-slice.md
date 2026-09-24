# 30 — Break the slice into tickets

```
Slice: <SLICE>. Spec issue: <ISSUE>

Run /mattpocock-skills:to-tickets on <ISSUE>.
- Tracer-bullet vertical slices only. Each ticket goes through UI, Convex and ai-service as needed,
  can be demoed or checked on its own, and fits in one fresh context window.
- Put any prefactoring first.
- Size tickets for a hackathon day: 30–90 minutes each. Aim for 3–7 tickets per slice.
- Label each ticket: ticket, slice:<slice>, and either ready-for-agent or ready-for-human (for dashboard,
  secrets, real phone or Stitch runs). Add plan-first to the risky tickets listed in planning/slices/<SLICE>.md.
- Name the owning role from AGENTS.md in each ticket body ("Owner: convex + frontend").
- Acceptance criteria must be checkable, and must quote the PRD story IDs.
- Show me the breakdown and blocking edges, and iterate until I approve it. Then publish the tickets as
  sub-issues of <ISSUE> with native blocked_by dependencies (docs/agents/issue-tracker.md).

Finish by listing the frontier: the tickets that can start now.
```
