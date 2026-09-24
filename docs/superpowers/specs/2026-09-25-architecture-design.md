# Smart Fundis — Architecture Design

- **Status:** approved in brainstorming, 24–25 Sep 2026. This is a written spec, pending the owner's review.
- **Supersedes:** PRD §6 phase order, §7 data model, and §9 prompt sequence. Where this spec and `docs/PRD.md` disagree, this spec wins.
- **Glossary:** `CONTEXT.md`. **Decisions:** ADR-1 to ADR-17 (PRD §2), plus `docs/adr/0018-derived-roles.md` and `docs/adr/0019-paper-liveness-code.md`.

---

## 1. Problem statement

Clients in Kenya can't tell a skilled fundi from an unskilled one. Skilled jua kali workers have no cheap, trusted way to prove what they can do.

## 2. Solution

A Fundi records one short phone video of one Task, with a paper Liveness code in the shot.
1. **Cosmos Reason 2** watches the video against the Task's Rubric and returns an Observation per Rubric item, with timestamps.
2. **Nemotron** turns those Observations into a Verdict, which is a recommendation only.
3. **`rules.py`** caps any safety or liveness doubt.
4. **An Expert** decides.
5. An approval becomes a public **Badge**: "Verified by Smart Fundis — <Trade>: <Task> · <date>".

Clients browse Verified Fundis without an account. Everything after the MVP appears only on `/roadmap`, tagged "Coming soon".

**MVP loop, which is never cut:** landing → sign up → consent → upload → AI result → Expert approval → Badge on the public profile.

---

## 3. System and data flow

```
 Phone browser (PWA, Next.js on Vercel)
   │  Clerk session (development instance)  ┌─────────────────────────────┐
   ├──────────── useQuery / useMutation ──▶ │ Convex (system of record)   │
   │  upload: generateUploadUrl → POST ───▶ │  tables · storage · crons   │
   │                                        │  HTTP: POST /ai/claim  ◀─┐  │
   │                                        │        POST /ai/callback ◀┤  │
   │                                        └──────────────────────────┼──┘
   │                                                                   │ outbound only (ADR-9)
   │                                        ┌──────────────────────────┴──┐
   │                                        │ Brev H100 (no inbound port) │
   │                                        │ poller → Redis → Celery     │
   │                                        │   (or QUEUE_MODE=inline)    │
   │                                        │ LangGraph: ingest → guard → │
   │                                        │   observe → assess → rules  │
   │                                        │ vLLM Cosmos-Reason2 8B / 2B │
   │                                        │ Nemotron (hosted) ──────────┼─▶ build.nvidia.com
   │                                        └─────────────────────────────┘
```

**The upload-to-Badge path:**
1. **Upload.** The Fundi uploads, which creates an Assessment at `queued` with a new Liveness code.
2. **Claim.** The poller calls `/ai/claim`. That atomically moves the oldest `queued` Assessment to `analyzing`, adds one to its attempts, and returns the job.
3. **Process.** The worker downloads the video to `/data`, runs the graph, and calls `/ai/callback`, which sets `awaiting_review` or `reshoot`. The worker then deletes its local copy.
4. **Live update.** The Fundi's screen updates live through Convex.
5. **Decision.** An Expert decides, and on `approved` the Badge is derived and shown on `/f/[id]`.

**Failure paths:**
- **Stuck job:** the cron finds an Assessment that has been `analyzing` for more than 10 minutes. On the first attempt it goes back to `queued`, and on the second it becomes `failed`.
- **vLLM down:** the worker uses the 2B model and sets `fallbackModel: true`.
- **Redis down:** the worker runs in `QUEUE_MODE=inline`.

**The stub worker (V1)** is a small script that uses the same claim and callback contract and returns a canned Verdict. It lets V1 prove the whole loop before Brev is ready. V2 swaps it for the real worker with no change to Convex or the UI.

**Environments:**

