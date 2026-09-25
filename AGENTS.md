# Smart Fundis — Agent Rules

Every agent (Claude Code session, subagent, Cursor, Copilot) follows these rules. `CLAUDE.md` imports this file.

## Source of truth, in priority order

1. **Architecture spec:** `docs/superpowers/specs/2026-09-25-architecture-design.md`. Where it and the PRD disagree, the spec wins.
2. **Slice specs and tickets:** GitHub Issues, one `V<n> spec` issue per slice with ticket sub-issues (`docs/agents/issue-tracker.md`). Slice briefs are in `planning/slices/`, and the build-loop prompts are in `planning/prompts/`. `plan-first` tickets have plans in `docs/superpowers/plans/`.
3. **Project state:** `planning/STATE.md`, `DECISIONS.md`, `RISKS.md` and `QUESTIONS.md`.
4. **Glossary:** `CONTEXT.md`. Use its terms in code, specs and copy, and avoid the aliases it lists.
5. **Product background:** `docs/PRD.md`. It covers the stories, the original data model and the Responsible-AI checklist (§8).
6. **Designs:** `design/stitch/`. `DESIGN.md` holds the brand and rules, `prompts/` holds one prompt per screen, and `exports/` holds the Stitch output that the frontend converts.
7. **Progress:** `docs/handoff/` gets one file per finished task. **Reviews:** `docs/reviews/`, where open blockers stop the next phase.

## Working rules

1. Read the current spec, plan and `CONTEXT.md` before writing code.
2. Fetch live docs (llms.txt or MCP) before using any API. Do not rely on memory for Convex, Clerk, LangGraph, vLLM or NVIDIA APIs.
3. Every Convex function checks the caller's identity and role on the server.
4. No secrets in `web/` or in Convex client code. `NVIDIA_API_KEY` lives only on the Brev box.
5. Every user-visible string goes through `next-intl`. **For now the UI is English only:** fill `messages/en.json`, keep `sw.json` absent, and keep the language toggle hidden. The one exception is the **consent screen**, which ships in both English and Kiswahili (PRD §8). The AI pipeline still returns `feedback_sw`, but the UI does not show it yet.
6. Finish each task with: what changed, how to verify it, and which acceptance criteria now pass. Write it to `docs/handoff/<task-id>.md` with `/handoff`.
7. Stay inside your role's folders unless the Architect assigns cross-cutting work.

## Skills by role

Skills come from two places:
- **Plugins,** enabled at project scope in `.claude/settings.json`: superpowers, mattpocock-skills, the Clerk skills, the Stitch skills, `langchain-skills` and `convex`.
- **Standalone skills** in `.claude/skills/`, pinned in `skills-lock.json`: `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `brev-cli` and `nvidia-skill-finder`.

Research links for every role are in `docs/research-links.md`.

| Role | Load |
| --- | --- |
| everyone who writes code | `mattpocock-skills:tdd`, `superpowers:verification-before-completion` |
| orchestrating session | `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents` |
| architect | `anthropic-skills:120x-architect`, `superpowers:brainstorming`, `superpowers:writing-plans`, `mattpocock-skills:grilling`, `mattpocock-skills:domain-modeling`, `mattpocock-skills:to-spec`, `mattpocock-skills:to-tickets`, `mattpocock-skills:codebase-design`, `mattpocock-skills:improve-codebase-architecture`, `mattpocock-skills:research`, `nvidia-skill-finder` |
| designer | `stitch-design:generate-design`, `stitch-design:manage-design-system`, `stitch-utilities:enhance-prompt`, `stitch-utilities:design-md`, `stitch-utilities:taste-design`, `web-design-guidelines`, `design:accessibility-review`, `design:ux-copy`, the Canva MCP tools, and the Apple HIG skills once installed (as principles only) |
| frontend | `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `anthropic-skills:nextjs-expert`, `anthropic-skills:ui-styling`, `stitch-build:shadcn-ui`, `stitch-build:react-components`, `stitch-design:generate-design`, `stitch-utilities:design-md` |
| convex | `convex:design`, `convex:auth`, `convex:convex-authz`, `convex:crons`, `convex:seed`, `convex:test`, `convex:env`; the `convex-expert` and `convex-reviewer` subagents; the Convex MCP server |
| auth | `clerk-setup`, `clerk-nextjs-patterns`, `clerk-custom-ui`, `clerk-testing`, `convex:auth` |
| ai-pipeline | `langchain-skills:ecosystem-primer`, `langchain-skills:langgraph-fundamentals`, `langchain-skills:langchain-fundamentals`, `langchain-skills:langchain-dependencies`, `langchain-skills:eval-engineering`, `nvidia-skill-finder`, `mattpocock-skills:diagnosing-bugs` |
| gpu-devops | `brev-cli`, `nvidia-skill-finder`, `mattpocock-skills:wizard`, `mattpocock-skills:diagnosing-bugs` |
| qa | `clerk-testing`, `convex:test`, `web-design-guidelines`, `langchain-skills:eval-engineering` |
| rai-reviewer | `mattpocock-skills:grilling` |
| code-reviewer | `mattpocock-skills:code-review`, the `convex-reviewer` subagent |

No NVIDIA skill covers serving Cosmos Reason 2 with vLLM, so use the official docs in `docs/research-links.md` for that. The Convex plugin runs lint and type-check hooks, and sends anonymous telemetry unless `CONVEX_PLUGIN_TELEMETRY=0` is set.

## Folder ownership

| Folder | Owner | Others may |
| --- | --- | --- |
| `web/` | frontend, auth (`web/proxy.ts`, sign-in pages, onboarding) | read |
| `convex/` | convex, auth (`auth.config.ts`, `users.ts`) | read |
| `ai-service/app/` | ai-pipeline | read |
| `ai-service/{scripts,worker,poller}`, infra | gpu-devops | read |
| `ai-service/eval/`, `web/e2e/` | qa | read |
| `design/` (Stitch and Canva prompts, exports, `LOG.md`) | designer, architect (`DESIGN.md`) | frontend reads the exports |
| `web/public/images/` | designer + frontend | read |
| `docs/`, `CONTEXT.md`, `AGENTS.md`, root config | architect | propose changes |

## Non-negotiables

- The AI recommends. Only an **Expert** approval creates a **Badge**. When the AI says `pass` but no Expert has reviewed the video, the public profile shows nothing.
- A safety item marked `no` or `unclear`, or a missing liveness code, caps the verdict at `needs_review` (ADR-11).
- The UI says "verified by Smart Fundis". It never says "certified", because NITA, KNQA and TVETs certify.
- Nothing may look live that isn't. Post-MVP features appear only on `/roadmap`, tagged "Coming soon".
- YouTube and TikTok links are showcase only. Never download them, and only in-app video earns badges (ADR-7).
- LangSmith traces are masked: no video URLs, prompts or feedback text.
- Brev pulls jobs from Convex. There is no inbound port on Brev (ADR-9).

## Conventions

- TypeScript strict in `web/` and `convex/`. Python 3.11+ with type hints in `ai-service/`.
- One branch and PR per ticket (`v<n>/<issue#>-<slug>`), reviewed locally (`/code-review`, plus `convex-reviewer` for `convex/`) and then by the Architect on GitHub, and squash-merged by the Architect only. The `claude-review` CI check is off for now (D-10).
- The brand is the v2 "Instrument" system (D-9): graphite `#050609`, text `#f2f4f7`, and amber `#ef9a57` as punctuation only. Design mobile-first at 360 px.
- If a rule here conflicts with a spec, stop and ask the Architect.
