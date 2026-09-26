# Smart Fundis — Version 2 Marketplace design (Jobs, public board, proximity, role dashboards)

- **Status:** draft, 26 Sep 2026, **awaiting operator approval**. The operator answered V2-Q1, Q2, Q4–Q9 and, in rounds 2–6, the subscription, contact, ranking, renewal, ward-name, Pay-to and price questions on 2026-09-26 (§2.1); those are binding. The **V2-25 architecture review** (`docs/reviews/v2-architecture.md`) put 14 more questions to the operator, who accepted every recommendation (D-45 to D-58, §2.1); its mechanical fixes are applied here. The review has **no open blockers**. Every row marked "proposed" or "open" is the Architect's recommendation, not a decision. The remaining open items are in §20.
- **Slices and prerequisites:** the Version 2 track, numbered **V7 onwards** (`planning/prompts/v2/README.md`). Order: **V7 → V8 → V9 → V11 → V10 (optional)** (D-45, D-58). Each slice names its prerequisites in §21 instead of a sprint label (D-45). Until V11 (M-Pesa and Fundi Pro, Spec B) ships, no "Pro" UI appears anywhere, ranking stays verified-first (D-24), and contact is the Call reveal only. V2-30 writes the briefs.
- **Extends:** `docs/superpowers/specs/2026-09-25-architecture-design.md` (the "architecture spec") and `docs/superpowers/specs/2026-09-26-find-a-fundi-design.md` (the "find-a-fundi spec"). Every change to an earlier rule is listed in §18 and proposed as D-33 to D-44 in `planning/DECISIONS.md`; the V2-25 review decisions are D-45 to D-58. "Amended 2026-09-26 (proposed, D-n)" notes are in the affected architecture-spec sections.
- **Sibling spec:** `docs/superpowers/specs/2026-09-26-v2-payments-design.md` ("Spec B": direct pay to the Fundi, and the proposed subscription paid by M-Pesa). This spec says only where payment plugs in (§10).
- **ADRs (proposed):** ADR-23 (Client is a derived role), ADR-24 (Jobs and Interests; contact only through logged steps), ADR-25 (location: device point snapped to ~1 km plus a county → sub-county → ward picker, distance bands; accepts the ~1 km floor; supersedes PRD ADR-6), ADR-26 (price is a filter, never a rank), ADR-28 (paid subscription and a labelled ranking boost; amends ADR-22 and D-24). ADR-27 (M-Pesa scope) belongs to Spec B.
- **Glossary:** the new and changed terms (§19) are in `CONTEXT.md`, marked "(V2, proposed)" until this spec is approved.
- **Research used:** `docs/research/2026-09-26-kenya-domain-research.md` ("KR §n", "I-n"), `docs/research/2026-09-26-nvidia-fit.md` ("NF §n"), and live-doc checks on 2026-09-26 (Google Maps Platform terms and prices, `@convex-dev/geospatial`, Daraja). Anything that couldn't be confirmed is marked **UNVERIFIED**.
- **Package manager:** pnpm (D-12). Every command is `pnpm …`, `pnpm exec …` or `pnpm dlx …`. Every local secret lives in the repo-root `.env` (D-13).

---

## 1. Problem

Find a Fundi (V6) lets a Client look for a Fundi, but the Client has to do all the work: browse, compare and phone around. A Client with a specific need ("my Probox's brakes squeal, I'm in Ruiru, I can pay about KSh 3,000") has no way to say so once and let the right Fundis come to them. A Fundi has no way to find work beyond waiting for a call. Kenya's live fundi platforms either book without proof of skill or list without any trust layer (KR §1, N1.1). Only two let a Client describe a job (N1.3), and none shows task-level evidence of skill next to the Fundis who answer.

Distance matters too. In Nairobi and Kiambu, "near" decides whether a fundi can come today. The MVP has only county and free-text area (D-18), with no distance at all (PRD ADR-6 kept it post-MVP).

## 2. Solution

A small-jobs **marketplace** built on the Listing and the Badge:

1. A **Client** (a signed-in User with a Client profile) posts a **Job**: Trade, title, description, location (county → sub-county → ward, a free-text landmark, and optionally "near me"), optional budget and optional photos. Later, and only if Brev already runs for video, an AI suggestion may pre-fill the form from one sentence (V10, optional, D-58); the Client confirms every field.
2. The Job appears on the public **Job board** (`/jobs`), in a **"Latest jobs"** strip on the landing page and under a **JOBS** header tab (operator Q6, nav per D-57). The public sees only the Trade, title, county · ward, budget if given, how long ago it was posted and a response-count bucket. Never the Client, the phone, the landmark, the exact place or the photos.
3. **Any Listed Fundi** may send an **Interest**: "I'm interested" plus a short note (≤ 280 characters). No price amount (operator Q4, Q5; Listed per V2-Q37).
4. The Client sees the responses ranked **Fundi Pro first** (a paid subscription; within Pro, verified first), then verified, then not yet verified (operator round 3), then nearer band first, and can **shortlist** and **hire** one Fundi. **Exception, Electrical and Solar (D-48):** verified comes first there, and Pro is ordered and tagged within each tier. Every boosted place carries a visible **"FUNDI PRO · PAID"** tag (SW "FUNDI PRO · AMELIPIA"), which opens the explanation, on the result itself and on `/f/[id]` (D-47). A one-line legend explains it.
5. **Contact** (operator rounds 2–4, D-46). A **Client's phone number and WhatsApp are never shown to a Fundi**; contact runs Client → Fundi only. Every reveal (Call, WhatsApp, Pay-to) needs `requireClient`: a Client profile with a phone, 18+ confirmed and the terms accepted. One mutation, `contact.reveal`, serves Call and WhatsApp on profiles and responses. **Call** reveals the phone of a Fundi who opted in to "Show my phone to clients" (ADR-21). A **Fundi Pro**'s one-tap **WhatsApp** link (`wa.me`) is shown to any Client in V2. V6's anonymous `visitorKey` reveal is **retired** in V8. A **per-Fundi daily cap** (100 a day, V6's figure) counts Call, WhatsApp and Pay-to together. Strict subscriber-to-subscriber contact starts only when Enterprise Pro exists (future). In-app chat between subscribers comes in a **later phase** (roadmap, not V2).
6. **The Client pays the Fundi directly**, to the Fundi's own **M-Pesa Pochi la Biashara or Till**, which the Fundi adds as **self-declared** details (operator Q2). Smart Fundis never holds that money.
7. **Fundi Pro** (operator rounds 2–3): a Fundi subscription paid to Smart Fundis by **M-Pesa STK Push to Smart Fundis' own Till** (sandbox + "Test mode" until the Till exists). It buys the WhatsApp link and **first place** in Job responses and in Find a fundi (after verified Fundis on Electrical and Solar, D-48), always tagged "FUNDI PRO · PAID" (D-47). It ships in **V11**. It **never** creates or implies a Badge, the "Verified by Smart Fundis" wording, the ✓ or the amber tick (Spec B, ADR-28). The only V2 subscription is Fundi Pro; **Enterprise Pro** for Clients with large or many Jobs (including project management) is a future `/roadmap` item.
8. **Proximity:** "near me" uses the phone's location (`navigator.geolocation`), snapped once to ~1 km; a typed location is the county → sub-county → ward picker plus a free-text landmark (operator Q8). Distance is computed in Convex and shown only in **bands** ("within 5 km"), and lists sort by band, never by exact km. A **public or pre-hire Job's band is computed from its ward centroid**, never from the Client's point, and the server snaps every query point before it computes a band (D-55). No Google, no map.
9. **Every role has a dashboard**: Client (my Jobs and responses), Fundi (Jobs near me, my Interests, my Assessments), Expert (queue) and Admin (moderation and operations). A User with two roles switches between them (operator Q7).

### 2.1 Operator decisions table