| | Dev | Prod |
| --- | --- | --- |
| Convex | dev deployment | prod deployment |
| Vercel | preview deployments | production |
| `AI_SHARED_SECRET` | its own secret | a separate secret |
| Clerk | development instance | development instance (a prod instance needs a custom domain with DNS) |

**Who deploys:** only the Architect runs a prod deploy, and only the Architect switches the poller between dev and prod.

---

## 4. Roles and auth (ADR-18)

**Clerk:**
- Sign-in methods are email and Google.
- The JWT template `convex` includes `email`, `email_verified` and `name`.
- `convex/auth.config.ts` uses `CLERK_FRONTEND_API_URL` with `applicationID: "convex"`.
- The app is wrapped as `ClerkProvider`, then `ConvexProviderWithClerk`.

**Roles are derived, and one User can hold several:**
- **Fundi:** a Fundi profile exists. The base role is `fundi` or `none`.
- **Expert:** an active `experts` row with a non-empty `approvedTrades`.
- **Admin:** the token's email is on `ADMIN_EMAILS` **and** `email_verified` is true.

No role is ever read from function arguments or Clerk metadata.

**Helpers:**
- `requireUser`, `getRoles`, `requireFundi`, `requireExpert(trade?)` and `requireAdmin`.
- `canDecide(user, assessment)` requires all of these: the decider is not the Assessment's own Fundi (**including Admins**), the Expert is active and approved for the Trade, and for an `appealed` Assessment the decider did not make the original decision.
- `users.store` creates or updates the user row after sign-in. `users.me` returns the user, their roles and any pending application.

**Routing:**
- **Public pages:** `/`, `/roadmap`, `/fundis`, `/f/[id]`, `/sign-in`, `/sign-up`.
- **The proxy** only requires sign-in, for `/dashboard`, `/onboarding`, `/application-pending`, `/fundi`, `/expert` and `/admin`.
- **`/dashboard`** reads `users.me` and sends the user on:
  - no Fundi profile and no application → `/onboarding`
  - Admin → `/admin`
  - Expert → `/expert`
  - Fundi → `/fundi`
  - application only → `/application-pending`
- **Page guards:** each dashboard shows a skeleton until `users.me` loads. A user without the page's role goes back to `/dashboard`.
- **Avatar menu:** it lists the dashboards the user holds. A pending applicant sees "Expert application: pending", as text rather than a link.

**Onboarding:**
- Two checkboxes, Fundi and Expert, that can both be ticked. At least one is required.
- The landing page's `?as=fundi|expert&trade=<slug>` pre-ticks the matching box and trade, and nothing is pre-ticked without it.
- The Fundi profile form comes first, then the Expert application.

---

## 5. Data model (Convex)

Compared with PRD §7:
- **Removed:** `users.role`, `fundiProfiles.badgeTier`, `dataProgramConsent` and `clientProfiles`, because Clients have no account in the MVP.
- **Derived instead of stored:** roles and Badges.

| Table | Fields | Indexes |
| --- | --- | --- |
| `users` | clerkId, email, name, phone, county, isDemo | by_clerkId |
| `fundiProfiles` | userId, trades[], county, area, yearsExp, languages[], bio, links{youtube, tiktok, linkedin, cv, portfolio}, coopInterest, coopInterestAt?, publicListing (default true) | by_userId |
| `expertApplications` | userId, trades[], credentials, yearsExp, statement, status `pending/approved/rejected`, decidedBy?, reason?, decidedAt? | by_status, by_userId |
| `experts` | userId, approvedTrades[], active | by_userId |
| `trades` | slug, name, category, activeRubricId? | by_slug |
| `rubrics` | tradeSlug, taskSlug, taskName, version, items[{id, text, safety}], status `active/retired` | by_trade_task |
| `assessments` | see below | by_fundi, by_status (oldest first), by_status_trade, by_status_claimedAt |
| `reviews` | assessmentId, deciderUserId, kind `review/appeal/override`, decision `approve/reshoot/reject`, note?, at | by_assessment, by_decider |
| `auditLog` | actorUserId, action, targetTable, targetId, reason?, at | by_target |

