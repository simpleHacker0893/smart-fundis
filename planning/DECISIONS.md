# Decisions

These are house rules. Don't reopen one silently. If one looks wrong, propose a new decision that replaces it. Full reasoning lives in `docs/PRD.md` §2 (ADR-1 to ADR-17), `docs/adr/` (ADR-18 onwards), and the architecture spec.

| # | Decision | Where |
| --- | --- | --- |
| ADR-1 | Next.js App Router PWA, shadcn and Tailwind on Vercel. Convex is the system of record. | PRD §2 |
| ADR-2 | The AI service is FastAPI, LangGraph and LangChain on Brev. | PRD §2 |
| ADR-3/12 | Cosmos Reason 2 8B (with a 2B fallback) runs on vLLM on a Brev H100. | PRD §2 |
| ADR-4 | Nemotron runs through the hosted NVIDIA API via `ChatNVIDIA`. | PRD §2 |
| ADR-5 | Redis and Celery, with `QUEUE_MODE=inline` as the fallback. | PRD §2 |
| ADR-7 | YouTube and TikTok links are showcase only and are never downloaded. | PRD §2 |
| ADR-8 | Videos are stored in Convex storage. | PRD §2 |
| ADR-9 | Brev pulls jobs from Convex and has no inbound port. | PRD §2 |
| ADR-10 | Recording uses the phone's own camera (`<input capture>`), with a Liveness code. Amended by ADR-19. | PRD §2 |
| ADR-11 | A safety item marked `no` or `unclear`, or a failed liveness check, caps the Verdict at `needs_review`. Amended by ADR-19. | PRD §2 |
| ADR-13 | LangSmith traces are masked. | PRD §2 |
| ADR-14 | Eval clips are labelled blind and faults are staged. | PRD §2 |
| ADR-15 | Monorepo with `web/`, `convex/` and `ai-service/`. | PRD §2 |
| ADR-16 | Clerk with email and Google. The phone number is collected in onboarding. | PRD §2 |
| ADR-17 | `next-intl`. **Amended:** the UI is English only for now, except that consent ships in English and Kiswahili. | PRD §2, spec §8 |
| ADR-18 | Roles are derived in Convex, with no copy in Clerk metadata. `/dashboard` does the routing, and the admin check needs a verified email. | `docs/adr/0018-derived-roles.md` |
| ADR-19 | The Liveness code is written on paper, read by Cosmos without being told the expected code, and compared in `rules.py`. | `docs/adr/0019-paper-liveness-code.md` |
| D-1 | Badges are derived from approved Assessments, with no tiers. The public profile shows nothing until an Expert approves. | spec §5 |
| D-2 | Clients have no account in the MVP. `/fundis` lists Verified Fundis only. | spec §2 |
| D-3 | A reshoot or a failure creates a new Assessment with a new code. After two failed attempts the Assessment is `failed`. | spec §5 |
| D-4 | Appeals are allowed once, against `rejected` only, with a reason. A different Expert decides, or an Admin if there isn't one. | spec §5 |
| D-5 | The Data Co-op is a Roadmap item and is kept apart from consent. `coopInterest` means "contact me" only. | spec §7 |
| D-6 | Build in vertical slices V0–V5, with a stub worker in V1. | spec §9 |
| D-7 | GitHub Issues is the tracker. One PR per ticket, reviewed by Claude in CI, and squash-merged by the Architect. | spec §11 |
| D-8 | The guard accepts 10–90 s for the MVP. Test clips are the team's own recordings plus licensed Pexels footage. | spec §6, §10 |
