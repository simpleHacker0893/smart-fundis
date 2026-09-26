# V2-50 — Run each V2 slice through the normal loop

Once `planning/slices/V7.md` (and so on) exist, every V2 slice uses the same prompts as V0–V6. This file lists the order, and the extra instructions to append for V2.

## Order per slice

| Step | Prompt | Session | Append this for V2 |
| --- | --- | --- | --- |
| 1 | `../10-grill-slice.md` with `<SLICE>` = `V7` | fresh, first message | "Also read the V2 spec, docs/reviews/v2-architecture.md and the V2 research. The V2 ADRs (0023+) are settled; don't reopen them unless a fact contradicts one." |
| 2 | `../20-spec-slice.md` | same session | "Label also `version:2`. Every Job/location/price contract names the ADR it implements." |
| 3 | `../25-design-slice.md` | same session | "The designer uses the V2-40 exports and the DESIGN.md Dashboards section. A missing screen gets a prompt numbered after the last one in design/stitch/prompts/." |
| 4 | `../30-tickets-slice.md` | same session | "Map keys, Daraja sandbox and ODPC steps are `ready-for-human` tickets that use mattpocock-skills:wizard." |
| 5 | `/clear`, then `/next-task` per ticket (runs 40 + 50) | fresh per ticket | nothing extra. `/next-task` picks the owning role's agent |
| 6 | `../60-close-slice.md` | fresh | "rai-reviewer also checks the V2 privacy table and location precision on a real phone." |

## Agents and skills by V2 ticket type

These are the owning agents from AGENTS.md. Tell every subagent to use **pnpm** and the **root `.env`**.

| Ticket type | Agent | Skills to load |
| --- | --- | --- |
| Dashboard routes, shell, role switch | frontend (+ auth for routing) | `vercel-composition-patterns`, `vercel-react-best-practices`, `anthropic-skills:nextjs-expert`, `stitch-build:shadcn-ui`, `clerk-nextjs-patterns`, `mattpocock-skills:tdd` |
| Client role, derived roles, `/dashboard` routing | auth + convex | `clerk-nextjs-patterns`, `convex:auth`, `convex:convex-authz`, `clerk-testing` |
| Jobs schema, lifecycle, rate limits, crons (expiry) | convex / convex:convex-expert | `convex:design`, `convex:convex-authz`, `convex:crons`, `convex:test`, `convex:migrate` (if tables change), then the `convex-reviewer` subagent |
| Geo index and proximity search | convex (plan-first) | `convex:design`, `convex:add` (geospatial component), `convex:test`, `convex-optimize` |
| Map UI | frontend | `vercel-react-best-practices` (lazy-load the map), `web-design-guidelines`, `design:accessibility-review` |
| Nemotron job structuring / AI evidence in dashboards | ai-pipeline + convex | `langchain-skills:langgraph-fundamentals`, `langchain-skills:eval-engineering`, `nvidia-skill-finder`, `langsmith-trace` (masked, D-14) |
| M-Pesa (only if in scope) | convex + gpu-devops for secrets | `mattpocock-skills:wizard` (Daraja sandbox), `convex:env`, `convex:test`; a `plan-first` ticket |
| Stitch screens | designer / stitch-onboarding pattern | the V2-40 skill list |
| Phase review | qa, rai-reviewer, code-reviewer | `/review-phase`, `clerk-testing`, `convex:test`, `web-design-guidelines` |

## After the last V2 slice
Run `../60-close-slice.md` for the final slice, then ask the architect to update `/roadmap` (via a frontend ticket) so nothing live is still tagged "Coming soon", and nothing tagged "Coming soon" is live.
