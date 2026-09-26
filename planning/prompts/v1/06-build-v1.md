# 06 — Build V1, one ticket per session

Open a fresh session per ticket and type:

```
/next-task
```

It picks the next unblocked, unassigned V1 ticket, then runs `planning/prompts/40-implement-ticket.md` and `50-pr-and-review.md`. It stops at "PR ready for review", and you review and merge.

To force a specific ticket, use `/next-task <issue#>`.

## Which agent owns what (prompt 40 dispatches it)
| Ticket kind | Agent | Skills the agent loads |
| --- | --- | --- |
| schema, queries, mutations, crons, HTTP actions | `convex` (and then `convex:convex-reviewer`) | convex:design, convex:convex-authz, convex:test, convex:crons, mattpocock-skills:tdd |
| routing, roles, onboarding, auth guards | `auth` | clerk-nextjs-patterns, convex:auth, clerk-testing |
| dashboards and screens from the Stitch exports | `frontend` | anthropic-skills:nextjs-expert, vercel-react-best-practices, web-design-guidelines, stitch-build:shadcn-ui |
| the stub worker and AI contract fixtures | `ai-pipeline` | langchain-skills:langchain-fundamentals, mattpocock-skills:tdd |
| Playwright e2e and the 360 px checks | `qa` | clerk-testing, convex:test, web-design-guidelines |
| a plan-first ticket (claim/callback) | a plan, then subagents | superpowers:writing-plans, then superpowers:subagent-driven-development |
| a ready-for-human ticket (real phone) | you | mattpocock-skills:wizard writes the steps |

## House rules every build session keeps
- pnpm only. Secrets only in the root `.env`. Never `convex deploy`; push to dev with `pnpm exec convex dev --once`.
- Test-first at the spec seams. Check each of `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` by its exit code.
- Save memory: one heavy agent at a time on the main checkout, and no stray dev servers. Use a worktree for parallel work.
- Leave your own uncommitted files (AGENTS.md, CLAUDE.md, skills-lock.json, .agents/) unstaged.
