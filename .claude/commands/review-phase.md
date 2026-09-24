---
description: Review a finished phase with code-reviewer, rai-reviewer and qa in parallel; write docs/reviews/phase-<N>.md
argument-hint: "<phase number 1-6>"
---

# /review-phase

Phase: `$ARGUMENTS`

1. **Collect scope.**
   - Read `docs/PRD.md` §6 for Phase `$ARGUMENTS` and every `docs/handoff/P$ARGUMENTS.*.md` file.
   - Find the commit range for this phase. It starts at the first commit whose message begins with `P$ARGUMENTS.` and runs to HEAD.
2. **Run three reviewers in parallel** as subagents, giving each the phase number, the commit range and the handoff files:
   - **code-reviewer**: security, correctness, Convex practice, i18n completeness and type check.
   - **rai-reviewer**: the PRD §8 checklist for what this phase touches.
   - **qa**: every acceptance criterion in this phase. Run the automated checks and list the manual phone steps.
3. **Merge the results** into `docs/reviews/phase-<N>.md` in this format:

```markdown
# Phase <N> review — <date>

**Commit range:** <base>..<head>
**Verdict:** PASS | PASS WITH FIXES | BLOCKED

## Acceptance criteria (from qa)
| Story | Criterion | Result | Evidence |

## Responsible-AI checklist (from rai-reviewer)
| Item | Result | Evidence |

## Findings
| ID | Severity | Source | File:line | Issue | Suggested fix | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R<N>-1 | blocker/major/minor | code/rai/qa | ... | ... | ... | open |

## Manual checks still needed
- [ ] <phone step>
```

4. **Deduplicate and rank.** Merge findings that more than one reviewer raised. Drop any finding that has no file:line and no concrete failure scenario. Sort blockers first.
5. **Set the verdict.**
   - Any `blocker` means **BLOCKED**.
   - Only `major` or `minor` findings means **PASS WITH FIXES**.
   - No findings means **PASS**.
6. Tell me the verdict and the finding count by severity. If fixes are needed, say `/fix-review <N>`.

Do not edit product code in this command.