**The `assessments` fields:**

| Group | Fields |
| --- | --- |
| Who and what | fundiUserId, tradeSlug, rubricId, previousAssessmentId? |
| Consent | consentVersion, consentAt |
| Video | videoStorageId? (absent once deleted, and for demo rows), videoDeletedAt? |
| Liveness | livenessCode, livenessRead?, livenessCheck `yes/unclear` |
| Pipeline | status, attempts, claimedAt?, reshootReason?{code, en, sw} |
| AI result | observations[{itemId, result, evidence, timestampS}], verdict, confidence, safetyFlags[], feedbackEn, feedbackSw, model, latencyMs, fallbackModel |
| Appeal | appealReason? |
| Kept for later | licenseStatus (always `"none"` until the Pilot) |

**Derived values:**
- **Badge:** each `approved` Assessment, shown as Trade, Task and the decision date. The Demo tag comes from `users.isDemo`.
- **Trade is "Verify now":** the Trade has an `activeRubricId`.
- **Verified Fundi:** has at least one Badge **and** `publicListing` is on. Only Verified Fundis appear on `/fundis`. When the Fundi turns `publicListing` off, `/f/[id]` returns not found.

**Status changes and who can make them.** Anything not in this table is rejected. Every row from the Expert decision onwards also writes a `reviews` row and an `auditLog` row.

| From | To | By |
| --- | --- | --- |
| (new) | `queued` | Fundi upload, after the server checks size ≤ 100 MB and a `video/*` type, and consent is recorded |
| `queued` | `analyzing` | `/ai/claim` (attempts + 1) |
| `analyzing` | `awaiting_review` or `reshoot` (guard) | `/ai/callback` |
| `analyzing` | `queued` or `failed` | the cron or an error callback (`failed` once attempts reach 2) |
| `awaiting_review` | `approved`, `reshoot` or `rejected` | an eligible Expert (a note is required for reshoot and reject) |
| `rejected` | `appealed` | the Fundi, once, with a reason |
| `appealed` | `approved` or `rejected` (final) | a different eligible Expert, or an Admin if there isn't one |
| any | any final status | an Admin override, with a reason (the override removes or creates the Badge) |

**Reshoot and failure:**
- Both lead to a **new** Assessment with `previousAssessmentId` set and a **new** Liveness code.
- **Reshoot** comes from a guard rejection or an Expert request. **Failed** only ever means a system error.

**Video deletion:**
- It's allowed only in a final status (`approved`, `reshoot`, `rejected`, `failed`).
- It removes the file from storage, sets `videoDeletedAt`, and writes an audit row. The Badge and the decision record remain, and nothing public mentions the deletion.

---

## 6. AI contracts

Both endpoints require `Authorization: Bearer <AI_SHARED_SECRET>`, checked with a constant-time compare. A missing or wrong secret gets 401.

**`POST /ai/claim`**, with body `{ "workerId": string }`:
- It returns **204** when nothing is queued.
- Otherwise it returns **200** with a job:
```json
{ "assessmentId": "…", "attempt": 1, "videoUrl": "<getUrl, never logged>",
  "trade": { "slug": "electrical", "name": "Electrical" },
  "task":  { "slug": "13a-socket", "name": "Install a 13A socket" },
  "rubric": { "id": "…", "version": 1, "items": [{ "id": "isolate", "text": "…", "safety": true }] },
  "livenessCode": "482" }
```
`livenessCode` goes to the `rules` node only. A unit test checks that the Cosmos prompt never contains it (ADR-19).

