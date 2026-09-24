# Smart Fundis — Product Requirements Document (Agent Build Edition)

**Project:** Smart Fundis — verified-fundi marketplace for Kenya
**Event:** GOMYCODE × NVIDIA "Come Build with AI" hackathon, Sunday 27 Sept 2026
**Owner:** Njuguna Njenga (Cpt. N)
**Version:** 1.0 · 24 Sept 2026
**How to use this file:** save it as `docs/PRD.md` in the repo root. Every agent prompt references it.

---

## 1. Product summary

Smart Fundis lets jua kali workers (fundis) prove their skills with a short phone video. NVIDIA's Cosmos Reason 2 watches the video against a trade rubric, Nemotron turns the observations into a verdict with English and Swahili feedback, and a human expert makes the final decision. Clients and contractors then find and hire verified fundis.

**Hackathon MVP scope:** landing page → sign-in and roles → fundi video upload → AI assessment → expert review → badge on the fundi's profile.

**Out of MVP scope:** marketplace search, bookings, M-Pesa payments, subscriptions, Data Co-op licensing (all listed in §10 as later phases).

**Rules reminder:** the jury evaluates what is built on build day. Specs, prompts, labelled test clips and research may be prepared in advance; product code is written on Sunday and anything prepared earlier is disclosed on the project card.

---

## 2. Tech stack (locked decisions)

| # | Decision |
| --- | --- |
| ADR-1 | Next.js App Router PWA + shadcn/ui + Tailwind, deployed on Vercel |
| ADR-15 | Monorepo: `web/` (Next.js), `convex/` (Convex functions), `ai-service/` (Python) |
| ADR-16 | Clerk auth: email + Google. Phone number collected in onboarding, not used for sign-in |
| ADR-17 | English + Swahili UI from day one with `next-intl` (`en`, `sw`) |
| ADR-1 | Convex = system of record: schema, queries, mutations, actions, file storage, cron, HTTP actions |
| ADR-8 | Fundi videos stored in Convex storage |
| ADR-2 | AI service: FastAPI + LangGraph + LangChain (Python) on the Brev GPU box |
| ADR-3 / 12 | Cosmos Reason 2 (8B, 2B fallback) served by vLLM on a Brev H100 80GB |
| ADR-4 | Nemotron via hosted NVIDIA API (build.nvidia.com) through `ChatNVIDIA` |
| ADR-5 | Redis + Celery on Brev, with `QUEUE_MODE=inline` fallback |
| ADR-9 | Brev **pulls** jobs from Convex (`POST /ai/claim`); no inbound port on Brev |
| ADR-7 | YouTube/TikTok links are showcase only (embed + metadata); only in-app video earns badges |
| ADR-10 | Recording via the phone's native camera (`<input capture>`); liveness code shown before recording |
| ADR-11 | Hard rules after the LLM: safety `no`/`unclear` or missing liveness code → max "needs review" |
| ADR-13 | LangSmith tracing with inputs/outputs masked |
| ADR-14 | Eval clips labelled blind by Cpt. N before any AI run; faults deliberately staged |
| ADR-6 | *(Phase 2+)* Geohash index for nearest-fundi search in Convex |

### Repository layout

```
smart-fundis/
├── AGENTS.md                 # shared agent rules (CLAUDE.md symlinks here)
├── docs/PRD.md               # this file
├── package.json              # npm workspaces: web, convex
├── convex.json               # points the Convex CLI at ./convex
├── convex/                   # schema.ts, functions, http.ts, crons.ts, auth.config.ts
├── web/                      # Next.js app (no src/), messages/en.json, messages/sw.json
├── ai-service/               # FastAPI, LangGraph pipeline, poller, Celery worker, eval
│   ├── app/{main,schemas,video,cosmos,nemotron,pipeline,rules,callback,poller,worker}.py
│   ├── eval/clips.csv
│   └── scripts/serve_vllm.sh
└── .claude/skills/  .agents/skills/   # installed agent skills (see §4)
```

---

## 3. The agent team

