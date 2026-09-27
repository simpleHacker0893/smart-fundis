# Handoff prompt: continue V1 (#41 → #40 → #42)

Paste the prompt below into a new Claude Code session at the repo root.

---

```
You are continuing the Smart Fundis V1 slice (spec issue #36, "Tracer bullet") from a previous session. Read AGENTS.md, CLAUDE.md, CONTEXT.md, docs/agents/issue-tracker.md, and planning/prompts/40-implement-ticket.md and 50-pr-and-review.md first. Then read this file (docs/handoff/next-session-v1.md) to the end, along with docs/handoff/38.md and docs/handoff/39.md.

## Standing rules (the operator stated these; they override older docs)
- **pnpm only.** Never npm or npx. Use `pnpm exec` and `pnpm dlx`.
- **English only for now (D-64).** Add strings to `web/messages/en.json` only. No Kiswahili and no language toggle. Tickets and specs that say "EN + SW" are stale on this point. Tell every subagent this explicitly.
- **Secrets live only in the root `.env`.** Never read it, and never create per-app env files.
- **`pnpm exec convex codegen` pushes functions to the dev Convex deployment.** Run it for one branch at a time, never for two branches in parallel.
- **Workflow per ticket (prompt 40):**
  1. Claim the ticket and branch as `v1/<issue#>-<slug>`.
  2. Build it: plan-first tickets use superpowers:writing-plans, then superpowers:subagent-driven-development. Other tickets get a subagent of the owning role with the TDD brief (mattpocock-skills:tdd).
  3. For any change to `convex/`, run convex:convex-reviewer, then mattpocock-skills:code-review (Standards + Spec) against main.
  4. Run rai-reviewer on any AI or consent wording.
  5. Fix what holds up, then run superpowers:verification-before-completion.
  6. Write `docs/handoff/<n>.md`, then open the PR (prompt 50).
  7. Only the operator merges. Never merge yourself.
- **Keep the operator informed.** One line of status between steps. Put every ruling you make in the handoff file and the PR under "For the Architect".

## State at handoff (2026-09-27)

| Ticket | State | Branch / PR |
| --- | --- | --- |
| #37, #38 | merged | — |
| #39 claim/callback contract | **merged** (squash `66afaa9`, PR #59) | — |
| #41 Expert queue + decision | **in progress**, see below | `v1/41-expert-queue`, pushed; main merged in at `d32c311` (the only conflict, `convex/_generated/api.d.ts`, was resolved by keeping `lib/assessmentNames`) |
| #40 stub worker | not started, see below | — |
| #42 public `/f/[id]` + full-loop Playwright | blocked by #40 and #41 | — |
| #43 real phone + native-speaker check | `ready-for-human`, the operator's own step | — |

### #41: what's done and what's left
**Done:**
- **Backend (convex):**
  - `reviews.queue`, `reviews.detail` (the ONLY query that returns a video URL, and only while the status is `awaiting_review` or `appealed`) and `reviews.decide`.
  - `canDecide` in `convex/lib/auth.ts`. It refuses an Expert's own Assessment (Admins included), a non-Expert, a Trade the Expert isn't approved for, the original decider of an appealed Assessment, and a Demo Assessment.
  - `listMine` now returns `decidedAt` and `expertNote`.
  - `assessments.get` no longer returns `videoUrl`.
  - `decide` throws one generic `forbidden` for a missing Assessment and for any refusal. Its error codes are `forbidden`, `invalid_status`, `note_required` and `note_too_long`.
  - Reviewed by convex-reviewer and a spec/quality reviewer. Fix round 1 was re-reviewed clean.
- **Frontend (web):** `/expert` (the guard and the queue), `/expert/[assessmentId]` (the video, the Liveness code, the Observations, the "AI suggestion — you decide" panel and the decision form), `BUILT_ROLE_ROUTES.expert = true`, and the Badge line and Expert note on `/fundi`. The spec/quality review approved it. rai-reviewer found 2 majors.
- **Checks at `324a287`:** typecheck 0, lint 0 errors and 2 warnings (both cleared by W7), Convex 351 passed, web 460 passed.

**Committed after the first push:** the frontend fix round W1–W7, in commits `fd93b7a`, `4aae970`, `4e96b2c` and `11ee173`. At `11ee173` the checks passed: typecheck 0, lint with 0 errors and 0 warnings, Convex 351 passed, web 464 passed (with `--maxWorkers=4`; vitest workers sometimes crash on this Windows machine at the default count). The fix diff has **not** had its scoped re-review yet. The items were:
- **W1:** the approval note's label and hint say it is kept for the record and **not** shown to the Fundi. `reshoot` and `reject` keep "Note to the Fundi".
- **W2:** remove the AI verdict word from the queue row (automation bias), and keep the safety-flag count.
- **W3:** no decision is pre-selected. Submit stays disabled until the Expert picks one.
- **W4:** the Expert's `<video>` gets `controlsList="nodownload noremoteplayback"` and `disablePictureInPicture`.
- **W5:** show "The video has been deleted." only when `videoDeletedAt` is set. In an open status with no URL, show a new `videoUnavailable` line: "We couldn't load the video right now. Try again in a moment."
- **W6:** `expert/[assessmentId]/error.tsx` takes the Next.js props `{ error, reset }`.
- **W7:** `pnpm lint` shows 0 warnings. Prefer `argsIgnorePattern: "^_"` in `web/eslint.config.mjs`.