**`POST /ai/callback`** carries `assessmentId`, `attempt` and an `outcome`:
- **`"result"`** comes with:
  - `observations[]` and `liveness { read, check }`
  - `verdict { verdict, confidence, strengths[], gaps[], feedbackEn, feedbackSw }`
  - `safetyFlags[]`, `model` (including the prompt versions, for example `cosmos-reason2-8b@p1 + nemotron@p1`), `fallbackModel` and `latencyMs`
- **`"reshoot"`** comes with `reason { code: too_short | too_long | low_res | too_dark, en, sw }`.
- **`"error"`** comes with `errorCode`. Convex then requeues the job if attempts < 2, and marks it `failed` otherwise.
- **Stale callbacks:** Convex accepts a callback only if the Assessment is still `analyzing` **and** `attempt` matches. Otherwise it returns 409 and changes nothing.

**What each model does:**
- **Cosmos** gets the video (`video_url` part, `fps: 4`) and the Rubric items. It returns one Observation per item, plus `liveness_digits`: the digits it read, or `null`.
- **Nemotron** gets the Rubric and the Observations, never the video, and returns the Verdict through `ChatNVIDIA(...).with_structured_output(Verdict)`.
- **Prompts** live in versioned files under `ai-service/app/prompts/`.
- **Invalid output:** a JSON parse failure gets one retry with a repair prompt, then an error callback.

**The guard** accepts videos of **10–90 s** and at least **360p** that are not too dark. This cap stays for the MVP.

**`rules.py`** runs after both models. It can lower a Verdict but never raise it:
1. **Liveness:** if the digits read equal `livenessCode`, the check is `yes`. Unreadable or mismatched digits are `unclear`.
2. **Missing observations:** a Rubric item with no Observation is set to `unclear`.
3. **Safety:** a safety item that is `no` or `unclear` goes into `safetyFlags`.
4. **Cap:** if the liveness check isn't `yes`, or any safety flag is set, a `pass` becomes `needs_review`. A `fail` stays `fail`.
5. **Consistency:** the item IDs must match the Rubric exactly, and each `timestampS` must fall within the video's length. Otherwise the callback reports an error.

---

## 7. Privacy, consent and honesty

**Verification consent** is shown in **both English and Kiswahili** before every upload, and the upload stays disabled until it's ticked. It covers:
- who sees the video: the Fundi, eligible Experts, Admins, and our AI on Smart Fundis' GPU
- that only the Badge becomes public
- that the Fundi can delete the video once review is finished
- that the video is **not** used for the Data Co-op or for AI training

The consent version and time are stored on the Assessment.

**Video access:**
- Convex stores only the `storageId`.
- Only the single-Assessment detail query (for the owning Fundi, an eligible Expert or an Admin) and `/ai/claim` return `getUrl()`.
- List queries never return it, and no one logs it.

**On Brev:** the worker deletes the local file after the callback and wipes `/data` on start. LangSmith masks inputs and outputs (ADR-13).

**What the public profile (`/f/[id]`) shows:** display name, county and area, Trades, years of experience, languages, bio, Badges, and Showcase links embedded with `youtube-nocookie` or the TikTok embed and labelled "Showcase — not verified". It **hides** phone, email, videos, AI feedback, and rejected or pending Assessments.

**Data Co-op:**
- It's a Roadmap feature. The landing page teaser leads with it: "Coming next: earn from your skills".
- The Fundi dashboard has a card with a "Tell me when it launches" toggle. This is Co-op interest, which means "contact me" and nothing else.
- There are no earnings figures anywhere.

**Demo data:**
- Demo profiles are created only by the seed, marked `isDemo`, and use invented names with initials avatars.
- Each Badge and each demo profile shows **"Demo: not a real verification"**.
- Seeded Assessments have no video and never enter an Expert's queue.

**Copy rules:**
- Always "verified by Smart Fundis", never "certified". NITA, KNQA and TVETs certify.
- Nothing may look live that isn't.

**Known limitations for the project card:**
1. A leaked video URL keeps working until the video is deleted. The fix, serving video through an authenticated HTTP action, is planned for the Pilot.
2. Clerk runs on its development instance.
3. The accuracy of reading the handwritten Liveness code hasn't been measured.
4. The only accuracy claims are the eval figures.