Each role is one Claude Code session (or subagent) with a narrow brief, the skills listed for it, and a "done when" check. Your existing `devteam-*` pipeline wraps around them.

| Role | Owns | Skills to load | Docs / MCP to allow |
| --- | --- | --- | --- |
| **Architect** | Plan per phase, interfaces between web/convex/ai-service, reviews "done" claims | Your `120x-architect` skill; `devteam-office-hours`, `devteam-eng-review` | This PRD |
| **Frontend engineer** | Landing page, dashboards, upload UI, i18n, accessibility | `vercel-react-best-practices`, `web-design-guidelines`, `vercel-composition-patterns` (Vercel); Anthropic `frontend-design`; your `ui-ux-pro-max` + `ui-styling`; a shadcn skill | Next.js docs, shadcn docs |
| **Convex backend engineer** | Schema, functions, file storage, HTTP actions, crons, role checks | Official Convex agent skills (incl. `convex-setup-auth`, `convex-quickstart`, `convex-performance-audit`) or the official Convex Claude Code plugin | `docs.convex.dev/llms.txt`, Convex MCP server |
| **Auth engineer** | Clerk setup, JWT template, onboarding, role routing, protected routes | Clerk skills: `/clerk`, `/clerk-setup`, `/clerk-nextjs-patterns`, `/clerk-custom-ui`, `/clerk-testing` | Clerk MCP server, Clerk CLI |
| **AI pipeline engineer** | LangGraph graph, Cosmos client, Nemotron chain, rules, eval | LangChain skills: `ecosystem-primer`, `langgraph-fundamentals`, `langgraph-persistence`, `langchain-fundamentals` | `docs.langchain.com/llms.txt`, Cosmos Reason 2 docs |
| **GPU / DevOps engineer** | Brev instance, vLLM, Redis, Celery, poller, env vars, cost control | NVIDIA skills catalog (`nvidia/skills`); your `gem-devops-guidelines` | `docs.nvidia.com/brev/llms.txt` |
| **QA engineer** | Acceptance checks per phase, Playwright tests, eval run | `devteam-qa`; `/clerk-testing` | — |
| **Responsible-AI reviewer** | Consent, privacy, bias, safety rules, disclosure text | `devteam-staff-review` with the §8 checklist | — |

**Working rules for every agent (put these in `AGENTS.md`):**

1. Read `docs/PRD.md` and the current phase's user stories before writing code.
2. Fetch live docs (llms.txt / MCP) before using any API. Do not rely on memory for Convex, Clerk, LangGraph, vLLM or NVIDIA APIs.
3. Every Convex function checks the caller's identity and role on the server.
4. No secrets in `web/` or in Convex client code. `NVIDIA_API_KEY` lives only on the Brev box.
5. Every user-visible string goes through `next-intl` with both `en` and `sw` keys.
6. Finish each task with: what changed, how to verify it, and which acceptance criteria now pass.
7. Stay inside your role's folders unless the Architect assigns cross-cutting work.

---

## 4. Skills and documentation — install list with links

**Safety first:** community skills are instructions your agent will follow. Read every `SKILL.md` before installing, prefer official publisher repos, and check for name collisions with your own `devteam-*` and `ui-ux-pro-max` skills. Install into the repo (project scope) so teammates get the same set.

### 4.1 Official skills (install these)

