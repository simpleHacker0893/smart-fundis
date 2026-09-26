# State

This is a short snapshot, updated in place at the end of every slice. It is not a log.

- **Phase:** V2 planning. The slice cut (V2-30) is done; the dashboard design (V2-40) is next.
- **Current branch for planning:** `docs/v2-spec`.
- **Done in code (evidence: git history, 2026-09-26):**
  - **V0 scaffold:** #2 monorepo, #3 Clerk sign-in, #4 Convex users, #7 ai-service and LangSmith tracing are merged to `main`. #5 branded shell is merged into the `v3/landing-page` line (PR #18). #9 Nemotron smoke is on `v0/9-nemotron-smoke`, not merged to `main`.
  - **V3 front door:** landing page, header and footer, `/evidence`, `/trades`, `/telemetry`, `/about`, `/contact` with the Convex-backed contact form (#29), `/privacy`, `/responsible-ai`, auth pages, `/pricing` (#20–#30), on `v3/landing-page`, not merged to `main`. Handoff: `docs/handoff/v3-front-door.md`.
  - **V6 design:** Stitch exports for `/trades` v4, `/fundis` v2 and onboarding v2 (#31, PR #33).
- **Done in docs:**
  - the MVP architecture spec, PRD, `CONTEXT.md`, ADR-18 to ADR-22, the Find a Fundi spec and V6 slice brief
  - the V2 specs (`docs/superpowers/specs/2026-09-26-v2-marketplace-design.md`, `…-v2-payments-design.md`) and ADR-23 to ADR-28, drafted
  - the V2 architecture review, `docs/reviews/v2-architecture.md`: every operator decision accepted (D-45 to D-58), **no open blockers**
  - the V2 slice briefs `planning/slices/V7.md`, `V8.md`, `V9.md`, `V11.md`, `V10.md` (V2-30), and the self-hosted Nemotron client added to the MVP `V2.md` scope (V2-Q48)
- **Not built yet:** MVP **V1** (stub worker, Assessment loop), **V2** (AI pipeline), **V4** and the **V6 core** (Listings). They are prerequisites: V7 builds on the V1 stub, and V8 is blocked on the V6 core (D-45).
- **V2 track (order V7 → V8 → V9 → V11 → V10, D-58):**

  | Slice | Demo in one line | Hard prerequisites |
  | --- | --- | --- |
  | V7 Dashboards + video analysis | Fundi, Expert and Admin dashboards; "Awaiting expert review"; the Verdict after one full playback; ops tiles | MVP V1; MVP V4 (Admin tiles, appeal); V6-1 (Listing status card) |
  | V8 Clients and Jobs (core, then rest) | a Client posts a Job; a Listed Fundi responds; the Client calls, hires and sees the Pay-to details | V7; V6 core; the IEBC ward list (V8-1) |
  | V9 Proximity | "Where I work", "near me" and distance bands; no map | V8; the centroid source (V9-1); the geospatial check (V9-2) |
  | V11 M-Pesa + Fundi Pro (sandbox) | STK Push in Test mode; the "FUNDI PRO · PAID" tag and legend; WhatsApp for Pro | V8; the mpesa agent listed in AGENTS.md |
  | V10 Job pre-fill (optional) | "Suggest from my words" with Nemotron; keyword-only when Brev is off | V11 (order); MVP V2 with self-hosted Nemotron; go/no-go V10-0 |
- **Gates before V8 production:** the DPIA update and processor agreements (D-49), the native-speaker sign-off on consent strings (R-20), and the IEBC ward-name import (D-56, V2-Q11).
- **Blockers:** none. Open operator questions V2-Q3, V2-Q11 and V2-Q35 block single slices, not the slice cut. V2-Q42 is answered (KSh 200 a month).
- **Waiting on the operator:** the `AGENTS.md` changes in the marketplace spec §23 and review §5 (the mpesa agent must be listed before V11-1); the IEBC ward-name source (V8-1); the NCA "building Trades" list in `convex/lib/trades.ts` (before V8-20).
- **Next action:** in a fresh session, run `planning/prompts/v2/V2-40-dashboard-design.md`. It can run in parallel with V7's prompt 10 (grill), once the MVP V1 prerequisite is on track.
