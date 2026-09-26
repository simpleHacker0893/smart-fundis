# V2 architecture review

- **Date:** 2026-09-26
- **Prompt:** `planning/prompts/v2/V2-25-v2-architecture-review.md`
- **Branch:** `docs/v2-spec`
- **Reviewed:**
  - `docs/superpowers/specs/2026-09-26-v2-marketplace-design.md` (**M**)
  - `docs/superpowers/specs/2026-09-26-v2-payments-design.md` (**P**)
  - ADR-23 to ADR-28
  - D-29 to D-44, R-24 to R-37, and the V2-Q rows
  - `CONTEXT.md`
  - `docs/research/2026-09-26-*`
  - the MVP architecture spec
- **Reviewers, run in parallel:** rai-reviewer, convex-reviewer and then code-reviewer, architect, designer.
- **Outcome:** 14 decisions were put to the operator (grilling round 1), and the operator **accepted every recommendation**. The blockers that needed no decision are fixed mechanically. The fixes are applied to M, P, the ADRs, `CONTEXT.md`, the find-a-fundi spec and the planning files in this same commit.

Line references below are to the files as they were **before** the fixes.

---

## 1. Operator decisions (grilling round 1, all recommendations accepted)

| # | Decision | New row |
| --- | --- | --- |
| Q1 | **Prerequisites.** V7 is built on the MVP **V1 stub** (stub worker and canned callbacks), because the dashboards only display stored fields. V8 stays blocked on the **V6 core** (Listings). The "this sprint" labels in M §21 are replaced by explicit prerequisites. V7 restyles the MVP Expert review; it does not build a second one. | D-45 |
| Q2 | **Contact.** Every reveal (Call, WhatsApp, Pay-to) needs `requireClient`: a Client profile with a phone, 18+ and the terms accepted. One `contact.reveal({ fundiProfileId, channel, jobId?, interestId? })` replaces `jobs.revealFundiPhone` and `jobs.openWhatsApp`. V6's anonymous `visitorKey` reveal is **retired**, so V2-Q24 is answered yes. All reveal paths go through one internal helper keyed on `userId`. A **per-Fundi daily cap** covers all of them: V6's 100 a day, counted across Call, WhatsApp and Pay-to. `clients.create` is rate-limited per identity. `contactShares.jobId` becomes optional and `contactReveals` is retired. V8 owns the migration. | D-46 |
| Q3 | **Pro disclosure on the result itself.** The tag reads **"FUNDI PRO · PAID"** in English and **"FUNDI PRO · AMELIPIA"** in Kiswahili. It is a 48 px button that opens the US-8.32 explanation, and it also appears on `/f/[id]`. The forbidden-word copy test allow-lists "Paid". The Kiswahili legend drops "usajili", which reads as official registration. The draft is "Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi", pending a native-speaker check (R-20). | D-47 |
| Q4 | **Safety Trades.** On **Electrical and Solar**, verified comes first and Pro is tagged within each tier: verified Pro, then verified, then Demo, then not-yet-verified Pro, then not yet verified. Every other Trade keeps round-3 Pro-first (D-44). | D-48 |
| Q5 | **Kenya DPA transfers.** An explicit line (EN + SW) in both the verification consent and the Client terms says data is processed outside Kenya: Convex and Clerk (US), Brev, and LangSmith. Processor agreements for Convex, Clerk, Brev and LangSmith are kept on file. The **DPIA update gates V8's production deploy**, and V9's for location. | D-49 |
| Q6 | **Before the Expert decides, the Fundi sees one neutral line** for every Verdict: "Awaiting expert review". Nothing hints at the Verdict, the cap or a safety flag until the decision. | D-50 |
| Q7 | **The Expert sees the AI Verdict only after the video has played through once.** The queue shows only the safety marker, never an "AI suggestion" chip. We log how often Experts agree with the AI and how long they take, and show it on the Admin eval tiles. | D-51 |
| Q8 | **"The AI noticed…" is shown only on a reshoot or reject decision**, never on an approved Assessment, for V2 (V2-Q20 narrowed). | D-52 |
| Q9 | **A hired Job auto-closes to `done` 30 days after `hiredAt`**, and the Client gets a notice. Retention counts from the close. | D-53 |
| Q10 | **Proximity uses `@convex-dev/geospatial` `nearest()`** behind the `ProximityIndex` interface, with one call per tier (`filterKeys: { scope, tier }`) and only snapped points stored. The custom precision-5 ring search stays as the fallback behind the same interface. `convex-expert` confirms the choice in V9's first ticket. This supersedes D-37's own-geohash choice and the "no `@convex-dev/geospatial`" line in M §22. | D-54 |
| Q11 | **Job location precision.** Public and pre-hire Job bands are computed from the **ward centroid**, never the Client's point. `clientProfiles` stores **no point**. Results sort **by band**, never by exact km. The server snaps every query point before it computes bands. The copy says "others can tell only roughly which area (about 1 km)" rather than "never shown". `fundi.setServiceArea` is rate-limited. | D-55 |
| Q12 | **V8 imports ward names only** (IEBC / LN 14/2012) for the six first counties, so V2-Q11 becomes a V8 dependency. Point capture and centroids stay in V9. | D-56 |
| Q13 | **Navigation.** The public bar is **JOBS · TRADES · EVIDENCE · COMPANY**, with TELEMETRY moved into the COMPANY sheet and the footer. Role routes (`/client`, `/fundi`, `/expert`, `/admin`) replace it with a role bar of at most 4 items. The role switcher sits in the avatar sheet, the bell in the header, and the EN \| SW toggle in the menu sheet and the footer (and the desktop header). | D-57 |
| Q14 | **Nemotron Job pre-fill (V10) is last and optional.** It moves after V11 and is cut unless Brev already runs for video. It keeps every reviewer fix (§3.4). gpu-devops measures p95 parse latency while Cosmos is busy before V10 is cut. | D-58 |