---

## 8. UI and design

**Stitch** designs these screens. Each screen gets one prompt in `design/stitch/prompts/`, and all of them use the shared header and footer.
1. landing
2. sign-up role pick and Fundi profile
3. Fundi dashboard
4. upload flow
5. Assessment result
6. Expert queue
7. Expert review
8. public Fundi profile
9. roadmap
10. `/fundis`

The Admin screens use plain shadcn.

**`DESIGN.md` rules:**
- Colours: green `#0B5D3B` and orange `#F28C28`.
- Plus Jakarta Sans through `next/font`, with 2 weights.
- Designed for 360 px first.
- Photos only in the hero (WebP under 100 KB, loaded with priority), with icons everywhere else. Photos show hands, tools and close-ups of work, with no identifiable faces. Stitch uses placeholders.

**Header:** logo, How it works, Trades, Find a fundi, a More menu linking to the `/roadmap` anchors, Sign in, and **Join as a fundi**. There's no search box.

**Landing page, in order:**
1. Hero: "Kazi yako, sifa yako", with **Join as a fundi** and **Find a fundi**
2. How it works, with step 1 showing the paper code
3. The 12 trades: Electrical and Hairdressing are "Verify now" and link to Join with that trade pre-selected. The other ten are muted "Coming soon" tiles that aren't buttons.
4. Trust, including **Become a verifier**
5. "Coming next: earn from your skills", with the Co-op first
6. Footer, with one contact email

There are no counters.

**`/roadmap`:** Data Co-op, bookings and M-Pesa, Fundi Pro, training partners, Client accounts, Trades, and the Rubric editor.

**Language:**
- The copy is English only. `next-intl` is wired up with only `en.json`, and the language toggle is hidden.
- The **consent screen** is the one exception and ships in English and Kiswahili.
- `feedbackSw` is stored but not shown yet.

---

## 9. Vertical slices

Each slice cuts through the UI, Convex and the AI, and can be demoed on its own. The work is done one slice at a time, using the loop in `planning/prompts/README.md`.

| Slice | What you can demo at the end | Stories | Blocked by |
| --- | --- | --- | --- |
| **V0 Skeleton** | The monorepo, the Next.js shell deployed to a Vercel preview, `npx convex dev` running, Clerk sign-in round trip, `users.store` and `users.me` | — | — |
| **V1 Tracer bullet** | A Fundi picks a Task, sees the Liveness code, accepts the verification consent (English and Kiswahili, unstyled) and uploads a video; the **stub worker** claims it and posts a canned result; the status updates live; an Expert (seeded) approves; the Badge shows on `/f/[id]` | US-3.1–3.7, 3.9, 4.1, 5.1, 5.3, 5.4, 5.7 | V0 |
| **V2 Real AI** | The stub is replaced by Brev, vLLM Cosmos, Nemotron, `rules.py` and the guard. Real Observations show in the Expert review, and tapping one jumps the video to its timestamp. The 2B and inline fallbacks work. | US-4.2–4.6, 5.2 | V1 (contract), plus the Brev setup |
| **V3 Trust and front door** | The Stitch landing page, `/roadmap`, `/fundis`, the header and footer, onboarding with both checkboxes, the restyled consent screen, the guard's reshoot reasons shown to the Fundi, the Co-op card, the visibility toggle | US-1.1–1.6 (English only), 2.2, 2.3, 3.8 | V1 |
| **V4 Judgement edges** | The Expert application and Admin approval, appeal, Admin override, video deletion, the `failed` screen with "Record again", role-bypass tests | US-2.5, 2.6, 2.8, 5.5, 5.6 | V1 |
| **V5 Demo** | The seed with Demo tags, the eval over `eval/clips.csv` (8B first), the backup video, the demo script, the project card | US-4.7, 6.1–6.3 | V2, V3 |

