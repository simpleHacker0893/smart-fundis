# Version 2 planning: dashboards, jobs and proximity

Version 1 is the MVP: slices V0–V6 in `planning/slices/`. Version 2 turns Smart Fundis from "prove and be found" into a small-jobs marketplace:

- a **dashboard for every role**: Fundi, Client, Expert and Admin
- **Fundi video input** from three sources: in-app record or upload (the only one that can earn a Badge), a YouTube link or a TikTok link (Showcase only, ADR-7)
- **Clients with accounts** who post small jobs for a Trade in a place
- **Fundis finding jobs** near them, by Trade
- **proximity**: county, area, map and distance, ranked with verification status and price
- (probably later) **M-Pesa**

The V2 slices are numbered **V7 onwards**, so they don't clash with the V0–V6 briefs.

> **This track is planning only.** Prompts V2-00 to V2-40 write research, specs, ADRs, slice briefs and Stitch prompts. They change no code in `web/`, `convex/` or `ai-service/`. Code starts with the normal 40/50 loop, once a V2 slice has its spec issue and tickets.

## Decisions V2 will deliberately reopen

The V2 grill must supersede these on the record, with new ADRs and D-numbers, not just ignore them:

| Current rule | Where | What V2 wants |
| --- | --- | --- |
| Clients have no account | D-2, D-18, D-24, `CONTEXT.md` "Client" | Client accounts, a Client dashboard and job posts. **Decided 2026-09-26 (D-30):** Clients have accounts, every role signs in, and the demo has Demo Clients with mock data (D-31) |
| No geohash, maps or distance | ADR-6 (PRD), D-18, find-a-fundi spec §OD-3 | a map, "near me" and distance ranking |
| Bookings, M-Pesa and Client accounts are Roadmap-only | AGENTS non-negotiable, `CONTEXT.md` "Roadmap", spec §12 | move some of them from `/roadmap` to live |
| Rates are never sorted or compared | `CONTEXT.md` "Rates" | the user wants "pricing should matter". Grill whether a Client may *filter by* a budget without Smart Fundis *ranking by* price |
| YouTube/TikTok are Showcase only | ADR-7, D-26 | **keep this.** Links are showcase inputs on the dashboard and are never downloaded or assessed |

**Also decided on 2026-09-26:** the UI ships in English and Kiswahili (D-29), and Nemotron is self-hosted with vLLM on Brev (D-32).

Unchanged in V2: the AI recommends and only an Expert creates a Badge; ADR-11; "verified by Smart Fundis", never "certified"; masked LangSmith traces; no inbound port on Brev; pnpm (D-12); one root `.env` (D-13).

## Run order

```
V2-00 research (background) ──┐
                              ▼
V2-10 grill the V2 scope ─▶ V2-20 V2 spec + ADRs ─▶ V2-25 architecture review
        (one session)                                          │
                              ┌────────────────────────────────┘
                              ▼
V2-30 cut V2 into slice briefs (V7…) ─▶ V2-40 dashboard design system + Stitch prompts
                              │
                              ▼
for each V2 slice: the normal loop, 10 ▶ 20 ▶ 25 ▶ 30 ▶ /next-task (40+50) ▶ 60   (see V2-50)
```

| # | Prompt | Session | Agents | Skills | Output |
| --- | --- | --- | --- | --- | --- |
| V2-00 | `V2-00-domain-research.md` | any, runs in the background | general-purpose (research) | `/mattpocock-skills:research`, `nvidia-skill-finder` | `docs/research/2026-09-26-kenya-domain-research.md`, plus an NVIDIA fit note |
| V2-10 | `V2-10-grill-v2-scope.md` | **fresh** session, first message | main session in the architect role | **`/mattpocock-skills:grill-with-docs`**, `superpowers:brainstorming`, `mattpocock-skills:domain-modeling` | a shared understanding, `CONTEXT.md` terms, answered questions in `planning/QUESTIONS.md` |
| V2-20 | `V2-20-v2-spec-and-adrs.md` | same session as V2-10 | architect, convex:convex-expert (a feasibility check) | `anthropic-skills:120x-architect`, `engineering:architecture`, `mattpocock-skills:codebase-design`, `superpowers:writing-plans` | `docs/superpowers/specs/<date>-v2-marketplace-design.md`, ADR-23+, D-29+, R-/Q- rows |
| V2-25 | `V2-25-v2-architecture-review.md` | **fresh** session | architect, rai-reviewer, code-reviewer, convex:convex-reviewer, designer | `mattpocock-skills:grilling`, `engineering:architecture` | `docs/reviews/v2-architecture.md`, with its fixes applied |
| V2-30 | `V2-30-v2-slice-briefs.md` | **fresh** session | architect | `anthropic-skills:120x-architect`, `mattpocock-skills:codebase-design` | `planning/slices/V7.md` … `V<n>.md`, `planning/STATE.md` |
| V2-40 | `V2-40-dashboard-design.md` | **fresh** session | designer (runs Stitch), frontend (feasibility), rai-reviewer (copy) | Stitch skills, `design:ux-copy`, `design:accessibility-review`, `web-design-guidelines`, `vercel-composition-patterns` | `design/stitch/DESIGN.md` §Dashboards, `design/stitch/prompts/24-…`, exports after each checkpoint |
| V2-50 | `V2-50-per-slice-loop.md` | per slice | owning roles | the prompts 10–60, plus V2-specific skills | spec issue, tickets, PRs, `docs/reviews/V<n>.md` |

**Bold** skills are slash-only. Paste the block as the **first line of a new message**, exactly as with prompts 10, 20 and 30.

## How to paste
1. Replace `<DATE>` with today's date, `<SLICE>` with a slice id such as `V7`, and `<ISSUE>` with a spec issue such as `#40`.
2. Run V2-10 and V2-20 in **one** session so the grilling stays in context. Use `/clear` or a fresh session for everything else. The files each prompt writes carry the context between sessions.
3. Every prompt ends by telling you which prompt comes next.