---

## 2. Findings by reviewer

Severity key: **B** = blocker, **S** = should-fix, **N** = nit. "→" gives the resolution.

### 2.1 rai-reviewer (PRD §8)

- **B1.** The Fundi sees an AI Verdict hint before the Expert decides (M:440, 447, 495, 498; US-8.27 M:97; test #40 M:486) → Q6 / D-50.
- **B2.** Paid ranking is not disclosed on the result itself. "Pro" reads as "professional", `/f/[id]` has no tag, and an unverified Pro electrician can outrank a verified one (M:378–380, 585; R-36) → Q3, Q4 / D-47, D-48.
- **B3.** There are no Kiswahili drafts for the consent lines (M:75, 339, 530, 533, 534, 538). The Client terms leave out: the first name shown to Fundis, who counts as "signed-in fundis", retention, the Client's rights, that data is not used for AI training, and that data is processed outside Kenya → mechanical, §3.1.
- **B4.** No consent line or safeguard covers processing outside Kenya, and the DPIA is gated too late (M:568) → Q5 / D-49.
- **B5.** Job photos under 1,600 px may keep their EXIF GPS data (M:75) → mechanical, §3.1.
- **S1.** Sandbox Pro subscriptions on production would rank testers first for real visitors → on `prod`, only `mode: "production"` subscriptions set `listings.subscriber`.
- **S2.** Pro copy appears in V8 strings (M:79, 531) → V8 ships versions of those strings without Pro.
- **S3.** The pay sheet says "You appear first…" (P:66) → reword to "You appear above fundis without Fundi Pro". Never list chat or AI voice as benefits.
- **S4.** "usajili" in the Kiswahili legend → Q3.
- **S5.** The Expert sees the Verdict too early → Q7.
- **S6.** "The AI noticed…" on approved Assessments → Q8.
- **S7.** Location triangulation, a point stored on the Client profile, and over-assuring copy → Q11.
- **S8.** A Pochi number reveals the Fundi's phone → Q2. The Pay-to form warns the Fundi.
- **S9.** 18+ is asked only of new accounts → existing Fundis and Experts are asked at their next sign-in, and uploads are blocked until they confirm.
- **S10.** No erasure path and no lawful basis → a manual deletion runbook through info@ with a 30-day response, and a privacy notice listing the lawful basis for each purpose.
- **S11.** Publish doesn't restate what becomes public → US-8.2 restates it.
- **S12.** Stale wording in R-24 ("only after shortlisting") and ADR-24 ("two-sided") → updated.
- **N.** Sort near-me by band (Q11). Split `tradeKept` by input language. Add the PRD §8 splits (sex, lighting, phone) to the eval tiles. Extend the licence line to NCA for building Trades. Show an "Examples only, no real jobs yet" banner when `/jobs` has only Demo Jobs. The `wa.me` text must not mention a Job when there is none.

### 2.2 convex-reviewer

- **B1.** The geohash `.take(50)` per coarse cell returns rows that aren't the nearest, and it ignores tiers. Test #29 can't pass (M:301, 875) → Q10 / D-54.
- **B2.** Four reads need `now`: `jobs.getPublic` (M:168, 718), `ops.pipelineHealth` (M:483), `ops.summary` (M:99, 804) and the 24 h AI failures tile → mechanical, §3.2.
- **B3.** The reveal contracts contradict each other (M:28, 83, 676, 784–790, 860) → Q2 / D-46.
- **B4.** A payment paid at M-Pesa can fail to settle: a timeout without a `checkoutRequestId`, or rows stuck in `created` (P:112, 133, 235) → mechanical, §3.3.
- **B5.** Gaps in `syncListing` (R-16): `interests.create` with addTrade (M:635), centroid edits in `areas` (M:641), and `clients.create/update` writing `users.phone` → mechanical, §3.2.
- **S1.** Hired Jobs never close → Q9.
- **S2.** `jobsNearMe` paginates but is capped → mechanical, §3.2.
- **S3.** `liveInterestCount` is a conflict and re-render hot spot → mechanical, §3.2.
- **S4.** There is no draft purge index, and the crons have no batch sizes → mechanical.
- **S5.** `notifications.jobId` is required, and indexes and the unread counter are missing → mechanical.
- **S6.** `@convex-dev/aggregate` is not mounted → decided: use named counter documents and do not mount aggregate in V2.
- **S7.** `jobs.getMine` is missing, and `parseResult` has no ownership check → mechanical.
- **S8.** Some writes have no rate limit (`saveDraft`, photo upload URL, `repost`, `setPayTo`, `setServiceArea`, `clients.create`) → mechanical.
- **S9.** Responses from hidden Fundis need a Listing row → V2-Q37 = yes (must be Listed).
- **N.** Rename the `listings` indexes to the `by_a_and_b` style. Add `by_clientUserId` / `by_fundiUserId` (newest first). Add `contactShares.by_viewerUserId_and_at`. Add a `jobs.board` `budgetMaxKsh` index field. `recordRefund` sets `active=false` itself. Code nits for later: the `.js` import in `convex.config.ts:2`, typed env for `ADMIN_EMAILS`, and changing `rolesValidator` together with `users.me` in V7-1. ADR-25 names the ~1 km floor explicitly.

### 2.3 code-reviewer

- **X1 (B).** The anonymous V6 reveal is never retired, and fake Clients are nearly free → Q2 / D-46.
- **S1.** `jobs.addPhoto` accepts any `storageId` → record each upload with its uploader when the URL is issued, and accept only the caller's own unused uploads. `getForFundi` is limited to `open`/`shortlisted` Jobs plus the hired Fundi, and excludes hidden Fundis.
- **S2.** Free-text writes skip `contactFilter` → `saveDraft` works on drafts only. `contactFilter` runs on `interests.update` and on `clients.create/update` (`displayName`, `businessName`).
- **S3.** Missing argument-ownership checks:
  - `interest.jobId === jobId` and the Interest is not withdrawn or removed;
  - `revealPayTo` resolves the Fundi through `job.hiredInterestId`;
  - `notifications.markRead` checks each id;
  - `jobReports.create` checks that the ids belong to the Job;
  - `payments.abandon` is owner-only.
- **S4.** STK prompts to any MSISDN → `startSubscription` defaults to `users.phone`. Another number needs a confirm step, and there is a per-MSISDN limit of 3 a day.
- **S5.** Callbacks are unsigned → settle only on a confirming STK Query at minimum for late callbacks (`expired`/`failed`/`abandoned → paid`) and for callbacks with no stored `checkoutRequestId`. Before V11, check whether Convex logs record the path token (marked UNVERIFIED).
- **S6.** The parse HTTP boundary trusts ai-service → add length and range checks (`title` ≤ 80, `areaText` ≤ 60, `budgetKsh` 1..10,000,000, ≤ 3 Trades) and a separate `AI_PARSE_SECRET`.
- **S7.** Undefined types (`MyInterest`, `MyJobRow`, `ParseResult`, `OpsSummary`, `ListingCard.pro`). `jobs.board` switches between paginated and array results → a separate `jobs.boardNear` query that returns an array.
- **S8.** Pochi overrides the phone opt-in → Q2 (warning on the form, counted against the cap).
- **N.** The query point is snapped on the server (Q11). `PAYMENTS_TESTERS` is matched against the verified token email. `requireClient` throws when `caller.user` is null. Drop the `GeoProvider` interface until a real provider exists. Pre-fill value → Q14. Hidden Fundis are excluded from `getForFundi`.

### 2.4 architect

- **B1.** MVP prerequisites are missing from the code → Q1 / D-45.
- **B2.** The reveal is ambiguous → Q2.
- **B3.** V8 ships the ward picker without its data → Q12 / D-56.
- **B4.** Pre-fill needs a fast lane → Q14 / D-58, with the fixes in §3.4.
- **S1.** `getPublic` reads the clock → §3.2.
- **S2.** `notifications.jobId` → §3.2.
- **S3.** `saveDraft` returns a result union → §3.2.
- **S4.** Missing contracts: `users.me`, `jobs.getMine`, `notifications.unreadCount`, a seen marker for "N new responses", the undefined types, the `listJobReports` return type, and merging `ops.summary` with `pipelineHealth` → §3.2.
- **S5.** `jobsNearMe` pagination → §3.2.
- **S6.** Error convention, `"v": 1` on the parse bodies, and the JobParse aliases → §3.2.
- **S7.** Hired Jobs never close → Q9.
- **S8.** LangSmith masking of parse output → §3.4.
- **S9.** D-32 is not carried through → "Amended (D-32)" notes go in the MVP spec. The self-hosted Nemotron client becomes a ticket, recorded in QUESTIONS for V2-30. AGENTS rule 4 goes to the operator (§5).
- **S10.** Stale contact wording in ADR-24 and R-24 → updated.
- **S11.** §8.1 rule 1 contradicts rule 4 → reworded.
- **S12.** The V6 WhatsApp button must be removed in V8 → noted in the V8 slice.
- **S13.** The payments spec reads `isFundiPro` at query time → it uses `listings.subscriber`. V2-Q32 now points at V11.
- **S14.** Missing testing seams → §3.5.
- **S15.** Aggregate → named counters (see convex S6).
- **S16.** 18+ backfill → see rai S9.
- **S17.** `CONTEXT.md` is stale at :9, :86 and :136 → updated.
- **N.** State the listings tier backfill. Use a word-boundary forbidden-word test. Define "attempt" in `idempotencyKey`. `suggestFromText` runs only on an explicit tap. Refresh STATE.md.

### 2.5 designer

- **B1.** The navigation has no room → Q13 / D-57.
- **B2.** The prompts say "English only", there is no language-toggle slot, and the Kiswahili type scale breaks → the hero uses `clamp(32px, 9vw, 44px)` with `overflow-wrap: anywhere`, tags and chips use 0.08em tracking, and every V2 prompt draws one Kiswahili frame at 360 px. The prompt files belong to the designer and are fixed in V2-40 (§4).
- **B3.** There is no status or tag vocabulary → M §13 gains a **tag table**:
  - **Badge:** ✓ with the amber tick.
  - **Expert:** solid outline with the scan-eye icon.
  - **Pro:** dashed outline with a receipt icon and the word PAID.
  - **Demo:** dim outline reading "DEMO: NOT A REAL JOB".
  - **Test mode:** a full-width banner.
  - **Not yet verified:** plain dim text.
  - **Error:** ✕ with text.
  - An 8-glyph set for the neutral status chips.
  - Never colour alone. `DESIGN.md` gets the same table in V2-40.
- **B4.** The Pro label depends on the legend → Q3.
- **S1.** The cinematic layer is too heavy → "app mode" on the role routes and `/jobs`: a CSS-only amber button, no grain, no GSAP. Budget: about 150 KB gzipped of first-load JS per route, tested on Slow 3G with 4× CPU throttling. The research has no device figures, so none are claimed.
- **S2.** Geolocation states:
  - denied, timeout, unavailable and blocked-in-settings;
  - `enableHighAccuracy: false`, `timeout: 10000`, `maximumAge: 600000`;
  - `near=1` on reload asks again;
  - "Distance isn't available in <County> yet" outside the six counties;
  - the consent line is shown to visitors too;
  - after locating, a "Near <ward>" confirmation.
  - No map; a list with distance bands is enough.
- **S3.** Job photos → a 480 px WebP thumbnail with the full size on tap, and upload progress, retry and failure states.
- **S4.** Empty, loading and error states for every list and every reason code, with skeletons and never page-blocking spinners.
- **S5.** Card actions are secondary. The one amber fill sits in the Hire confirm sheet.
- **S6.** The response card and Job card at 360 px → two primary actions, the rest in a row below.
- **S7.** No WhatsApp or M-Pesa logos and no green → text plus a generic line icon.
- **S8.** The "no counters" rule is limited to site-wide public counters, with the exceptions listed.
- **S9.** The legend becomes a stacked 2-column grid.
- **S10.** The AI pre-fill box shows only when the worker's heartbeat is fresh (§3.4).
- **S11.** Near-me reads are one-shot with a "Refresh" button, not live subscriptions.
- **N.**
  - Mono floor is 12 px.
  - Timestamp chips are 48 px, and "--:--" gets the label "no timestamp".
  - No fake progress while `analyzing`.
  - No "LIVE" label on the landing strip.
  - Admin uses a dark shadcn token theme.
  - Remove the orphan paragraph at M:488–489.
  - V11 frames are marked EXAMPLE.

---

## 3. Mechanical fixes applied

### 3.1 Consent and privacy (M §12, §7, US-8.2, US-8.5)
- Kiswahili drafts for every consent line are marked "SW draft, native-speaker check (R-20)". R-20 is extended to consent strings, which need sign-off before V8 merges.
- The Client terms gain six clauses:
  - Fundis see the Client's first name;
  - "signed-in fundis" means anyone who signs up as a fundi;
  - the retention periods;
  - the Client's rights (access, correction, deletion via info@);
  - Job text and photos are not used to train AI;
  - data is processed outside Kenya (D-49).
- Photos are always re-encoded in the browser, and `jobs.addPhoto` rejects or strips GPS EXIF on the server. The same applies to V6 Portfolio uploads. A new test covers it.
- US-8.2 restates at Publish what goes public and what signed-in Fundis see.
- A privacy notice lists the lawful basis for each purpose, and there is a manual deletion runbook.

### 3.2 Convex model and contracts (M §6, §14, §15, §16)
- **Replacing reads of `now`:**
  - `jobs.publicUntil` is set by `setJobStatus` to `closedAt + 7 d`, and a cron clears the public visibility flag.
  - The ops tiles read day-bucket counter documents.
  - `ops.summary` and `ops.pipelineHealth` are merged.
- **Response counts:** `jobs.responseBucket` is patched only when the bucket changes, and the exact count lives in a `jobCounters` row.
- **New fields and indexes:**
  - `jobs.updatedAt` and `by_status_and_updatedAt`;
  - batch sizes of 50 for `expireDue` and the purges;
  - `notifications.jobId` optional, plus `by_userId_and_at`, `by_at` and an unread counter document;
  - `by_clientUserId` and `by_fundiUserId`;
  - `contactShares.by_viewerUserId_and_at` and `fundiProfileId`;
  - a `budgetMaxKsh` index field;
  - the `listings` indexes renamed during the V2 re-tier migration.
- **`syncListing` caller list (R-16) now includes:**
  - `interests.create` with addTrade;
  - `clients.create/update` when they write `users.phone` or the display name;
  - `subscriptions.markExpired`, run in batches;
  - centroid points copied onto each Fundi or Job at write time, so later `areas` edits do not propagate (this is stated explicitly);
  - `setPayTo` and `clearPayTo` listed as exempt.
- **Contracts:**
  - `jobs.getMine({ jobId })` is added;
  - `jobs.parseResult` checks the caller;
  - `jobs.saveDraft` works on drafts only and returns `{ ok: true, jobId } | { ok: false, reason: "posting_blocked" | … }`;
  - `jobs.boardNear` and `fundi.jobsNearMe` return plain arrays of at most 60 rows;
  - `users.me` and `notifications.unreadCount` are added, and `clientProfiles.lastSeenResponsesAt` drives "N new";
  - `MyInterest`, `MyJobRow`, `ParseResult` and `OpsSummary` are defined, and `ListingCard.pro` is added.
- **Error convention:** throw on auth or invariant failures, and return `{ ok: false, reason }` for expected user outcomes.
- **Rate limits** are added for `saveDraft`, `generatePhotoUploadUrl`, `repost`, `setPayTo`, `setServiceArea` and `clients.create`, and there is the per-Fundi reveal cap (D-46).
- **Ownership and content checks** from the code-reviewer's S1 to S3 are added, plus `contactFilter` on all free text.
- No `@convex-dev/aggregate`: named counter documents instead.
- `requireClient` throws when `caller.user` is null.
- `GeoProvider` is dropped.

### 3.3 Payments (P §5, §7, §8, §12)
- When there is no stored `checkoutRequestId`, a callback settles only if the token matches, the amount matches, the receipt is unused **and** an STK Query confirms it. The ID is stored at that point.
- A cron expires `created` rows older than 2 minutes.
- Late callbacks (`expired`/`failed`/`abandoned → paid`) settle only on a confirming STK Query.
- Whether STK Query works without a stored ID is UNVERIFIED, and so is whether Convex logs record the path token. Both are checked on V11's first ticket.
- `startSubscription` defaults to `users.phone`. Another number needs a confirm step, and there is a per-MSISDN limit of 3 a day.
- `payments.abandon` is owner-only.
- `PAYMENTS_TESTERS` is matched against the verified token email.
- On `prod`, only `mode: "production"` subscriptions set `listings.subscriber` (rai S1).
- `interests.listForJob` uses `listings.subscriber`.
- `recordRefund` sets `active = false` itself.
- The pay-sheet copy says "above fundis without Fundi Pro".
- `idempotencyKey` "attempt" is defined as one user tap of Pay.
- V2-Q32 → V11.

### 3.4 Job pre-fill (M §11.2; V10, now last and optional)
- A dedicated parse lane on Brev: its own loop, polling every 1–2 s, never behind a video job, including in `QUEUE_MODE=inline`.
- `claim-parse` refuses requests older than 15 s. A request claimed but with no callback after 30 s becomes `failed`, and so does one whose callback returns 400.
- **Heartbeat:** a claim writes `aiWorker.lastSeenAt` at most every 30 s. If it is older than 60 s, `suggestFromText` returns `requestId: null`, and the UI shows only keyword suggestions, with no AI box and no spinner.
- `"v": 1` goes on the parse bodies. The JobParse camelCase ↔ snake_case aliases are specified, and so are the length and range checks. `AI_PARSE_SECRET` is separate from the Assessment secret.
- The LangSmith allow-list redacts `title` and `areaText`, and a pytest asserts that no output strings are traced.
- `suggestFromText` runs only on an explicit tap.

### 3.5 Testing seams (M §17)
- A clock seam (fake timers) for purges, `publicUntil`, `aiParse` expiry, `subscriptions.markExpired` and the auto-close in D-53.
- A shared `assertNoLeak(json, patterns)` helper.
- A `ProximityIndex` contract suite run against every implementation.
- Playwright `context.setGeolocation`, granted and denied.
- A stub parse worker, and a "Brev off" end-to-end test.
- A `DarajaClient` module seam.
- The rate-limiter component registered in convex-test.
- A word-boundary forbidden-word test that allow-lists "Paid".
- A test that EXIF is stripped.
- A test that near-me results are sorted by band.

---

## 4. Deferred to other prompts (not applied here)

- **V2-40 (designer).**
  - Fix "English only" in `design/stitch/prompts/00-header-footer.md:38`, `13-find-a-fundi.md:32`, `14-onboarding-role.md:7` and `15-onboarding-fundi-profile.md:9,64`.
  - Add the tag table, the app-mode rule, the 12 px mono floor and the counter exceptions to `DESIGN.md`.
  - Write the V2 screen prompts, with one Kiswahili frame per screen.
- **V2-30 (slice briefs).**
  - Use the new prerequisites (D-45) and the slice order: V7 → V8 → V9 → V11 → V10 (optional).
  - Add a ticket for the self-hosted Nemotron client (D-32).
  - Remove the V6 WhatsApp button in V8.
  - Migrate the V6 reveal in V8.
  - Import ward names in V8.
  - Add the 18+ backfill prompt.
- **Before V8 production:** the DPIA update, the processor agreements on file, and the native-speaker sign-off on the consent strings.
- **Code nits** go to the V7-1 ticket: the `.js` import in `convex/convex.config.ts:2`, typed env for `ADMIN_EMAILS`, and `rolesValidator` together with `users.me`.

**Added while applying the fixes. V2-30 must confirm these:**
- Proposed rate-limit figures for `saveDraft`, the photo upload URL, `repost`, `setPayTo`, `setServiceArea` and `clients.create` (M §14). The review named the limits but gave no numbers.
- A new internal `privacy.eraseUser` action run by an Admin (M §12.4), which backs the manual deletion runbook. Self-service account deletion stays out of scope.
- New Expert play-through fields that support D-51.
- The NCA licence-line Trades, and the hosting regions for Brev and LangSmith. All three are marked UNVERIFIED.

## 5. Proposed `AGENTS.md` changes (the operator applies them)

This adds to M §23:
- Rule 4: say that `NVIDIA_API_KEY` is needed only while the hosted fallback exists (D-32), and add `AI_PARSE_SECRET` and `DARAJA_*` to the list of Convex-only secrets.
- The Fundi Pro non-negotiable reads "FUNDI PRO · PAID" on every boosted result, and **"verified first on Electrical and Solar"** (D-48).
- Contact: "every reveal needs a Client profile and is capped per Fundi per day" (D-46).

## 6. Open blockers

**None.** The phase may proceed to V2-30. The operator questions that remain open are V2-Q3, Q11 (now blocking V8) and Q35 (V2-Q42 is answered: KSh 200 a month). They block individual slices, not the slice cut.