| Area | Install | Source |
| --- | --- | --- |
| Convex (official) | Follow the install steps on the docs page; skills go into `.agents/skills/` and are picked up by Claude Code, Cursor and Copilot | [Convex Agent Skills](https://docs.convex.dev/ai/agent-skills) · [get-convex/agent-skills](https://github.com/get-convex/agent-skills) |
| Convex (official plugin) | Claude Code plugin bundling a backend skill, quickstart, `convex-expert` subagent and the Convex MCP server | [get-convex/convex-backend-skill](https://github.com/get-convex/convex-backend-skill) |
| Clerk (official) | `npx skills add clerk/skills` (or one skill: `npx skills add clerk/skills --skill clerk-nextjs-patterns`) | [Clerk Skills guide](https://clerk.com/docs/guides/ai/skills) · [clerk/skills](https://github.com/clerk/skills) |
| Clerk CLI + MCP | `npx clerk@latest init` (offers to install skills), then `clerk mcp install` | [Using Clerk with AI](https://clerk.com/docs/guides/ai/overview) |
| LangChain / LangGraph (official) | `claude plugin marketplace add langchain-ai/langchain-skills` then `claude plugin install langchain-skills@langchain-skills --scope project` | [langchain-ai/langchain-skills](https://github.com/langchain-ai/langchain-skills) |
| NVIDIA (official catalog) | `npx skills add nvidia/skills --list` to browse, then install what matches (e.g. NIM, Brev, Cosmos entries as they appear) | [NVIDIA/skills](https://github.com/nvidia/skills) · [docs.nvidia.com/skills](https://docs.nvidia.com/skills) |
| Vercel / React / Next.js (official) | `npx skills add vercel-labs/agent-skills` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) · [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) |
| Anthropic | `frontend-design` and others | [anthropics/skills](https://github.com/anthropics/skills) |

### 4.2 Useful community skills (review before installing)

| Area | Repo | Why |
| --- | --- | --- |
| Convex | [waynesutton/convexskills](https://github.com/waynesutton/convexskills) | Schema validation, HTTP actions, crons, security audit |
| Convex | [PolarCoding85/convex-agent-skillz](https://github.com/PolarCoding85/convex-agent-skillz) | Reference docs incl. FILE_STORAGE, HTTP_ACTIONS, AUTH, NEXTJS |
| Convex + Next.js | [fluid-tools/claude-skills](https://github.com/fluid-tools/claude-skills) | Convex anti-patterns, performance, strict TypeScript |
| UI | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | You already ship a ported version; use yours |

### 4.3 Live documentation for agents (allow these domains)

| Topic | Link |
| --- | --- |
| Convex docs index for LLMs | https://docs.convex.dev/llms.txt |
| Convex file storage / upload | https://docs.convex.dev/file-storage/upload-files |
| Convex + Clerk | https://docs.convex.dev/auth/clerk |
| Clerk + Convex (Next.js) | https://clerk.com/docs/nextjs/convex |
| LangChain / LangGraph docs index | https://docs.langchain.com/llms.txt |
| LangChain NVIDIA integration | https://docs.langchain.com/oss/python/integrations/providers/nvidia |
| Brev docs index | https://docs.nvidia.com/brev/llms.txt |
| Brev connectivity (tunnels need browser auth → why ADR-9) | https://docs.nvidia.com/brev/cli/connectivity |
| Cosmos Reason 2 inference reference (vLLM flags) | https://docs.nvidia.com/cosmos/latest/reason2/reference.html |
| Cosmos Reason 2 API examples | https://docs.nvidia.com/nim/vision-language-models/latest/examples/cosmos-reason2/api.html |
| Cosmos Reason 2 repo | https://github.com/nvidia-cosmos/cosmos-reason2 |
| Cosmos Reason 2 model card | https://huggingface.co/nvidia/Cosmos-Reason2-8B |
| Cosmos Cookbook | https://nvidia-cosmos.github.io/cosmos-cookbook/ |
| NVIDIA model catalog (Nemotron) | https://build.nvidia.com/ |
| FastAPI | https://fastapi.tiangolo.com/ |
| Celery | https://docs.celeryq.dev/ |
| next-intl | https://next-intl.dev/ |

**Suggested `.claude/settings.json` permissions:**

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:docs.convex.dev)",
      "WebFetch(domain:clerk.com)",
      "WebFetch(domain:docs.langchain.com)",
      "WebFetch(domain:docs.nvidia.com)",
      "WebFetch(domain:build.nvidia.com)",
      "WebFetch(domain:nextjs.org)",
      "WebFetch(domain:ui.shadcn.com)",
      "WebFetch(domain:fastapi.tiangolo.com)",
      "WebFetch(domain:next-intl.dev)"
    ]
  }
}
```

---

## 5. Users and roles

| Role | How they get it | Can do in the MVP |
| --- | --- | --- |
| Fundi | Signs up, picks "I'm a fundi" | Profile, record/upload task video, see AI result and expert decision, appeal once |
| Client | Signs up, picks "I'm hiring" (homeowner or business) | Browse verified fundi profiles (read-only in MVP) |
| Expert verifier | Applies; admin approves and assigns trades | Review queue for approved trades, approve / reshoot / reject with notes |
| Admin | Email on the `ADMIN_EMAILS` allow-list | Approve experts, manage trades and rubrics, override decisions, see audit log |

---

## 6. Phases and user stories

Each phase ends with a demo on a real phone. Acceptance criteria are written so the QA agent can check them directly.

### Phase 1 — Landing page (design first)

**Goal:** a visitor understands Smart Fundis in 10 seconds and picks their path.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-1.1 | As a **visitor**, I want to see what Smart Fundis does in one screen, so I know if it's for me. | Hero with "Kazi yako, sifa yako" tagline, one-line value prop, primary CTA above the fold at 360 px width |
| US-1.2 | As a **fundi**, I want to see how verification works, so I trust it with my video. | 3-step "Record → AI checks → Expert confirms" section with icons |
| US-1.3 | As a **client**, I want to see which trades are covered, so I know I can find help. | Trades grid (electrician, plumber, mason, carpenter, welder, mechanic, tailor, hairdresser, beautician, solar installer, mama fua, movers) |
| US-1.4 | As a **visitor**, I want to switch between English and Swahili, so I read in my language. | Toggle on every page; all strings from `messages/en.json` and `messages/sw.json`; choice persists |
| US-1.5 | As a **visitor**, I want clear next steps, so I can join. | CTAs: "Join as a fundi", "Hire a fundi", "Become a verifier" → sign-up with role pre-selected |
| US-1.6 | As a **judge**, I want to see how AI is used responsibly, so I trust the product. | Trust section: "AI recommends, experts decide", privacy note, "we verify, NITA/KNQA/TVETs certify" |

**Non-functional:** Lighthouse mobile ≥ 90 for performance and accessibility; brand colours green `#0B5D3B` and orange `#F28C28`; loads under 3 s on a mid-range Android over 4G.

**Agents:** Frontend engineer (build), Architect (review), QA (Lighthouse + 360 px check).

### Phase 2 — Authentication, onboarding and roles

**Goal:** anyone can sign in and lands on the right dashboard for their role.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-2.1 | As a **new user**, I want to sign up with email or Google, so joining is quick. | Clerk sign-up/sign-in pages styled to brand; both methods work |
| US-2.2 | As a **new user**, I want to choose whether I'm a fundi or a client, so the app fits me. | Signed-in users with no role are redirected to `/onboarding` by the Next.js proxy |
| US-2.3 | As a **fundi**, I want to set up my profile, so clients and experts know me. | Fields: name, phone, trades (multi-select), county + area, years of experience, languages, bio, links (YouTube, TikTok, LinkedIn, CV, portfolio) |
| US-2.4 | As a **client**, I want to set up my profile, so I can hire later. | Homeowner or business, company name, county, trades usually needed |
| US-2.5 | As a **skilled assessor**, I want to apply to be a verifier, so I can review fundis in my trade. | Application: trades, credentials (e.g. TVET/NITA assessor ID), years, statement → status `pending` |
| US-2.6 | As an **admin**, I want to approve or reject verifier applications, so only qualified people review. | Approve assigns trades; reject stores a reason; both write an audit-log row |
| US-2.7 | As **any user**, I want to land on my own dashboard, so I see what matters to me. | Routing: `/fundi`, `/client`, `/expert`, `/admin`; wrong-role access redirects |
| US-2.8 | As the **platform**, I want every backend call to check role, so the UI can't be bypassed. | Calling an admin mutation as a fundi throws; tested directly |

**Technical notes:** Clerk JWT template named `convex`; `convex/auth.config.ts` with the Clerk Frontend API URL and `applicationID: "convex"`; `ConvexProviderWithClerk` inside `ClerkProvider`; `users.store` upserts on first sign-in; role mirrored into Clerk public metadata for routing.

**Agents:** Auth engineer + Convex backend engineer (build), QA (role-bypass tests with `/clerk-testing`).

### Phase 3 — Fundi dashboard and video upload

**Goal:** a fundi can pick a task, record it on their phone and upload it in under two minutes.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-3.1 | As a **fundi**, I want to see my verification status at a glance, so I know what to do next. | Dashboard: badge tier, assessments list with live status chips, "Verify a new skill" button |
| US-3.2 | As a **fundi**, I want to pick my trade and task, so I record the right thing. | Trade → task picker (MVP: Electrical "Install a 13A socket", Hairdressing "Cornrows / braiding"); shows the rubric checklist in plain words |
| US-3.3 | As a **fundi**, I want recording tips before I start, so my video passes. | Tips screen: good light, 10–90 s, keep hands and work in frame, say the code |
| US-3.4 | As a **fundi**, I want a code to say on camera, so my video proves it's really me. | 3-digit liveness code shown large before recording; stored with the assessment |
| US-3.5 | As a **fundi**, I want to record with my phone camera or pick a saved video, so it works on any phone. | `<input type="file" accept="video/*" capture="environment">`; works on Android Chrome and iOS Safari |
| US-3.6 | As a **fundi**, I want to see upload progress, so I know it's working on slow data. | Progress bar; retry on failure; clear error for files over 100 MB or wrong type |
| US-3.7 | As a **fundi**, I want to consent before uploading, so I control my video. | Consent screen (en/sw): who sees the video, AI + human review, deletion on request; separate unticked box for the future Data Co-op |
| US-3.8 | As a **fundi**, I want to add my YouTube/TikTok work links, so clients see my portfolio. | Links shown as embeds on the profile with a "Showcase — not verified" label |
| US-3.9 | As the **platform**, I want uploads validated on the server, so bad files never reach the GPU. | Save mutation checks auth, size ≤ 100 MB, MIME `video/*`; invalid files deleted from storage |

**Technical notes:** Convex `generateUploadUrl` mutation → client POSTs file → `storageId` → `assessments.create` (status `queued`). Assessment row keeps `livenessCode`, `rubricId`, `dataProgramConsent: false` by default.

**Agents:** Frontend engineer (UI), Convex backend engineer (upload + validation), QA (upload on a real Android and iPhone).

### Phase 4 — AI assessment (Cosmos Reason 2 + Nemotron)

**Goal:** an uploaded video returns rubric observations with timestamps and a verdict, automatically.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-4.1 | As a **fundi**, I want to watch my assessment progress live, so I'm not left waiting blind. | Status updates without refresh: `queued → analyzing → awaiting_review` |
| US-4.2 | As a **fundi**, I want an instant reshoot message if my video is unusable, so I don't wait for nothing. | Guard rejects < 10 s, > 90 s, < 360p, too dark, with a specific reason in en/sw |
| US-4.3 | As an **expert**, I want the AI to point to where each step happens, so I review fast. | One observation per rubric item: `yes/no/unclear`, one-line evidence, `timestamp_s` |
| US-4.4 | As a **fundi**, I want feedback in English and Swahili, so I understand how to improve. | Verdict JSON with strengths, gaps, `feedback_en`, `feedback_sw` |
| US-4.5 | As the **platform**, I want safety problems never auto-approved, so nobody is put at risk. | Any safety item `no` or `unclear`, or missing liveness code → verdict at most `needs_review` |
| US-4.6 | As the **operator**, I want the demo to survive a GPU failure, so judging isn't blocked. | Stopping vLLM switches to fallback and marks `fallbackModel: true`; `QUEUE_MODE=inline` bypasses Redis |
| US-4.7 | As the **team**, I want measured accuracy, so our claims are honest. | `POST /eval/run` outputs agreement %, safety-fault recall, p50 latency for 2B and 8B to `eval/results.csv` |

**Flow (ADR-9 pull model):** poller on Brev → `POST /ai/claim` (secret) → Convex atomically marks the oldest `queued` job `analyzing` and returns it → Redis → Celery worker runs the LangGraph graph (`ingest → guard → observe → assess → rules`) → `POST /ai/callback` (secret) → Convex saves and sets `awaiting_review`. A Convex cron returns jobs stuck in `analyzing` for over 10 minutes to `queued`.

**vLLM command (Brev):**

```bash
vllm serve nvidia/Cosmos-Reason2-8B \
  --allowed-local-media-path /data \
  --max-model-len 8192 \
  --media-io-kwargs '{"video": {"num_frames": -1}}' \
  --reasoning-parser qwen3 --port 8000
```

Videos go in as a `video_url` content part with `fps: 4`. Cosmos is called through the `openai` SDK (LangChain's NVIDIA chat class documents images, not video) and wrapped as a LangGraph node. Nemotron uses `ChatNVIDIA(...).with_structured_output(Verdict)`.

**Agents:** AI pipeline engineer (graph, prompts, rules), GPU/DevOps engineer (Brev, vLLM, Redis, Celery, poller), Convex backend engineer (`/ai/claim`, `/ai/callback`, cron), QA (eval run).

### Phase 5 — Expert verification and badge

**Goal:** a human expert confirms the AI's recommendation, and the fundi gets a badge.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-5.1 | As an **expert**, I want a queue of assessments in my trades only, so I review what I'm qualified for. | Queue filtered by `approvedTrades`; never shows the expert's own videos |
| US-5.2 | As an **expert**, I want to jump to flagged moments, so I don't watch every second. | Tapping an observation seeks the video to its timestamp |
| US-5.3 | As an **expert**, I want to approve, request a reshoot or reject with a note, so the fundi knows why. | Three actions; note required for reshoot/reject; audit row written |
| US-5.4 | As a **fundi**, I want my badge to appear when approved, so clients trust me. | Approval sets Tier 2 "Human-verified" on the profile with trade and date |
| US-5.5 | As a **fundi**, I want to appeal once, so one unfair review doesn't block me. | Appeal routes to a different expert or admin |
| US-5.6 | As an **admin**, I want to override any decision with a reason, so mistakes can be fixed. | Override logged with actor, reason, time |
| US-5.7 | As a **client**, I want to see a fundi's verified skills, so I know who to call. | Public profile shows badges, verified tasks, showcase links; contact details hidden in MVP |

**Agents:** Frontend engineer (queue + profile), Convex backend engineer (review mutations, audit), Responsible-AI reviewer (appeal flow, wording).

### Phase 6 — Demo hardening and submission

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-6.1 | As the **team**, I want seeded demo data, so the app looks alive. | ~20 fundi profiles across Nairobi, 2 experts, 1 admin, mixed statuses |
| US-6.2 | As a **judge**, I want to see the whole loop in 90 seconds, so I understand the product. | Video script from the pitch plan recorded from the working build |
| US-6.3 | As a **judge**, I want to know how NVIDIA Brev was used, so I can score it. | Project card lists GPU type, hours, models, what ran on Brev and why, eval numbers, data sources, prepared-in-advance items |

---

## 7. Data model (Convex)

| Table | Key fields | Indexes |
| --- | --- | --- |
| `users` | clerkId, role (fundi / client / expert / admin / pending), name, phone, county, locale | by_clerkId, by_role |
| `fundiProfiles` | userId, trades[], area, yearsExp, languages[], bio, links {youtube, tiktok, linkedin, cv, portfolio}, badgeTier | by_userId |
| `clientProfiles` | userId, type, company, tradesNeeded[] | by_userId |
| `expertApplications` | userId, trades[], credentials, statement, status, reviewedBy, reason | by_status |
| `experts` | userId, approvedTrades[], active | by_userId |
| `trades` | slug, name, category (skilled / semi / odd-job), activeRubricId | by_slug |
| `rubrics` | tradeSlug, task, version, items [{id, text, safety}], status, approvedBy | by_trade_status |
| `assessments` | fundiId, tradeSlug, rubricId, videoStorageId, livenessCode, status, observations[], verdict, confidence, safetyFlags[], feedbackEn, feedbackSw, model, latencyMs, fallbackModel, dataProgramConsent, licenseStatus, claimedAt | by_fundi, by_status_trade, by_status_claimedAt |
| `reviews` | assessmentId, expertId, decision, note | by_assessment |
| `auditLog` | actor, action, target, reason, at | by_target |

**Assessment status machine:** `queued → analyzing → awaiting_review → approved | reshoot | rejected`, plus `failed` and `appealed`.

**Environment variables**

| Where | Variables |
| --- | --- |
| Convex | `CLERK_FRONTEND_API_URL`, `AI_SHARED_SECRET`, `ADMIN_EMAILS` |
| web (Vercel) | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Brev | `VLLM_BASE_URL`, `COSMOS_MODEL`, `NVIDIA_API_KEY`, `NEMOTRON_MODEL`, `CONVEX_SITE_URL`, `AI_SHARED_SECRET`, `REDIS_URL`, `QUEUE_MODE`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING` |

---

## 8. Responsible AI checklist (reviewer signs off each phase)

- [ ] The AI recommends; only a human expert issues a badge
- [ ] Consent shown in English and Swahili before any upload; Data Co-op consent is separate and off by default
- [ ] Videos private by default; fundi chooses what appears publicly; deletion on request
- [ ] Safety items can never be auto-passed (ADR-11)
- [ ] Accuracy reported per trade; tested with men and women, different lighting and phones
- [ ] Test clips only from licensed sources or our own recordings; YouTube/TikTok never downloaded
- [ ] LangSmith traces masked: no video URLs, prompts or feedback text
- [ ] UI says "verified by Smart Fundis"; never "certified" (NITA, KNQA and TVETs certify)

---

## 9. Agent prompt sequence (Claude Code)

Run one prompt per session, in order. Commit after each. Every prompt starts with: *"Read `AGENTS.md` and `docs/PRD.md`. You are the <role>. Load your skills from §3."*

| # | Agent | Prompt (short form) | Done when |
| --- | --- | --- | --- |
| P0 | Architect | "Create the monorepo per §2 layout: npm workspaces, `convex.json`, empty `web/`, `convex/`, `ai-service/`, `AGENTS.md` with the §3 working rules, and `.claude/settings.json` from §4.3. No features." | Tree matches §2; `npm install` works |
| P1.1 | Frontend | "Scaffold `web/`: Next.js App Router (no src), Tailwind, shadcn/ui, next-intl with `en` and `sw`, brand colours. Build the landing page for US-1.1 to US-1.6." | Phase 1 criteria pass on a 360 px phone |
| P2.1 | Auth + Convex | "Wire Clerk + Convex per Phase 2 technical notes. Implement `users.store`, `users.me`, `requireRole`, and the Phase 2 tables from §7." | Sign-in works; role check throws for wrong role |
| P2.2 | Frontend + Auth | "Build onboarding and role routing for US-2.2 to US-2.4 and US-2.7." | Each role lands on its dashboard |
| P2.3 | Convex + Frontend | "Build verifier application and admin approval for US-2.5, US-2.6, US-2.8 with audit log." | Phase 2 criteria pass |
| P3.1 | Convex | "Implement `generateUploadUrl`, `assessments.create` with server validation (US-3.9), trades/rubrics seed for Electrical and Hairdressing." | Invalid uploads deleted; valid ones `queued` |
| P3.2 | Frontend | "Build the fundi dashboard and upload flow for US-3.1 to US-3.8." | Upload works on Android Chrome and iOS Safari |
| P4.1 | GPU/DevOps | "On Brev: start vLLM with the §6 Phase 4 command, Redis in Docker, `ai-service` skeleton with `/health`." | `/health` shows Cosmos model loaded |
| P4.2 | AI pipeline | "Build the LangGraph graph (`ingest → guard → observe → assess → rules`), Cosmos client, Nemotron chain, rules per ADR-11, LangSmith masking." | One labelled clip returns a valid Verdict |
| P4.3 | Convex + DevOps | "Add `/ai/claim` (atomic claim), `/ai/callback`, requeue cron; add `poller.py` and Celery `worker.py` with `QUEUE_MODE` switch." | Upload → result appears live in the UI |
| P4.4 | AI pipeline + QA | "Add `/eval/run` over `eval/clips.csv` for 2B and 8B; write `eval/results.csv`." | US-4.7 passes |
| P5.1 | Frontend + Convex | "Build the expert queue, timestamp jump, review actions, appeal, admin override, badge on profile for US-5.1 to US-5.7." | Phase 5 criteria pass |
| P6.1 | QA + Architect | "Seed demo data (US-6.1), run every acceptance check on a phone, list failures." | All MVP criteria green |

**Around each phase, use your devteam pipeline:** `devteam-office-hours` (confirm stories) → `devteam-eng-review` (plan) → `devteam-build` (the prompts above) → `devteam-staff-review` + §8 checklist → `devteam-qa` → `devteam-ship` → `devteam-retro` (append lessons to `LEARNINGS.md`).

---

## 10. From MVP to production and scale

| Stage | What changes |
| --- | --- |
| Hackathon MVP | This PRD, one Brev H100, ~20 eval clips, hosted Nemotron, inline fallback |
| Pilot (1 TVET + 1 contractor) | LangGraph checkpointing, Whisper for spoken liveness code, rubric library per trade, marketplace search (ADR-6 geohash), bookings |
| Production | M-Pesa Daraja payments and subscriptions (Fundi Pro from KSh 300/month; 2.5% + 2.5% booking commission), autoscaled GPU pool, 2B triage → 8B for hard cases, Kenya Data Protection Act compliance, expert SLA dashboards |
| Scale | Fine-tune Cosmos on expert-approved clips; Smart Fundis Data Co-op (opt-in licensing, paid recording tasks, annotation jobs); expansion to other GOMYCODE countries |

---

## 11. Open questions

- [ ] Per-team Brev credit amount (announced after roster on Sunday)
- [ ] Exact Nemotron model name on build.nvidia.com on the day
- [ ] Kenya start time: Tunis clock (11:00 Nairobi) or local 09:00?
- [ ] Who are the first two expert verifiers for the demo?
- [ ] Teammate roles (Frontend / Platform) confirmed?

---

## 12. Sources

- Convex Agent Skills — https://docs.convex.dev/ai/agent-skills
- Convex official Claude Code plugin — https://github.com/get-convex/convex-backend-skill
- Clerk Skills — https://clerk.com/docs/guides/ai/skills
- Clerk Skills launch — https://clerk.com/changelog/2026-01-29-clerk-skills
- Using Clerk with AI (CLI + MCP) — https://clerk.com/docs/guides/ai/overview
- LangChain skills — https://github.com/langchain-ai/langchain-skills
- LangChain docs skills / llms.txt — https://docs.langchain.com/oss/python/deepagents/skills/index.html
- NVIDIA Agent Skills catalog — https://github.com/nvidia/skills
- Vercel agent skills — https://github.com/vercel-labs/agent-skills
- Clerk + Convex (Next.js) — https://clerk.com/docs/nextjs/convex
- Brev connectivity — https://docs.nvidia.com/brev/cli/connectivity
- Cosmos Reason 2 reference — https://docs.nvidia.com/cosmos/latest/reason2/reference.html
- Cosmos Reason 2 API — https://docs.nvidia.com/nim/vision-language-models/latest/examples/cosmos-reason2/api.html
- LangChain NVIDIA provider — https://docs.langchain.com/oss/python/integrations/providers/nvidia
- Hackathon rules and rubric — https://hackathon.gomycode.com/
