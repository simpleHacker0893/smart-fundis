# 30 — Break the slice into tickets

Run this in the **same** session as 10, 20 and 25. Send it as a new message that starts with the slash command.

```
/mattpocock-skills:to-tickets Slice: <SLICE>. Spec issue: <ISSUE>

- Read the "Design: modules and screens" comment on <ISSUE>, and cut along those module and screen boundaries.
- Tracer-bullet vertical slices only. Each ticket goes through the UI, Convex and ai-service as needed,
  can be demoed or checked on its own, and fits in one fresh context window.
- Put any prefactoring first.
- Size the tickets for a hackathon day: 30–90 minutes each, and 3–7 tickets per slice.
- Label each ticket: ticket, slice:<slice>, and either ready-for-agent or ready-for-human (dashboards,
  secrets, a real phone, or Stitch runs). Add plan-first to the risky tickets listed in planning/slices/<SLICE>.md.
- Name the owning role from AGENTS.md in each ticket body ("Owner: convex + frontend").
- The acceptance criteria must be checkable, and must quote the PRD story IDs.
- Show me the breakdown and the blocking edges, and iterate until I approve them. Then publish the tickets as
  sub-issues of <ISSUE>, with native blocked_by dependencies (docs/agents/issue-tracker.md).

Finish by listing the frontier: the tickets that can start now. Tell me to /clear and run /next-task.
```
