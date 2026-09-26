# Open questions

The questions are ranked by how much they block.

1. **What are the start time and the submission deadline?** The start is either 09:00 Nairobi or 11:00 (Tunis clock). This turns the H+3 prod promotion and the H+4 freeze into clock times. The freeze should come before the submission and pitch. *Blocks the Sunday timeline.*
2. **Who's on the team, and what does each person own?** The owner is the Architect. Lane A (web and Convex) and lane B (Brev and AI) need names, and a possible third person would do QA, the seed and the demo video. *Blocks lane assignment.*
3. **How many Brev credits does each team get?** This is announced on Sunday. *Affects whether 2B runs in the eval.* **Partly answered:** the operator already has a Brev account with credits, enough to start V0 ticket 7. The amount per team is still announced on Sunday.
4. **What is the exact Nemotron model id** on build.nvidia.com on the day? **Answered (2026-09-25, #9 live smoke):** `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` (the operator's `NEMOTRON_MODEL`) returned valid structured JSON. The library flags it as "not known to support structured output", so see R-14. The documented structured-output alternatives are `nvidia/nemotron-3-nano-30b-a3b` and `nvidia/nemotron-3-super-120b-a12b`.
5. **Who are the first two Experts** for the demo, with their names and Trades? For the demo they can be team members, disclosed as such.
6. **Do you own a domain?** If so, set up the Clerk prod instance and DNS before Sunday and disclose it. Otherwise the demo runs on the Clerk development instance.
7. **Should Convex plugin telemetry be turned off** (`CONVEX_PLUGIN_TELEMETRY=0`)? The recommendation is yes.

## Version 2 marketplace and payments (2026-09-26)

Specs: `docs/superpowers/specs/2026-09-26-v2-marketplace-design.md` (§2.1, §20) and `docs/superpowers/specs/2026-09-26-v2-payments-design.md` (§2.1, §14). Each open row gives the Architect's recommendation. **Sprints (operator, 2026-09-26):** this sprint = V7 dashboards + video-analysis surfaces, V8 Clients and Jobs; next sprint = V11 M-Pesa + Fundi Pro. **Replaced by explicit prerequisites (D-45)** and the slice order V7 → V8 → V9 → V11 → V10 (optional, D-58), per `docs/reviews/v2-architecture.md`.

### Answered by the operator (2026-09-26, three rounds)

| # | Question | Answer |
| --- | --- | --- |
| V2-Q1 | One spec or two? | Two: marketplace + payments. |
| V2-Q2 | How does money move? | Direct pay only: the Client pays the Fundi's own M-Pesa Pochi la Biashara or Till. Smart Fundis never holds the money. Fundis may add their Pochi/Till number to their profile, labelled self-declared. |
| V2-Q4 | How do Fundis respond? | "I'm interested" + a short note, no price amount. WhatsApp outside the app; no in-app chat in V2. |
| V2-Q5 | Who may respond? | All Fundis, not only verified ones. |
| V2-Q6 | Public board? | `/jobs`, a landing "Latest jobs" strip, a JOBS header tab; coarse location; sign in to post or respond; shown only once shipped. |
| V2-Q7 | Client role? | Derived through a Client profile; dual Fundi + Client allowed; no responding to your own Job; `/dashboard` switcher. |
| V2-Q8 | Location? | "Near me" = the phone's location (`navigator.geolocation`), snapped to ~1 km; no Google (keep a `GeoProvider` interface); typed location = county → sub-county/ward picker + landmark; bands only. **Amended (V2-25 review):** no `GeoProvider` interface until a real provider exists. |
| V2-Q9 | M-Pesa agent scope? | Payment backend and contracts only; no UI; gives UI suggestions to frontend. |
| V2-Q33 | Subscriptions? | Yes: **Fundi Pro**, paid by STK Push to Smart Fundis' own Safaricom Till (operator provides it; sandbox + "Test mode" until then). Buys the WhatsApp link, first place in lists, later AI voice search (roadmap). Only Fundi Pro in V2; **Enterprise Pro** for Clients (large or many Jobs, project management) is a future `/roadmap` item. |
| R2-4 | Client contact details? | A Client's phone number and WhatsApp are never shown to Fundis. |
| R2-5 | In-app chat? | Later phase, subscribers only (roadmap). |
| V2-Q41 | Ranking? | Fundi Pro first, verified or not (within Pro, verified first) → verified → Demo → not yet verified. Tag "Fundi Pro" + legend "Pro = paid subscription, not a verification"; "Verified only" chip kept. |
| V2-Q43 | Where does the boost apply? | Both `/fundis` and Job responses. |
| V2-Q40 | May Clients subscribe in V2? | No; Enterprise Pro is future. |
| V2-Q10 | Google Maps? | Dropped (V2-Q8). |
| V2-Q36 | Verified-first responses? | Superseded by V2-Q41, and for Electrical and Solar by D-48 (verified first there). |
| V2-Q34 | Can a free signed-in Client call a Fundi? | Yes: a free Fundi's phone stays tap-to-reveal per ADR-21 for opted-in Fundis, for any signed-in Client (round 4). |
| V2-Q44 | Who sees a Fundi Pro's WhatsApp link in V2? | Any signed-in Client (Client → Fundi only). Strict subscriber-to-subscriber contact only once Enterprise Pro exists (round 4). |
| V2-Q39 | Does that cover the V6 WhatsApp button on `/f/[id]`? | Yes: WhatsApp only for a Fundi Pro, shown to any signed-in Client; Call for opted-in Fundis (follows from round 4). |
| R4-2 | Fundi Pro renewal? | Monthly; manual STK Push to Smart Fundis' Till; an in-app reminder 10 days before it lapses (round 4). |
| Scope | Sprint order? | This sprint: V7 dashboards + NVIDIA video-analysis surfaces, V8 Clients and Jobs. Next sprint: V11 M-Pesa + Fundi Pro. No "Pro" UI before V11 (round 5). **Superseded by D-45:** explicit prerequisites; order V7 → V8 → V9 → V11 → V10 (optional). |
| V2-Q42 | Fundi Pro price? | KSh 200 a month (round 6). |
| V2-Q24 | Phone reveal needs sign-in? | Yes, signed-in users only (round 6). Confirmed by D-46: every reveal needs `requireClient`, and V6's anonymous `visitorKey` reveal is retired. |
| V2-Q37 | Must a responding Fundi be Listed? | Yes (round 6, reading of "also for fundi, yes"); confirmed by the V2-25 review (convex S9). |
| V2-Q20 | Show AI Observations to the Fundi after the decision? | Narrowed: "The AI noticed…" only on a reshoot or reject decision, never on an approved Assessment, in V2 (D-52, V2-25 review). |
| V2-Q26 | Keep Brev up 24/7 for Job pre-fill? | Moot: V10 is last and optional, cut unless Brev already runs for video (D-58). |
| V2-Q38 | Where are Pay-to details shown? | Only to the Client who hired that Fundi; no public Till (round 6). |
| R6-1 | Pay-to details? | Required only for Fundis who respond to Jobs, not to register; verification-only Fundis are prompted, never blocked (V2-Q47). |
| V2-Q46 | Does "for an STK push" mean Smart Fundis pushes Client payments into the Fundi's Till? | No: Clients pay Fundis directly; our STK Push is only for Fundi Pro. Operator-confirmed by default, no objection raised. |
| V2-Q47 | Pay-to required for every Fundi? | Only for Fundis who respond to Jobs. |
| R6-2 | Ward names? | IEBC ward names (round 6). |
| R6-5 | Portfolio? | Fundis can show their Portfolio and Smart Fundis recommends it (round 6). |

### Open (ranked by how much they block)

| # | Question | Recommendation | Blocks |
| --- | --- | --- | --- |
| V2-Q18 | Must a Fundi have declared the Job's Trade? | Soft rule: respond anyway and confirm adding the Trade to the profile. | V8 |
| V2-Q35 | Till number and M-PESA Org-portal access. | The operator provides the Till; until it and a Business Administrator exist: sandbox + "Test mode". | V11 go-live |
| V2-Q3 | Test-mode rules. | Sandbox + tag; on production in sandbox, only Admins and named testers can pay. | V11 |
| V2-Q11 | Source of ward **centroids** (names are IEBC, decided in round 6)? | HDX 1,450-ward dataset if its licence allows, else OpenStreetMap (ODbL attribution); six counties first. The IEBC ward-name import moves into V8 (D-56). | V8 |
| V2-Q14 | Bucketed response counts on Job cards? | Yes, buckets only. | V8 |
| V2-Q15 | Demo Jobs on `/jobs`? | Yes, tagged, after real Jobs, no Interests, never on the landing strip. | V8 |
| V2-Q16 | Job expiry? | 7/14/30 days, default 14. | V8 |
| V2-Q17 | "The fundi didn't work out"? | Once per Job, within 7 days. | V8 |
| V2-Q19 | Caps? | 30 Interests per Job; 20 a day per Fundi; 3 posts a day, 10 a week per Client. | V8 |
| V2-Q21 | Retention periods? | As marketplace spec §12.3. | V8 |
| V2-Q22 | Voluntary ODPC registration + DPIA update? | Yes to both before V2 goes live. | launch |
| V2-Q23 | Notifications? | In-app only in V2. | V8 |
| V2-Q25 | What does a Fundi see of the Client? | First name before hire; full display name after; never the phone or WhatsApp. | V8 |
| V2-Q27 | EPRA licence line on Electrical and Solar? | Yes. | V8 |
| V2-Q13 | Fundi Pro refund policy? | Not refundable once started; double charges refunded manually. | V11 |
| V2-Q28 | Payment record retention for tax? | Ask the accountant; clear the full MSISDN after 90 days. | V11 go-live |
| V2-Q29 | VAT / eTIMS on Fundi Pro? | Ask an accountant; stay in sandbox until answered. | V11 go-live |
| V2-Q30 | Legal sign-off on the CBK stance and the Pro copy? | Yes, before `DARAJA_ENV=production`. | V11 go-live |
| V2-Q31 | Till or Paybill? | Till (the operator is providing one). | V11 go-live |
| V2-Q32 | Approve the `mpesa` agent and `mpesa-daraja` skill? | Yes, listed in AGENTS.md when V11 is sliced. | V11 |
| V2-Q45 | Email renewal reminders for Fundi Pro? | Not in V2 (in-app only). If wanted, pick an email provider as a separate decision; Clerk's support for custom transactional email is UNVERIFIED. | V11 |
| V2-Q48 | Self-hosted Nemotron client (D-32): who builds the vLLM-served LangChain chat model that replaces `ChatNVIDIA`? | **Answered in V2-30:** a scope item in the MVP brief `planning/slices/V2.md` (gpu-devops + ai-pipeline), because the real Verdict needs it; V10 is blocked by it. `NVIDIA_API_KEY` stays only while the hosted fallback exists. | MVP V2 |
| V2-Q49 | Does Daraja STK Query work without a stored CheckoutRequestID? UNVERIFIED. | Check against the Daraja docs and sandbox in V11's first ticket (V11-1); if not, a callback with no stored ID is never settled (R-40). | V11-1 |
| V2-Q50 | Do Convex logs record HTTP action path tokens (the per-payment callback token)? UNVERIFIED. | Check in V11's first ticket; if they do, move the token out of the path. | V11 |
| V2-Q51 | Does `@convex-dev/geospatial` `nearest()` with `filterKeys: { scope, tier }` meet the proximity needs (D-54)? | `convex-expert` confirms in V9's first ticket; otherwise the precision-5 ring search behind `ProximityIndex`. | V9 |
| V2-Q52 | Parse p95 latency on Brev while Cosmos is busy? | gpu-devops measures it before V10 is cut; V10 is cut if the 15 s cap can't be met (D-58). | V10 |
