---
description: Write docs/handoff/<task-id>.md — what changed, how to verify, which acceptance criteria pass, and what the next agent needs
argument-hint: "<task-id, e.g. P2.1>"
---

# /handoff

Task: `$ARGUMENTS`. If no task id was given, use the task you just worked on.

Write `docs/handoff/<task-id>.md` using the template below. Fill it from **real evidence** in this session: the diff, command output and test results. Do not describe work that wasn't done. If something was skipped or failed, say so.

Use `git diff --stat` and `git status` to list the files.

```markdown
# <task-id> — <short title>

- **Status:** done | partial | blocked
- **Agent(s):** <roles>
- **Date:** <YYYY-MM-DD HH:MM>
- **Commit:** <sha or "uncommitted">

## What changed
- <file or area>: <one line>

## How to verify
1. <exact command or phone step>
2. ...

## Acceptance criteria
| Story | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| US-x.y | ... | ✅ / ❌ / ⏭ manual | <output snippet, test name, or screenshot path> |

## Contracts / interfaces introduced
<types, endpoints, payload shapes other roles now depend on — or "none">

## Env vars / manual setup
<new env vars (names only, never values), dashboard steps done or still needed>

## Open issues / blockers
- <issue> — owner: <role>

## Notes for the next task
<what the next agent must know>
```

If this task used anything prepared before build day, add it under **Notes** so it can go on the project card (PRD US-6.3).