| # | Topic | Answer | Status |
| --- | --- | --- | --- |
| V2-Q1 | Spec split | Two specs: this one (Jobs, board, proximity, dashboards) and Spec B (payments). | **operator-decided, 2026-09-26** |
| V2-Q2 | Money | **Direct pay only.** The Client pays the Fundi directly, to the Fundi's M-Pesa **Pochi la Biashara or Till**. Smart Fundis never holds the money. Fundis may add their Pochi or Till number to their profile, labelled self-declared. STK Push for Smart Fundis' own fees is **not** confirmed; it depends on V2-Q33. | **operator-decided, 2026-09-26** |
| V2-Q3 | Test mode | Default: Daraja sandbox with a visible "Test mode" tag on every payment surface until a real Paybill/Till and Org-portal access exist (V2-Q35). | proposed, operator to confirm |
| V2-Q4 | How Fundis respond | **"I'm interested" + a short note.** No price amount unless the operator adds one later. Fundis and Clients **communicate through WhatsApp** (a `wa.me` link); **no in-app chat**; the WhatsApp link is **subscriber-only**. | **operator-decided, 2026-09-26** (subscriber details open: V2-Q33, V2-Q34) |
| V2-Q5 | Who may respond | **All Fundis may respond**, not only verified ones. Response order was settled in round 3 (R3-1). | **operator-decided, 2026-09-26** |
| V2-Q6 | Public board | `/jobs` + "Latest jobs" on the landing page + JOBS header tab. Coarse location only. Sign in to post or respond. Shown only once shipped. | **operator-decided, 2026-09-26** |
| V2-Q7 | Client role | Derived through a Client profile (ADR-18); dual Fundi + Client allowed; a Fundi can't respond to their own Job; `/dashboard` switcher. | **operator-decided, 2026-09-26** |
| V2-Q8 | Location | **"Near me"** with browser `navigator.geolocation`, snapped to ~1 km. **No Google geocoding or Places in V2.** (The `GeoProvider` interface first proposed here is dropped until a real provider exists, V2-25 review.) Typed location = county → sub-county/ward picker + free-text landmark. Distance computed in Convex, shown in bands. | **operator-decided, 2026-09-26** |
| V2-Q9 | M-Pesa agent | The `mpesa` agent owns the payment backend and contracts only. It **does not own UI**; it gives UI suggestions to frontend, the sole owner of `web/`. | **operator-decided, 2026-09-26** |
| R2-1 | "Near me" | The phone's location (`navigator.geolocation` / device GPS), snapped to ~1 km. No Google. | **operator-decided, round 2** |
| R2-2 | Subscriptions | Subscriptions exist, paid to Smart Fundis by **M-Pesa STK Push to Smart Fundis' own Safaricom Till** (or Paybill). The operator will provide the Till; until then, sandbox with "Test mode". Our own fee, not third-party money. Client → Fundi job payment stays direct. | **operator-decided, round 2** |
| R2-3 | Who subscribes; WhatsApp | Mainly Fundis; a WhatsApp link is a subscriber (Fundi Pro) feature. **Refined in round 3 (R3-3):** only Fundi Pro is live in V2. | **operator-decided, rounds 2–3** (V2 WhatsApp visibility: V2-Q44) |
| R2-4 | Client phone | **A Client's phone number and WhatsApp are never shown to Fundis.** | **operator-decided, rounds 2–3** |
| R2-5 | In-app chat | Chat between Clients and Fundis, **subscribers only**, in a **later phase**. Roadmap, not V2. | **operator-decided, round 2** |
| R2-6 | What a Fundi subscription buys | The WhatsApp link; **higher ranking** in Job responses and in Find a fundi (R3-2); later, AI voice communication for searching (roadmap, not live). | **operator-decided, round 2** |
| R2-7 | Ranking | Subscribers and verified Fundis both rank high; **order set in round 3 (R3-1)**. | **operator-decided, rounds 2–3** |
| R2-8 | Hard limits (carried as non-negotiable) | A subscription **never** creates or implies a Badge or the "Verified by Smart Fundis" wording, and never uses the ✓ or amber tick. Paid placement is **visibly labelled** (EN + SW). | binding |
| R3-1 | Ranking order | **Fundi Pro first, verified or not** ("they pay inside the platform"): Pro (within Pro, verified first) → verified → Demo (as today) → not yet verified. Supersedes D-24's verified-first rule and the ADR-22 tiers. Mitigations kept: the Pro tag on every boosted result, the "Verified only" chip, ✓/amber only for Badges, a one-line legend (EN + SW). **Amended by D-47** (tag wording "FUNDI PRO · PAID", legend text) and **D-48** (verified first on Electrical and Solar). | **operator-decided, round 3** (amended, V2-25 review) |
| R3-2 | Where the boost applies | **Both** `/fundis` results and Job responses. | **operator-decided, round 3** |
| R3-3 | Subscriptions in V2 | Only **Fundi Pro** (price and period open, V2-Q42). A Client subscription, **Enterprise Pro** (large-scale or many Jobs, full project management), is a future `/roadmap` item, not built in V2. | **operator-decided, round 3** |
| R4-1 | Contact in V2 | A Fundi Pro's WhatsApp link is shown to **any Client** (a signed-in User with a Client profile, D-46). A free Fundi's phone stays tap-to-reveal per ADR-21 for opted-in Fundis. Strict subscriber-to-subscriber contact only once Enterprise Pro exists. A Client's number and WhatsApp are never shown to Fundis. | **operator-decided, round 4** (narrowed to Clients by D-46) |
| R4-2 | Fundi Pro renewal | **Monthly**, renewed by a manual STK Push to Smart Fundis' Till; a **renewal reminder 10 days before it lapses**. Price still proposed: KSh 200/month (V2-Q42). | **operator-decided, round 4** (price open) |
| R6-1 | Pay-to details | A Fundi must give an M-Pesa Till or Pochi la Biashara number **to respond to Jobs** (operator, V2-Q47). It is **not** required to register: a verification-only Fundi is prompted on the dashboard but never blocked, and can still record Assessments and earn Badges. | **operator-decided** |
| R6-2 | Ward names | **IEBC ward names** (LN 14/2012). The centroid source is still open (V2-Q11). | **operator-decided, round 6** |
| R6-3 | Phone reveal | **Only for signed-in users** (closes V2-Q24), and a Fundi must be Listed to respond (V2-Q37: "yes"). **Tightened by D-46:** only for a Client with a Client profile. | **operator-decided, round 6** (confirmed as the operator's own) |
| R6-4 | Where Pay-to details show | The Till (or Pochi) number is shown **only to the Client who hired that Fundi**. No public Till. | **operator-decided, round 6** |
| R6-5 | Portfolio | A Fundi can show their **Portfolio** (V6, ADR-20) and Smart Fundis **recommends** it: onboarding and "My public profile" prompt "Add photos of your work". | **operator-decided, round 6** |
| R6-6 | Fundi Pro price | **KSh 200 a month.** | **operator-decided, round 6** |
| D-45 | Prerequisites | V7 builds on the MVP **V1 stub** (stub worker, canned callbacks): its dashboards only display stored fields. V8 stays blocked on the **V6 core** (Listings). §21 names explicit prerequisites instead of "this sprint" / "next sprint". V7 restyles the MVP Expert review; it does not build a second one. | **operator-decided, V2-25 review, 2026-09-26** |
| D-46 | Contact | Every reveal (Call, WhatsApp, Pay-to) needs `requireClient` (Client profile, phone, 18+, terms). One `contact.reveal({ fundiProfileId, channel, jobId?, interestId? })` replaces `jobs.revealFundiPhone` and `jobs.openWhatsApp`. V6's anonymous `visitorKey` reveal is retired (V2-Q24 = yes). One internal helper keyed on `userId`. A per-Fundi daily cap of 100, across Call, WhatsApp and Pay-to. `clients.create` rate-limited per identity. `contactShares.jobId` optional; `contactReveals` retired. V8 owns the migration. | **operator-decided, V2-25 review, 2026-09-26** |
| D-47 | Pro disclosure | The tag reads **"FUNDI PRO · PAID"** (SW **"FUNDI PRO · AMELIPIA"**), a 48 px button that opens the US-8.32 explanation, also on `/f/[id]`. The forbidden-word test allow-lists "Paid". The SW legend drops "usajili"; draft "Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi" (R-20). | **operator-decided, V2-25 review, 2026-09-26** |
| D-48 | Safety Trades | On **Electrical and Solar**: verified Pro → verified → Demo → not-yet-verified Pro → not yet verified. Every other Trade keeps round-3 Pro-first (D-44). | **operator-decided, V2-25 review, 2026-09-26** |
| D-49 | Kenya DPA transfers | An EN + SW line in the verification consent and the Client terms: data is processed outside Kenya (Convex and Clerk in the US, Brev, LangSmith). Processor agreements on file. The DPIA update gates V8's production deploy, and V9's for location. | **operator-decided, V2-25 review, 2026-09-26** |
| D-50 | Fundi before the decision | One neutral line for every Verdict: "Awaiting expert review". No hint of the Verdict, the cap or a safety flag until the Expert decides. | **operator-decided, V2-25 review, 2026-09-26** |
| D-51 | Expert and the Verdict | The Expert sees the AI Verdict only after one full playback. The queue shows only the safety marker, never an "AI suggestion" chip. Expert–AI agreement rate and time to decide are logged and shown on the Admin eval tiles. | **operator-decided, V2-25 review, 2026-09-26** |
| D-52 | "The AI noticed…" | **Superseded by D-59.** Was: shown only on a reshoot or reject decision, never on an approved Assessment, in V2 (V2-Q20 narrowed). | **operator-decided, V2-25 review, 2026-09-26**; superseded 2026-09-26 |
| D-53 | Hired Jobs close | A `hired` Job auto-closes to `done` 30 days after `hiredAt`, with a Client notice. Retention counts from the close. | **operator-decided, V2-25 review, 2026-09-26** |
| D-54 | Proximity engine | `@convex-dev/geospatial` `nearest()` behind `ProximityIndex`, one call per tier (`filterKeys: { scope, tier }`), only snapped points stored. The custom precision-5 ring search stays as the fallback behind the same interface. `convex-expert` confirms in V9's first ticket. Supersedes D-37's own-geohash choice. | **operator-decided, V2-25 review, 2026-09-26** |
| D-55 | Job location precision | Public and pre-hire Job bands come from the **ward centroid**. `clientProfiles` stores **no point**. Results sort by band, never exact km. The server snaps every query point. Copy: "others can tell only roughly which area (about 1 km)". `fundi.setServiceArea` is rate-limited. | **operator-decided, V2-25 review, 2026-09-26** |
| D-56 | Ward names in V8 | V8 imports IEBC ward names (LN 14/2012) for the six first counties; V2-Q11 (names part) becomes a V8 dependency. Points and centroids stay in V9. | **operator-decided, V2-25 review, 2026-09-26** |
| D-57 | Navigation | Public bar **JOBS · TRADES · EVIDENCE · COMPANY**; TELEMETRY moves into the COMPANY sheet and the footer. Role routes get a role bar of ≤ 4 items. Role switcher in the avatar sheet; bell in the header; EN \| SW toggle in the menu sheet, the footer and the desktop header. | **operator-decided, V2-25 review, 2026-09-26** |
| D-58 | Job pre-fill | Nemotron pre-fill (V10) is **last and optional**: after V11, and cut unless Brev already runs for video. It keeps every review fix (§11.2). gpu-devops measures p95 parse latency while Cosmos is busy before V10 is cut. | **operator-decided, V2-25 review, 2026-09-26** |
| D-59 | "The AI noticed…" after the decision | On **every** Expert decision (approved, reshoot, rejected), the Fundi's Assessment detail shows "The AI noticed…" Observations with their evidence text and whole-second timestamps **as plain text**, under the AI tag and "An Expert decides.", below the Expert's note. Safety items first, reading "needs a closer look". D-50 is unchanged. Still never a Verdict word, `confidence`, `videoUrl`, `livenessRead` digits or a model name. No player for the Fundi (so no jump) until the Architect decides. Supersedes D-52. **Amended by D-61.** | **operator-decided, V2-40 design, 2026-09-26** |
| D-61 | D-59 guardrails | (1) The Cosmos `evidence` text stays **English** in both UI languages, labelled **"AI note in English"** (SW draft "Maelezo ya AI kwa Kiingereza", pending R-20); the Rubric item, the AI's answer and all chrome are translated. **A named exception to D-29.** (2) The approved-state "The AI noticed…" copy goes to `rai-reviewer` before V7-10 ships, framed as practice notes, never as doubt about the Badge. (3) The Fundi sees **no timestamps** until the timestamp-reliability eval passes (NF §1.1); after that, plain text. (4) The Fundi-facing query redacts the Liveness code (and any digit run matching it) from `evidence`; test 40 plants the code to prove it. Amends D-59. | **operator-decided, V2-40 design, 2026-09-26** |

Open questions are in §20, each with a recommendation.

---

## 3. User stories

IDs continue the PRD scheme under a new **group 8**. QA checks every acceptance criterion.

| ID | Story | Acceptance criteria |
| --- | --- | --- |
| US-8.1 | As a **visitor**, I want to become a Client in under a minute, so I can post a job. | "Post a job" (header, landing, `/jobs`, `/fundis` empty state) → sign-in if needed → a one-screen Client profile: display name, Kenyan phone (`+2547…`/`+2541…`, required for the account and M-Pesa; helper "Fundis never see your number"), county (47), sub-county/ward (optional; names only, no point is stored on the Client profile, D-55), "I am 18 or older", and the Client terms in English and Kiswahili (§12.1, including the processing-outside-Kenya line, D-49). Display and business names pass the contact-details filter. `clients.create` is rate-limited per identity (D-46). Saving creates `clientProfiles` and continues to the Job form. |
| US-8.2 | As a **Client**, I want to post a Job for a Trade in my area. | Trade (all 12, required), title (4–80, required), description (≤ 1,000, required), location (county required; sub-county and ward from the picker, optional; "Use my location"; a landmark ≤ 140, shared only with the hired Fundi, §7.4), optional budget (fixed, or min–max in KSh), "When" (as soon as possible, this week, flexible, or a date), expiry (7, 14 or 30 days) and up to 4 photos. "Use my location" only picks the nearest ward (V9); the public band always comes from the ward centroid (D-55). **Publish** is disabled until the required fields pass. The Publish screen restates, EN + SW: "Everyone can see: trade, title, area (ward), budget. Signed-in fundis also see: your description, your photos and your first name. Only the fundi you hire sees your landmark. No fundi ever sees your phone number." |
| US-8.3 | As a **Client**, I want to describe the job in one sentence and have it filled in. (**V10, last and optional**, D-58.) | "Describe it in your words" accepts ≤ 500 characters (English, Kiswahili or Sheng). Keyword Trade suggestions appear instantly (no AI). The AI runs only on an explicit tap, and the AI box shows only when the worker's heartbeat is fresh (§11.2). If the AI is available, its suggestion appears within 15 s as **editable** fields marked "AI suggestion — check before posting". Nothing is published until the Client taps Publish. On any AI failure or timeout the plain form stays, with no error wall. |
| US-8.4 | As a **Client**, I want the post blocked if I put my phone in it. | Title, description and landmark reject Kenyan phone numbers, emails, URLs and Paybill/Till/Pochi patterns: "Don't add phone numbers or links. Fundis reach you through Smart Fundis once you pick them." |
| US-8.5 | As a **Client**, I want to add photos safely. | ≤ 4 photos, each ≤ 5 MB, JPEG/PNG/WebP. **Every photo is re-encoded in the browser** (resized to ≤ 1,600 px, even when already smaller), which drops EXIF; `jobs.addPhoto` also rejects or strips GPS EXIF on the server (§17 #48). Each shows upload progress, retry and failure states; cards show a 480 px WebP thumbnail with the full size on tap. Each needs the tick "No children can be recognised, and anyone recognisable agreed." Advice: "Show the problem, not people or number plates." Seen only by signed-in Fundis on the Job detail; never on the public board; never sent to the AI. |
| US-8.6 | As a **visitor**, I want to see jobs being posted. | `/jobs` lists open Jobs newest first with the public fields (§7.4); filters Trade / county / "near me" (band) / "Budget at least KSh X"; 24 per page. Demo Jobs carry "DEMO: NOT A REAL JOB" and sort after real ones. When `/jobs` has only Demo Jobs, a banner says "Examples only, no real jobs yet". No sign-in to browse. |
| US-8.7 | As a **visitor on the landing page**, I want a live strip of recent Jobs. | Up to 6 **real** open Jobs (no Demo Jobs), newest first, linking to `/jobs/[id]`. With no real open Job, the strip is **not rendered** (no placeholder, no fake activity, no "LIVE" label). |
| US-8.8 | As a **Fundi**, I want to see Jobs near me in my Trades. | "Jobs" tab: open Jobs in my declared Trades within my radius (5, 10, 25 or 50 km) or, with no point set, in my county. Each row: band (from the Job's ward centroid, D-55), budget (if any), "When", age, response bucket. Sorted by band, then newest. A "Show all Trades" toggle widens it (V2-Q18). Read once, with a "Refresh" button, not a live subscription. At most 60 rows. |
| US-8.9 | As a **Fundi**, I want to say I'm interested. | On `/jobs/[id]`, "I'm interested" opens an optional note (≤ 280). The Fundi must be Listed (V2-Q37); if not, the screen offers "Turn on Show my profile". If "Show my phone to clients" is off, the screen says "The client can't call you unless you turn on 'Show my phone to clients'" with the switch inline. One Interest per Fundi per Job; the Fundi can edit the note and withdraw until hired. |
| US-8.10 | As a **Fundi**, I want to be protected from scams. | Every Job detail shows "Smart Fundis never asks you to pay to respond to a job. If a client asks you for money first, report it." A Report link on every Job. |
| US-8.11 | As a **Client**, I want to compare responses honestly. | Each response: the Fundi's card (the Listing card fields), their Badges in the Job's Trade, "Not yet verified in <Trade>" where true, the band, the note, "Responded 3 h ago", and (from V11) a **"FUNDI PRO · PAID"** tag button on every Fundi Pro. Order (§8.2): Fundi Pro (verified first) → verified → not yet verified; on **Electrical and Solar**, verified first with Pro tagged within each tier (D-48); then nearer band, then earliest. Filters: "Verified only" (still filters to verified, Pro or not), "Within N km". No price shown or used. From V11 the Pro legend (§8.4a) sits above the list. Until V11 the readout says "Verified first" and no Pro copy exists (V8 strings carry none). At 360 px each card shows two primary actions (Call, Shortlist); the rest sit in a row below, and card actions are secondary styles (the one amber fill is in the Hire confirm sheet). |
| US-8.12 | As a **Client**, I want to shortlist and then hire one Fundi. | "Shortlist" and "Hire" on each response. Hire asks "Hire <name>?" and states what is shared (§12.1). On confirm: Job `hired`, other responses `not_chosen`. |
| US-8.13 | As a **Client**, I want to reach a Fundi who responded. | On each response and profile, both through `contact.reveal` (D-46), which needs a Client profile (`requireClient`: phone, 18+, terms); a signed-in User without one is sent to `/client/start` first, and a visitor to sign-in. **Call** (only if the Fundi opted in, ADR-21) reveals the Fundi's phone; **Chat on WhatsApp** (V11; only for a Fundi Pro whose number is marked "on WhatsApp") opens a `wa.me` link to the Fundi, with "Starting a WhatsApp chat shares your WhatsApp number with this fundi." The `wa.me` text names the Job only when a `jobId` is given. Both count toward the per-Fundi daily cap. Buttons are text plus a generic line icon: no WhatsApp or M-Pesa logo, no green. **The Fundi never sees the Client's number or WhatsApp in Smart Fundis.** Numbers are never in a query result or HTML. A Fundi with neither shows "This fundi hasn't shared a phone number". V8 removes V6's WhatsApp button and V6's anonymous reveal. |
| US-8.14 | As a **hired Fundi and the Client**, we want to settle payment directly. | After hire the Client sees the Fundi's self-declared **Pay to** details (Pochi or Till, §9.2) with "Set by the fundi — Smart Fundis doesn't check this number. M-Pesa shows the account name before you confirm: check it matches." Every hired Fundi has them, because Pay-to is required to respond (V2-Q47); if an Admin cleared them after the hire, the Client sees "Agree with <name> how to pay." |
| US-8.15 | As a **Client**, I want to say the hire fell through. | Once per Job, within 7 days of hire: "The fundi didn't work out" → Job `open` (expiry ≥ 7 more days), hired Interest `released`, Fundi told. Details already shared can't be un-shared, and the screen says so. |
| US-8.16 | As a **Client**, I want to close or cancel my Job. | "Work done" (from `hired`) and "Cancel job" (from any open state, optional reason). Every responding Fundi is told. A `hired` Job the Client never closes becomes `done` 30 days after hire, and the Client is told (D-53). |
| US-8.17 | As a **Client**, I want old Jobs to stop showing. | A Job expires after its expiry period (default 14 days) and leaves the board; "Repost" creates a new Job with the same fields. |
| US-8.18 | As a **User with two roles**, I want to switch dashboards. | A role switcher (only roles held) in the avatar sheet (D-57). `/dashboard` opens the last one used, or the highest role (§5.2). |
| US-8.19 | As a **Fundi who is also a Client**, I can't respond to my own Job. | No respond button; the mutation returns `own_job`. |
| US-8.20 | As a **Fundi**, I want to set where I work. | County, sub-county/ward picker, optional "Use my location" (snapped to ~1 km; "Pick your usual work spot, not your home"), radius 5/10/25/50 km. After locating, the screen confirms "Near <ward>". "Turn off location" deletes the point immediately. `fundi.setServiceArea` is rate-limited (D-55). |
| US-8.21 | As a **Fundi**, I want to add how clients can pay me. | Pochi la Biashara (a Kenyan mobile number) or Till (5–7 digits), plus the M-Pesa account name, in "My public profile". **Optional to register; required to respond to Jobs** (V2-Q47). Onboarding offers it as an optional step ("How clients pay you — you can add this later; you need it to respond to jobs"). Until it's set, "I'm interested" opens the Pay-to form first ("Add how clients pay you to respond to jobs. Only a client who hires you sees it."). The Fundi dashboard shows the same prompt as a dismissible card; it never blocks Assessments or Badges. "Set by the fundi — not verified". The Pochi option warns: "A Pochi number is your phone number. The client you hire will see it, even if 'Show my phone to clients' is off." A change within 7 days of a hire notifies that Client. `fundi.setPayTo` is rate-limited. |
| US-8.22 | As a **Client on `/fundis`**, I want "near me". | "Near me" asks the phone for its location (never stored for visitors; the server snaps it) and shows Listed Fundis within the band in the §8.2 order (Fundi Pro first and tagged from V11; verified first on Electrical and Solar), then nearer band. Cards show a band, never a point or an exact km. Geolocation states per §7.2. |
| US-8.23 | As **anyone signed in**, I want to report a Job or a response. | Reasons `asks_for_payment`, `fake_job`, `offensive`, `shows_someone_without_consent`, `contact_details_in_text`, `wrong_pay_to_details`, `other`; note ≤ 280. Rate-limited. "Thanks — an Admin will look at this." |
| US-8.24 | As an **Admin**, I want to act on Jobs. | `/admin/jobs` (plain shadcn): open Job reports newest first. Dismiss, remove Job, remove a photo, block posting, remove an Interest, clear a Fundi's Pay-to details; each with a reason and `auditLog`. |
| US-8.25 | As a **Fundi**, I want to know what happened to my responses. | "My responses": Sent, Shortlisted, Hired, "The client chose another fundi", "You withdrew", "Job closed". |
| US-8.26 | As **every role**, I want in-app notices. | A bell in the header (D-57) with an unread count from `notifications.unreadCount`: new response (Client); shortlisted / hired / not chosen / released / Job closed (Fundi); Job expired, Job auto-closed 30 days after hire (D-53), Pay-to changed (Client); Fundi Pro ends in 10 days / has ended (Fundi, Spec B, V11). In-app only in V2. |
| US-8.27 | As a **Fundi**, I want my Assessment AI results shown honestly. | §11: before the Expert decides, one neutral line for every Verdict, "Awaiting expert review", with no hint of the Verdict, the cap or a safety flag (D-50); strengths, gaps, `feedbackEn`/`feedbackSw` only after the Expert decides; "The AI noticed…" after every decision (approved, reshoot, rejected), with the evidence text in English labelled "AI note in English", the Liveness code redacted, and no timestamps until the timestamp eval passes (D-59, D-61); never a confidence number; no fake progress while `analyzing`. |
| US-8.28 | As an **Expert**, I want my queue on a dashboard with the AI evidence. | §11: the queue shows only the safety marker, never an "AI suggestion" chip; on the review screen, safety flags first; Observations with whole-second timestamp chips (48 px) that jump the player; "--:--" labelled "no timestamp" when missing; "The AI couldn't tell" for `unclear`; the AI Verdict appears only after the video has played through once (D-51); no confidence number. |
| US-8.29 | As an **Admin**, I want an operations view. | Tiles from day-bucket counter documents (no clock reads in queries): Assessments by status, AI failures in 24 h, open Job reports, Jobs posted and hired this week, Expert–AI agreement rate and average time to decide (D-51), and (V10 only) AI pre-fill "Trade kept as suggested" rate split by input language. Accuracy tiles stay empty until `eval/results.csv` exists; when filled they include the PRD §8 splits (sex, lighting, phone). Admin uses the dark shadcn token theme. |
| US-8.30 | As the **platform**, I want every rule enforced on the server. | The convex-test suite in §17 passes. |
| US-8.31 | As a **Fundi**, I want to subscribe to Fundi Pro. | Spec B US-9.3–9.7: price, period and what it buys shown first; STK Push to Smart Fundis' own Till; "Test mode" in sandbox. |
| US-8.32 | As a **Client**, I want to know what "Fundi Pro" means. | (V11.) Every Pro result, and `/f/[id]`, shows the tag **"FUNDI PRO · PAID"** (SW **"FUNDI PRO · AMELIPIA"**) as a 48 px button (D-47). A one-line legend above every list where the boost applies: "Pro = paid subscription, not a verification." (SW draft: "Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi.", native-speaker check, R-20.) Tapping the tag opens: "This fundi pays Smart Fundis to appear above fundis without Fundi Pro. It says nothing about their skill. Only ✓ badges are verified by Smart Fundis." On Electrical and Solar it adds: "For electrical and solar work, verified fundis are listed first." The tag follows the §13 tag table: dashed outline, receipt icon, the word PAID; no ✓, no amber, not styled like a Badge or the Expert mark. |

---

## 4. Flows

### 4.1 Post → respond → connect → hire → pay directly

```
Client                                     Convex                                         Fundi
──────                                     ──────                                         ─────
"Post a job" ──(no Client profile)──▶ /client/start (profile, 18+, terms EN+SW)
/client/jobs/new
 ├─ keyword Trades (instant, no AI) ◀── convex/lib/tradeKeywords.ts
 ├─ [V10, optional] "Describe it" tap ▶ jobs.suggestFromText ─▶ aiParseRequests (queued)
 │                                     (only if heartbeat fresh) ◀── Brev parse lane pulls (ADR-9)
 │   AI suggestion (≤15 s or ignored) ◀── /ai/callback-parse
 ├─ Client edits + confirms fields ──▶ jobs.saveDraft              (drafts only)
 └─ Publish (restates what goes public) ▶ jobs.publish → open ──▶ /jobs, landing strip, "Jobs near you"
                                                                                           │
                                        interests.create ◀──────────── "I'm interested" + note (Listed, Pay-to set)
Responses (§8.2 order) ◀─────────────── interests.listForJob
 Shortlist ─────────────────────────▶ interests.shortlist          (job: open → shortlisted)
 Call (opted-in Fundi's phone) ─────▶ contact.reveal {call}        (requireClient; Client → Fundi only; per-Fundi cap)
 [V11, Fundi Pro] Chat on WhatsApp ──▶ contact.reveal {whatsapp}    (requireClient; per-Fundi cap)
 Hire ──────────────────────────────▶ jobs.hire                    (job: → hired; others not_chosen)
 Pay to (Pochi/Till, self-declared) ◀ jobs.revealPayTo             (via job.hiredInterestId; per-Fundi cap)
 Work done ─────────────────────────▶ jobs.markDone                (job: → done; else auto-done 30 d after hire, D-53)
Money for the work: Client ─▶ Fundi's own Pochi/Till (or cash). Never through Smart Fundis.
```

### 4.2 Browse (public)

```
/ (landing) "Latest jobs" strip ─┐
header JOBS tab ─────────────────┼─▶ /jobs?trade=&county=&near=1&band=10&budgetMin= ─▶ /jobs/[id]
footer "Jobs" ───────────────────┘        (public fields only)                         (public fields; signed-in
                                                                                        Fundis also see description
                                                                                        and photos; "I'm interested")
```

- The URL is the state: `trade` (12 slugs), `county` (47 slugs), `near=1` with `band` (5, 10, 25, 50), `budgetMin` (integer KSh). Unknown values are dropped silently, as on `/fundis`.
- **"Near me" for visitors:** the browser reads `navigator.geolocation`, snaps it to the ~1 km grid **in the browser**, and passes it as a query argument; **the server snaps it again** before it computes any band (D-55). It is never stored for a visitor. The location consent line (§7.6) is shown to visitors too. If permission is refused, the county filter stays and the control reads "Location off — pick a county". The full set of geolocation states is in §7.2.
- **"Near me" reads are one-shot** (`jobs.boardNear`, a plain array of ≤ 60 rows) with a "Refresh" button, not live subscriptions.
- When `/jobs` holds only Demo Jobs, the banner "Examples only, no real jobs yet" shows above the list.

---

## 5. Roles and routing

### 5.1 Roles (ADR-18, extended by proposed ADR-23)

| Role | Derived from | Notes |
| --- | --- | --- |
| **Fundi** | a `fundiProfiles` row | unchanged |
| **Client** | a `clientProfiles` row | **new** (operator Q7). Never stored in Clerk metadata, never read from arguments. |
| **Expert** | an active `experts` row with non-empty `approvedTrades` | unchanged |
| **Admin** | email on `ADMIN_EMAILS` and `email_verified` | unchanged |

`Roles` becomes `{ fundi: boolean; client: boolean; expert: boolean; admin: boolean }`. The current `base: "fundi" | "none"` (`convex/lib/auth.ts`) is replaced by the two booleans: a code change with no stored field (convex role, V7-1).

New helper: `requireClient(ctx)`. It **throws** when there is no identity or `caller.user` is null, and when the caller has no Client profile, no `users.phone`, no `adultConfirmedAt` or no accepted terms (D-46). Every reveal (Call, WhatsApp, Pay-to) calls it. The listing's `subscriber` flag (Spec B) drives Pro ranking and tags; it is never a role, and no query reads `isFundiPro` at query time.

**18+ backfill (rai S9).** Existing Fundis and Experts without `adultConfirmedAt` are asked "I am 18 or older" at their next sign-in, and uploads (Assessments, Portfolio) are blocked until they confirm.

**Dual roles.** A Fundi can never send an Interest on a Job where `job.clientUserId === caller._id` (`own_job`). The Expert rules are unchanged.

### 5.2 Routing

| Route | Access | Notes |
| --- | --- | --- |
| `/jobs`, `/jobs/[id]` | public | `/jobs/[id]` is not found for `draft`, `removed` or unknown Jobs. `hired`, `done`, `expired` and `cancelled` Jobs show "This job is closed" with the public fields while `publicUntil` is set (7 days after closing), then not found. The query reads the stored flag, never the clock. |
| `/client/start` | signed in | the Client profile (US-8.1) |
| `/client`, `/client/jobs/new`, `/client/jobs/[id]` | Client | dashboard, Job form, responses |
| `/fundi/jobs`, `/fundi/responses`, `/fundi/where-i-work` | Fundi | new tabs; Pay-to lives in "My public profile" |
| `/admin/jobs`, `/admin/ops` | Admin | plain shadcn, dark token theme |

**App mode** (designer S1): the role routes and `/jobs` drop the cinematic layer: a CSS-only amber button, no grain, no GSAP. Budget about 150 KB gzipped of first-load JS per route, tested on Slow 3G with 4× CPU throttling. No device figures are claimed (the research has none). Every list and every reason code has empty, loading and error states, with skeletons, never page-blocking spinners.

**The proxy** adds `/client` to the sign-in-required prefixes (`web/lib/auth-routes.ts`); every protected page still calls `auth.protect()` itself (D-15).

**`/dashboard`** reads `users.me`:
1. If `users.dashboardPref` names a role the User still holds, go there.
2. Otherwise the highest role held: **Admin → Expert → Fundi → Client**.
3. No role and no application: `/onboarding`, now offering "I need a fundi" (Client), "I'm a fundi" (Fundi) and "Become a verifier" (Expert), in any combination; forms in the order Fundi, Client, Expert.

**The role switcher** writes `users.dashboardPref` through `users.setDashboardPref({ role })`, which throws if the caller doesn't hold that role. A preference, not a role.

### 5.3 The first 10 seconds of each dashboard

| Dashboard | Above the fold at 360 px |
| --- | --- |
| **Client** | "Post a job"; my open Jobs with status chips and "3 new responses" (responses newer than `clientProfiles.lastSeenResponsesAt`); the notice bell. |
| **Fundi** | "Jobs near you" (first 3, with bands); my Assessment status chips; "Set where you work to see nearby jobs" if unset; "Add photos of your work — clients look at these first" while the Portfolio is empty (R6-5). |
| **Expert** | queue count by Trade and the oldest waiting item. |
| **Admin** | open reports (Jobs + profiles), AI failures in 24 h, the operations tiles. |

### 5.4 Header and footer (navigation, D-57)

| Where | What |
| --- | --- |
| Public header bar | **JOBS · TRADES · EVIDENCE · COMPANY**. TELEMETRY moves into the COMPANY sheet and the footer. |
| Role routes (`/client`, `/fundi`, `/expert`, `/admin`) | The public bar is replaced by a **role bar of at most 4 items** (bottom nav at 360 px, side rail from 1024 px). |
| Avatar sheet | The **role switcher** (only roles held). |
| Header | The notice **bell** with the unread count. |
| EN \| SW toggle | In the menu sheet, in the footer, and in the desktop header. |
| Footer | The existing links plus "Jobs" (from V8), TELEMETRY and the EN \| SW toggle. |

- The **JOBS** tab (→ `/jobs`) and a "Post a job" action appear **only in the release that ships Jobs** (V8; AGENTS "Nothing may look live that isn't"). Until then the bar reads TRADES · EVIDENCE · COMPANY.
- Kiswahili type: the hero uses `clamp(32px, 9vw, 44px)` with `overflow-wrap: anywhere`; tags and chips use 0.08em tracking; the mono floor is 12 px. Every V2 screen prompt draws one Kiswahili frame at 360 px (designer, V2-40).
- `/roadmap` loses "Client accounts" when V8 ships (D-30). "Bookings & M-Pesa" becomes "Escrow & in-app payment to fundis — Coming soon" (Spec B).

---

## 6. The Job lifecycle

### 6.1 Job states

`draft → open ⇄ shortlisted → hired → done`, plus `expired`, `cancelled` and `removed`. There is no Job post fee and so no payment state: the operator did not confirm platform fees (Q2), and the only proposed fee is the Fundi subscription (V2-Q33), which never gates a Job.

| From | To | Who / what | Server checks | Side effects |
| --- | --- | --- | --- | --- |
| (new) | `draft` | Client: `jobs.saveDraft` | `requireClient`; not `postingBlocked`; field limits; rate limit `jobSaveDraft`; with a `jobId`, the Job must be the caller's and still `draft` (`saveDraft` never edits a published Job) | `updatedAt` |
| `draft` | `open` | Client: `jobs.publish` | Trade set; county set; title, description and landmark pass the contact-details filter; every photo has `peopleConsentConfirmed`; rate limit `jobPublish` (3 a day, 10 a week per Client) | `openedAt`, `expiresAt = openedAt + expiryDays`; board fields; the band point is the ward centroid (D-55) |
| `open` | `shortlisted` | Client: `interests.shortlist` (the first) | owns the Job; Interest `active` | Fundi notice "You're on the shortlist" |
| `shortlisted` | `open` | Client: `interests.unshortlist` (the last) | owns the Job | none |
| `open`, `shortlisted` | `hired` | Client: `jobs.hire({ interestId })` | owns the Job; Interest `active`/`shortlisted`; the Fundi still passes the §6.2 checks; not expired | Interest → `hired`; other live Interests → `not_chosen`; `hiredAt`; notices; hire-level sharing (§12.1) |
| `hired` | `open` | Client: `jobs.releaseHire` | owns the Job; `releaseCount === 0`; `now < hiredAt + 7 days` | Interest → `released`; `expiresAt = max(expiresAt, now + 7 days)`; notice |
| `hired` | `done` | Client: `jobs.markDone` | owns the Job | `doneAt`; notice |
| `hired` | `done` | cron `jobs.autoCloseHired` (daily, batches of 50) | `hiredAt + 30 days <= now` (D-53) | `doneAt`; `autoClosed: true`; Client notice "We marked <title> as done. It was hired 30 days ago." |
| `draft`, `open`, `shortlisted`, `hired` | `cancelled` | Client: `jobs.cancel({ reason? })` | owns the Job | live Interests → `closed`; notices |
| `open`, `shortlisted` | `expired` | cron `jobs.expireDue` (every 15 min, batches of 50) | `expiresAt <= now` | live Interests → `closed`; Client notice with "Repost" |
| any non-terminal | `removed` | Admin: `moderation.removeJob({ reason })` | `requireAdmin` | live Interests → `closed`; `auditLog`; Client sees "Removed by Smart Fundis: <reason>. Questions: info@smartfundis.com" |

Anything not in the table is rejected. `done`, `expired`, `cancelled` and `removed` are terminal. Every transition sets `updatedAt`; every move to `done`, `expired` or `cancelled` sets `closedAt`, and **retention counts from `closedAt`** (§12.3). Drafts untouched for 30 days (by `updatedAt`, index `by_status_and_updatedAt`) are deleted with their photos, in batches of 50.

**Queries never read the clock** (Convex guidelines):
- "Posted 2 h ago" is computed in the browser from `openedAt`.
- Expiry and the 30-day auto-close are materialised by crons.
- On close, `setJobStatus` sets `publicUntil = closedAt + 7 days`. A cron (`jobs.clearPublicUntil`, hourly, batches of 50) clears `publicUntil` once it has passed. `jobs.getPublic` shows a closed Job only while `publicUntil` is set, and never compares it with `now`.
- `jobs.releaseHire`'s 7-day check runs in a mutation, where reading the clock is allowed.

### 6.2 Interest states

| From | To | Who | Checks |
| --- | --- | --- | --- |
| (new) | `active` | Fundi: `interests.create` | `requireFundi`; **any Listed Fundi** (operator Q5; V2-Q37 = yes, so a `listings` row is required) and V2-Q18 (declared Trade, soft; with `addTradeToProfile` the Trade is added and `syncListing` runs); Pay-to details set; not hidden by an Admin; Job `open`/`shortlisted`; not `own_job`; one per Fundi per Job; < 30 live Interests on the Job; rate limit `interestCreate` (20 a day); Demo Jobs accept none; the note passes the contact-details filter |
| `active` | `shortlisted` | Client | owns the Job; `interest.jobId === jobId`; the Interest is not withdrawn or removed |
| `shortlisted` | `active` | Client | owns the Job; `interest.jobId === jobId` |
| `active`, `shortlisted` | `hired` | Client (`jobs.hire`) | §6.1 |
| `active`, `shortlisted` | `not_chosen` | system, on hire | — |
| `active`, `shortlisted` | `withdrawn` | Fundi: `interests.withdraw` | owns it |
| `hired` | `released` | Client (`jobs.releaseHire`) | §6.1 |
| `active`, `shortlisted` | `closed` | system, on cancel / expire / remove | — |
| any | `removed` | Admin | `auditLog` |

A Fundi may edit the note of an `active` or `shortlisted` Interest; the new note passes the contact-details filter, and the Client sees "Updated <time>".

### 6.3 Edge cases (Kenyan scenarios)

| # | Scenario | What happens |
| --- | --- | --- |
| E1 | A Client in Ruiru types "fix my Probox brakes" and picks no Trade. | The keyword map matches `probox`, `brake` → **Mechanic** instantly; the AI (if up) agrees. "Suggested: Mechanic" — tap to accept. **Publish stays disabled until a Trade is chosen**: "Pick the type of work so the right fundis see your job." |
| E2 | Two Fundis get hired for the same Job (two taps, two tabs). | `jobs.hire` checks the status inside the mutation; Convex serialises the transactions; the second returns `already_hired`. A Client needing a mason **and** a plumber posts two Jobs. |
| E3 | The Client double-taps Hire on the same Fundi. | The second call sees the Interest `hired` and returns `{ ok: true }`. |
| E4 | A Fundi turns off location. | Point and geohash deleted in the same mutation; `syncListing` clears them on the Listing and removes the Fundi's entries from the `ProximityIndex`. Still found by county; not by "near me"; their Interests show "In Kiambu" instead of a band. |
| E5 | A dual-role User opens their own Job as a Fundi. | No respond button; `own_job`. |
| E6 | A Fundi is hidden by an Admin after responding. | The Client's list re-checks at read time and hides it; hiring → `fundi_unavailable`. |
| E7 | A Job photo shows a child in school uniform beside a leaking tank. | The Client ticked "No children can be recognised". A Fundi reports `shows_someone_without_consent`; the Admin removes the photo (storage deleted) with an audit row. |
| E8 | The description says "call me 0712 345 678". | Publish → `contact_details_in_text`. |
| E9 | A fake "Client" wants Fundis to pay KSh 500 "registration". | A Fundi can never reach a Client through Smart Fundis; only the Client can start contact, and every reveal is logged. The Fundi reports `asks_for_payment`; the Admin removes the Job and blocks posting. The scam line warns every Fundi. |
| E10 | A Job expires while the Client is still comparing. | Cron → `expired`; Interests closed; "Repost". |
| E11 | The hired fundi never showed up in Kitengela. | "The fundi didn't work out" (once, 7 days) → `open`; Interest `released`. |
| E12 | A Fundi in Mombasa responds to a Nairobi Job. | Allowed (operator Q5). "Over 50 km"; sorts after nearer bands in its tier. |
| E13 | A Client signed up with Google and has no phone. | `/client/start` requires one. |
| E14 | A Fundi changes their Till number the day after being hired. | The Client gets "<name> changed their payment details" and sees the new details with the date (a guard against a hijacked account redirecting payment). |
| E15 | A Job in Marsabit, where no ward centroids exist yet. | County-only; "In Marsabit"; excluded from radius filters, found by county. |
| E16 | A Client pays the Pochi number shown and M-Pesa shows a different name. | The Pay-to label told them to check the name before confirming. They report `wrong_pay_to_details`; the Admin clears the details and investigates. Smart Fundis never touched the money and can't reverse it; the Client contacts Safaricom. |
| E17 | A Client wants to WhatsApp a Fundi who isn't Fundi Pro. | No WhatsApp button (a Pro feature). If the Fundi opted in, the Client taps Call instead (ADR-21). |
| E20 | A Fundi Pro who is not yet verified and an Expert-approved verified Fundi respond to the same plumbing Job in Umoja. | The Pro Fundi is listed first, tagged "FUNDI PRO · PAID"; the verified Fundi's ✓ Badge line shows below. The legend says Pro is paid, not a verification; "Verified only" hides the Pro Fundi (R-17, R-37). **On an Electrical or Solar Job the verified Fundi comes first** and the Pro Fundi sits in the not-yet-verified tiers (D-48). |
| E21 | A Fundi's Pro subscription ends mid-Job. | The cron clears `subscriber`; `syncListing` re-tiers them; their responses drop to their unpaid tier and lose the Pro tag; WhatsApp buttons disappear. Numbers already revealed stay revealed. |
| E22 | A Client never taps "Work done" after hiring. | 30 days after `hiredAt` the cron closes the Job to `done` and tells the Client (D-53). Retention counts from that close. |
| E23 | A scraper makes many Client profiles to harvest Fundi phones. | `clients.create` is rate-limited per identity; every reveal needs a full Client profile; the per-Fundi cap (100 a day across Call, WhatsApp and Pay-to) bounds the damage; `contactShares` shows the pattern to Admins (D-46, R-25). |
| E18 | A Fundi withdraws after being shortlisted. | Allowed; "<name> withdrew". After hire, not possible; the Client uses E11. |
| E19 | "Nahitaji fundi wa stima Kahawa West, socket imeungua". | Keywords `stima`, `socket` → Electrical; "Kahawa West" matches the ward picker. Nemotron's Kiswahili is UNVERIFIED (NF §2.1, R-20), hence keywords first and the Client confirms. |

---

## 7. Location model and privacy (proposed ADR-25)

### 7.1 What we store

A **Location** is a value object on Client profiles, Fundi service areas and Jobs. Which fields each one may hold:

| Field | Meaning | Client profile | Fundi service area | Job | Who may ever see it |
| --- | --- | --- | --- | --- | --- |
| `county` | one of the 47 `CountySlug` values (KR F4.1) | yes | yes | yes | public |
| `subCountyId`, `wardId` | optional rows in `areas` (the picker) | yes | yes | yes | public (as names) |
| `areaLabel` | ward name, else sub-county, else county | yes | yes | yes | public |
| `landmark` | free text ≤ 140 ("behind Total, Ruiru stage") | no | no | yes | the owner and the hired Fundi (§7.4). Fundi profiles keep the V6 public `area` text unchanged |
| `point` | optional `{ lat, lng }`, **snapped once at write time** to a 0.01° grid (≈ 1.1 km in Kenya) | **never** (D-55) | the **device** point or the ward centroid | the **ward centroid only** (D-55) | **never returned by any query** |
| `geohash` | optional, precision 6 of the stored point (used by the fallback ring search) | never | yes | yes | never returned |
| `pointSource` | `"device"` or `"ward_centroid"` | never | yes | always `"ward_centroid"` | never returned |

**A Job never stores the Client's own point** (D-55). On the Job form, "Use my location" only picks the nearest ward (`areas.nearestWard`, V9); the device point is dropped after that call. A Job's public and pre-hire band is computed from its ward centroid. A Job with no ward (or in a county without centroids yet) has no point and shows county bands only.

**Why snap once, at write time.** Per-request jitter can be averaged away; a single snap cannot (KR F4.10 (c)). Repeated "near me" queries can at best place a Fundi in their ~1 km cell, and the Fundi picks the point ("your usual work spot, not your home"). **ADR-25 accepts this ~1 km floor explicitly:** someone who runs many "near me" queries from different points can narrow a Fundi down to about one 0.01° cell, and no further.

**The server snaps every query point** before it computes a band or runs a proximity search (D-55). An unsnapped argument is snapped, never rejected, so the browser snap is a convenience only.

**Distance bands**, computed on the server from two snapped points: **"Within 2 km"**, **"2–5 km"**, **"5–10 km"**, **"10–25 km"**, **"25–50 km"**, **"Over 50 km"**; with no point on either side, **"In <County>"** or **"<County>"**. Nothing below 2 km, because snapping error can reach ~0.8 km per side. **Lists sort by band, never by exact km** (D-55); ties inside a band use the list's time key. No function result carries a km figure.

### 7.2 Where points come from (operator Q8)

1. **The device (Fundis' service area and visitors' "near me" only):** `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: false`, `timeout: 10000`, `maximumAge: 600000`, snapped in the browser **and again** on the server. These are the User's own coordinates, so no provider's caching or map terms apply.
2. **The ward centroid:** a picked ward without a device point, and every Job, uses the ward's centroid from `areas`. The centroid is **copied** onto the Fundi or Job at write time; a later edit to `areas` does not propagate (stated so that nobody expects it to).
3. **No geocoding service in V2.** There is no `GeoProvider` interface until a real provider exists (V2-25 review). The Google terms read on 2026-09-26 are recorded in ADR-25 in case a provider is reconsidered.

**Geolocation states** (designer S2; EN + SW for every line):

| State | What the control shows |
| --- | --- |
| Before the first ask | The location consent line (§7.6 rule 6), for visitors too. |
| Locating | "Finding your area…" (no spinner that blocks the page). |
| Located | "Near <ward>" (from `areas.nearestWard`), with "Change". |
| Denied (this time) | "Location off — pick a county"; the county filter stays. |
| Blocked in settings | "Location is blocked for this site. Turn it on in your browser settings, or pick a county." |
| Timeout (10 s) | "We couldn't find your location. Try again, or pick a county." |
| Unavailable | "Your phone couldn't give a location. Pick a county." |
| Outside the six first counties | "Distance isn't available in <County> yet"; county browsing only. |
| Reload with `near=1` | Asks again; never reuses a stored point for a visitor. |

No map anywhere; a list with distance bands is enough.

**The picker data (`areas`).** County → sub-county → ward. Official frames: 47 counties (Constitution First Schedule), constituencies and county assembly wards (LN 14/2012), KNBS census sub-counties (KR F4.1–F4.3). Census sub-counties are **not** the same units as constituencies (F4.3), and no official machine-readable ward list with centroids was found (F4.2, UNVERIFIED). **V8 imports the IEBC ward names only** (LN 14/2012) for Nairobi, Kiambu, Mombasa, Kisumu, Nakuru and Machakos, so the V8 picker has data (D-56). **V9 adds the centroids**; their source is still **V2-Q11**. Until a county has centroids, its wards work as labels and distance falls back to county bands.

### 7.3 Proximity index (`convex/lib/proximity.ts`) and the feasibility answer

```ts
type ProximityScope = { kind: "listing"; scope: string /* trade or "all" */ } | { kind: "job"; tradeSlug?: string };
interface ProximityIndex<Row> {
  // `point` is snapped by the caller's server code first (D-55). `tier` is one ranking tier (§8.2).
  near(ctx: QueryCtx, args: { point: SnappedPoint; radiusKm: 5 | 10 | 25 | 50; scope: ProximityScope;
                              tier: number; cap: number }):
    Promise<{ row: Row; band: DistanceBand }[]>;   // bands only; km stays inside the implementation
}
```

**Implementation (D-54): `@convex-dev/geospatial` `nearest()`.** Each indexed row is inserted into the component with its **snapped** point only, and filter keys `{ scope, tier }`. A near-me read makes **one `nearest()` call per tier**, in tier order (§8.2), with `maxDistance` = the radius and `limit` = what is left of the 60-row cap. It stops as soon as 60 rows are gathered. Inside a tier the rows are ordered by band, then the list's time key, never by exact km. `syncListing` and `setJobStatus` keep the component in step (insert on a point or tier change, remove on location off, hide or close). The component is mounted in `convex/convex.config.ts` in V9.

**Fallback: the custom precision-5 ring search**, behind the same interface. Each row stores `geohash` (precision 6). The search reads the query's precision-5 cell, then rings of neighbouring precision-5 cells outward, one indexed prefix range per cell and tier (`by_scope_and_tier_and_geohash`), until the tier has `cap` rows inside the radius or the rings pass the radius. It computes haversine distance, drops rows outside the radius, and bands them. No `.collect()`. Swapping to it is a one-line change in `convex/lib/proximity.ts`, and the §17 contract suite runs against both.

**`convex-expert` confirms the choice in V9's first ticket** (D-54): the filter-key syntax, how `nearest()` behaves with `maxDistance` and filter keys together, and the read cost per call are **UNVERIFIED** until then.

**Feasibility notes** (the Architect's reading of `convex/_generated/ai/guidelines.md` and the live docs on 2026-09-26, updated by the V2-25 review):

| Question | Answer | Source |
| --- | --- | --- |
| Geospatial component vs our own geohash index | `@convex-dev/geospatial` is **beta**, v0.2.1 (published 2025-12-11), "tested … up to about 1,000,000 points". It offers `insert/get/remove`, a paginated rectangle `query` (returns `nextCursor`) and `nearest(ctx, { point, limit, maxDistance, filter })`; filters are `eq`/`in` on filter keys and `gte`/`lt` on a `sortKey`, sorted ascending only. The tiered order can't live in one index, so **one call per tier** keeps it (D-54). The first draft chose our own geohash cells; the review found that a per-cell `.take(50)` returns rows that aren't the nearest and ignores tiers, so that choice (D-37) is superseded. | https://github.com/get-convex/geospatial (README), https://www.convex.dev/components/geospatial, npm registry `@convex-dev/geospatial` |
| Pagination with distance sort | A Convex index can't order by distance from an arbitrary point, and `.paginate()` returns index order. So near-me results are gathered per tier, ordered by band in memory and **capped at 60, not paginated** ("Showing the 60 nearest"). `jobs.boardNear` and `fundi.jobsNearMe` return plain arrays. | https://docs.convex.dev/database/pagination, guidelines "Pagination" |
| Search index + geo | A text search index returns relevance order and filters only by equality on declared `filterFields`. It can't combine with a geo range. Near-me and free-text search are therefore **separate modes**; the geohash cell is not a search filter field. `/jobs` has no free-text search in V2 (only Trade, county, band, budget). | https://docs.convex.dev/search/text-search, guidelines "Full text search" |
| Bandwidth at 10k Listings and 2k open Jobs | Estimate (UNVERIFIED until measured): `listings` holds ≈ 10k × (1 + declared Trades) rows ≈ 30–40k; a near-me read returns ≤ 60 rows of ≈ 1 KB plus what `nearest()` reads inside the component (UNVERIFIED). Near-me reads are **one-shot with a "Refresh" button**, not live subscriptions, so they don't re-run on every Listing change. **Mitigation:** keep cards small, cap at 60, and prefer county browsing as the default. Measure in V9 with the Convex dashboard usage page before claiming a figure. | https://docs.convex.dev/production/state/limits |

### 7.4 What each audience sees

| Data | Public (`/jobs`, strip) | Signed-in Fundi | Hired Fundi | Client (owner) | Admin |
| --- | --- | --- | --- | --- | --- |
| Trade, title, county · ward, "When", age | yes | yes | yes | yes | yes |
| Budget | yes, "Budget set by the client" | yes | yes | yes | yes |
| Response bucket (§8.4) | yes | yes | yes | exact count | exact |
| Description, photos | **no** | yes | yes | yes | yes |
| Distance band (from the ward centroid, D-55) | only with "near me" | yes | yes | per response | no |
| Client name | no | first name only | full display name | — | yes |
| Landmark | no | no | yes | yes | yes |
| Client phone / WhatsApp | no | **never** | **never** (round 2) | — | Convex dashboard only |
| Fundi phone | no (reveal needs a Client profile, D-46) | own | own | any Client, if opted in (ADR-21), via `contact.reveal` | Convex dashboard only |
| Snapped point, geohash | no | no | no | no | not in any function result |

The description is hidden from the public because Clients write personal details into free text ("my wife is home after 5"), and the filter only catches numbers and links.

### 7.5 A Fundi's service area

`fundiProfiles.serviceArea = { location, radiusKm: 5 | 10 | 25 | 50, updatedAt }`, optional. With none, "Jobs near you" falls back to the Fundi's county. `syncListing` copies the `geohash` and point onto the Fundi's `listings` rows as **private** fields for near-me on `/fundis`, never returned (ADR-22's public-read property holds by never returning them; test #25), and keeps the Fundi's `ProximityIndex` entries in step (§7.3). `fundi.setServiceArea` is rate-limited (`serviceAreaSet`, 10 a day per Fundi), so a Fundi's point can't be probed by rapid moves (D-55).

### 7.6 Location privacy rules

1. No query, card, HTML page or log carries a point, geohash or km figure (§17 #25).
2. Turning location off deletes the point at once (E4).
3. A Job's point and landmark are deleted 30 days after the Job closes (§12.3).
4. Visitors' "near me" points are query arguments only, never written.
5. A Client's own point is never stored: not on `clientProfiles`, not on a Job (D-55).
6. Before the first "Use my location", for visitors and signed-in Users alike (EN + SW):
   - EN: "We use your location only to show distance in steps like 'within 5 km'. If you save it, we round it to about 1 km, and others can tell only roughly which area you are in (about 1 km). You can turn it off any time."
   - SW draft — native-speaker check (R-20): "Tunatumia mahali ulipo tu kuonyesha umbali kwa hatua kama 'ndani ya km 5'. Ukiihifadhi, tunaikadiria hadi takriban km 1, na wengine wanaweza kujua tu eneo lako kwa takriban (karibu km 1). Unaweza kuizima wakati wowote."
7. The DPIA update for location **gates V9's production deploy** (D-49).

---

## 8. Ranking and filter rules (proposed ADR-26)

### 8.1 Principles

1. **Tier first, then distance band, then time.** The tiers are the fixed, published list in §8.2: verification tiers, with the labelled paid Fundi Pro tier placed per rule 4 and the Electrical/Solar exception (D-48). No hidden score, and nothing inside a tier is weighted.
2. **Price is a filter, never a rank.** Nothing is ordered by Rates or Budget, and Smart Fundis never computes an average, "typical price", "best value" or "cheapest" (KR I-3, N3.1). Interests carry no price (operator Q4); if one is added later, the same rule applies.
3. **No AI in ranking.** No model ranks, scores or recommends a named Fundi (NF §2.3).
4. **Fundi Pro is ranked first, and always visibly** (operator round 3, ADR-28), **except on Electrical and Solar, where verified comes first** (D-48). Every Fundi Pro result carries the **"FUNDI PRO · PAID"** tag (D-47) and every such list carries the legend (§8.4a). A subscription never creates or implies a Badge, never uses "Verified by Smart Fundis", the ✓ or the amber tick. The "Verified only" chip still returns only verified Fundis.
5. **Only live subscriptions count.** On `prod`, only `mode: "production"` subscriptions set `listings.subscriber`, so sandbox testers never rank first for real visitors (Spec B, rai S1).

### 8.2 Orders

| List | Order |
| --- | --- |
| `/jobs` (default) | real Jobs newest first; then Demo Jobs newest first |
| `/jobs` with "near me" | real Jobs by band, then newest; Demo Jobs after |
| Fundi "Jobs near you" | band, then newest |
| Client's responses, every Trade except Electrical and Solar (**operator round 3**) | (1) Fundi Pro **and** verified in the Job's Trade (tagged); (2) Fundi Pro, not yet verified in that Trade (tagged); (3) verified; (4) not yet verified. "Verified" = a Badge there **or** the Expert verifier mark there (D-25). Within each tier: nearer band, then earliest response |
| Client's responses, **Electrical and Solar** (D-48) | (1) verified Fundi Pro (tagged); (2) verified; (3) not-yet-verified Fundi Pro (tagged); (4) not yet verified. Within each tier: nearer band, then earliest response |
| `/fundis` (default and "near me"), every scope except Electrical and Solar (**operator round 3**) | real Fundi Pro verified in scope → real Fundi Pro not yet verified → real verified → Demo → real not yet verified; then (near me) nearer band, then the existing time key. Area text search stays in relevance order (a Convex constraint); the tag still shows there |
| `/fundis`, scope **Electrical** or **Solar** (D-48) | real verified Fundi Pro → real verified → Demo → real not-yet-verified Fundi Pro → real not yet verified; then as above |

**Until V11 ships**, `listings.subscriber` is false for everyone, so every order above reduces to today's verified-first order (D-24), and V8's response list reads "Verified first".

### 8.3 Filters

| List | Filters |
| --- | --- |
| `/jobs` | Trade, county, "near me" + band, **"Budget at least KSh X"** (Jobs without a budget are hidden while it's on, and the readout says so) |
| Client's responses | "Verified only", "Within N km" |
| `/fundis` | V6 filters + "near me" + band. No price filter in V2 (Rates mix units). |

### 8.4 Labels and counters

**Before V11 ships** no Fundi is Pro, so these orders reduce to today's: verified in scope → Demo → not yet verified (D-24), and no Pro tag, legend or Pro copy is rendered anywhere. V8's strings carry no Pro wording at all (rai S2); V11 adds them.

**Why this order.** The operator chose it (round 3): Fundi Pro pays inside the platform, so it comes first. **Consequence:** outside Electrical and Solar, an unverified Fundi Pro can appear above an Expert-approved Fundi, which weakens the R-17 mitigation ("verified first") and raises the misleading-advertising risk (R-37). On the two safety Trades, Electrical and Solar, verified stays first (D-48). The mitigations are the "PAID" tag on the result itself, the legend, the "Verified only" chip, and Badges that stay the only place ✓, amber and "Verified by Smart Fundis" appear.

### 8.4a The Fundi Pro tag and legend (D-47)

- **Tag:** EN **"FUNDI PRO · PAID"**; SW **"FUNDI PRO · AMELIPIA"** (SW draft — native-speaker check, R-20). The word "Pro" alone reads as "professional", so the tag always carries PAID.
- **The tag is a 48 px button.** Tapping it opens the US-8.32 explanation (a sheet on mobile).
- **Where:** every Fundi Pro card and response, in every list (Job responses and `/fundis`), **and on `/f/[id]`**. Never on a Badge line, never next to "Verified by Smart Fundis".
- **Legend:** EN **"Pro = paid subscription, not a verification."** SW draft **"Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi"** (native-speaker check, R-20). The SW legend never uses "usajili", which reads as official registration.
- **Legend layout:** a stacked 2-column grid (term | meaning) above the list, one row each for ✓ Badge, Expert verifier, FUNDI PRO · PAID and DEMO, per the §13 tag table.
- **Style:** the §13 tag table row "Pro": dashed outline, receipt icon, the word PAID, in `--dim`/`--text`; **no ✓, no amber**, visually distinct from Badges and the Expert verifier mark (designer, V2-40).
- **Readout:** "Fundi Pro first, then verified" on most Trades; "Verified first" on Electrical and Solar, with the legend beside it.

### 8.4b Response buckets

The find-a-fundi rule "no counters" was about counts of Fundis and reveals. The operator wants the public to see "people vying" (Q6). Proposal (V2-Q14): each Job card shows one bucket from real live Interests: **"No responses yet"**, **"1 response"**, **"2–5 responses"** or **"More than 5 responses"**. Never a view count, never Fundis' names on the public board, never inflated; Demo Jobs show "Demo" instead. Still no site-wide public counters (the scope of the rule is in §13 rule 7).

**How it is stored.** `jobs.responseBucket` is patched only when the bucket changes, so a new Interest rarely re-renders every board reader. The exact live count lives in a separate `jobCounters` row per Job, which drives the 30-Interest cap and the owner's exact count (convex S3).

---

## 9. Pricing and payment labels

### 9.1 Prices

| Price | Who sets it | Where | Label (EN / SW draft; native-speaker check pending, R-20) |
| --- | --- | --- | --- |
| **Rates** (V6) | Fundi | public profile | "Set by the fundi — not verified" / "Imewekwa na fundi — haijathibitishwa" |
| **Budget** | Client | Job card and detail | "Budget set by the client" / "Bajeti imewekwa na mteja" |
| **Subscription** | Smart Fundis | Spec B pay sheet | "Smart Fundis subscription", plus "Test mode — no real money" in sandbox |

Formats: `KSh 3,000`; ranges `KSh 2,000–4,000`. Budgets are whole shillings, 1 to 10,000,000. Smart Fundis never pre-fills a budget (I-3); the AI may only copy a number the Client typed (§11.2).

### 9.2 Pay-to details (operator Q2)

A Fundi gives **one** set of self-declared payment details. They are required only to **respond to Jobs**, not to register (operator, V2-Q47, R6-1):
- **Pochi la Biashara:** a Kenyan mobile number plus the M-Pesa account name. Pochi payments go to the owner's **mobile number** (per Safaricom's product description; not re-checked in this session, **UNVERIFIED**), so a Pochi number **is a phone number** and follows the phone rules (ADR-21); it is never printed on a public page.
- **Till (Buy Goods):** a 5–7 digit till number plus the business name. A till number is not a personal phone number.

**Who sees them (operator round 6):**
- **Pochi:** only the Client who **hired** that Fundi, through the logged mutation `jobs.revealPayTo` (never in a query or HTML), from hire until 30 days after `done`. The mutation resolves the Fundi through `job.hiredInterestId`, never from an argument. It needs `requireClient` and counts toward the per-Fundi daily reveal cap (D-46).
- **Till:** the same. **No public Till** (operator round 6): Pay-to details are never on a profile or card.
- **The Pochi warning** on the Pay-to form (rai S8): "A Pochi number is your phone number. The client you hire will see it, even if 'Show my phone to clients' is off." (SW draft — native-speaker check (R-20): "Nambari ya Pochi ni nambari yako ya simu. Mteja utakayeajiriwa naye ataiona, hata kama 'Onyesha simu yangu kwa wateja' imezimwa.")

**Label everywhere:** "Pay to: set by the fundi — Smart Fundis doesn't check this number or handle this payment. M-Pesa shows the account name before you confirm: check it's <display name>." (SW draft: "Lipa kwa: imewekwa na fundi — Smart Fundis haikagui nambari hii wala kushughulikia malipo haya. M-Pesa inaonyesha jina la akaunti kabla hujathibitisha: hakikisha ni <jina>.")

**Guards:** format checks only; the account and business names pass the contact-details filter; `fundi.setPayTo` is rate-limited (`payToSet`, 5 a day per Fundi, proposed); a change within 7 days of any hire notifies that Client (E14); Admins can clear them (US-8.24); report reason `wrong_pay_to_details`. Demo profiles have no Pay-to details. `setPayTo` and `clearPayTo` do not call `syncListing` (Pay-to is never in `listings`).

---

## 10. Payments (pointer to Spec B)

- **Decided (operator Q2):** Client → Fundi payment is **direct**, to the Fundi's own Pochi or Till (§9.2) or in cash. Smart Fundis never receives, holds or passes on that money. No escrow.
- **Decided (rounds 2–6):** **Fundi Pro**, paid by STK Push to Smart Fundis' **own** Till, KSh 200 a month (R4-2, R6-6). Enterprise Pro (Clients) is roadmap only. Spec B designs the flow; it ships in **V11**, after V9.
- **The hire screen says:** "Pay the fundi directly, by M-Pesa or cash, when you agree. Smart Fundis doesn't hold or handle this payment." (SW draft: "Mlipe fundi moja kwa moja, kwa M-Pesa au pesa taslimu, mkikubaliana. Smart Fundis haishiki wala kushughulikia malipo haya.")
- **Coupling:** Jobs never wait on a payment. The only link is the `listings.subscriber` flag, which `syncListing` sets and which Spec B's subscription changes trigger (`subscriptions.extend`, `subscriptions.markExpired` in batches, `payments.recordRefund`, which sets `active = false` itself). `contact.reveal` (WhatsApp channel), `interests.listForJob` and `listings.search` read `listings.subscriber`; none reads subscriptions at query time (architect S13). On `prod`, only `mode: "production"` subscriptions set the flag.

---

## 11. AI in the dashboards

Only what the NVIDIA fit note supports (NF §1.2, §2.1–2.4). Every AI output is labelled "AI suggestion" or "The AI noticed…", never "AI verified". No NVIDIA logo, green or name-as-brand (NF §3).

### 11.0 Video-analysis surfaces (V7)

This section is the display side of the existing pipeline: architecture spec §3 (upload → claim → callback), §6 (the `/ai/claim` and `/ai/callback` contracts, `rules.py`), ADR-11, ADR-19, D-14, and the NVIDIA fit note (NF §1.1–§1.2, §3). **No AI contract changes.** Every surface reads only what the callback already stores on the Assessment, plus three optional Expert-review fields (below). **V7 builds on the MVP V1 stub** (stub worker, canned callbacks), because these surfaces only display stored fields (D-45). V7 **restyles** the MVP Expert review; it does not build a second one.

**What the pipeline produces (recap).** Cosmos Reason 2 (8B, 2B fallback) watches the in-app video at `fps: 4` against the Rubric and returns one Observation per Rubric item (`result` yes/no/unclear, one-line `evidence`, `timestampS`) plus the digits it read for the Liveness code. Nemotron turns the Observations (never the video) into a Verdict (`pass`/`needs_review`/`fail`, strengths, gaps, `feedbackEn`, `feedbackSw`, `confidence`). `rules.py` compares the Liveness code, sets missing items to `unclear`, flags safety items that are `no`/`unclear`, and caps the Verdict at `needs_review` (ADR-11). The guard can return a reshoot reason (`too_short`, `too_long`, `low_res`, `too_dark`) instead.

**Fundi dashboard: "My verifications".**

| Assessment status | What the Fundi sees (EN; SW in `sw.json`) |
| --- | --- |
| `queued` | "Waiting in line for the AI check" |
| `analyzing` | "The AI is watching your video" (live status via Convex; **no fake progress**: no percentage, no progress bar, no countdown) |
| `awaiting_review` | **"Awaiting expert review"**, the same line for every Verdict (D-50). Nothing hints at the Verdict, the cap or a safety flag until the Expert decides. Never the Verdict word, never a score. |
| `reshoot` (guard) | The specific reason from `reshootReason.{en,sw}` ("Your video was too dark — record again in daylight") and **Record again** (a new Assessment with a new Liveness code) |
| `reshoot` (Expert) | The Expert's note, the **"AI suggestion"** feedback (strengths, gaps and `feedbackEn`/`feedbackSw` in the UI language), the "The AI noticed…" list (below), and **Record again** |
| `approved` | The Badge line "Verified by Smart Fundis — <Trade>: <Task> · <date>", then the Expert's note, then **"AI suggestion"** feedback: strengths, gaps and `feedbackEn`/`feedbackSw` in the UI language, then the "The AI noticed…" list (below; D-59), in copy reviewed by `rai-reviewer` as practice notes, never as doubt about the Badge (D-61) |
| `rejected` | The Expert's note, the AI feedback, the "The AI noticed…" list (below), and **Appeal** (once) |
| `failed` | "Something went wrong on our side — please record again" |

**"The AI noticed…" list (D-59 as amended by D-61; supersedes D-52).** After every Expert decision (`approved`, `reshoot`, `rejected`), below the Expert's note: the AI tag, "The AI noticed…", **"An Expert decides."**, then one row per Rubric item, safety items first. Each row has the item text and the AI's answer in words ("AI: yes", "AI: no", "The AI couldn't tell"), both in the UI language, and the one-line evidence text, which stays **English in both UI languages** under the label **"AI note in English"** (a named exception to D-29; D-61). The query redacts the Liveness code, and any digit run matching it, from `evidence`. **No timestamps** until the timestamp-reliability eval passes (NF §1.1); after that, the whole-second timestamp as plain text (`0:42`; "--:--" labelled "no timestamp" when missing). Safety items read "needs a closer look", never an accusation. On `approved`, the copy is framed as practice notes, never as doubt about the Badge, and `rai-reviewer` signs it off before V7-10 ships (D-61). **No Jump chips:** the Fundi has no player of their own video (no `videoUrl`) until the Architect decides otherwise. Before the decision there is no list at all (D-50). DESIGN.md D5 has the layout.

Never shown to the Fundi: `confidence`, the Verdict label (before or after the decision), any safety flag before the decision, the digits Cosmos read (only "We couldn't read your code" when `livenessCheck` isn't `yes`, ADR-19), the `<think>` trace, model names. Kiswahili feedback is shown only after the native-speaker check (R-20); until then, the English feedback shows with "Kiswahili version coming".

**Expert dashboard: queue and review.**
- **Queue:** Assessments `awaiting_review` in the Expert's approved Trades, oldest first, never their own; each row shows Trade, Task and age. Safety-flagged rows carry a "Safety check" marker. **No "AI suggestion" chip in the queue** (D-51).
- **Review screen:** the video (the detail query is the only place `getUrl()` is returned), then **safety flags first**, then one row per Rubric item: the item text, the AI's `yes`/`no`/"The AI couldn't tell" (`unclear`), the one-line evidence, and a **timestamp chip in whole seconds** (`0:42`, 48 px tap target) that seeks the player; **"--:--"** with the accessible label "no timestamp" when `timestampS` is missing. The chip's tap-to-jump ships only after the eval checks timestamp reliability without a frame overlay (NF §1.1, UNVERIFIED); before that the chip is shown as plain text.
- **Liveness:** the expected code, the digits the AI read (or "not readable"), and `livenessCheck` (`yes`/`unclear`). The Expert confirms by watching; a mismatch is a reason to look, not an automatic reject (ADR-19).
- **Verdict, only after one full playback (D-51).** When the player reaches the end once, the browser calls `expert.markPlayedThrough({ assessmentId })`, which stores `expertPlayedThroughAt`. Until then `expert.reviewDetail` returns `aiSuggestion: null` and the panel reads "Watch the whole video to see the AI suggestion." After it: labelled "AI suggestion — you decide", with strengths and gaps. **No `confidence` number** (NF §1.2: uncalibrated). A "Checked with the backup model" note when `fallbackModel` is true.
- **Decide:** approve / reshoot (note required) / reject (note required), as today. The decision mutation also stores `expertAgreedWithAi` (true for approve on `pass` or reject on `fail`; false for the opposite; null on `needs_review` or a reshoot, which are counted separately) and `expertDecideMs` (from `expertOpenedAt`, set when the review screen first loads through `expert.openReview`) and bumps the day-bucket counters. These feed the Admin agreement tiles (D-51).

**Admin dashboard: pipeline health (`/admin/ops`).**
- Tiles from stored data only: Assessments by status; oldest `queued` and oldest `analyzing` timestamps (the browser computes the age); stuck-job requeues and `failed` in the last 24 h; share of callbacks with `fallbackModel`; p50/p95 `latencyMs` over the last 100 results; reshoot reasons by code.
- **"Last 24 h" and "this week" figures read day-bucket counter documents** (`opsCounters`, one row per metric per UTC day), summed over the last 1 or 7 buckets whose keys the browser passes in. The query never reads the clock (convex B2).
- **Expert–AI agreement** (D-51): the share of decisions where the Expert agreed with the AI Verdict, and the average time to decide, per Trade, from the same counters (a sum and a count; a median would need every value). Shown beside the eval tiles, labelled "Expert decisions, not accuracy".
- **Eval tiles** (agreement %, safety-fault recall, per Trade, plus the PRD §8 splits: sex, lighting, phone) stay empty with "No eval results yet" until `eval/results.csv` is loaded (US-4.7); `confidence` appears only there, labelled "uncalibrated".
- Counts come from **named counter documents**, never `.collect().length`. `@convex-dev/aggregate` is **not** mounted in V2 (convex S6).
- `ops.summary` and `ops.pipelineHealth` are **one query**, `ops.summary` (§16).

**Tracing and privacy.** Nothing on these surfaces is logged or traced; the ai-service traces only through `ai-service/app/tracing.py` with the D-14 mask (no video URLs, prompts or feedback text). The public profile still shows only Badges (D-1).

**Read models (contracts, convex role):**

```ts
dashboard.fundiVerifications({ paginationOpts }) (query, requireFundi) → PaginationResult<{
  assessmentId; tradeName; taskName; status; createdAt;
  reshootReason: { code; text: string } | null;      // text in the caller's language
  expertNote: string | null;                          // after a decision
  aiFeedback: { strengths: string[]; gaps: string[]; text: string;
                noticed: { item: string; safety: boolean; result: "yes" | "no" | "unclear";
                           evidence: string;      // English (D-61); Liveness code and matching digit runs redacted
                           timestampS: number | null }[]  // null to the Fundi until the timestamp eval passes, then whole seconds (D-61)
                                                    // present after any decision, incl. approved; safety items first (D-59)
              } | null;                              // only after a decision (approved, reshoot or rejected)
  livenessUnreadable: boolean;                        // never the digits; false until a decision
  canAppeal: boolean; canRecordAgain: boolean; canDeleteVideo: boolean;
}>  // never videoUrl, confidence, verdict label, safety flags before a decision, model
expert.queue({ trade?, paginationOpts }) (query, requireExpert) → PaginationResult<{ assessmentId; tradeName; taskName; waitingSince; safetyFlagged: boolean }>
  // no aiSuggestion field (D-51)
expert.openReview({ assessmentId }) (mutation, canDecide) → null          // sets expertOpenedAt once
expert.markPlayedThrough({ assessmentId }) (mutation, canDecide) → null   // sets expertPlayedThroughAt once
expert.reviewDetail({ assessmentId }) (query, canDecide) → {
  videoUrl: string;                                   // the only list-free place a URL is returned
  safetyFlags: string[];
  observations: { itemId; text; safety: boolean; result: "yes" | "no" | "unclear"; evidence: string; timestampS: number | null }[];
  liveness: { expected: string; read: string | null; check: "yes" | "unclear" };
  aiSuggestion: { verdict: "pass" | "needs_review" | "fail"; strengths: string[]; gaps: string[] } | null;
                                                      // null until expertPlayedThroughAt is set (D-51)
  fallbackModel: boolean;
}  // no confidence
// Admin tiles: see ops.summary in §16 (ops.pipelineHealth is merged into it).
```

New optional fields on `assessments` (convex role, V7): `expertOpenedAt`, `expertPlayedThroughAt`, `expertAgreedWithAi` (boolean or null), `expertDecideMs`. None is ever returned to a Fundi.

**Tests (convex-test), numbered after §17:**
- 40. `dashboard.fundiVerifications` never contains `videoUrl`, `confidence`, a Verdict label, a safety flag before the decision, `livenessRead` digits or a model name, in any status (serialised JSON). A `pass` and a capped `needs_review` Assessment awaiting review give **byte-identical** rows apart from ids and times (D-50). `aiFeedback` (and so `noticed`) is null until a decision; after any decision, **including `approved`**, `noticed` has one row per Rubric item with `evidence` and a whole-second `timestampS` (or null), safety items first (D-59); every `timestampS` is null while the timestamp eval hasn't passed, and a fixture that **plants the Liveness code in `evidence`** returns no trace of those digits (D-61).
- 41. `expert.queue` excludes the Expert's own Assessments and other Trades, and has no `aiSuggestion` field; `expert.reviewDetail` throws for a non-eligible Expert, has no `confidence`, and returns `aiSuggestion: null` until `expert.markPlayedThrough` has run (D-51).
- 42. `ops.summary` throws for non-Admins and computes the tiles from counter fixtures without `.collect()` on `assessments` and without reading the clock.
- 43. An AI `pass` awaiting review still shows nothing on the public profile (find-a-fundi #6).
- 44. A decision stores `expertAgreedWithAi` and `expertDecideMs` and bumps the day-bucket counters.

### 11.1 Assessments (unchanged contract; new placements)

| Output | Fundi dashboard | Expert dashboard | Admin | Public |
| --- | --- | --- | --- | --- |
| Verdict label | **never**; before the decision only "Awaiting expert review", the same for every Verdict (D-50) | "AI suggestion", **only after one full playback**; never in the queue (D-51) | yes | never |
| Strengths, gaps, `feedbackEn`, `feedbackSw` | **only after** the Expert decides, beside the Expert's note | n/a | yes | never |
| Observations | only after **any** Expert decision (approved, reshoot, rejected), as "The AI noticed…" with the evidence text (English, "AI note in English"; Liveness code redacted); **no timestamps** until the timestamp eval passes, then plain text, "--:--" if missing; no player, so no jump (D-59, D-61; supersedes D-52) | whole-second timestamp chip → jumps the player; "--:--" ("no timestamp") if missing; `unclear` = "The AI couldn't tell" | yes | never |
| Safety flags | nothing before the decision (D-50); after any decision, safety items first in "The AI noticed…", reading "needs a closer look", never an accusation (D-59) | first; the queue shows only the "Safety check" marker | yes | never |
| Liveness read | "We couldn't read your code" only, never the digits (ADR-19) | yes | yes | never |
| `confidence` | never | **never as a number** | eval view only, labelled "uncalibrated" | never |
| `<think>` trace | never | never | never (not in the contract) | never |
| `fallbackModel` | no | "Checked with the backup model" | yes | aggregate only |

**ADR-11 is unchanged:** a safety item `no`/`unclear`, or a liveness check that isn't `yes`, caps the Verdict at `needs_review`; no dashboard shows a Verdict as a decision (I-13, DPA s.35).

**Fallbacks:** pipeline down → the Assessment stays `queued` and the Fundi sees "Taking longer than usual — you don't need to do anything"; two failed attempts → `failed` (architecture spec §3).

### 11.2 Job post pre-fill (Nemotron, new; V10, last and optional)

**Scope (D-58).** V10 comes **after V11** and is **cut unless Brev already runs for video**. Before V10 is cut, gpu-devops measures p95 parse latency while Cosmos is busy. The keyword map (below) ships in V8 regardless, with no AI. Everything in this section keeps every V2-25 review fix (review §3.4).

- **What:** one sentence → `{ tradeSuggestions (≤ 3 of 12), title, county?, areaText?, budgetKsh? }`. `budgetKsh` only if the text has a number with a currency cue ("3000", "3k", "elfu tatu"), else null. `county` is one of 47; `areaText` is matched against the ward picker in Convex, not by the model.
- **Only on an explicit tap.** `jobs.suggestFromText` runs when the Client taps "Suggest from my words", never on typing.
- **How, given ADR-9 (no inbound port on Brev):** `jobs.suggestFromText` writes an `aiParseRequests` row (`queued`); Brev claims it through a **new** pair, `POST /ai/claim-parse` and `POST /ai/callback-parse`; the form picks up the result reactively. The browser waits at most **15 s**, then keeps the manual form.
- **A dedicated parse lane on Brev:** its own loop, polling every 1–2 s, never behind a video job, including in `QUEUE_MODE=inline` (gpu-devops).
- **Timeouts:** `claim-parse` refuses requests older than 15 s. A request claimed but with no callback after 30 s becomes `failed`, and so does one whose callback returns 400. Requests unclaimed after 60 s become `expired`. All are deleted after 24 h.
- **Heartbeat:** a claim writes `aiWorker.lastSeenAt` at most every 30 s. If it is older than 60 s, `suggestFromText` returns `requestId: null`, and the UI shows only keyword suggestions: no AI box, no spinner.
- **Secret:** a separate `AI_PARSE_SECRET` (Convex env and the Brev box only), not the Assessment `AI_SHARED_SECRET`. Bearer, constant-time compare. The Assessment endpoints are unchanged.
- **Payloads** carry `"v": 1`. The camelCase (Convex) ↔ snake_case (Pydantic) aliases are fixed in §16.
- **Boundary checks in Convex** on every callback (code-reviewer S6): `title` ≤ 80, `areaText` ≤ 60, `budgetKsh` an integer 1..10,000,000, ≤ 3 Trades, every slug among the 12 and every county among the 47. Anything else → 400 and the request becomes `failed`.
- **Model settings (NF §2.0a, §2.1):** self-hosted Nemotron 3 Nano 30B-A3B (D-32), `enable_thinking: false`, temperature 0.2, vLLM `structured_outputs` / `response_format: json_schema` (never the removed `guided_json`), Pydantic validation, one repair retry, then `failed`.
- **Privacy:** Convex strips phone numbers, emails and URLs **before** queueing. Traces only through `ai-service/app/tracing.py` with the D-14 mask; the LangSmith allow-list **redacts `title` and `areaText`** in the parse output, and a pytest asserts that no input or output strings are traced. Photos are never sent.
- **Kiswahili and Sheng:** quality UNVERIFIED (NF §2.1(3), R-20). The keyword map (`convex/lib/tradeKeywords.ts`: `stima`, `bomba`, `breki`, `probox`, `msusi`, `mama fua`…) runs first, with no AI.
- **Measured, not claimed:** `jobs.publish` records whether the published Trade equals the first AI suggestion (`aiDraft.tradeKept`) and the input language (`aiDraft.lang`: `en`, `sw` or `mixed`, from the keyword map) for US-8.29, so the rate is split by language. No accuracy claim until that number exists.
- **Cost:** with the Brev box off, the heartbeat goes stale and the keyword map + manual form carry on (V2-Q26 is moot while V10 is optional).

### 11.3 What AI never does in V2

Rank, score, summarise or recommend a Fundi or Client; read Job photos or Portfolio items; set or suggest a price; moderate on its own; write to a public page.

---

## 12. Consent, privacy and retention

### 12.1 What is shared, and when (consent lines, EN + SW)

Every Kiswahili line in this section is a **SW draft — native-speaker check (R-20)**. R-20 now covers consent strings, and they need a native speaker's sign-off **before V8 merges**.

**The Client terms** (shown on `/client/start`, accepted with `termsVersion`; status proposed). The last six clauses are new from the V2-25 review (rai B3, D-49):

| # | EN | SW draft — native-speaker check (R-20) |
| --- | --- | --- |
| T1 | "Your job's title, trade, area (ward) and budget are public." | "Kichwa, aina ya kazi, eneo (wadi) na bajeti ya kazi yako vinaonekana kwa wote." |
| T2 | "Your description and photos are seen only by signed-in fundis." | "Maelezo na picha zako zinaonwa tu na mafundi walioingia." |
| T3 | "Fundis never see your phone number or WhatsApp; you choose whom to contact. Your landmark is shared only with the fundi you hire." | "Mafundi hawaoni kamwe nambari yako ya simu wala WhatsApp; wewe ndiye unachagua wa kuwasiliana naye. Alama ya mahali pako inaonyeshwa tu kwa fundi utakayemwajiri." |
| T4 | "Pay fundis directly; Smart Fundis doesn't hold payments." | "Walipe mafundi moja kwa moja; Smart Fundis haishiki malipo." |
| T5 (new) | "Fundis see your first name. The fundi you hire sees your full display name." | "Mafundi wanaona jina lako la kwanza. Fundi utakayemwajiri anaona jina lako kamili." |
| T6 (new) | "A 'signed-in fundi' is anyone who has signed up as a fundi on Smart Fundis. They are not checked before they can see your description and photos." | "'Fundi aliyeingia' ni yeyote aliyejiunga kama fundi kwenye Smart Fundis. Hawakaguliwi kabla ya kuona maelezo na picha zako." |
| T7 (new) | "We delete your job's photos and landmark 30 days after the job closes, and the job itself 12 months after it closes. Drafts you don't touch for 30 days are deleted." | "Tunafuta picha na alama ya mahali siku 30 baada ya kazi kufungwa, na kazi yenyewe miezi 12 baada ya kufungwa. Rasimu usizoguse kwa siku 30 zinafutwa." |
| T8 (new) | "You can ask to see, correct or delete your data: email info@smartfundis.com. We reply within 30 days." | "Unaweza kuomba kuona, kusahihisha au kufuta data yako: tuma barua pepe kwa info@smartfundis.com. Tunajibu ndani ya siku 30." |
| T9 (new) | "Your job text and photos are not used to train AI." | "Maandishi na picha za kazi yako hazitumiki kufunza AI." |
| T10 (new, D-49) | "Your data is processed outside Kenya: by Convex and Clerk in the United States, and by Brev and LangSmith. We keep agreements with each of them that protect it." | "Data yako inachakatwa nje ya Kenya: na Convex na Clerk nchini Marekani, na pia na Brev na LangSmith. Tuna mikataba na kila mmoja wao inayoilinda." |

**The verification consent** (MVP consent screen, D-22) gains the same transfer line (D-49): EN "Your video and results are processed outside Kenya: by Convex and Clerk in the United States, and by Brev and LangSmith." SW draft — native-speaker check (R-20): "Video na matokeo yako yanachakatwa nje ya Kenya: na Convex na Clerk nchini Marekani, na pia na Brev na LangSmith." Brev's and LangSmith's processing regions are **UNVERIFIED**; the line names them without a country until the processor agreements confirm one.

**Moments of sharing:**

| Moment | What is shared | Line shown (EN / SW draft — native-speaker check, R-20) | Status |
| --- | --- | --- | --- |
| Publish | what goes public, per US-8.2 | "Everyone can see: trade, title, area (ward), budget. Signed-in fundis also see: your description, your photos and your first name. Only the fundi you hire sees your landmark. No fundi ever sees your phone number." / "Kila mtu anaona: aina ya kazi, kichwa, eneo (wadi), bajeti. Mafundi walioingia pia wanaona: maelezo, picha na jina lako la kwanza. Fundi utakayemwajiri pekee ndiye anaona alama ya mahali. Hakuna fundi atakayeona nambari yako ya simu." | proposed (rai S11) |
| Interest sent (V8) | nothing new | "Clients reach you by the phone you chose to show. You never see their number." / "Wateja wanakufikia kwa simu uliyochagua kuonyesha. Wewe huoni nambari yao." V11 adds "(and WhatsApp if you're Fundi Pro)" / "(na WhatsApp kama wewe ni Fundi Pro)". | decided (round 4) |
| Any time, a Client (D-46) | an opted-in Fundi's phone (Call reveal) | — | decided (round 4, ADR-21, D-46) |
| Any time, a Client, **Fundi Pro** (V11) | the Fundi's WhatsApp link | "Starting a WhatsApp chat shares your WhatsApp number with this fundi." / "Kuanzisha mazungumzo ya WhatsApp kunamwonyesha fundi huyu nambari yako ya WhatsApp." (shown to the Client) | decided (round 4) |
| Hire | the Fundi's Pay-to details to the Client; the landmark and full display name to the Fundi | "Hire <name>? You'll see how they want to be paid, and they'll see your landmark and your full name." / "Umwajiri <jina>? Utaona jinsi anavyotaka kulipwa, na yeye ataona alama ya mahali pako na jina lako kamili." | proposed |

Every reveal (`contact.reveal` for Call and WhatsApp, `jobs.revealPayTo`) is a mutation behind `requireClient` that writes a `contactShares` row and counts toward the per-Fundi daily cap (D-46). None of these values is ever in a query result or HTML. **No function ever returns a Client's phone to a Fundi** (§17 #17).

**Other consent** (EN / SW draft — native-speaker check, R-20):
- **18+** on every new account (I-12, `users.adultConfirmedAt`): "I am 18 or older" / "Nina umri wa miaka 18 au zaidi". **Backfill:** existing Fundis and Experts confirm at their next sign-in; uploads are blocked until they do (§5.1).
- **Location** before the first "Use my location" (§7.6 rule 6).
- **Job photo**, per photo (I-12, I-17, D-22 extended): "No children can be recognised, and anyone recognisable agreed." / "Hakuna mtoto anayeweza kutambulika, na yeyote anayetambulika amekubali."
- **AI pre-fill** notice on the "Describe it" box (V10 only): "We use AI to read your description. You check every field before your job goes live." / "Tunatumia AI kusoma maelezo yako. Unakagua kila sehemu kabla kazi yako haijaonekana."

### 12.2 Who sees what

| Data | Public | Fundi | Client | Admin | AI | LangSmith |
| --- | --- | --- | --- | --- | --- | --- |
| Client name | no | first name; full once hired | own | yes | no | no |
| Client phone | no | **never** | own | Convex dashboard | no | no |
| Fundi phone | no (reveal needs a Client profile, D-46) | own | any Client, if the Fundi opted in (ADR-21), via `contact.reveal` | Convex dashboard | no | no |
| Pay-to (Pochi) | no | own | hiring Client, via `jobs.revealPayTo` | yes | no | no |
| Pay-to (Till) | no (no public Till, round 6) | own | hiring Client, via `jobs.revealPayTo` | yes | no | no |
| Job text | title only | yes | own | yes | stripped text, pre-fill only (V10) | no (masked; `title` and `areaText` redacted) |
| Job photos | no | yes | own | yes | **never** | no |
| Points | no | no | no | no | no | no |

### 12.3 Retention (proposal, V2-Q21)

| Data | Kept | Then |
| --- | --- | --- |
| Draft Jobs | 30 days untouched (`updatedAt`) | deleted with photos |
| Job photos, point, landmark | 30 days after `closedAt` | deleted / cleared |
| Jobs, Interests, notices | 12 months after `closedAt` | deleted |
| `contactShares` | 90 days | deleted |
| `aiParseRequests` | 24 hours | deleted |
| Job reports | 12 months after resolution | deleted |

**Retention counts from the close** (`closedAt`). A `hired` Job closes when the Client taps "Work done" or, at the latest, 30 days after `hiredAt` (D-53), so no hired Job keeps its photos, landmark and point for ever.

Crons delete in **batches of 50** (Convex guidelines), each batch scheduling the next. DPA s.25(g) (KR F4.5) is the reason; the periods are the operator's call.

### 12.4 Data-protection actions (not code)

| Action | Gate |
| --- | --- |
| **DPIA update** for Client accounts and Jobs (I-10) | **gates V8's production deploy** (D-49) |
| **DPIA update** for location | **gates V9's production deploy** (D-49) |
| **DPIA update** for payments | gates V11's production deploy (Spec B) |
| **Processor agreements on file** for Convex, Clerk, Brev and LangSmith (D-49) | before V8 production |
| Native-speaker sign-off on every consent string (R-20) | before V8 merges |
| Voluntary ODPC registration (I-15, V2-Q22) | operator decision |
| 72-hour breach runbook naming Convex, Clerk, Brev, LangSmith and Safaricom (I-14) | before V8 production |

**Privacy notice: lawful basis per purpose** (rai S10; proposed; counsel confirms the mapping to the Kenya DPA 2019, UNVERIFIED):

| Purpose | Lawful basis (proposed) |
| --- | --- |
| Accounts, Client profiles, Jobs, Interests, hire | performance of the service the User asked for (contract) |
| Contact reveals and `contactShares` logs | legitimate interest: fraud and harvesting prevention |
| Device location for "near me" and service areas | consent (§7.6), withdrawable at any time |
| Job photos showing people | consent of the people shown (the per-photo tick) |
| Video verification and its AI analysis | consent (the MVP verification consent) |
| Job pre-fill by AI (V10) | consent (the pre-fill notice, explicit tap) |
| Fundi Pro payments | contract, plus legal obligations on payment records (Spec B) |

**Manual deletion runbook** (rai S10; there is no self-serve deletion in V2, §22):
1. A request arrives at info@smartfundis.com. Smart Fundis replies within **30 days**.
2. Confirm identity: the request must come from the account's verified email, or the User confirms from it.
3. An Admin runs an internal `privacy.eraseUser({ userId })` action (proposed; convex role, a V8 ticket; until it exists the same steps run by hand from the Convex dashboard): deletes `clientProfiles`, the User's Jobs with their photos, Interests, notifications and `contactShares` rows where the User is the viewer or the subject; clears Pay-to details and service areas; runs `syncListing`; deletes the Clerk user.
4. Keep only what a law requires (payment records, Spec B) and the `auditLog` row of the erasure itself, which holds no personal data beyond the user id.
5. Reply to confirm, and record the request and the date in the privacy log.

---

## 13. Honesty and copy rules

All copy is in `messages/en.json` and `messages/sw.json` (D-29), with a native-speaker check on Kiswahili (R-20). **One named exception (D-61):** the Cosmos `evidence` text in "The AI noticed…" stays English in both UI languages, under the translated label "AI note in English"; its surrounding chrome is translated. Kiswahili strings in this spec are drafts.

1. **"Verified" means a Badge.** On Jobs and responses the only verification words are the Badge line, "Expert verifier · <Trade>" and "Not yet verified in <Trade>" (I-1). Never "vetted", "trusted", "top", "recommended", "best", "certified".
2. **Licence line for regulated Trades.** Electrical and Solar responses and profiles: "A Smart Fundis badge is not an EPRA licence." (I-2, V2-Q27; SW draft "Beji ya Smart Fundis si leseni ya EPRA.") **Building Trades** get the same line for the NCA: "A Smart Fundis badge is not an NCA registration." (SW draft — native-speaker check, R-20: "Beji ya Smart Fundis si usajili wa NCA."). Which of the 12 Trades count as building Trades is set in `convex/lib/trades.ts` by the Architect before V8 (UNVERIFIED which Trades the NCA covers).
3. **Every price and payment detail has an owner** (§9).
4. **Nothing looks live that isn't.** JOBS, "Post a job" and the landing strip appear only in the release that ships them; the strip never shows Demo Jobs, hides itself when empty and never says "LIVE"; `/jobs` with only Demo Jobs shows "Examples only, no real jobs yet"; payment surfaces carry "Test mode" in sandbox; no fake progress while an Assessment is `analyzing`.
5. **Fundi Pro is labelled, never dressed as quality.** Every Pro result, and `/f/[id]`, shows the "FUNDI PRO · PAID" tag and the list shows the legend (§8.4a). Never "Premium", "Top", "Trusted", "Recommended" or "Verified Pro"; never a ✓, amber, or "Verified by Smart Fundis" near the tag. Only skill Badges use those. The pay sheet says "You appear above fundis without Fundi Pro", never "You appear first", and never lists chat or AI voice as benefits (Spec B).
6. **Demo is always tagged.** Demo Jobs and Clients carry "DEMO: NOT A REAL JOB" (Jobs) or "Demo", accept no Interests, have no Pay-to details and are `noindex`.
7. **No site-wide public counters** (counts of Fundis, Clients, Jobs, reveals or views, anywhere public). The rule covers site-wide public figures only. **Exceptions:** the Job response bucket (§8.4b); the owner's exact response count and "N new responses"; the bell's unread count; the Expert's queue count; Admin tiles.
8. **AI wording** per §11.
9. **The scam line** on every Job detail for Fundis (US-8.10); SW draft "Smart Fundis haikuombi ulipe ili ujibu kazi. Mteja akikuomba pesa kwanza, ripoti."
10. **Forbidden words** on V2 screens (copy test): certified, guaranteed, escrow (outside `/roadmap`), cheapest, best price, top fundi, recommended fundi, rating, stars, premium fundi, verified pro, promoted. The test matches on **word boundaries** (so "unverified" or "starship" never trips it) and **allow-lists "Paid"** (the Pro tag). In Kiswahili, "usajili" may not appear in Pro copy (D-47).
11. **No brand logos and no green.** WhatsApp and M-Pesa buttons are text plus a generic line icon: no WhatsApp or M-Pesa logo, no green (designer S7). No NVIDIA logo or green either (§11).
12. **Never colour alone.** Every tag and status carries a glyph or word as well as its colour.

**Tag table** (designer B3; `DESIGN.md` gets the same table in V2-40):

| Tag | Look | EN / SW | Where |
| --- | --- | --- | --- |
| **Badge** | ✓ with the amber tick | "Verified by Smart Fundis — <Trade>: <Task>" / SW in `sw.json` | Badge lines only |
| **Expert** | solid outline with the scan-eye icon | "Expert verifier · <Trade>" | Expert verifiers only |
| **Pro** | dashed outline, receipt icon, the word PAID; 48 px button | "FUNDI PRO · PAID" / "FUNDI PRO · AMELIPIA" | Pro results and `/f/[id]` (V11) |
| **Demo** | dim outline | "DEMO: NOT A REAL JOB" (Jobs), "Demo" (profiles) | Demo rows |
| **Test mode** | full-width banner | "Test mode — no real money" | every payment surface in sandbox |
| **Not yet verified** | plain dim text, no outline | "Not yet verified in <Trade>" | unverified rows |
| **Error** | ✕ with text | the reason in words | failed states |
| **Status chips** | neutral outline plus one glyph from an 8-glyph set (designer, V2-40) | the status in words | Job, Interest and Assessment statuses |

Only the Badge uses ✓ or amber. Tags and chips use 0.08em tracking and a 12 px mono floor.

---

## 14. Moderation and abuse

- **Rate limits** (`@convex-dev/rate-limiter`, mounted by #29). Figures marked "proposed" are the Architect's; the convex role may tune them in the V8 ticket:

| Limit | Scope | Figure |
| --- | --- | --- |
| `jobPublish` | per Client | 3 a day, 10 a week |
| `jobSaveDraft` | per Client | 60 an hour (proposed) |
| `jobPhotoUploadUrl` (`jobs.generatePhotoUploadUrl`) | per Client | 20 an hour (proposed) |
| `jobRepost` | per Client | 5 a day (proposed) |
| `interestCreate` | per Fundi | 20 a day |
| `contactRevealViewer` | per Client | 20 a day, shared by Call, WhatsApp and Pay-to |
| `contactRevealFundi` | **per Fundi** (the subject) | **100 a day**, across Call, WhatsApp and Pay-to and every surface (D-46; V6's figure) |
| `clientCreate` (`clients.create`) | per identity (Clerk subject) | 3 a day (proposed; D-46) |
| `payToSet` (`fundi.setPayTo`) | per Fundi | 5 a day (proposed) |
| `serviceAreaSet` (`fundi.setServiceArea`) | per Fundi | 10 a day (proposed; D-55) |
| `jobReport` | per User | 5 an hour |
| `aiParse` (V10) | per Client | 10 an hour |

- **Contact-details filter** (`convex/lib/contactFilter.ts`): Kenyan mobile patterns (`(\+?254|0)[17]\d{8}`, spaces and dashes tolerated), emails, URLs, "paybill"/"till"/"lipa na"/"pochi" followed by digits. Applied to **every free-text write**: Job titles, descriptions and landmarks (`saveDraft` and `publish`), Interest notes (`interests.create` **and `interests.update`**), report notes, Client `displayName` and `businessName` (`clients.create/update`), and Pay-to account and business names. Reports catch what it misses.
- **Ownership checks** (code-reviewer S1, S3), each a thrown error:
  - `interests.shortlist/unshortlist` and `jobs.hire`: the Client owns the Job, `interest.jobId === jobId`, and the Interest is not withdrawn or removed.
  - `jobs.revealPayTo`: resolves the Fundi through `job.hiredInterestId`, never an argument.
  - `notifications.markRead`: checks that every id belongs to the caller.
  - `jobReports.create`: `interestId` and `jobPhotoId` must belong to `jobId`.
  - `jobs.addPhoto`: accepts only a `storageId` the caller uploaded through a URL issued to them and not yet used (`jobPhotoUploads`, §15.3).
  - `jobs.getForFundi`: only for `open`/`shortlisted` Jobs, plus the hired Fundi on a `hired` Job; never for an Admin-hidden Fundi.
  - `jobs.parseResult`: only the request's own Client.
  - `payments.abandon` (Spec B): owner only.
- **Job reports** (`jobReports`), reasons in US-8.23, handled in `/admin/jobs`.
- **Posting block:** `clientProfiles.postingBlocked`; `jobs.saveDraft`/`jobs.publish` return `posting_blocked` with "Posting is paused on your account. Questions: info@smartfundis.com".
- **Fake Client accounts** (R-25): verified email (Clerk) + phone + 18+ + terms; `clients.create` rate-limited per identity; only a Client can reveal an opted-in Fundi's phone (`requireClient`), logged and capped per Client and per Fundi; V6's anonymous `visitorKey` reveal is retired (D-46); Fundis never get Client numbers; every reveal logged. OTP is Pilot.
- **Hire harvesting** (R-32): one release per Job, posting and reveal rate limits, the per-Fundi cap, `contactShares` for Admin review.
- **Pay-to fraud** (R-35): self-declared label, name-check line, change notices, report reason, Admin clear.

---

## 15. Data model (Convex)

The **convex** role owns the code and the Architect owns the shape. Payment and subscription tables are in Spec B, owned by the **mpesa** role. New index names follow the Convex guideline (`by_a_and_b`). Every new field on an existing table is optional.

### 15.1 Shared validators (`convex/lib/location.ts`)

```ts
snappedPoint = v.object({ lat: v.number(), lng: v.number() })   // multiples of 0.01; the server snaps on every write and query
areaFields = {
  county: countySlug,                               // 47-slug union (convex/lib/counties.ts)
  subCountyId: v.optional(v.id("areas")),
  wardId: v.optional(v.id("areas")),
  areaLabel: v.string(),                            // ≤ 60
}
clientLocation = v.object({ ...areaFields })        // clientProfiles: names only, NO point (D-55)
serviceLocation = v.object({                        // fundiProfiles.serviceArea
  ...areaFields,
  point: v.optional(snappedPoint),                  // device point or copied ward centroid
  geohash: v.optional(v.string()),                  // precision 6, for the fallback ring search
  pointSource: v.optional(v.union(v.literal("device"), v.literal("ward_centroid"))),
})
jobLocation = v.object({                            // jobs
  ...areaFields,
  landmark: v.optional(v.string()),                 // ≤ 140
  point: v.optional(snappedPoint),                  // the ward centroid ONLY, copied at write time (D-55)
  geohash: v.optional(v.string()),
})
```

### 15.2 Changes to existing tables

| Table | Field | Type / rule |
| --- | --- | --- |
| `users` | `adultConfirmedAt` | number, optional; required before any profile is created from V8, and before any upload for existing Fundis and Experts (backfill at next sign-in, §5.1) |
| `users` | `locationConsentAt` | number, optional |
| `users` | `dashboardPref` | `"fundi" \| "client" \| "expert" \| "admin"`, optional; never a role |
| `fundiProfiles` | `serviceArea` | `{ location: serviceLocation, radiusKm: 5 \| 10 \| 25 \| 50, updatedAt }`, optional |
| `fundiProfiles` | `payTo` | `{ kind: "pochi", phoneE164, accountName } \| { kind: "till", till, businessName }`, plus `updatedAt`; **optional** (a Fundi can register, record Assessments and earn Badges without it); `interests.create` returns `no_pay_to` until it's set (V2-Q47, §9.2) |
| `assessments` | `expertOpenedAt`, `expertPlayedThroughAt`, `expertAgreedWithAi`, `expertDecideMs` | optional (V7, D-51); never returned to a Fundi |
| `listings` | `geohash`, `point` | optional, **private**, never returned (§7.5) |
| `listings` | `subscriber` | boolean, public (drives the Pro tag); set by `syncListing` from `subscriptions` (Spec B). On `prod`, only `mode: "production"` subscriptions count |
| `listings` | `tier` | 1–5, the ranking tier for this row's scope (below); also the `ProximityIndex` filter key |
| `listings` | `sortKey` | **re-tiered** (operator round 3, D-48): `tier × 10¹³ + t` as before. **Default scopes:** 5 real Pro verified in scope, 4 real Pro not yet verified, 3 real verified, 2 Demo, 1 real not yet verified. **Scopes `electrical` and `solar`:** 5 real verified Pro, 4 real verified, 3 Demo, 2 real not-yet-verified Pro, 1 real not yet verified |
| `listings` | indexes | **renamed** to the `by_a_and_b` style during the V2 re-tier migration (for example `by_scope_and_sortKey`), plus `by_scope_and_tier_and_geohash` for the fallback ring search |

**Listings tier backfill.** The V2 re-tier is a migration (convex role, V8): it recomputes `tier` and `sortKey` for every `listings` row with `subscriber: false`, which reproduces today's order exactly (D-24), and renames the indexes. The projection-consistency test (find-a-fundi #19) passes before and after.

**`syncListing` callers (R-16)** gain these rows in the find-a-fundi §10.3 table:
- `fundi.setServiceArea`, `fundi.clearServiceLocation` (V9);
- `interests.create` when `addTradeToProfile` adds a Trade (V8);
- `clients.create` and `clients.update` when they write `users.phone` or the display name (V8);
- Spec B's `subscriptions.extend`, `subscriptions.markExpired` (run in batches of 50) and `payments.recordRefund` (V11);
- `privacy.eraseUser` (§12.4).
- **Exempt:** `fundi.setPayTo` and `moderation.clearPayTo` (Pay-to is never in `listings`).
- **Stated explicitly:** ward centroids are **copied** onto each Fundi or Job at write time, so a later edit to `areas` does not propagate and does not call `syncListing`.

Pay-to details are never in `listings` or `profiles.getPublic` (operator round 6).

**Retired in V8 (D-46):** V6's `contactReveals` table, its `purgeOldReveals` cron and the anonymous `contact.reveal({ fundiProfileId, channel, visitorKey })`. The V8 migration drains and deletes `contactReveals` and replaces the function with the §16 `contact.reveal`. V8 also removes V6's WhatsApp button on `/f/[id]` (it comes back in V11, Pro-only).

### 15.3 New tables

**`clientProfiles`**: `userId`; `displayName` (≤ 40); `kind: "person" | "business"`; `businessName?` (≤ 60); `location: clientLocation` (county required; **no point, no landmark**, D-55); `termsVersion`, `termsAt`; `lastSeenResponsesAt?` (drives "N new responses"); `postingBlocked?`, `hiddenByAdmin?` (`{ reason, byUserId, at }`). Index `by_userId`.

**`areas`** (the picker; written only by the import and Admins): `slug` (unique, e.g. `kiambu-ruiru-gitothua`); `name`; `county`; `kind: "subcounty" | "ward"`; `parentId?` (a ward's sub-county); `centroid?` (snapped point; **V9**); `geohash?` (V9); `source: "iebc" | "knbs" | "hdx" | "osm" | "manual"`; `sourceRef?`; `active`. Indexes `by_slug`, `by_county_and_kind_and_name`, `by_parentId_and_name`, `by_geohash`. Search index `search_name` on `name`, `filterFields: ["county", "kind", "active"]`. **V8 imports IEBC ward names only** for the six first counties (D-56); V9 adds centroids.

**`jobs`**

| Field | Type |
| --- | --- |
| `clientUserId`, `clientProfileId` | ids |
| `status` | `"draft" \| "open" \| "shortlisted" \| "hired" \| "done" \| "expired" \| "cancelled" \| "removed"` |
| `tradeSlug` | optional in `draft`, required from `open` |
| `title` | 4–80 |
| `description` | ≤ 1,000 |
| `budget` | `{ kind: "fixed", amountKsh } \| { kind: "range", minKsh, maxKsh }`, optional |
| `when` | `{ kind: "asap" \| "this_week" \| "flexible" } \| { kind: "date", date: "YYYY-MM-DD" }` |
| `location` | `jobLocation` (optional landmark; the point is the ward centroid only, D-55) |
| `county`, `geohash` | top-level copies of `location.county` / `location.geohash`, for indexes |
| `budgetMaxKsh` | optional number: the fixed amount or the range max; absent without a budget. An index field for "Budget at least KSh X", never a sort key |
| `expiryDays` | `7 \| 14 \| 30` |
| `openedAt`, `expiresAt`, `hiredAt`, `doneAt`, `closedAt` | optional numbers |
| `updatedAt` | number; every write |
| `publicUntil` | optional number: `closedAt + 7 days`, set by `setJobStatus` on close; cleared by a cron once passed. `jobs.getPublic` shows a closed Job only while it is set |
| `autoClosed` | optional `true` when the 30-day cron closed it (D-53) |
| `hiredInterestId` | optional |
| `releaseCount` | 0 or 1 |
| `cancelReason` | ≤ 140, optional |
| `removedByAdmin` | `{ reason, byUserId, at }`, optional |
| `responseBucket` | `ResponseBucket`; **patched only when the bucket changes** (the exact count is in `jobCounters`) |
| `onBoard` | boolean: `status ∈ {open, shortlisted}` |
| `boardSortKey` | `tier × 10¹³ + openedAt`; tier 2 = real, 1 = Demo |
| `aiDraft` | `{ requestId, tradeKept: boolean, lang: "en" \| "sw" \| "mixed" }`, optional (no text; V10) |
| `isDemo` | boolean |

Indexes: `by_onBoard_and_boardSortKey`, `by_onBoard_and_tradeSlug_and_boardSortKey`, `by_onBoard_and_county_and_boardSortKey`, `by_onBoard_and_tradeSlug_and_county_and_boardSortKey`, `by_onBoard_and_budgetMaxKsh`, `by_onBoard_and_geohash`, `by_onBoard_and_tradeSlug_and_geohash`, `by_clientUserId` (newest first), `by_clientUserId_and_status`, `by_status_and_expiresAt`, `by_status_and_hiredAt` (auto-close), `by_status_and_updatedAt` (draft purge), `by_status_and_closedAt`, `by_publicUntil`. No search index in V2 (§7.3). With `budgetMin`, `jobs.board` reads `by_onBoard_and_budgetMaxKsh` from `budgetMin` up and orders each page newest first (real before Demo) in memory, **never by budget**; the convex role settles the page shape in V8 (UNVERIFIED).

**One helper, `setJobStatus(ctx, job, to, actor)`,** performs every transition (§6.1): it checks the table, updates `onBoard`, `boardSortKey`, `updatedAt`, `closedAt`, `publicUntil`, the Interests, `jobCounters`, the `ProximityIndex` entry and the notices, and writes `auditLog` for Admin actions. It has a consistency test, like `syncListing` (§17 #9).

**`jobCounters`** (one row per Job): `jobId`; `liveInterests` (exact; drives the 30-Interest cap, the owner's count and `jobs.responseBucket`). Index `by_jobId`. A separate row keeps Interest writes from conflicting with board reads (convex S3).

**`jobPhotoUploads`** (upload ownership, code-reviewer S1): `userId`; `storageId?` (set when the upload finishes); `issuedAt`; `usedAt?`. Written by `jobs.generatePhotoUploadUrl`. `jobs.addPhoto` accepts a `storageId` only if a row of the caller's with no `usedAt` matches it, then sets `usedAt`. Unused rows and their storage are purged after 24 h. Indexes `by_userId_and_issuedAt`, `by_storageId`.

**`jobPhotos`**: `jobId`; `storageId`; `thumbStorageId` (480 px WebP); `contentType`, `sizeBytes` (from `_storage`); `peopleConsentConfirmed: true`; `removedByAdmin?`. Index `by_jobId`. ≤ 4 per Job. The server rejects a file whose EXIF still holds GPS data, or strips it (§17 #48); the same rule applies to V6 Portfolio uploads.

**`interests`**: `jobId`; `clientUserId` (denormalised for guards); `fundiUserId`, `fundiProfileId`; `status: "active" | "shortlisted" | "hired" | "not_chosen" | "withdrawn" | "released" | "closed" | "removed"`; `note?` (≤ 280); `noteUpdatedAt?`; `isDemo`. Indexes `by_jobId_and_status`, `by_jobId_and_fundiUserId`, `by_fundiUserId` (newest first), `by_fundiUserId_and_status`.

**`contactShares`** (replaces V6's `contactReveals`, D-46): `jobId?` (**optional**: profile reveals have none); `interestId?`; `fundiProfileId`; `viewerUserId` (always a Client); `subjectUserId` (always the Fundi); `kind: "call" | "whatsapp" | "pay_to"`; `surface: "profile" | "response" | "hire"`; `at`. Indexes `by_jobId`, `by_viewerUserId_and_at`, `by_fundiProfileId_and_at`, `by_at` (purge).

**`jobReports`**: `jobId`, `interestId?`, `jobPhotoId?`, `reporterUserId`, `reason`, `note?`, `status: "open" | "dismissed" | "actioned"`, `resolvedByUserId?`, `resolution?`, `resolvedAt?`, `at`. Indexes `by_status_and_at`, `by_jobId`.

**`notifications`**: `userId`; `kind: "new_response" | "shortlisted" | "hired" | "not_chosen" | "released" | "job_closed" | "job_expired" | "job_auto_closed" | "job_removed" | "pay_to_changed" | "fundi_pro_renewal" | "fundi_pro_lapsed"`; `jobId?` (**optional**: the Fundi Pro notices have none); `interestId?`; `readAt?`; `at`. Indexes `by_userId_and_at`, `by_userId_and_readAt_and_at`, `by_at` (purge). No text stored; the UI builds the sentence in the reader's language.

**`notificationCounters`** (one row per User): `userId`; `unread`. Index `by_userId`. Every notice insert increments it; `markRead` decrements it. `notifications.unreadCount` reads only this row.

**`opsCounters`** (named day-bucket counter documents; no `@convex-dev/aggregate` in V2): `metric` (e.g. `assessments_failed`, `ai_requeued`, `jobs_posted`, `jobs_hired`, `expert_decisions`, `expert_agreed`, `expert_decide_ms_sum`, `trade_kept`); `trade?`; `day` (`YYYY-MM-DD`, UTC); `value`. Index `by_metric_and_day`, `by_metric_and_trade_and_day`. Written by the mutations that cause each event; `ops.summary` sums the buckets whose keys the browser passes in.

**`aiParseRequests`** (V10): `clientUserId`; `text` (stripped, ≤ 500); `status: "queued" | "claimed" | "done" | "failed" | "expired"`; `attempt`; `claimedAt?`; `result?: ParseResult`; `model?`; `at`. Indexes `by_status_and_at`, `by_clientUserId_and_at`.

**`aiWorker`** (V10; one row per worker): `workerId`; `lastSeenAt` (written by a claim at most every 30 s). Index `by_workerId`.

### 15.4 Components

- `@convex-dev/rate-limiter` (mounted by #29; new limits in §14). Registered in convex-test (§17).
- `@convex-dev/geospatial`: **mounted in V9** behind `ProximityIndex` (D-54); `convex-expert` confirms in V9's first ticket. The precision-5 ring search is the fallback.
- `@convex-dev/aggregate`: **not mounted** in V2. Named counter documents instead (`jobCounters`, `notificationCounters`, `opsCounters`).

---

## 16. Contracts (TypeScript)

Every public function has `args` and `returns` validators. No function takes a role or a "who am I" user id from its arguments (ADR-18).

**Error convention** (architect S6). A function **throws** (`ConvexError` with a code) on an auth failure (no identity, `caller.user` null, missing role or profile), on an ownership failure (an id that isn't the caller's, or an Interest that isn't on the given Job) and on a broken invariant (an illegal transition, a bad validator value). It **returns `{ ok: false, reason }`** only for an expected user outcome the UI shows as a sentence (`rate_limited`, `contact_details_in_text`, `posting_blocked`, `already_hired`, …). A function never returns `{ ok: false }` for something only an attacker would cause.

**`requireClient(ctx)`** throws `unauthenticated` with no identity or when `caller.user` is null, and `not_client` when the User has no Client profile, no `users.phone`, no `adultConfirmedAt` or no accepted `termsVersion` (D-46). The UI reads `users.me` first and sends the User to `/client/start` instead of calling a reveal that would throw.

```ts
// ---- shared types --------------------------------------------------------
type DistanceBand = "within_2" | "2_5" | "5_10" | "10_25" | "25_50" | "over_50" | "same_county" | "other_county";
type Budget = { kind: "fixed"; amountKsh: number } | { kind: "range"; minKsh: number; maxKsh: number };
type When = { kind: "asap" | "this_week" | "flexible" } | { kind: "date"; date: string /* YYYY-MM-DD */ };
type ResponseBucket = "none" | "one" | "two_to_five" | "more_than_five";
type PointArg = { lat: number; lng: number };        // the server snaps it before any use (D-55); never stored for visitors
type ClientLocationInput = { county: CountySlug; subCountyId?: Id<"areas">; wardId?: Id<"areas"> };   // no point (D-55)
type JobLocationInput = ClientLocationInput & { landmark?: string };      // the band point is the ward centroid
type ServiceLocationInput = ClientLocationInput & { devicePoint?: PointArg };
type PayToInput = { kind: "pochi"; phone: string; accountName: string }
                | { kind: "till"; till: string; businessName: string };
type Roles = { fundi: boolean; client: boolean; expert: boolean; admin: boolean };
type InterestStatus = "active" | "shortlisted" | "hired" | "not_chosen" | "withdrawn" | "released" | "closed" | "removed";
type NotificationKind = /* the notifications.kind union, §15.3 */ string;
type JobStatus = "draft" | "open" | "shortlisted" | "hired" | "done" | "expired" | "cancelled" | "removed";

// ---- public, no auth -----------------------------------------------------
jobs.board({ trade?, county?, budgetMin?, paginationOpts }) (query) → PaginationResult<JobCard>   // 24 a page
jobs.boardNear({ trade?, budgetMin?, point: PointArg, radiusKm: 5 | 10 | 25 | 50 }) (query)
  → JobCard[]                        // plain array, ≤ 60, §8.2 near-me order (band, then newest; Demo after).
                                     // One-shot read with a "Refresh" button, not a live subscription.
type JobCard = {
  jobId: Id<"jobs">; tradeSlug: string; tradeName: string; title: string;
  county: CountySlug; countyName: string; areaLabel: string;
  budget: Budget | null; when: When; openedAt: number;
  band: DistanceBand | null;          // only from boardNear / jobsNearMe; from the Job's ward centroid (D-55)
  responses: ResponseBucket | null;   // null for Demo Jobs
  status: "open" | "shortlisted"; isDemo: boolean;
};
jobs.latestForLanding() (query) → JobCard[]            // ≤ 6 real Jobs; [] → strip not rendered
jobs.getPublic({ jobId }) (query) → (Omit<JobCard, "status"> & { status: JobStatus; closed: boolean }) | null
  // null for draft, removed, unknown, and closed Jobs whose publicUntil has been cleared. Never reads the clock.
areas.children({ county: CountySlug; parentId?: Id<"areas"> }) (query)
  → { areaId: Id<"areas">; name: string; kind: "subcounty" | "ward" }[]   // the picker (V8: names only, D-56)
areas.search({ text: string; county?: CountySlug }) (query) → same shape, ≤ 10
areas.nearestWard({ point: PointArg }) (query) → { areaId; name; county } | null   // V9; server snaps first
profiles.getPublic (find-a-fundi §11) gains `pro: boolean` (from listings.subscriber; the tag on /f/[id], D-47).
// ListingCard (find-a-fundi §11) gains `pro: boolean` (from listings.subscriber; the boost applies to /fundis too).

// ---- signed in -----------------------------------------------------------
users.me() (query) → null | {        // null when signed out or before the Clerk webhook has created the user
  userId: Id<"users">; roles: Roles; dashboardPref: keyof Roles | null;
  adultConfirmed: boolean;           // false → the 18+ prompt (new accounts, and the backfill for Fundis and Experts)
  hasPhone: boolean; clientProfileId: Id<"clientProfiles"> | null; fundiProfileId: Id<"fundiProfiles"> | null;
  canReveal: boolean;                // requireClient would pass
}
users.confirmAdult() → null
users.setDashboardPref({ role: "fundi" | "client" | "expert" | "admin" }) → null   // throws if not held
jobs.getForFundi({ jobId }) (query, requireFundi) → (JobCard & {
  description: string;
  photos: { id: Id<"jobPhotos">; thumbUrl: string; url: string }[];
  clientFirstName: string; band: DistanceBand; myInterest: MyInterest | null;
  landmark: string | null;           // only for the hired Fundi (§7.4)
  clientDisplayName: string | null;  // only for the hired Fundi
  canRespond: { ok: true } | { ok: false; reason: CannotRespond };
}) | null;
  // null unless the Job is open or shortlisted, or the caller is its hired Fundi; null for an Admin-hidden Fundi.
type CannotRespond = "own_job" | "not_listed" | "no_pay_to" | "hidden" | "closed" | "full" | "demo" | "already_responded";
// "not_listed": the Fundi must be Listed to respond (V2-Q37 = yes). "no_pay_to": Pay-to missing; required only to respond (V2-Q47).

// ---- Client (requireClient; the caller's own data only) -----------------
clients.create({ displayName, kind, businessName?, location: ClientLocationInput, termsVersion, phone? })
  → { ok: true; clientProfileId: Id<"clientProfiles"> }
  | { ok: false; reason: "contact_details_in_text" | "rate_limited" }
  // signed in (not requireClient); needs users.adultConfirmedAt; phone required if users.phone is empty;
  // rate limit clientCreate per identity (D-46); writes users.phone → syncListing if the User is a Fundi
clients.update({ displayName?, businessName?, location?: ClientLocationInput }) →
  { ok: true } | { ok: false; reason: "contact_details_in_text" }       // syncListing when the display name changes
clients.markResponsesSeen() → null             // sets lastSeenResponsesAt = now
jobs.saveDraft({ jobId?, tradeSlug?, title?, description?, budget?, when?, location?: JobLocationInput, expiryDays? })
  → { ok: true; jobId: Id<"jobs"> }
  | { ok: false; reason: "posting_blocked" | "contact_details_in_text" | "rate_limited" | "not_draft" }
  // drafts only: with a jobId, the Job must be the caller's and still `draft`, else not_draft
jobs.generatePhotoUploadUrl() → { ok: true; url: string } | { ok: false; reason: "rate_limited" }
  // records a jobPhotoUploads row for the caller
jobs.addPhoto({ jobId, storageId, thumbStorageId, peopleConsentConfirmed: true }) → Id<"jobPhotos">
  // throws unless both ids are the caller's own unused uploads, the Job is the caller's draft or open Job,
  // the file is an image ≤ 5 MB, it has no GPS EXIF (rejected or stripped), and the Job has < 4 photos
jobs.removePhoto({ photoId }) → null
jobs.getMine({ jobId }) (query, owner only) → MyJobDetail | null
type MyJobRow = {
  jobId: Id<"jobs">; title: string; tradeName: string | null; status: JobStatus;
  openedAt: number | null; expiresAt: number | null; hiredAt: number | null;
  responseCount: number;             // exact, from jobCounters
  newResponses: number;              // Interests created after clientProfiles.lastSeenResponsesAt
  isDemo: boolean;
};
type MyJobDetail = MyJobRow & {
  description: string; budget: Budget | null; when: When; expiryDays: 7 | 14 | 30;
  location: { county: CountySlug; areaLabel: string; landmark: string | null };   // never a point
  photos: { id: Id<"jobPhotos">; thumbUrl: string; url: string }[];
  releaseAvailable: boolean; autoClosed: boolean; cancelReason: string | null; removedReason: string | null;
};
jobs.listMine({ paginationOpts }) (query) → PaginationResult<MyJobRow>   // by_clientUserId, newest first
interests.listForJob({ jobId, verifiedOnly?, radiusKm? }) (query, owner only)
  → { responses: ResponseRow[] /* ≤ 30, §8.2 order */; hiddenByFilter: number }
  // excludes Admin-hidden and unlisted Fundis at read time; reads listings.subscriber, never subscriptions
type ResponseRow = {
  interestId: Id<"interests">;
  status: "active" | "shortlisted" | "hired" | "not_chosen" | "withdrawn" | "released";
  fundi: ListingCard;               // find-a-fundi §11 shape, scope = the Job's Trade; includes `pro`
  band: DistanceBand; note: string | null; noteUpdatedAt: number | null; respondedAt: number;
  licenceNote: "epra" | "nca" | null; // Electrical/Solar → EPRA; building Trades → NCA (§13 rule 2)
  pro: boolean;                     // listings.subscriber → the Pro tag (V11; always false before)
  callAvailable: boolean;           // the Fundi opted in to "Show my phone to clients" (ADR-21)
  whatsappAvailable: boolean;       // Fundi Pro and number marked "on WhatsApp" (V11)
};
interests.shortlist({ jobId, interestId }) / interests.unshortlist({ jobId, interestId }) → null
  // throws unless the caller owns the Job, interest.jobId === jobId, and the Interest isn't withdrawn or removed
jobs.hire({ jobId, interestId }) → { ok: true } | { ok: false; reason: "already_hired" | "fundi_unavailable" | "closed" }
  // same ownership checks as shortlist
jobs.releaseHire({ jobId }) → { ok: true } | { ok: false; reason: "too_late" | "already_released" }
jobs.markDone({ jobId }) / jobs.cancel({ jobId, reason? }) → null
jobs.repost({ jobId }) → { ok: true; jobId: Id<"jobs"> } | { ok: false; reason: "rate_limited" | "posting_blocked" }
  // a new draft copying fields (not photos)
jobs.revealPayTo({ jobId }) →                // requireClient; the hiring Client only; hired, or ≤ 30 days after done
  | { ok: true; payTo: { kind: "pochi"; phoneE164: string; display: string; accountName: string }
                     | { kind: "till"; till: string; businessName: string }; updatedAt: number }
  | { ok: false; reason: "not_hired" | "none" | "rate_limited" }
  // resolves the Fundi through job.hiredInterestId; writes contactShares {pay_to}; counts toward both reveal limits

// ---- Fundi (requireFundi) ------------------------------------------------
fundi.jobsNearMe({ allTrades?: boolean }) (query) → (JobCard & { band: DistanceBand })[]
  // plain array, ≤ 60, band then newest; one-shot read with "Refresh"; county fallback with no service point
fundi.setServiceArea({ location: ServiceLocationInput, radiusKm }) → { ok: true } | { ok: false; reason: "rate_limited" }
  // snaps the point; copies the ward centroid if no device point; calls syncListing; rate limit serviceAreaSet (D-55)
fundi.clearServiceLocation() → null                                 // deletes point + geohash; calls syncListing
fundi.setPayTo({ payTo: PayToInput | null }) → { ok: true } | { ok: false; reason: "rate_limited" | "contact_details_in_text" }
  // format checks; notifies Clients hired within 7 days; not a syncListing caller
interests.create({ jobId, note?, addTradeToProfile?: boolean }) →   // addTradeToProfile per V2-Q18 (soft rule)
  | { ok: true; interestId: Id<"interests"> }
  | { ok: false; reason: CannotRespond | "rate_limited" | "contact_details_in_text" }
  // with addTradeToProfile adding a Trade → syncListing
interests.update({ interestId, note: string | null }) → { ok: true } | { ok: false; reason: "contact_details_in_text" }
interests.withdraw({ interestId }) → null
interests.listMine({ paginationOpts }) (query) → PaginationResult<MyInterest>   // by_fundiUserId, newest first
type MyInterest = {
  interestId: Id<"interests">; jobId: Id<"jobs">; jobTitle: string; tradeName: string; areaLabel: string;
  status: InterestStatus;
  shown: "sent" | "shortlisted" | "hired" | "not_chosen" | "withdrawn" | "released" | "job_closed";  // US-8.25 wording key
  note: string | null; noteUpdatedAt: number | null; respondedAt: number;
};

// ---- Client → Fundi contact (D-46) -----------------------------------------------
contact.reveal({ fundiProfileId, channel: "call" | "whatsapp", jobId?, interestId? }) →   // requireClient
  | { ok: true; channel: "call"; phoneE164: string; display: string }
  | { ok: true; channel: "whatsapp"; url: string }
      // https://wa.me/<fundi digits>?text=… — "Hi, about your Smart Fundis job: <title>" only when jobId is given,
      // otherwise "Hi, I found you on Smart Fundis." Never mentions a Job that doesn't exist.
  | { ok: false; reason: "not_opted_in" | "no_phone" | "fundi_not_pro" | "not_on_whatsapp" | "not_listed" | "rate_limited" }
  // Replaces jobs.revealFundiPhone, jobs.openWhatsApp and V6's anonymous contact.reveal({ …, visitorKey }).
  // Used on /f/[id] and on responses. With jobId: throws unless the caller owns the Job; with interestId: throws
  // unless interest.jobId === jobId and interest.fundiProfileId === fundiProfileId.
  // "whatsapp" needs listings.subscriber (V11); before V11 it always returns fundi_not_pro and no button is shown.
  // One internal helper, revealFor(ctx, { viewerUserId, fundiProfileId, kind, surface, jobId?, interestId? }),
  // keyed on userId, serves contact.reveal and jobs.revealPayTo: it checks contactRevealViewer (20/day per Client)
  // and contactRevealFundi (100/day per Fundi, across Call, WhatsApp and Pay-to), then writes contactShares.
// There is NO function that returns a Client's phone or WhatsApp to a Fundi (round 2). Reveals are never queries.

// ---- any signed-in User ---------------------------------------------------
jobReports.create({ jobId, interestId?, jobPhotoId?, reason, note? }) → { ok: true } | { ok: false; reason: "rate_limited" | "contact_details_in_text" }
  // throws unless interestId and jobPhotoId belong to jobId
notifications.list({ paginationOpts }) (query) → PaginationResult<{
  id: Id<"notifications">; kind: NotificationKind; jobId: Id<"jobs"> | null; jobTitle: string | null;
  interestId: Id<"interests"> | null; at: number; read: boolean }>   // by_userId_and_at, newest first
notifications.unreadCount() (query) → number                          // reads notificationCounters only
notifications.markRead({ ids }) → null                                // throws if any id isn't the caller's

// ---- Admin (requireAdmin; auditLog on every write) --------------------------
moderation.listJobReports({ status, paginationOpts }) (query) → PaginationResult<{
  reportId: Id<"jobReports">; jobId: Id<"jobs">; jobTitle: string; interestId: Id<"interests"> | null;
  jobPhotoId: Id<"jobPhotos"> | null; reason: string; note: string | null; status: "open" | "dismissed" | "actioned";
  at: number; resolvedAt: number | null }>
moderation.resolveJobReport({ reportId, resolution: "dismissed" | "actioned", reason }) → null
moderation.removeJob / removeJobPhoto / removeInterest ({ id, reason }) → null
moderation.blockPosting / unblockPosting ({ clientProfileId, reason }) → null
moderation.clearPayTo({ fundiProfileId, reason }) → null
ops.summary({ dayKeys }) (query) → OpsSummary   // dayKeys: the last ≤ 7 UTC day keys, passed in by the browser;
                                                // named counter documents only, never .collect().length, never the clock
type OpsSummary = {
  byStatus: Record<string, number>; oldestQueuedAt: number | null; oldestAnalyzingAt: number | null;
  failed24h: number; requeued24h: number; fallbackShare: number | null;
  latencyP50Ms: number | null; latencyP95Ms: number | null; reshootByCode: Record<string, number>;
  openJobReports: number; openProfileReports: number; jobsPostedWeek: number; jobsHiredWeek: number;
  expertAgreement: { trade: string; decisions: number; agreed: number; meanDecideMs: number | null }[];   // D-51
  tradeKept: { lang: "en" | "sw" | "mixed"; kept: number; total: number }[] | null;                      // V10 only
  eval: null | { loadedAt: number; /* per-Trade figures and the PRD §8 splits */ };
};  // merges the former ops.pipelineHealth (§11.0)

// ---- internal ----------------------------------------------------------------
setJobStatus(ctx, job, to, actor)
revealFor(ctx, { viewerUserId, fundiProfileId, kind, surface, jobId?, interestId? })
jobs.expireDue / jobs.autoCloseHired / jobs.clearPublicUntil / jobs.purgeDrafts / jobs.purgeClosed /
  jobPhotoUploads.purge / contactShares.purge / notifications.purge / aiParse.expireAndPurge   // crons, batches of 50
migrations.v8RetireAnonymousReveal / migrations.v8RetierListings                               // V8, one-off
```

**AI parse endpoints** (V10, optional; HTTP actions, `Authorization: Bearer <AI_PARSE_SECRET>` (separate from the Assessment secret), constant-time compare, 401 otherwise). Every body carries `"v": 1`; an unknown `v` → 400.

```jsonc
// POST /ai/claim-parse  { "v": 1, "workerId": "brev-1" }  → 204 when none; else 200:
//   refuses (skips) requests older than 15 s; writes aiWorker.lastSeenAt at most every 30 s
{ "v": 1, "requestId": "…", "attempt": 1, "text": "fix my probox brakes ruiru around 3k",
  "trades": [{ "slug": "mechanic", "name": "Mechanic" } /* …all 12 */],
  "counties": [{ "slug": "kiambu", "name": "Kiambu" } /* …all 47 */] }

// POST /ai/callback-parse
{ "v": 1, "requestId": "…", "attempt": 1, "outcome": "result",
  "result": { "tradeSuggestions": ["mechanic"], "title": "Fix Probox brakes",
              "county": "kiambu", "areaText": "Ruiru", "budgetKsh": 3000 },
  "model": "nemotron-3-nano-30b-a3b@parse-p1" }
// or { "v": 1, "requestId", "attempt", "outcome": "error", "errorCode": "invalid_output" }
// Stale (not `claimed`, or attempt mismatch) → 409, no change.
// 400, and the request becomes `failed`: unknown slug or county; > 3 Trades; title > 80; areaText > 60;
//   budgetKsh not an integer in 1..10,000,000. Claimed with no callback after 30 s → `failed` (cron).
```

```ts
type ParseResult = {                 // what jobs.parseResult returns to the Client
  tradeSuggestions: string[];        // ≤ 3 of the 12 slugs
  title: string | null; county: CountySlug | null;
  areaText: string | null; wardMatch: { areaId: Id<"areas">; name: string } | null;   // matched in Convex
  budgetKsh: number | null;
};
jobs.suggestFromText({ text }) → { keywordTrades: string[]; requestId: Id<"aiParseRequests"> | null }
  // explicit tap only; requestId null when the heartbeat is older than 60 s, V10 is off, or rate_limited
jobs.parseResult({ requestId }) (query) → { status: "queued" | "claimed" | "done" | "failed" | "expired"; result: ParseResult | null }
  // throws unless the request is the caller's
jobs.publish({ jobId, aiRequestId? }) →
  | { ok: true }
  | { ok: false; reason: "missing_fields" | "contact_details_in_text" | "photo_consent_missing" | "rate_limited" | "posting_blocked" }
```

Pydantic (`ai-service/app/schemas/job_parse.py`, ai-pipeline role): `JobParse(trade_suggestions: list[TradeSlug] (max 3), title: str | None (max 80), county: CountySlug | None, area_text: str | None (max 60), budget_ksh: int | None (1..10_000_000))`, with closed enums built from the claim payload. **Aliases:** the JSON uses camelCase and Python uses snake_case: `trade_suggestions` ↔ `tradeSuggestions`, `area_text` ↔ `areaText`, `budget_ksh` ↔ `budgetKsh` (`Field(alias=…)`, `populate_by_name=True`, serialised `by_alias=True`). Convex re-checks every limit at the boundary; Pydantic is not trusted alone.

---

## 17. Testing seams

Highest seam first (architecture spec §10). Every rule is tested with **`convex-test`** through public functions and the HTTP actions, before any V7+ UI merges.

**Roles and routing**
1. A User with only `clientProfiles` gets `{ client: true, fundi: false, expert: false, admin: false }`; with both profiles, both true.
2. `users.setDashboardPref({ role: "expert" })` by a non-Expert throws; by an Expert it succeeds.
3. `clients.create` without `adultConfirmedAt`, or without any phone, throws.
3a. `users.me` returns null signed out and when the identity has no `users` row yet; `requireClient` throws in both cases rather than dereferencing null.

**Job lifecycle**
4. Every transition in §6.1 succeeds for the listed actor, and **every other (from, to, actor) combination throws** (table-driven).
5. `jobs.publish` with no Trade → `missing_fields`; with `0712 345 678`, `+254712345678`, `me@x.com`, `https://…`, "paybill 123456" or "pochi 0712…" in the title, description or landmark → `contact_details_in_text`.
6. A photo without `peopleConsentConfirmed: true` can't be added; a 5th photo throws; a non-image `_storage` file is deleted and the call throws; a `storageId` the caller didn't upload through their own issued URL, or one already used, throws (code-reviewer S1).
7. Two concurrent `jobs.hire` calls on different Interests of one Job: exactly one succeeds, the other returns `already_hired` (E2). Re-hiring the same Interest returns `{ ok: true }` (E3).
8. On hire, every other live Interest becomes `not_chosen`, with a notification each.
9. **Status-helper consistency:** after every transition, `onBoard`, `boardSortKey`, `updatedAt`, `closedAt`, `publicUntil`, `responseBucket` and `jobCounters.liveInterests` equal a from-scratch recomputation.
10. `jobs.releaseHire` works once within 7 days; the second call → `already_released`; after 7 days → `too_late` (fake timers); `expiresAt` ≥ now + 7 days.
11. `jobs.expireDue` moves only `open`/`shortlisted` Jobs with `expiresAt <= now` and closes their Interests.
12. `jobs.purgeDrafts` deletes drafts whose `updatedAt` is 30 days old, with storage, in batches of 50; `jobs.purgeClosed` clears photos, point and landmark 30 days after `closedAt` and deletes Jobs and Interests 12 months after it (clock seam).

12a. **Auto-close (D-53):** `jobs.autoCloseHired` moves a `hired` Job to `done` exactly when `hiredAt + 30 days <= now` (fake timers), sets `closedAt`, `autoClosed` and `publicUntil`, and writes one `job_auto_closed` notice to the Client; a Job hired 29 days ago is untouched.

12b. **`publicUntil`:** closing a Job sets `publicUntil = closedAt + 7 days`; `jobs.clearPublicUntil` clears it once passed (fake timers); `jobs.getPublic` returns the Job with `closed: true` while it is set and null after, and the query never reads `Date.now()` (asserted by running it with the clock frozen and moved).

12c. `jobs.saveDraft` with the `jobId` of an `open` Job returns `not_draft` and changes nothing; with another Client's draft it throws.

**Interests**
13. `interests.create` → `own_job` for a dual-role User on their own Job; `hidden` for an Admin-hidden Fundi; `demo` on a Demo Job; `already_responded` on a second Interest; `full` at 30 live Interests; `rate_limited` on the 21st in a day; `no_pay_to` without Pay-to details. **An unverified Fundi succeeds** (operator Q5). With `addTradeToProfile: true` on an undeclared Trade, the Trade is added and `syncListing` runs (V2-Q18). `not_listed` with `publicListing` off (operator round 6).
14. A Fundi hidden after responding disappears from `interests.listForJob`; hiring them → `fundi_unavailable` (E6).
15. **Order (operator round 3):** fixtures in a **Plumbing** Job: A Pro + verified 20 km, D Pro not yet verified 1 km, B Expert verifier 3 km, C verified 1 km, E not yet verified 0.5 km → A, D, then C (`within_2`) and B (`2_5`) by band, then E. A and D have `pro: true`; no other row does. Turning off A's subscription moves A into the verified tier and clears `pro`. `verifiedOnly: true` returns A, C and B only.

15a. **Safety Trades (D-48):** the same fixtures in an **Electrical** Job (and again for **Solar**) → A, then C and B by band, then D, then E. On `/fundis` with scope `electrical`, a Demo row sorts after verified and before D. Two rows in the same band keep the time order, whatever their exact km (band sort, D-55).

15b. On `prod`, a subscription with `mode: "sandbox"` leaves `listings.subscriber` false (rai S1).
16. A Fundi reads and edits only their own Interests; a Client lists responses only for their own Jobs; others throw.

**Contact and Pay-to**
17. **The Client's number never reaches a Fundi:** as a Fundi (hired, shortlisted or not), every query and mutation result is scanned for the Client's phone (serialised JSON, all formats) and never contains it. There is no Fundi-callable reveal.
18. **`contact.reveal` (D-46):** throws for a visitor, for a User whose `caller.user` is null, and for a signed-in User without a complete Client profile (no profile, no phone, no 18+ or no terms). For a Client: `channel: "call"` → `not_opted_in` when the Fundi's "Show my phone to clients" is off, otherwise the Fundi's number and a `contactShares` row (`jobId` absent on a profile reveal). `channel: "whatsapp"` → `fundi_not_pro` unless `listings.subscriber` is true; `not_on_whatsapp` unless the number is marked; otherwise a `wa.me` URL to the **Fundi's** digits only, whose text names the Job only when `jobId` is given. With a `jobId` the caller doesn't own, or an `interestId` not on that Job or not for that Fundi, it throws. V6's `visitorKey` form no longer exists (the old args fail validation).

18a. **Per-Fundi cap (D-46):** 100 reveals of one Fundi in a day, mixed across Call, WhatsApp and Pay-to and across many Clients, succeed; the 101st returns `rate_limited`. The per-Client limit returns `rate_limited` on the 21st reveal in a day. `clients.create` returns `rate_limited` past its per-identity limit.
19. `jobs.revealPayTo` → `not_hired` for anyone but the hiring Client; the details after hire; `none` if the Fundi set none. Neither a Pochi nor a Till number ever appears in `profiles.getPublic`, `listings.search` or any other query result. Onboarding and `assessments.*` succeed without Pay-to details; `interests.create` without them returns `no_pay_to`, and succeeds once `fundi.setPayTo` has run.
20. `fundi.setPayTo` within 7 days of a hire writes a `pay_to_changed` notification for that Client (E14).
21. **No leaks:** no query result for any role contains a phone pattern (`+254`, `07\d{8}`, `01\d{8}`), asserted with the shared `assertNoLeak(json, patterns)` helper on the serialised JSON of `jobs.board`, `jobs.boardNear`, `jobs.getPublic`, `jobs.getForFundi`, `jobs.getMine`, `interests.listForJob`, `jobs.listMine`, `interests.listMine`, `notifications.list`, `users.me` and `profiles.getPublic`.

21a. **Ownership (code-reviewer S3):** `notifications.markRead` with another User's id throws; `jobReports.create` with an `interestId` or `jobPhotoId` from another Job throws; `jobs.revealPayTo` ignores every Fundi but `job.hiredInterestId`'s; `jobs.parseResult` for another Client's request throws; `jobs.getForFundi` returns null for a `hired` Job to any Fundi but the hired one, and for an Admin-hidden Fundi.

21b. **`contactFilter` on all free text:** `interests.update`, `clients.create/update` (`displayName`, `businessName`), `fundi.setPayTo` names and `jobs.saveDraft` return `contact_details_in_text` for the §6 #5 inputs.

21c. **Rate limits:** `jobs.saveDraft`, `jobs.generatePhotoUploadUrl`, `jobs.repost`, `fundi.setPayTo` and `fundi.setServiceArea` each return `rate_limited` one call past their §14 figure.

**Public board**
22. `jobs.board` returns only `open`/`shortlisted` Jobs, never a description, photo, client name, landmark or point; real before Demo.
23. `jobs.latestForLanding` never returns a Demo Job and returns `[]` when no real Job is open.
24. The bucket is `none` / `one` / `two_to_five` / `more_than_five` at 0 / 1 / 2 and 5 / 6 live Interests, and `null` on Demo Jobs. `budgetMin` hides Jobs without a budget and Jobs whose fixed amount or range max is below it, and the remaining Jobs stay in newest-first order, never budget order. `jobs.getPublic` is null for `draft`, `removed` and unknown ids, and `closed: true` while `publicUntil` is set (#12b). `jobs.responseBucket` is patched only when the bucket changes (a 3rd and 4th Interest leave the `jobs` row untouched), and `jobCounters.liveInterests` is exact.

**Location and proximity**
25. **No point leak:** no result of any query contains `point`, `geohash`, `lat`, `lng`, `centroid` or a km figure, nor a landmark except for the owner and the hired Fundi.
26. **Snapping and no Client point (D-55):** a device point passed to `fundi.setServiceArea` is stored re-snapped to 0.01°; `clientProfiles` has no point field at all (`clients.create` has no point argument); a Job's stored point always equals its ward's centroid, whatever the Client did on the form; every query point (`jobs.boardNear`, `listings` near-me, `areas.nearestWard`) is snapped on the server before use, so two unsnapped points in the same cell give identical results.
27. Bands: fixtures at 1, 3, 7, 15, 40 and 80 km give `within_2`, `2_5`, `5_10`, `10_25`, `25_50`, `over_50`; no point on either side gives `same_county` / `other_county`; a ward centroid is used when there's no device point.
28. `fundi.clearServiceLocation` deletes the point and geohash in the profile and in every `listings` row of that Fundi, and removes the Fundi's `ProximityIndex` entries, in one transaction (E4), and the find-a-fundi projection-consistency test (#19) still passes.
29. **`ProximityIndex` contract suite (D-54),** run against **every implementation** (the `@convex-dev/geospatial` one and the precision-5 ring-search fallback): for each tier, `near` returns the same set of rows as a brute-force haversine over the same fixtures within the radius, up to `cap`, and when more than `cap` rows qualify it returns the `cap` nearest by band (property test around Nairobi and Kiambu, with rows of several tiers in one cell so that a per-cell `take` would fail). A full near-me read returns ≤ 60 rows in tier order, then band order; no result carries a km figure.

**AI pre-fill**
30. `jobs.suggestFromText("fix my probox brakes ruiru")` returns `keywordTrades` starting with `mechanic` with no AI; `"socket imeungua kahawa west"` returns `electrical`.
31. The queued `aiParseRequests.text` never contains a phone number, email or URL from the input.
32. `/ai/claim-parse` and `/ai/callback-parse` (V10): 401 without `AI_PARSE_SECRET`, and 401 with the Assessment secret; 400 without `"v": 1`; 204 when empty; atomic claim; a request older than 15 s is not claimed; stale callback → 409; slug outside the 12, > 3 Trades, `title` > 80, `areaText` > 60 or `budgetKsh` outside 1..10,000,000 → 400 and `failed`; claimed with no callback after 30 s → `failed`; unclaimed after 60 s → `expired` (clock seam).

32a. **Heartbeat:** with `aiWorker.lastSeenAt` older than 60 s, `jobs.suggestFromText` returns `requestId: null` and writes no `aiParseRequests` row.
33. `jobs.publish` saves only fields the Client sent (a `budgetKsh` in the AI result is ignored when the Client left budget empty).

**Subscription and labels (ADR-28)**
37. A subscription never adds a Badge, never sets `verified`, never changes `badges`/`badgeCount`, and never makes a card or response contain "Verified by Smart Fundis" (serialised JSON check, subscriber vs non-subscriber fixtures).
38. `pro` is true **exactly** when `listings.subscriber` is true (an active production Fundi Pro subscription on `prod`), in `interests.listForJob`, `listings.search` and `profiles.getPublic`; on default scopes every Pro row sorts in tier 5 or 4, and on `electrical`/`solar` in tier 5 or 2 (D-48).
39. Subscription start, expiry and refund each call `syncListing`, and the projection-consistency test (find-a-fundi #19) passes after each.

**Moderation**
34. Every `moderation.*` call by a non-Admin throws; every Admin write adds an `auditLog` row.
35. `postingBlocked` → `jobs.saveDraft` and `jobs.publish` return `posting_blocked`.
36. `jobReports.create` → `rate_limited` on the 6th call in an hour.

**Other seams**
**Seams added by the V2-25 review (§3.5)**
45. **Clock seam:** every time rule runs under convex-test fake timers: the draft and closed purges, `publicUntil`, `aiParse` expiry and the 30 s / 15 s parse timeouts, `subscriptions.markExpired` (Spec B) and the D-53 auto-close. No test sleeps.
46. **`assertNoLeak(json, patterns)`**, one shared helper (`convex/test/assertNoLeak.ts`) used by #17, #21, #25, #40 and #41, with named pattern sets: phone, till, point (`lat`, `lng`, `geohash`, `centroid`), km figures, `videoUrl`, `confidence`, Verdict labels.
47. **The rate-limiter component is registered in convex-test**, so every rate-limit test runs against the real component.
48. **EXIF:** a JPEG with GPS EXIF passed to `jobs.addPhoto` (and to the V6 Portfolio upload) is rejected or stored without the GPS tags; a Playwright check asserts the browser re-encodes a 1,200 px photo (smaller than the 1,600 px limit) before upload.
49. **Near-me band sort:** `jobs.boardNear`, `fundi.jobsNearMe` and `/fundis` near-me return rows sorted by band, never by exact km (#15a); the results carry no km.
50. **18+ backfill:** an existing Fundi without `adultConfirmedAt` gets `users.me().adultConfirmed === false`, and `assessments.generateUploadUrl` and the Portfolio upload throw until `users.confirmAdult` runs.
51. **V8 migration:** after `migrations.v8RetireAnonymousReveal`, `contactReveals` is empty and gone from the schema, and `contact.reveal` rejects `visitorKey`; after `migrations.v8RetierListings`, every `listings` row has `tier` and the same order as before (D-24).

**Other seams**
- **Playwright at 360×740:** a Client posts a Job (keyword Trade accepted) → it shows on `/jobs` and the landing strip → a Fundi opens it, sees the scam line, sends an Interest with a note → the Client shortlists, taps Call and gets the Fundi's number as a `tel:` link, then hires → the Client sees the Pay-to details with the name-check line → the Fundi's screens never show the Client's number. The HTML before any tap has no phone or till number; the public `/jobs/[id]` HTML has no description. A signed-in User without a Client profile who taps Call on `/f/[id]` lands on `/client/start`.
- **Playwright geolocation:** `context.setGeolocation` with permission **granted** shows "Near <ward>" and banded results; with permission **denied** the control reads "Location off — pick a county" and the county filter stays.
- **Stub parse worker** (V10): a fixture worker that claims and calls back, for the end-to-end pre-fill test; and a **"Brev off"** end-to-end test (stale heartbeat) that shows only keyword suggestions, with no AI box and no spinner.
- **`DarajaClient` module seam** (Spec B): payments tests swap the Daraja client for a fake.
- **Copy tests:** every V2 string is in `en.json` and `sw.json` (the Cosmos `evidence` text is model output, not a string, and is exempt under D-61); the forbidden-word list (§13 rule 10) passes as a **word-boundary** match with **"Paid" allow-listed**; no V8 string contains "Pro" (rai S2); a Playwright style check asserts the Pro tag has no ✓ glyph and no amber colour, reads "FUNDI PRO · PAID" / "FUNDI PRO · AMELIPIA", is at least 48 px tall, and that the legend is visible on `/fundis`, on `/f/[id]` and on the response list whenever a Pro result is shown.
- **Performance (designer S1):** each app-mode route stays within about 150 KB gzipped first-load JS, checked on Slow 3G with 4× CPU throttling.
- **pytest (ai-service):** the parse graph with a fixture model: unknown slugs rejected, `budget_ksh` null without a number, one repair retry then an error callback, the camelCase aliases round-trip, and **no input or output strings in traces** (`title` and `areaText` redacted).

---

## 18. Changes to earlier decisions

| Earlier rule | Where | Change | Proposed as |
| --- | --- | --- | --- |
| "Clients have no account"; roles `fundi \| none` + expert + admin | D-2, ADR-18, architecture spec §4 | **Client** is a fourth derived role. `Roles` becomes four booleans. `/dashboard` precedence Admin → Expert → Fundi → Client, with a stored preference. | D-33, ADR-23 (operator Q7) |
| Bookings and Client job posts are Roadmap-only | AGENTS non-negotiable, CONTEXT "Roadmap", spec §12 | Jobs, Interests, shortlist, hire and logged contact are live from V8. Escrow and bookings stay on `/roadmap`. | D-34, ADR-24 (operator Q4–Q6) |
| Phone revealed only on the Fundi's opt-in | ADR-21 | **Kept** for Call, on profiles and responses, for any **Client** (a signed-in User with a Client profile, phone, 18+ and terms; `requireClient`, D-46). The WhatsApp button becomes a **Fundi Pro** feature (V11). One `contact.reveal` serves both, with a per-Fundi daily cap across Call, WhatsApp and Pay-to. **A Client's number or WhatsApp is never revealed to a Fundi.** | D-34, D-46, ADR-24 |
| "No counters" | find-a-fundi §7 rule 7 | Job cards show a real, bucketed response count. The rule is scoped to **site-wide public counters**, with the §13 rule 7 exceptions. | D-35 (V2-Q14) |
| Anonymous tap-to-reveal with a `visitorKey`, logged in `contactReveals` | find-a-fundi §6, §10.4 (V6) | **Retired in V8.** Every reveal needs `requireClient`; `contactShares` (with optional `jobId`) replaces `contactReveals`; V8 owns the migration and removes V6's WhatsApp button until V11. | D-46 |
| "Geohash, maps and distance stay post-MVP" | PRD ADR-6, D-18, find-a-fundi OD-3 | **Superseded:** device point snapped to ~1 km (Fundis only; Jobs use the ward centroid, Clients store no point), county → sub-county → ward picker, distance bands sorted by band, a `ProximityIndex` backed by `@convex-dev/geospatial` with a ring-search fallback. No Google, no map. ADR-25 accepts the ~1 km floor. | D-36, D-37, **D-54**, **D-55**, ADR-25 (operator Q8) |
| Our own geohash cells, and "no `@convex-dev/geospatial`" | D-37, this spec's first draft (§7.3, §22) | **Superseded:** `@convex-dev/geospatial` `nearest()`, one call per tier, behind `ProximityIndex`; the precision-5 ring search is the fallback. `convex-expert` confirms in V9's first ticket. | D-54 |
| Rates are never sorted or compared | CONTEXT "Rates" | Extended to Budgets: **filter, never rank**. | D-38, ADR-26 |
| Nemotron only turns Observations into a Verdict | architecture spec §6 | Also pre-fills a Job post through a new pull endpoint pair; the Client confirms every field. The Assessment contract is unchanged. | D-39 |
| No age check | — | Every new account declares 18+ (I-12). | D-40 |
| "Bookings & M-Pesa" on `/roadmap` | spec §8, CONTEXT "Roadmap" | Direct pay to the Fundi's self-declared Pochi/Till (operator Q2). STK Push only for Smart Fundis' own subscription, if confirmed. The Roadmap item becomes "Escrow & in-app payment to fundis". | D-41, ADR-27 (Spec B) |
| No payments role | AGENTS folder ownership | New `mpesa` role: payment backend and contracts; UI suggestions only (operator Q9). | D-42 (Spec B) |
| Retention set only for `contactReveals` and (proposed) `contactMessages` | find-a-fundi §8.1, R-19 | Retention for Jobs, photos, points, Interests, reveal logs and AI requests (§12.3), counted from the close; `contactReveals` is retired. | D-43 (V2-Q21), D-46, D-53 |
| `listings` holds only public card fields | ADR-22 | Adds private `geohash`/`point` for near-me, never returned (test #25). | D-37 |
| Demo profiles: no phone, no Portfolio, no Expert mark | find-a-fundi §7 rule 8 | Also no Pay-to details; Demo Jobs accept no Interests. | D-34 |
| `listings.sortKey` tiers: real verified → Demo → real not yet verified | ADR-22, find-a-fundi §4 | **Superseded (operator round 3):** Pro verified → Pro not yet verified → verified → Demo → not yet verified; **on Electrical and Solar:** verified Pro → verified → Demo → not-yet-verified Pro → not yet verified; `listings` gains a public `subscriber` flag and a `tier`; subscription changes call `syncListing`. | D-44, **D-48**, ADR-28 |
| "There's no ranking, rating or 'top fundi' language" / "verified first" as the R-17 mitigation | find-a-fundi §4 and §7 rule 3, D-24 | **Superseded (round 3):** Fundi Pro ranks first, verified or not, **except on Electrical and Solar, where verified stays first** (D-48). Kept: the "FUNDI PRO · PAID" tag on the result itself and on `/f/[id]` (D-47), the legend, the "Verified only" chip, ✓/amber only for Badges. Still no rating or "top" language. | D-44, D-47, D-48, ADR-28, R-17, R-37 |
| A Client's phone is revealed to a hired Fundi (first draft of this spec) | — | **Never** (round 2). Contact is Client → Fundi only. | D-34 |
| In-app messaging out of scope | find-a-fundi §15, architecture spec §12 | Still out of V2; subscriber-only in-app chat is a later phase on `/roadmap`, with AI voice search. | D-44 |
| Slices ordered by sprint ("this sprint", "next sprint") | this spec's first draft, §21 | Explicit prerequisites. V7 builds on the MVP V1 stub and restyles the MVP Expert review; V8 is blocked on the V6 core. Order V7 → V8 → V9 → V11 → V10 (optional). | D-45, D-58 |
| The Fundi sees "AI suggestion: <label>" while `awaiting_review` | this spec's first draft (§11.0, §11.1, US-8.27) | One neutral line, "Awaiting expert review", for every Verdict; nothing hints at the Verdict, the cap or a safety flag until the Expert decides. | D-50 |
| The Expert queue shows an "AI suggestion" chip; the review shows the Verdict at once | MVP Expert review, this spec's first draft | The queue shows only the safety marker; the Verdict appears after one full playback; Expert–AI agreement and time to decide are logged and shown to Admins. | D-51 |
| "The AI noticed…" after every decision (V2-Q20) | this spec's first draft | Only on reshoot or reject, never on `approved`. (Itself superseded by D-59, next row.) | D-52 |
| "The AI noticed…" only on reshoot or reject, without timestamps | D-52 | **Superseded:** after every decision, including `approved`, with evidence text and whole-second timestamps as plain text; no player for the Fundi, so no jump. D-50 is unchanged. | D-59 |
| Every user-visible string in EN and SW (D-29); D-59's timestamps shown to the Fundi | D-29, D-59 | Cosmos `evidence` stays English, labelled "AI note in English" (named D-29 exception); no Fundi timestamps until the timestamp eval passes; the Liveness code is redacted from `evidence`; approved-state copy reviewed by `rai-reviewer`. | D-61 |
| A hired Job stays `hired` until the Client closes it | this spec's first draft (§6.1) | Auto-closes to `done` 30 days after `hiredAt`, with a Client notice. | D-53 |
| Kenya DPA: consent lines silent on transfers; DPIA "before V2 goes live" | this spec's first draft (§12) | An EN + SW transfer line in the verification consent and the Client terms; processor agreements on file; the DPIA update gates V8's production deploy, and V9's for location. | D-49 |
| Ward picker data arrives with centroids (V9) | this spec's first draft (§7.2) | V8 imports IEBC ward names for the six first counties; centroids stay in V9. | D-56 |
| Public bar with TELEMETRY; no room for JOBS or the language toggle | MVP header (`00-header-footer`) | JOBS · TRADES · EVIDENCE · COMPANY; TELEMETRY in the COMPANY sheet and footer; a role bar on role routes; the EN \| SW toggle in the menu sheet, footer and desktop header. | D-57 |
| Counts via `@convex-dev/aggregate` | this spec's first draft (§11.0, §16) | Named counter documents; aggregate is not mounted in V2. | V2-25 review (convex S6) |

---

## 19. Glossary changes (in `CONTEXT.md`, marked "V2, proposed" until approval)

- **Client** (changed): a person or business that posts Jobs and hires Fundis; a User is a Client once they create a **Client profile** (ADR-23); one User can be both Fundi and Client.
- **Job** (new): a Client's description of work for one Trade in one place, with an optional Budget. *Avoid:* gig, task (a Rubric term), request, order, booking.
- **Job board** (new): the public list of open Jobs at `/jobs`.
- **Interest** (new): a Fundi's "I'm interested" on an open Job, with an optional short note. *Avoid:* bid, application, proposal, quote.
- **Shortlist / Hire** (new): a Client's marks on Interests; hiring one Fundi closes the Job to the others.
- **Budget** (new): the Client's own price for a Job, "Budget set by the client".
- **Pay-to details** (new): a Fundi's self-declared Pochi la Biashara or Till number and account name. *Avoid:* wallet, account, payment method.
- **Fundi Pro** (new; replaces the old Roadmap item of that name): a Fundi with an active monthly subscription paid to Smart Fundis by STK Push. It buys a WhatsApp link shown to any Client and first place in lists (verified first on Electrical and Solar, D-48), always tagged **"FUNDI PRO · PAID"** (SW "FUNDI PRO · AMELIPIA", D-47); never a Badge, never "verified", never a role. *Avoid:* "Pro" alone in copy (it reads as "professional").
- **Enterprise Pro** (future, `/roadmap` only): a Client subscription for large or many Jobs, including project management. Not in V2.
- **Pro legend** (new): "Pro = paid subscription, not a verification." (SW draft "Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi", R-20.) Shown beside every list with a Fundi Pro result. *Avoid:* featured, top, premium, recommended, verified Pro; in Kiswahili, "usajili".
- **Service area** (new): where a Fundi works: a Location and a radius.
- **Location / Ward / Distance band** (new): §7.1. A Client's Location never holds a point; a Job's point is its ward centroid (D-55). Lists sort by band, never by exact km. *Avoid:* address, pin, GPS.
- **Contact reveal** (new): a Client's logged tap that shows a Fundi's phone, WhatsApp link or Pay-to details (`contact.reveal`, `jobs.revealPayTo`). Needs a Client profile and is capped per Fundi per day (D-46). *Avoid:* unlock, lead, connect fee.
- **Roadmap** (changed): "Client accounts" leaves when V8 ships; "bookings & M-Pesa" becomes "escrow & in-app payment to fundis".
- **Rates** (changed): Budgets follow the same rule: shown with their owner, used as filters, never as a ranking.

---

## 20. Open questions for the operator

V2-Q1, Q2, Q4–Q9 are answered (§2.1), and the V2-25 review answered or narrowed Q20, Q24, Q26 and Q37 (D-45 to D-58). The operator questions that remain open are **V2-Q3, Q11 (now blocking V8 for ward names, D-56), Q35 and Q42** (review §6; Q42's KSh 200 a month is recorded in R6-6, and the review keeps the row open for Spec B's remaining details); they block individual slices, not the slice cut. Rows marked "recommendation" below are still the Architect's proposals.

| # | Question | Recommendation |
| --- | --- | --- |
| V2-Q3 | Test mode for any payment. | Daraja sandbox + "Test mode" tag; on production while in sandbox, only Admins and named testers see payment (Spec B §9). |
| V2-Q10 | Google Maps. | **Closed by Q8:** dropped from V2. If ever reconsidered, counsel must first read ToS §3.2.3(d)(iii) ("listings or directory service"). |
| V2-Q11 | Source for ward names and centroids (names are decided: IEBC, R6-2). **The names part now blocks V8** (D-56); the centroids part blocks V9. | Names: the IEBC ward list (LN 14/2012) for the six first counties, imported in V8. Centroids from the HDX 1,450-ward dataset **if its licence allows** (secondary; licence UNVERIFIED), else OpenStreetMap (ODbL, footer attribution); match them to IEBC ward names; start with Nairobi, Kiambu, Mombasa, Kisumu, Nakuru and Machakos. |
| V2-Q14 | Bucketed response counts on Job cards (amends "no counters")? | Yes, buckets only (§8.4). |
| V2-Q15 | Demo Jobs on `/jobs`? | Yes: tagged "Demo", after real Jobs, no Interests, `noindex`; never on the landing strip. |
| V2-Q16 | Job expiry. | Client picks 7, 14 or 30 days; default 14. |
| V2-Q17 | "The fundi didn't work out"? | Yes, once per Job, within 7 days of hire. |
| V2-Q18 | Must a Fundi have declared the Job's Trade (the operator said "all Fundis may respond")? | **Soft rule:** any Fundi may respond; "Jobs near you" shows declared Trades by default; responding in an undeclared Trade asks "Add Plumbing to your trades?" and adds it. Keeps "all Fundis" and keeps the Trade filter truthful. |
| V2-Q19 | Caps. | 30 live Interests per Job; 20 Interests a day per Fundi; 3 posts a day and 10 a week per Client. |
| V2-Q20 | Show AI Observations to the Fundi after the Expert decides? | **Answered (D-59, superseding D-52's narrowing):** yes, after **every** decision (approved, reshoot, rejected), as "The AI noticed…" with evidence text (English, D-61) and, once the timestamp eval passes, plain-text timestamps (D-61). |
| V2-Q21 | Retention (§12.3). | As §12.3; payment records per Spec B V2-Q28. |
| V2-Q22 | Voluntary ODPC registration and a DPIA update before V2 goes live? | Yes to both (KSh 4,000; I-10, I-15). **The DPIA part is decided (D-49):** the update gates V8's production deploy, and V9's for location. Registration stays the operator's call. |
| V2-Q23 | Notifications. | In-app only in V2; SMS is a separate cost decision. |
| V2-Q24 | Does the `/f/[id]` phone reveal need sign-in? | **Answered: yes** (round 6, tightened by D-46): every reveal needs a Client profile (`requireClient`), and V6's anonymous `visitorKey` reveal is retired in V8. |
| V2-Q25 | What does a Fundi see of the Client before hire? | First name only; full display name once connected. |
| V2-Q26 | Keep the Brev box up around the clock for Job pre-fill? | **Moot (D-58):** V10 is optional and ships only if Brev already runs for video; the keyword map + manual form work without it. |
| V2-Q27 | The licence line on Electrical and Solar? | Yes (I-2). |
| V2-Q33 | Subscribers. | **Answered in rounds 2–3:** Fundi Pro only in V2, STK Push to our own Till; Enterprise Pro for Clients later. |
| V2-Q34 | Free Clients and Call. | **Answered in round 4:** a free Fundi's phone stays tap-to-reveal per ADR-21 for opted-in Fundis, for any Client (a Client profile is required, D-46). |
| V2-Q41 | Ranking order. | **Answered in round 3:** Fundi Pro (verified first) → verified → Demo → not yet verified; **amended by D-48** for Electrical and Solar: verified Pro → verified → Demo → not-yet-verified Pro → not yet verified. |
| V2-Q42 | Fundi Pro price. | **Answered in round 6:** KSh 200 a month. |
| V2-Q43 | Boost on `/fundis` too? | **Answered in round 3:** yes, both `/fundis` and Job responses. |
| V2-Q44 | Who sees a Fundi Pro's WhatsApp in V2? | **Answered in round 4:** any Client (with a Client profile, D-46), until Enterprise Pro exists. |
| **V2-Q35** | Does the operator have a Paybill or Till and M-PESA Org-portal access? | Until yes: sandbox only, with "Test mode". |
| V2-Q36 | Verified-first ordering of Job responses. | **Superseded by V2-Q41** (round 2: subscribers and verified both rank high). |
| V2-Q37 | Must a responding Fundi be Listed? | **Answered: yes** (round 6; the reading was confirmed in the V2-25 review). Responses need a `listings` row; the respond screen offers "Turn on Show my profile". |
| V2-Q38 | Where are Pay-to details shown? | **Answered in round 6:** only to the Client who hired that Fundi; no public Till. |
| V2-Q39 | Does the Pro-only WhatsApp rule cover the V6 WhatsApp button on `/f/[id]`? | **Follows from round 4:** yes. V8 removes V6's WhatsApp button; V11 brings it back for Fundi Pro only. Call for any Client (Fundi opt-in, D-46). |
| V2-Q46 | Does "a Till or Pochi … for an STK push" mean Smart Fundis pushes Client payments into the Fundi's Till? | **Operator-confirmed by default, no objection raised:** no. Clients pay Fundis directly to their Till or Pochi; Smart Fundis' STK Push is only for Fundi Pro into our own Till (ADR-27). |
| V2-Q47 | Is Pay-to required for every Fundi? | **Answered:** required only for Fundis who respond to Jobs; verification-only Fundis are prompted on the dashboard, never blocked, and can still record Assessments and earn Badges. |
| V2-Q40 | May a Client subscribe? | **Answered in round 3:** not in V2; Enterprise Pro is a future `/roadmap` item. |

---

## 21. Proposed slice cut and prerequisites (V2-30 finalises)

Slices are ordered by **explicit prerequisites**, not sprint labels (D-45). Order: **V7 → V8 → V9 → V11 → V10 (optional)** (D-58).

| Order | Slice | Demo at the end | Stories | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | **V7 Dashboards + video analysis** | The dashboard shell (role bar: bottom nav at 360 px, side rail from 1024 px; role switcher in the avatar sheet; notice bell; D-57) for Fundi, Expert and Admin; the Fundi's "My verifications" with statuses, the neutral "Awaiting expert review" line (D-50), reshoot reasons and post-decision AI feedback (EN + SW; "The AI noticed…" after every decision, with English evidence and no timestamps until the eval passes, D-59, D-61); the Expert queue (safety marker only) and a **restyled MVP review** with Observations, timestamp chips, the liveness read, and the Verdict as an AI suggestion after one full playback (D-51); Admin `ops.summary` tiles from counter documents, including Expert–AI agreement (§11.0). V7-1 also fixes the code nits (the `.js` import in `convex/convex.config.ts:2`, typed env for `ADMIN_EMAILS`, `rolesValidator` together with `users.me`). | US-8.18, 8.26 (shell), 8.27, 8.28, 8.29 (ops part) | **The MVP V1 stub** (stub worker and canned callbacks); the real AI pipeline (V2) is **not** required, because V7 only displays stored fields (D-45). V4 (Admin) for `/admin/ops`. |
| 2 | **V8 Clients and Jobs core** | A Client signs up (18+, bilingual terms with the transfer line) and posts a Job (county → sub-county → ward from the **imported IEBC ward names** + landmark; Publish restates what goes public); it shows on `/jobs` and the landing strip; a Listed Fundi with Pay-to details sends an Interest; the Client taps Call on an opted-in Fundi through `contact.reveal` (`requireClient`, per-Fundi cap), shortlists and hires; the Client sees the Fundi's Pay-to details; an Admin removes a reported Job; hired Jobs auto-close after 30 days; Demo Clients and Jobs seeded; the **Client dashboard** joins the shell. **Responses sort verified-first** ("Verified first"; D-24) until V11. No Pro copy in any V8 string. | US-8.1, 8.2, 8.4–8.7, 8.9–8.12, 8.13 (Call part), 8.14–8.17, 8.19, 8.21, 8.23–8.25, 8.26 (Job notices), 8.30 | V7; **V6 core (Listings)**; V2-Q11 names part (IEBC ward list for the six first counties, D-56); native-speaker sign-off on consent strings before merge (R-20). **Production deploy gated** on the DPIA update, processor agreements on file and the breach runbook (D-49). |
| 3 | **V9 Proximity** | "Where I work" with device location and the geolocation states (§7.2); "near me" on `/jobs`, `/fundis` and "Jobs near you", sorted by band, one-shot with "Refresh"; bands in responses; **ward centroids** for the six first counties; `@convex-dev/geospatial` behind `ProximityIndex`, with the ring-search fallback. | US-8.8, 8.20, 8.22 | V8; V2-Q11 centroids part; **`convex-expert` confirms D-54 in V9's first ticket**. **Production deploy gated** on the DPIA update for location (D-49). |
| 4 | **V11 M-Pesa + Fundi Pro (sandbox)** | A Fundi subscribes to Fundi Pro by STK Push in Test mode; the Pro tiers switch on in responses, `/fundis` and `/f/[id]` with the "FUNDI PRO · PAID" tag button and legend (verified first on Electrical and Solar, D-48); any Client sees "Chat on WhatsApp" for them through `contact.reveal`; the 10-day renewal reminder fires (Spec B). | US-8.13 (WhatsApp part), 8.31, 8.32, Spec B US-9.x | V8 (V9 is not required, but comes first in order); V2-Q3, V2-Q35 for anything beyond sandbox. Production deploy gated on the payments DPIA update (Spec B). |
| 5 (optional) | **V10 Job pre-fill** | Nemotron Job pre-fill via the dedicated parse lane (`/ai/claim-parse`, `AI_PARSE_SECRET`, heartbeat); the "Trade kept" tile split by language. **Cut unless Brev already runs for video** (D-58). | US-8.3, 8.29 (pre-fill tile) | V8; the real AI pipeline (V2) running on Brev; gpu-devops' p95 parse-latency measurement while Cosmos is busy; the self-hosted Nemotron client ticket (D-32). |

**V8 also carries these migrations and chores** (V2-30 writes them as tickets):
- **The V6 reveal migration** (D-46): retire the anonymous `contact.reveal({ …, visitorKey })` and the `contactReveals` table and cron; ship the `requireClient` `contact.reveal`; move the per-Fundi cap onto `revealFor`.
- **Remove the V6 WhatsApp button** on `/f/[id]` (it returns in V11, Pro-only).
- **The IEBC ward-name import** for Nairobi, Kiambu, Mombasa, Kisumu, Nakuru and Machakos (D-56).
- **The 18+ backfill** prompt for existing Fundis and Experts, with uploads blocked until they confirm (rai S9).
- **The listings re-tier migration** (`tier`, renamed indexes; order unchanged while `subscriber` is false).
- **The privacy notice** with the lawful basis per purpose, and the manual deletion runbook (§12.4).

**Until V11 ships:** no "Pro" tag, legend, Subscribe button, Pro copy or WhatsApp link appears anywhere; `listings.subscriber` is false for everyone, so the five-tier `sortKey` gives exactly today's order (D-24), and V8's response list reads "Verified first"; contact is the Call reveal only.

The smallest demo of the marketplace loop is **V8**; the smallest demo of the V2 dashboards is **V7**.

---

## 22. Out of scope for V2

- escrow; holding, splitting or passing on money between Client and Fundi; deposits; wallets; payouts (Spec B)
- in-app chat or messaging: **a later phase, subscribers only** (on `/roadmap`); WhatsApp is outside the app; SMS or email notifications
- **Enterprise Pro** (Client subscription for large or many Jobs, including project management): `/roadmap` only
- AI voice communication for searching (a later phase for subscribers, on `/roadmap`, not live)
- any way for a Fundi to see or reach a Client's phone number or WhatsApp
- price amounts on Interests (quotes), unless the operator adds them later under ADR-26
- reviews, ratings, stars (I-16 rules are ready if a later version adds them)
- bookings with calendars and time slots
- any map; Google Maps Platform or any geocoder, and any `GeoProvider` interface until a real provider exists
- `@convex-dev/aggregate` (named counter documents instead)
- boosts or featured placement for **Jobs**; paid placement for Fundis other than the tagged Fundi Pro tier (ADR-28); any Pro mark that resembles a skill Badge
- more than one hire per Job; team Jobs
- AI on Job photos, AI ranking or recommending people, AI moderation
- OTP phone verification (Pilot)
- self-serve account deletion (retention crons cover Job data; deletion requests go through the manual runbook via info@, §12.4)
- a price filter on `/fundis`; free-text search on `/jobs`
- ward names and centroids for all 47 counties (V8 imports names and V9 adds centroids for six counties; they grow after V9)
- any Verdict hint to a Fundi before the Expert decides (D-50); a video player or jump-to-moment for the Fundi (pending an Architect decision, D-59)
- a Job pre-fill that needs its own always-on Brev box (V10 ships only if Brev already runs for video, D-58)

---

## 23. Proposed `AGENTS.md` changes (the operator applies them; the Architect does not edit `AGENTS.md`)

Covers both V2 specs. Updated with the V2-25 review's §5 proposals (D-32, D-46, D-48).

```diff
@@ Working rules
-4. No secrets in `web/` or in Convex client code. `NVIDIA_API_KEY` lives only on the Brev box.
+4. No secrets in `web/` or in Convex client code. `NVIDIA_API_KEY` lives only on the Brev box, and is needed
+   only while the hosted NVIDIA fallback exists (D-32). `AI_PARSE_SECRET`, the Daraja keys (`DARAJA_*`) and any
+   future geo-provider key live only in the Convex deployment env (`convex env set`) and the root `.env` (D-13)
+   (`AI_PARSE_SECRET` also on the Brev box), never under a `NEXT_PUBLIC_` name.
@@ Skills by role (table)
+| mpesa | `convex:design`, `convex:convex-authz`, `convex:crons`, `convex:test`, `convex:env`, `mattpocock-skills:tdd`, `superpowers:verification-before-completion`, `mpesa-daraja` (project skill, once written) |
@@ Folder ownership (table)
-| `convex/` | convex, auth (`auth.config.ts`, `users.ts`) | read |
+| `convex/` | convex, auth (`auth.config.ts`, `users.ts`), mpesa (`convex/payments/`) | read |
+  (mpesa gives UI suggestions for payment screens; frontend alone writes `web/`)
@@ Non-negotiables
-- Nothing may look live that isn't. Post-MVP features appear only on `/roadmap`, tagged "Coming soon".
+- Nothing may look live that isn't. A feature appears outside `/roadmap` only in the release that ships it;
+  everything else stays on `/roadmap`, tagged "Coming soon". While M-Pesa runs on the Daraja sandbox, every
+  payment surface shows "Test mode".
+- Smart Fundis never holds, stores or passes on money between a Client and a Fundi. Clients pay Fundis directly
+  (the Fundi's own Pochi or Till, or cash). M-Pesa STK Push is used only for Smart Fundis' own fees (ADR-27).
+- Exact locations are never shown or returned: only county, sub-county, ward and distance bands (ADR-25). No AI
+  ranks, scores or recommends a person; price is a filter, never a rank (ADR-26).
+- Fundi Pro (a paid subscription) may rank first only with the "FUNDI PRO · PAID" tag ("FUNDI PRO · AMELIPIA")
+  on every boosted result and on `/f/[id]`, and the legend "Pro = paid subscription, not a verification" (D-47).
+  On Electrical and Solar, verified comes first (D-48). It never creates or implies a Badge, never uses "Verified
+  by Smart Fundis", the ✓ or the amber tick, and the "Verified only" chip always filters to verified (ADR-28).
+- A Client's phone number and WhatsApp are never shown to a Fundi. Every reveal of a Fundi's phone, WhatsApp or
+  Pay-to details needs a Client profile and is capped per Fundi per day (D-46); reveals are logged mutations,
+  never a query result or HTML (ADR-21, ADR-24).
+- Before the Expert decides, the Fundi sees only "Awaiting expert review", whatever the AI said (D-50).
```

A new agent file `.claude/agents/mpesa.md` is drafted alongside this spec (Spec B §11).