**Left for #41:**
1. Run a scoped re-review of the W1–W7 fix diff (`git diff 0d34cde..11ee173`) against the list above.
2. Run mattpocock-skills:code-review (Standards + Spec) on the whole #41 branch against `main`, and fix what holds up.
3. Run verification-before-completion: `pnpm -r typecheck`, `pnpm typecheck:convex`, `pnpm lint` and `pnpm test`. Put the real output against each #41 acceptance criterion.
4. Write `docs/handoff/41.md`. List these deferred items for the Architect:
   - the playback gate before deciding (V2 D-51);
   - tap-to-seek timestamps (US-5.2; DESIGN §D5 keeps them as plain text until the timestamp eval passes);
   - no scan ceiling on the queue (no Demo rows exist until the V5 seed);
   - `experts` is read twice in `decide`.
5. Open the PR against main with prompt 50. #39 is already merged and main is merged into the branch, so the PR diff is only #41's work.

### #40: the stub worker. The operator decided this on 2026-09-27; see the comment on issue #40.
The upload never stored the clip's file name, so the operator chose to **store it**. Do the work in this order, on a branch `v1/40-stub-worker` from main (#39 is merged):
1. **convex:**
   - Add an optional `assessments.clipName`, trimmed and capped at 200 characters.
   - `assessments.create` accepts an optional `clipName`.
   - `/ai/claim`'s job (`jobValidator` in `convex/lib/aiContract.ts`) gains an optional `clipName`.
   - Write the tests first.
2. **frontend:** the upload (`web/app/(site)/fundi/record-step.tsx`) sends `file.name`.
3. **gpu-devops: the stub in `ai-service/scripts/`, Python 3.11, uv.**
   - It polls `/ai/claim` and reads `AI_SHARED_SECRET` and the Convex site URL from the root `.env`.
   - It sends the header as exactly `Bearer <secret>` (the scheme is case-sensitive).
   - It picks its canned outcome from `clipName`, following the #36 decision 1 in the #40 ticket.
   - It posts to `/ai/callback`.
   - It handles responses this way:
     - 204: sleep, then poll again;
     - 401: exit with a clear message;
     - 409: log it and continue;
     - 400: log the `error` field (it means a worker bug).
   - Result rules:
     - send every Rubric item exactly once;
     - send `safetyFlags` only with Rubric item ids;
     - send `fallbackModel: false`;
     - `feedbackSw` and `reason.sw` are optional (English only);
     - send `confidence` in [0, 1], at most 20 items per list and at most 2000 characters per text.
   - pytest against a fake HTTP server covers the three outcomes. ruff must be clean. Add a README section on running it with uv against dev.
   - The full contract is in `docs/handoff/39.md` under "Contracts".
4. Run the reviews, write the handoff and open the PR, as for every ticket.

### #42 (after #40 and #41 merge)
- The public, unstyled `/f/[id]` page shows the name, Trade and county. It shows the Badge lines "Verified by Smart Fundis — <Trade>: <Task> · <date>" and nothing for `needs_review`, `rejected` or pending Assessments.
- A leak test on the public query's JSON checks it returns no phone, video URL, Observation or Verdict.
- The word "certified" appears nowhere.
- Playwright at 360 px runs the full loop: upload → stub → Expert approves → the Badge shows on `/f/[id]`. This also closes #38's partial criterion that the chip goes `queued → analyzing` live.
- Build the Showcase embeds with `parseShowcaseLink` (see docs/handoff/38.md).

### Open questions for the Architect, from #39 (also in PR #59)
- Is the `queued → failed` move for an unclaimable row acceptable? It isn't in the §5 table.
- Should the AI mutations be exempt from AGENTS.md rule 3? They rely on the bearer secret (ADR-9).
- `fallbackModel` changed from a string to a boolean. Check the data before the prod deploy.
- `AI_SHARED_SECRET` must be set on each Convex deployment.

### After V1
Once #42 is merged and the operator has done #43, stop and ask the operator before starting V2. V2's specs (real AI, marketplace, payments) include decisions still marked "proposed" (D-33 to D-58). Run prompt 60 (close the slice), then report the V2 frontier.
```