**`plan-first` tickets** get a `superpowers:writing-plans` plan before implementation: the V1 claim and callback contract, and the V2 pipeline with `rules.py`.

**Sunday timeline.** H0 is the start time. The prod promotion is at H+3 and the freeze at H+4, and they become clock times once the start is confirmed.

| Time | Lane A: web + Convex | Lane B: Brev + AI | Architect |
| --- | --- | --- | --- |
| H0–0:30 | V0 | Brev up, start downloading the model | secrets, merge order |
| to H+2:30 | V1 with the stub worker | vLLM, `/health`, the V2 pipeline run from the CLI on eval clips | review V1 PRs |
| H+3 | **prod promotion**: V1 on prod, `seed --prod` | switch the poller to prod: stub, or real if V2 is ready | only the Architect switches |
| to H+4 | V3; V4 if there's time | V2 swap on prod, the eval (8B) | **freeze at H+4**: backup video, a phone check of every acceptance criterion |
| after the freeze | V5: demo script and project card, fixes only | eval numbers into the project card | pitch |

**If the day runs late,** cut in this order:
1. Appeal
2. The override UI
3. 2B in the eval
4. Celery and Redis
5. The delete button

**Never cut:** the MVP loop, consent, ADR-11, the paper liveness check, the Co-op dashboard card, and the backup video.

If the eval is cut, the pitch says "no accuracy numbers yet".

---

## 10. Testing decisions

**Test only through public seams, never internals.** These are the seams, preferring the highest:
1. **Convex functions through `convex-test`:** role guards, legal and illegal status changes, stale callbacks returning 409, the rules for deletion, appeals and overrides, the Badge derivation, `/fundis` visibility, and that no list query returns a video URL.
2. **The Convex HTTP actions:** 401 without the secret, 204 when nothing is queued, the claim being atomic, and callbacks being idempotent.
3. **The `ai-service` graph as a black box, through `pytest`:** `rules.py` for every liveness and safety combination, the guard's thresholds, and the Cosmos prompt never containing the Liveness code. The model clients are replaced with fixtures.
4. **Playwright, at 360×740:** the MVP loop against the dev stack with the stub worker, the landing page and CTAs, Lighthouse (performance and accessibility ≥ 90), and no hardcoded strings.
5. **The eval:** `POST /eval/run` over `eval/clips.csv`, reporting agreement %, safety-fault recall and p50/p95 latency per model and per Trade, split by gender and lighting.

**Eval clips (ADR-14):**
- The core is the team's own recordings: every cornrow and socket-installation clip, the staged safety faults, and 2–3 clips with a wrong or missing code.
- Licensed **Pexels** clips add variety: hands only, off-task clips, and clips that are too short.
- Clips are downloaded one at a time by hand, and no critical verdict is published next to a recognisable person.
- There is no YouTube, TikTok or Mixkit footage.
- Clips are labelled blind before any AI run.

---

## 11. Code review

1. **Local:** every ticket ends with `/code-review` (Matt's check against standards and the spec) before the PR is opened.
2. **CI:** `.github/workflows/claude-review.yml` runs `anthropics/claude-code-action@v1` on every PR. It reviews against `AGENTS.md`, `CONTEXT.md`, this spec, and the linked ticket's acceptance criteria.
3. **Merging:** branch protection on `main` requires that check. The Architect squash-merges.
4. **End of each slice:** `/review-phase` (code-reviewer, rai-reviewer and qa), then a 120x Builder Review, which updates `planning/STATE.md`.

---

## 12. Out of scope for the MVP

- Client accounts, bookings, M-Pesa and Fundi Pro
- search and a geohash index
- the Data Co-op program itself and any licensing
- a Rubric editor, Whisper, the Kiswahili UI (apart from consent), and a Clerk prod instance
- serving video through an authenticated HTTP action
- time limits on appeals, and badge tiers
