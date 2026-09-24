# Smart Fundis — Agent Rules

Every agent (Claude Code session, subagent, Cursor, Copilot) follows these rules. `CLAUDE.md` points here.

## Source of truth

- **Product spec:** `docs/PRD.md`. User stories and acceptance criteria are in §6, the data model is in §7, and the Responsible-AI checklist is in §8.
- **Current task:** `docs/prompts/<task-id>.md`. Each task has one file, P0 to P6.1, run in order.
- **Progress:** `docs/handoff/`. There is one file per finished task. Read the latest one before you start.
- **Reviews:** `docs/reviews/`. Open findings there block the next phase.

## Working rules

1. Read `docs/PRD.md` and the current phase's user stories before writing code.
2. Fetch live docs (llms.txt or MCP) before using any API. Do not rely on memory for Convex, Clerk, LangGraph, vLLM or NVIDIA APIs.
3. Every Convex function checks the caller's identity and role on the server.
4. No secrets in `web/` or in Convex client code. `NVIDIA_API_KEY` lives only on the Brev box.
5. Every user-visible string goes through `next-intl` with both `en` and `sw` keys.
6. Finish each task with: what changed, how to verify it, and which acceptance criteria now pass. Write it to `docs/handoff/<task-id>.md` with `/handoff`.
7. Stay inside your role's folders unless the Architect assigns cross-cutting work.

## Folder ownership

| Folder | Owner | Others may |
| --- | --- | --- |
| `web/` | frontend, auth (`web/proxy.ts`, sign-in pages, onboarding) | read |
| `convex/` | convex, auth (`auth.config.ts`, `users.ts`) | read |
| `ai-service/app/` | ai-pipeline | read |
| `ai-service/{scripts,worker,poller}`, infra | gpu-devops | read |
| `ai-service/eval/`, `web/e2e/` | qa | read |
| `docs/`, `AGENTS.md`, root config | architect | propose changes |

## Non-negotiables (from PRD §8 and the ADRs)

- The AI recommends. Only a human expert issues a badge.
- A safety item marked `no` or `unclear`, or a missing liveness code, caps the verdict at `needs_review` (ADR-11).
- The UI says "verified by Smart Fundis". It never says "certified", because NITA, KNQA and TVETs certify.
- YouTube and TikTok links are showcase only. Never download them, and only in-app video earns badges (ADR-7).
- LangSmith traces are masked: no video URLs, prompts or feedback text.
- Brev pulls jobs from Convex. There is no inbound port on Brev (ADR-9).

## Conventions

- TypeScript strict in `web/` and `convex/`. Python 3.11+ with type hints in `ai-service/`.
- Keep commits small, one per task: `P3.1: generateUploadUrl + server validation`.
- Brand colours are green `#0B5D3B` and orange `#F28C28`. Design mobile-first at 360 px.
- If a rule here conflicts with the PRD, stop and ask the Architect.
