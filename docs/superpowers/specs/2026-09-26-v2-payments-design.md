# Smart Fundis — Version 2 Payments design (direct pay to the Fundi; M-Pesa only for our own fees)

- **Status:** draft, 26 Sep 2026, **awaiting operator approval**. Part A (direct pay) is **operator-decided** (V2-Q2). Part B (**Fundi Pro**, a monthly Fundi subscription paid by M-Pesa STK Push to Smart Fundis' own Till, renewed manually with a reminder 10 days before it lapses) is **operator-decided in rounds 2–4** (2026-09-26). Price: **KSh 200 a month** (operator round 6). Nothing is built until V2-25 passes.
- **Schedule** (D-45, D-58): slices run **V7 → V8 → V9 → V11 → V10 (optional)**. V7 (dashboards and video-analysis surfaces) builds on the MVP V1 stub; V8 (Clients and Jobs) needs the V6 core. **Part A** (Pay-to details, no money handling) ships with V8. **Part B** is **V11 "M-Pesa + Fundi Pro (sandbox)"**, after V9; until it ships, no "Pro" tag, legend, Subscribe button or WhatsApp link appears anywhere, V8 ships its strings without Pro, ranking stays verified-first (D-24), and contact is the Call reveal through `requireClient` `contact.reveal` (D-46).
- **Extends:** `docs/superpowers/specs/2026-09-26-v2-marketplace-design.md` ("Spec A"). Spec A §9.2 defines the Pay-to details; §10 is the pointer to this spec.
- **ADRs (proposed):** ADR-27, "Clients pay Fundis directly; M-Pesa is used only for Smart Fundis' own fees; no escrow" (`docs/adr/0027-mpesa-own-fees-only-no-escrow.md`), and ADR-28, "Paid subscription and a labelled ranking boost" (`docs/adr/0028-paid-subscription-and-ranking-boost.md`).
- **Owner:** the new **mpesa** role (`.claude/agents/mpesa.md`, drafted with this spec) owns the payment backend and contracts: `convex/payments/`, the Daraja callback HTTP action and the payment tables. It **does not own UI**; it gives UI suggestions to frontend, the sole owner of `web/` (operator Q9). **convex** keeps `convex/schema.ts` and `convex/http.ts` and imports the payment pieces. Part A's Pay-to fields live on `fundiProfiles` and belong to **convex** (Spec A §15).
- **Research used:** `docs/research/2026-09-26-kenya-domain-research.md` §5 (F5.1–F5.11, I-8, I-9) and live research on 2026-09-26: no credible Daraja SKILL.md exists on skills.sh (all 1–2 installs); Daraja MCP servers are community-built (the safest, `jackscodevault/mpesa-daraja-mcp`, only searches docs); `@kepas/daraja-js` 1.6.3 (2026-09-17) is the strongest TypeScript library but young; Safaricom's `mpesa-node` was last published in 2018; the Daraja portal has no `llms.txt` or `openapi.json` (both 404) and did not render for the Architect's fetcher. **Every Daraja field below that is not in KR F5.1–F5.6 is marked UNVERIFIED** and must be confirmed from the portal when the `mpesa-daraja` skill is written (§11.2).
- **Package manager:** pnpm (D-12). Secrets: the Convex deployment env and the repo-root `.env` only (D-13).

---

## 1. Problem

Clients and Fundis in Kenya settle small jobs by M-Pesa or cash. A marketplace would normally take the Client's money and release it when the job is done ("escrow"). That is regulated: a person "sending, receiving, storing or processing of payments" for others may be a payment service provider that needs Central Bank of Kenya authorisation, and operating without it is an offence (fine up to KSh 500,000 and/or 3 years; NPS Act s.2, s.12; KR F5.8–F5.9). An authorised PSP must keep customer money in a trust, never commingled (NPS Regulations 2014 r.25(3); F5.10). Whether our own Paybill holding Client money for a Fundi counts is UNVERIFIED and needs counsel (F5.11). None of the Kenyan competitors checked says it holds Client money (N1.4).

Separately, the operator wants a paid **Fundi Pro** subscription (rounds 2–3) that buys the WhatsApp link and first place in lists (verified first on Electrical and Solar, D-48), tagged "FUNDI PRO · PAID" (D-47). That needs a way for Smart Fundis to be paid for its **own** service.

## 2. Solution

### Part A — direct pay (operator-decided, V8)

- The Client pays the Fundi **directly**: to the Fundi's own **Pochi la Biashara** or **Till** number, or in cash. Smart Fundis never receives, holds, splits or pays out that money.
- A Fundi adds **Pay-to details** (Pochi or Till, plus the M-Pesa account name), labelled **self-declared** (Spec A §9.2).
- **Required only to respond to Jobs**, not to register (V2-Q47): verification-only Fundis are prompted, never blocked. Only the Client who hired that Fundi sees them, through a logged reveal (operator round 6): `contact.reveal({ channel: "pay_to", jobId })`, resolved through `job.hiredInterestId` and counted in the per-Fundi daily cap (D-46). A Pochi number is the Fundi's phone number, so the Pay-to form warns the Fundi; neither is ever public.
- No Daraja API is involved in Part A. It is profile data plus copy plus guards.

### Part B — Smart Fundis' own subscription fee (operator-decided in rounds 2–4, V11)

- **M-Pesa Express (STK Push)** collects a **subscription** into **Smart Fundis' own Safaricom Till** (or Paybill); the operator will provide the Till number. This is Smart Fundis selling its own service, not handling third-party money.
- **Fundi Pro** (the only V2 subscription): the WhatsApp link (Spec A §12.1, V2-Q44) and **first place** in Job responses and Find a fundi, except on **Electrical and Solar**, where verified comes first and Pro is tagged within each tier (D-48). Always tagged **"FUNDI PRO · PAID"** / **"FUNDI PRO · AMELIPIA"**, a 48 px button that opens the US-8.32 explanation, on results and on `/f/[id]` (D-47), with the legend "Pro = paid subscription, not a verification" (ADR-28). Later phases on `/roadmap`: subscriber-only in-app chat and AI voice search; these are **never** listed as Fundi Pro benefits. **Never** a Badge, "Verified by Smart Fundis", the ✓ or the amber tick.
- **Enterprise Pro** (a future Client subscription for large or many Jobs, including project management) is a `/roadmap` item only. Not built in V2 (operator round 3).
- **Period and renewal** (operator round 4): **monthly** (30 days per payment), renewed by a **manual STK Push** to Smart Fundis' Till; a **renewal reminder 10 days before it lapses**, and a notice on the day it lapses. No auto-debit (a Daraja recurring-mandate API could not be confirmed, UNVERIFIED). **Price:** KSh 200 a month (operator round 6).
- **Who sees a Fundi Pro's WhatsApp** (operator round 4): any Client, in V2, through `contact.reveal` with `requireClient` and the per-Fundi daily cap (D-46). Strict subscriber-to-subscriber contact starts only when Enterprise Pro exists.
- **Sandbox first.** Every payment surface shows **"Test mode — no real money"** until a real Till or Paybill and an M-PESA Org-portal Business Administrator exist (F5.6, V2-Q35) and the operator switches `DARAJA_ENV` to `production`.
- **Async by design:** `ResponseCode 0` from the STK request means only "accepted, pending". The payment settles **only** on a callback with `ResultCode 0`, or a reconciliation query that says the same; a late callback, or one for a payment with no stored `checkoutRequestId`, also needs a confirming STK Query (§4.3, §7). `ResultCode 1032` means the customer cancelled (F5.2, I-9).
- **Ranking only from production money:** on `prod`, only `mode: "production"` subscriptions set `listings.subscriber` (review rai S1).

### 2.1 Operator decisions table

| # | Topic | Answer | Status |
| --- | --- | --- | --- |
| V2-Q2 | Money | **Direct pay only**, to the Fundi's Pochi or Till. Smart Fundis never holds the money. Fundis may add their Pochi or Till number to their profile, labelled self-declared. Platform fees by STK Push are **not** confirmed. | **operator-decided, 2026-09-26** |
| V2-Q3 | Test mode | Daraja sandbox, a visible "Test mode" tag on every payment surface; on the production deployment while in sandbox, only Admins and named testers see a pay sheet (§9). | proposed, operator to confirm |
| V2-Q9 | Owner | The mpesa agent owns the payment backend and contracts; no UI; gives UI suggestions to frontend. | **operator-decided, 2026-09-26** |
| R2-2 | Subscription payment | Paid to Smart Fundis by **STK Push to Smart Fundis' own Safaricom Till** (or Paybill); the operator provides the Till; sandbox + "Test mode" until then. | **operator-decided, round 2** |
| R3-3 | Who subscribes | Only **Fundis** (Fundi Pro) in V2. Enterprise Pro for Clients is roadmap. | **operator-decided, round 3** |
| R3-1 | Ranking | Fundi Pro first (verified Pro first), then verified, Demo, not yet verified; boost on `/fundis` and Job responses (R3-2). **Electrical and Solar:** verified Pro → verified → Demo → not-yet-verified Pro → not yet verified (D-48). | **operator-decided, round 3; D-48 in the V2 review** |
| D-47 | Pro tag | "FUNDI PRO · PAID" / "FUNDI PRO · AMELIPIA", a 48 px button opening US-8.32, also on `/f/[id]`; SW legend drops "usajili" (native-speaker check, R-20). | **operator-decided, V2 review** |
| R2-6 | What a Fundi subscription buys | WhatsApp link; higher ranking in Job responses and Find a fundi; later, AI voice search (roadmap, never listed on the pay sheet). | **operator-decided, round 2** |
| R4-1 | WhatsApp visibility | A Fundi Pro's WhatsApp link is shown to any Client (a Client profile, D-46) in V2; free Fundis stay Call-by-opt-in (ADR-21); a Client's number and WhatsApp are never shown to Fundis. | **operator-decided, round 4** |
| R4-2 | Renewal | Monthly, manual STK Push to Smart Fundis' Till, reminder 10 days before lapse. | **operator-decided, round 4** |
| R6-6 | Fundi Pro price | KSh 200 a month. | **operator-decided, round 6** |
| R6-1 | Pay-to details | Required only to respond to Jobs (V2-Q47); Clients pay the Fundi directly (V2-Q46). | **operator-decided** |
| V2-Q35 | Paybill/Till and Org-portal access | Does the operator have them? Default: sandbox + "Test mode". | **open** |

More payment questions are in §14.

---

## 3. User stories

Group **9**.

| ID | Story | Acceptance criteria |
| --- | --- | --- |
| US-9.1 | As a **Fundi**, I want clients to pay me directly. | Spec A US-8.21: Pochi or Till + account name, required to respond to Jobs (not to register), shown only to the Client who hired me, "Set by the fundi — not verified". |
| US-9.2 | As a **Client**, I want to know how to pay the Fundi I hired, and that Smart Fundis isn't involved. | After hire: the Pay-to details (Spec A US-8.14) with the name-check line, and "Pay the fundi directly, by M-Pesa or cash, when you agree. Smart Fundis doesn't hold or handle this payment." (EN + SW). |
| US-9.3 | As a **Fundi**, I want to see the Fundi Pro price before I pay. | "Get Fundi Pro" opens a pay sheet: price, period ("30 days"), what it unlocks ("Clients can open your WhatsApp in one tap" and "You appear above fundis without Fundi Pro in job responses and in Find a fundi, tagged 'FUNDI PRO · PAID'"; on Electrical and Solar, "verified fundis still come first", D-48), what it doesn't ("It never gives you a badge or makes you 'verified'. Only an Expert-approved video does that."), the refund line (§8.3), the M-Pesa number (default `users.phone`; another number needs a confirm step), and **Pay with M-Pesa** / **Cancel**. **Never** lists in-app chat or AI voice search (roadmap only). In sandbox: "Test mode — no real money". Nothing is charged without the tap (Consumer Protection Act s.31, KR F6.14). |
| US-9.4 | As a **Fundi**, I want the M-Pesa prompt on my phone. | "Check your phone and enter your M-Pesa PIN", updating live: **Paid** → "You're Fundi Pro until <date>"; **Cancelled** → "Payment cancelled"; **Failed** → a plain reason and **Try again**. |
| US-9.5 | As a **Fundi**, I want never to be charged twice by tapping twice. | While a subscription payment is `created`/`pending`, a second tap returns the same payment and sends no second prompt. |
| US-9.6 | As a **Fundi**, I want an answer even when M-Pesa is slow. | No callback within 90 s → status queries (up to 3 over 15 minutes), then "We didn't get a confirmation from M-Pesa. If money left your account, email info@smartfundis.com with your M-Pesa code." |
| US-9.7 | As a **Fundi**, I want receipts and a renewal reminder. | "My payments" lists each payment (amount, M-Pesa receipt, date, period). **10 days before Fundi Pro lapses**, an in-app notice "Your Fundi Pro ends on <date>. Renew with M-Pesa" with a **Renew** button (one tap opens the pay sheet); another notice on the day it lapses. Channel: **in-app** (the only notification channel in the V2 specs). Email is not sent in V2: Clerk's emails serve sign-in flows, and whether Clerk can send custom transactional email is UNVERIFIED, so an email reminder needs an email provider (V2-Q45). No automatic renewal. |
| US-9.8 | As an **Admin**, I want to see and fix payments. | `/admin/payments` (plain shadcn): newest first with status, amount, masked phone, receipt, mode, "refund due". Actions: "Check with M-Pesa now", "Record refund" (Org-portal reference + reason), "Set subscription price". Each writes `auditLog`. |
| US-9.9 | As the **operator**, I want to switch payments off instantly. | `PAYMENTS_ENABLED=false` hides every Subscribe button and pay sheet. Existing subscriptions run to their end date. |
| US-9.11 | As a **Client**, I want paid placement to be obvious. | Every Fundi Pro result, and `/f/[id]`, shows the "FUNDI PRO · PAID" tag ("FUNDI PRO · AMELIPIA" in SW), a 48 px button that opens the US-8.32 explanation; the list shows "Pro = paid subscription, not a verification" (Spec A §8.4a, US-8.32; D-47). On Electrical and Solar, verified Fundis come first (D-48). |
| US-9.10 | As the **platform**, I want payment rules enforced on the server. | The convex-test suite in §13 passes. |

---

## 4. Flows (Part B)

### 4.1 STK Push, happy path

```
Browser (Fundi)            Convex mutation            Convex action (default runtime)        Daraja               Phone
───────────────            ───────────────            ────────────────────────────────        ──────               ─────
Pay with M-Pesa ─────────▶ payments.startSubscription
                           requireFundi; enabled;
                           allowed in this mode (§9);
                           no created/pending payment
                           for this user+purpose
                           insert payments{created,
                             callbackTokenHash, idem}
                           schedule daraja.stkPush ──▶ GET oauth token (Basic key:secret) ─▶ 200 {access_token, 3600 s}
                                                      POST stkpush/v1/processrequest ──────▶ 200 {ResponseCode "0",
                                                                                              MerchantRequestID,
                                                                                              CheckoutRequestID}
                           payments.markPending ◀──── (internal mutation)                                   ──▶ PIN prompt
"Check your phone…"  ◀──── status pending (reactive)
                                                                                                             PIN entered
                           HTTP action POST /payments/stk-callback/<token> ◀──────────── callback {ResultCode 0, …}
                           payments.applyResult (internal mutation):
                             token hash → payment; CheckoutRequestID matches;
                             Amount == amountKsh; receipt unused
                             payment → paid; subscriptions.extend (+30 days)
                             → syncListing(fundi) (Pro tier + "FUNDI PRO · PAID" tag;
                               on prod only if mode = "production")
"Subscribed until …" ◀──── (reactive)                                                             200 ack ─▶
```

### 4.2 No callback: reconciliation

```
cron payments.reconcile (every 1 min)
  └─ pending payments with requestedAt < now − 90 s, queryCount < 3, nextQueryAt due
       └─ schedule daraja.stkQuery(paymentId) ──▶ POST stkpushquery (UNVERIFIED path, §6.1)
            ├─ ResultCode 0      → payments.applyResult(source: "query") → paid
            ├─ ResultCode 1032   → cancelled
            ├─ other final code  → failed
            └─ still processing / network error → queryCount + 1, next at +3 min, then +5 min
  └─ pending payments with requestedAt < now − 15 min → expired
  └─ created payments older than 2 min (the STK request never returned) → expired   (batches of 50)
```

### 4.3 A late callback

A callback after the payment became `expired`, `failed` or `abandoned` settles **only on a confirming STK Query** (callbacks are unsigned): `payments.applyResult` records the callback, schedules `daraja.stkQuery`, and settles only if the query also says `ResultCode 0`. Because money has moved, the payment then becomes `paid` with `late: true` and the subscription is extended by its period. If the same User already has another payment `paid` within the previous 10 minutes for the same purpose (a double charge), the later one also gets `refundDue: true` and appears in the Admin queue (§8.3); the extension still applies until an Admin records the refund, which removes it.

---

## 5. The payment state machine (Part B)

| From | To | By | Checks | Side effects |
| --- | --- | --- | --- | --- |
| (new) | `created` | `payments.startSubscription()` (Fundi) | `requireFundi`; `PAYMENTS_ENABLED`; allowed in the current mode (§9); **no `created`/`pending` payment for this User** (else return that one); valid Kenyan MSISDN, defaulting to `users.phone` (another number needs `confirmOtherNumber: true`); rate limits `stkPushUser` (3 per 10 minutes per User) and `stkPushMsisdn` (3 a day per MSISDN) | schedule `daraja.stkPush` |
| `created` | `pending` | `daraja.stkPush` → `payments.markPending` (internal) | `ResponseCode === "0"` | store `merchantRequestId`, `checkoutRequestId`, `requestedAt` |
| `created` | `failed` | `daraja.stkPush` → `payments.markFailed` (internal) | non-zero `ResponseCode`, HTTP error, or a 10 s timeout (a timeout may leave **no** stored `checkoutRequestId`; §7 rule 4) | `failure = { stage: "request", code }` |
| `created` | `expired` | cron `payments.reconcile`, row older than 2 minutes | — | none |
| `pending` | `paid` | callback or query, `ResultCode 0` | CheckoutRequestID matches; amount equals `amountKsh`; `mpesaReceipt` not on any other payment | `paidAt`, `mpesaReceipt`; `subscriptions.extend` |
| `pending` | `cancelled` | callback or query, `ResultCode 1032` | same CheckoutRequestID | none |
| `pending` | `failed` | callback or query, any other final code | same CheckoutRequestID | `failure = { stage: "result", code }` |
| `pending` | `expired` | cron, 15 minutes with no final answer | — | none |
| `created`, `pending` | `abandoned` | the Fundi taps "Cancel" on the waiting screen (`payments.abandon`) | **owner only** | none; a later `ResultCode 0` is still applied (§4.3) |
| `expired`, `failed`, `cancelled`, `abandoned` | `paid` (`late: true`) | callback **confirmed by an STK Query**, or a query alone, `ResultCode 0` | as `pending → paid` | §4.3 |
| `paid` | `refunded` | Admin: `payments.recordRefund` | `requireAdmin`; reference and reason required | `auditLog`; the subscription period this payment added is removed; if that ends the subscription, `recordRefund` sets `active = false` itself and calls `syncListing` |

`paid` and `refunded` are terminal. Anything not in the table is rejected. A repeat callback for a `paid` payment with the **same** receipt is a no-op that still returns 200. A callback with a **different** receipt for the same CheckoutRequestID writes a `paymentEvents` anomaly and changes nothing.

### 5.1 Result codes (what the Fundi sees)

| Code | Meaning | Source | Copy (EN) |
| --- | --- | --- | --- |
| `0` | success | KR F5.2 | "Paid" |
| `1032` | cancelled by the user | KR F5.2 | "Payment cancelled" |
| `1037` | phone unreachable / timed out | **UNVERIFIED** | "Your phone didn't respond. Check it's on and try again." |
| `1` | insufficient balance | **UNVERIFIED** | "Not enough M-Pesa balance" |
| `2001` | wrong PIN | **UNVERIFIED** | "Wrong PIN — try again" |
| anything else | other failure | — | "M-Pesa couldn't complete this payment. Try again." |

The skill confirms codes from the portal before V11; unknown codes always fall into the last row.

### 5.2 Subscription state

`subscriptions` holds one row per Fundi: `activeUntil` (a timestamp). A payment that settles sets `activeUntil = max(now, activeUntil) + periodDays`. `isFundiPro(ctx, userId)` reads a stored `active` flag. Queries can't read the clock (Convex guidelines), so a cron (`subscriptions.markExpired`, every 15 minutes, in batches of 50) flips the flag when `activeUntil` passes.

**Ranking coupling.** Fundi Pro start (`subscriptions.extend`), end (`subscriptions.markExpired`) and refund (`payments.recordRefund`) each call the convex role's `syncListing(ctx, fundiUserId)` in the same mutation, so the `listings.subscriber` flag, the Pro tier and the "FUNDI PRO · PAID" tag change atomically with the subscription (Spec A §15.2; R-16 applies). **Job responses (`interests.listForJob`) read `listings.subscriber`**, not `isFundiPro` at query time (review §3.3). On `SF_DEPLOYMENT=prod`, only `mode: "production"` subscriptions set `subscriber` (`subscriptions.mode` records the mode of the payment that extended it); a sandbox subscription on prod never boosts or tags a real visitor's results (review rai S1). On Electrical and Solar scopes the sortKey places verified tiers first (D-48).

---

## 6. Daraja integration (Part B)

### 6.1 Endpoints and credentials

| Item | Value | Source |
| --- | --- | --- |
| OAuth | `GET https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, Basic `consumerKey:consumerSecret`, token valid 3,600 s | KR F5.1 |
| STK Push | `POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest` | KR F5.2 |
| STK Query | `POST https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query` with `BusinessShortCode`, `Password`, `Timestamp`, `CheckoutRequestID` | path and fields **UNVERIFIED** (F5.2 confirms only that a separate Query API exists) |
| Production host | emailed after go-live (F5.6); held in `DARAJA_BASE_URL`, never hard-coded | KR F5.6 |
| Transaction Status | needs `InitiatorName` + `SecurityCredential`; parameters UNVERIFIED (F5.5). **Not used in V2**; Admins reconcile receipts in the Org portal. | KR F5.5 |

The access token is fetched **per action run** and never stored or logged. Subscriptions are rare, so caching isn't worth storing a bearer token.

### 6.2 STK Push request (`convex/payments/daraja.ts`: default Convex runtime, `fetch` only, no `"use node"`)

| Field | Value |
| --- | --- |
| `BusinessShortCode` | `DARAJA_SHORTCODE` (5–6 digits, F5.2) |
| `Password` | `base64(Shortcode + Passkey + Timestamp)` (F5.2) |
| `Timestamp` | `YYYYMMDDHHmmss` in Africa/Nairobi time (whether the time zone matters is UNVERIFIED; EAT is the safe choice) |
| `TransactionType` | `DARAJA_TRANSACTION_TYPE`: `CustomerPayBillOnline` (Paybill) or `CustomerBuyGoodsOnline` (Till) (F5.2) |
| `Amount` | whole KSh, `payments.amountKsh` |
| `PartyA`, `PhoneNumber` | the payer MSISDN, `2547XXXXXXXX` / `2541XXXXXXXX` (F5.2) |
| `PartyB` | `DARAJA_PARTY_B` (the Paybill, or the till number; the Till mapping of `BusinessShortCode` vs `PartyB` is **UNVERIFIED**) |
| `CallBackURL` | `${CONVEX_SITE_URL}/payments/stk-callback/<callbackToken>` (§7) |
| `AccountReference` | `SFSUB` + the first 7 characters of a per-User code, ≤ 12 characters, shown to the payer (F5.2) |
| `TransactionDesc` | `Subscription` (12 characters; max 13, F5.2) |

### 6.3 Response and callback bodies

- **Response:** `ResponseCode` (`"0"` = accepted), `MerchantRequestID`, `CheckoutRequestID`, plus description fields (names beyond `ResponseCode` UNVERIFIED against the portal).
- **Callback body (UNVERIFIED shape, to confirm in the skill):**

```json
{ "Body": { "stkCallback": {
  "MerchantRequestID": "…", "CheckoutRequestID": "ws_CO_…",
  "ResultCode": 0, "ResultDesc": "The service request is processed successfully.",
  "CallbackMetadata": { "Item": [
    { "Name": "Amount", "Value": 1 },
    { "Name": "MpesaReceiptNumber", "Value": "…" },
    { "Name": "TransactionDate", "Value": 20260926143012 },
    { "Name": "PhoneNumber", "Value": 254712345678 } ] } } } }
```

A non-zero `ResultCode` carries no `CallbackMetadata`. The handler treats the body as `unknown` and narrows every field (Convex guidelines); a body that doesn't narrow gets 400 and a `paymentEvents` entry without the raw body. **`PhoneNumber` is not relied on** (whether it is masked is UNVERIFIED; C2B v2 masks MSISDNs, F5.3).

### 6.4 Environment (typed in `convex/convex.config.ts` via `defineApp({ env: { … } })`, per the Convex guidelines)

| Name | Example | Secret? |
| --- | --- | --- |
| `PAYMENTS_ENABLED` | `true` / `false` | no |
| `SF_DEPLOYMENT` | `dev` / `preview` / `prod`, set per deployment; drives §9 | no |
| `DARAJA_ENV` | `sandbox` / `production` | no |
| `DARAJA_BASE_URL` | `https://sandbox.safaricom.co.ke` | no |
| `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_PASSKEY` | — | **yes** |
| `DARAJA_SHORTCODE`, `DARAJA_PARTY_B`, `DARAJA_TRANSACTION_TYPE` | — | no (not public) |
| `PAYMENTS_TESTERS` | comma-separated emails allowed to pay in sandbox on prod | no |

Set on deployments with `pnpm exec convex env set …`; locally in the root `.env` only (D-13). No `NEXT_PUBLIC_` names; `web/` never sees them. `CONVEX_SITE_URL` is platform-provided and must not be redeclared.

---

## 7. Callback security

Daraja callbacks carry no signature the Architect could confirm (UNVERIFIED either way), so the design assumes anyone can POST to the callback URL.

1. **HTTPS only.** A Convex HTTP action on `https://<deployment>.convex.site`. No ngrok or request bins anywhere (F5.3).
2. **No forbidden words in the URL.** Production URLs must not contain "M-PESA", "Safaricom", "exe", "cmd", "SQL" or "query" (F5.3, stated for C2B; applied to STK to be safe). So the path is `/payments/stk-callback/<token>`, never `/mpesa/…`. The route uses `httpRouter`'s `pathPrefix` form (the convex role confirms the syntax in live docs).
3. **An unguessable per-payment token.** 32 random bytes, base64url, generated in the `created` mutation. Only its **SHA-256** is stored (`callbackTokenHash`, indexed). Unknown hash → 404, no write.
4. **Cross-checks before settling:** `CheckoutRequestID` equals the stored one; `Amount` equals `amountKsh`; `MpesaReceiptNumber` is present and not on another payment (`by_mpesaReceipt`). Any mismatch → a `paymentEvents` anomaly, no settle.
   - **No stored `checkoutRequestId`** (the STK request timed out): the callback settles only if the token matches, the amount matches, the receipt is unused **and** an STK Query for the callback's `CheckoutRequestID` confirms `ResultCode 0`. The ID is stored at that point.
   - **Late callbacks** (`expired`/`failed`/`abandoned → paid`) also settle only on a confirming STK Query (§4.3).
   - **UNVERIFIED, checked on V11's first ticket:** whether STK Query works for an ID we never stored, and whether Convex logs record the callback path (and so the token). If they do, the token is treated as logged and the Query confirmation carries the weight.
5. **Idempotent.** One internal mutation applies every result; terminal states make repeats no-ops; accepted and duplicate callbacks get 200 so Safaricom doesn't retry.
6. **Nothing sensitive in logs.** No token, phone, receipt or raw body in `console.log`; `paymentEvents` keeps a sanitised summary.
7. **Later:** source-IP allow-listing needs Safaricom's IP list and the caller IP in Convex HTTP actions, both UNVERIFIED. Not in V2.

---

## 8. Reconciliation, records and refunds

### 8.1 Automatic

`payments.reconcile` (every minute, batches of 50) queries STK status for `pending` payments at +90 s, +3 min and +5 min, expires them at 15 minutes, and expires `created` rows older than 2 minutes (§4.2). Query results go through `payments.applyResult` with `source: "query"`.

### 8.2 Manual

`/admin/payments` filters: `pending` > 5 min, `refundDue`, `late`, anomalies. "Check with M-Pesa now" runs one query. The Org portal is the source of truth for disputes; Admins look receipts up there in V2.

### 8.3 Refunds

No refund API in V2 (reversals and B2C need initiator credentials, and B2C a separate shortcode; F5.4):
1. A payment gets `refundDue` automatically (a double charge, §4.3) or by Admin decision.
2. A human reverses or refunds it in the M-PESA Org portal.
3. An Admin records it with `payments.recordRefund({ paymentId, refundReference, reason })` → `refunded` + `auditLog`, and the period it added is removed.

Pay-sheet refund line (proposed, V2-Q13): "The subscription isn't refundable once it starts. If you were charged twice, we refund you. Email info@smartfundis.com with your M-Pesa code."

**Part A has no refunds**: Smart Fundis never had the money. A Client who paid the wrong number contacts Safaricom and reports `wrong_pay_to_details` (Spec A E16).

---

## 9. Test mode and going live

| Situation | What happens |
| --- | --- |
| `PAYMENTS_ENABLED=false` | No Subscribe button or pay sheet anywhere. |
| Dev or preview (`SF_DEPLOYMENT` ≠ `prod`), `DARAJA_ENV=sandbox` | Subscriptions on for everyone, every surface tagged **"Test mode — no real money"**, rows stored with `mode: "sandbox"`. Sandbox subscriptions unlock WhatsApp and the boost only on that deployment. |
| **Production** (`SF_DEPLOYMENT=prod`), `DARAJA_ENV=sandbox` | The Subscribe button appears **only** for Admins and `PAYMENTS_TESTERS` (matched against the **verified email in the auth token**, never a client-sent value). Every other Fundi sees no subscription at all. Tester subscriptions are `mode: "sandbox"` and **never set `listings.subscriber`**, so they never boost or tag results for real visitors (review rai S1). This keeps a sandbox from looking live to real users (R-27). |
| Production, `DARAJA_ENV=production` | Real payments; no "Test mode" tag. Only the operator or Architect switches this, like the prod deploy rule (architecture spec §3). |

**Demo seed:** Demo accounts never subscribe and never create payments (D-31).

**Sandbox on real handsets:** whether a sandbox STK prompt reaches a real Safaricom line, and which test MSISDNs work, is **UNVERIFIED**; the skill records what the portal says.

**Go-live checklist (human steps, owned by the operator):**
1. A registered business with a Till or Paybill in its name (V2-Q31).
2. M-PESA Org-portal access with a Business Administrator or Business Manager operator (F5.6, V2-Q35).
3. The Daraja go-live request; production keys and passkey arrive by email (F5.6).
4. Counsel confirms the CBK stance (§10, V2-Q30) and an accountant the tax treatment (V2-Q29).
5. `pnpm exec convex env set` the production values on the prod deployment only; `DARAJA_ENV=production`.
6. One real KSh 1 payment by the operator, checked end to end; then set the real price.

---

## 10. Legal stance (CBK, consumer protection, tax)

- **What we do:** in Part A, nothing with money at all (we show a Fundi's self-declared number). In Part B, we sell our own service and collect our own fee into our own Till/Paybill, like any merchant. **What we never do:** receive money for a Fundi or Client, hold a balance for anyone, split a payment, pay out, or run a wallet. That keeps us outside "receiving, storing or processing of payments" **for others**, as far as the Architect can read (NPS Act s.2, F5.8). **This is a reading, not legal advice; counsel must confirm (F5.11, V2-Q30).**
- **Paid placement must not mislead.** Consumer Protection Act 2012 s.12(2)(a)–(c) lists as false or misleading any representation that services have "sponsorship, approval … or qualities they do not have", that the supplier has "sponsorship, approval, status, affiliation" they don't have, or that services are of "a particular standard, quality, grade" if they are not (Kenya Law, fetched 2026-09-26). Competition Act (Cap. 504, Rev. 2022) s.55(a)(ii) and (v)–(vi) make similar false representations an offence (CAK PDF, fetched 2026-09-26). Fundi Pro ranks first even when not verified (operator round 3), except on Electrical and Solar, where verified comes first (D-48), so every Pro result, and `/f/[id]`, carries the "FUNDI PRO · PAID" tag (D-47), every such list carries the legend "Pro = paid subscription, not a verification", Pro never looks like a Badge, and the "Verified only" chip still filters to verified (R-17, R-37). Not legal advice; counsel to review with V2-Q30.
- **Pay-to details are self-declared** and carry the name-check line (Spec A §9.2). Smart Fundis doesn't verify them and can't reverse a payment made to them.
- **Escrow** stays on `/roadmap` as "Escrow & in-app payment to fundis — Coming soon". Only a CBK-authorised PSP or a bank escrow product may ever hold that money, under a new ADR.
- **Consumer protection:** price, period, what it unlocks, what it doesn't, and the refund line are shown before the Fundi accepts, with an express "Pay with M-Pesa" / "Cancel" (Consumer Protection Act s.31, F6.14). No pre-ticked boxes, no auto-renewal.
- **Tax:** VAT or KRA eTIMS invoices on the subscription are **UNVERIFIED** (V2-Q29). Until answered, production stays in sandbox.
- **Records:** how long payment records must be kept is **UNVERIFIED** (V2-Q28).

---

## 11. The mpesa agent and its skill

### 11.1 The agent

`.claude/agents/mpesa.md` (drafted with this spec; not listed in `AGENTS.md` until approved):
- **Owns:** `convex/payments/**` (the tables module, the Daraja client, the HTTP handler module, crons and tests) and this spec's contracts.
- **Does not own:** any UI (operator Q9). It writes **UI suggestions** (states, copy keys, error mapping) into its handoff for frontend, which builds the pay sheet and `/admin/payments` in `web/`. Nor `convex/schema.ts` or `convex/http.ts` (convex imports `paymentTables` and calls `registerPaymentRoutes(http)`), nor Part A's Pay-to fields (convex).
- **Called only for payment tasks.**
- **Skills (initial; may change after further research on Daraja skills):** `convex:design`, `convex:convex-authz`, `convex:crons`, `convex:test`, `convex:env`, `mattpocock-skills:tdd`, `superpowers:verification-before-completion`, and the project skill `mpesa-daraja` once written.

### 11.2 The proposed project skill `.claude/skills/mpesa-daraja/` (described here; not created yet)

No credible published Daraja skill exists, community MCP servers must never get live credentials (the docs-search-only `jackscodevault/mpesa-daraja-mcp` is the safest for development), and libraries like `@kepas/daraja-js` are **references, not dependencies**, unless they pass an audit. So we write a thin `fetch` client and our own skill:

| File | Contents |
| --- | --- |
| `SKILL.md` | When to load it (any M-Pesa task); the rules (never hold third-party money; settle only on callback/query `ResultCode 0`; idempotency; callback token + cross-checks; secrets only in the Convex env / root `.env`; sandbox "Test mode"); a map of the files |
| `reference/auth.md` | OAuth URL, Basic header, token lifetime (F5.1), errors |
| `reference/stk-push.md` | Request fields and limits; response fields; **callback payloads** for success, cancel and failure; the result-code table with the portal's wording; Paybill vs Till field mapping |
| `reference/stk-query.md` | The Query API path, fields, responses, the "still processing" case |
| `reference/transaction-status.md`, `reference/c2b.md`, `reference/b2c.md` | Why V2 doesn't use them, and what each would need to go live (F5.3–F5.5) |
| `reference/go-live.md` | The §9 checklist, from the portal's Getting Started page (F5.6) |
| `reference/security.md` | HTTPS, URL keyword rules, no ngrok (F5.3), token design, logging rules |
| `reference/legal.md` | The CBK/NPS summary (F5.8–F5.11), "never hold third-party money", Pochi = phone number, marked "not legal advice" |
| `fixtures/*.json` | Sanitised sample callbacks (success, 1032, a failure, a duplicate) for convex-test |
| `examples/` | A Convex action calling STK Push with `fetch`; a callback HTTP action that narrows `unknown` |

Every page records its **source URL and the date it was read**; anything not read from the portal is **UNVERIFIED**. The mpesa agent refreshes the skill at the start of each payment slice. The skill is pinned in `skills-lock.json` like the other standalone skills.

---

## 12. Data model and contracts (Part B)

Tables live in `convex/payments/tables.ts`, spread into `convex/schema.ts` by convex.

**`payments`**

| Field | Type |
| --- | --- |
| `purpose` | `"fundi_pro"` (a union, so Enterprise Pro can be added later) |
| `payerUserId` | `Id<"users">` |
| `amountKsh` | integer ≥ 1 |
| `periodDays` | 30 |
| `mode` | `"sandbox" \| "production"` |
| `status` | `"created" \| "pending" \| "paid" \| "cancelled" \| "failed" \| "expired" \| "abandoned" \| "refunded"` |
| `attempt` | number |
| `idempotencyKey` | `${payerUserId}:${purpose}:${attempt}`; an **attempt** is one user tap of Pay (a double tap while `created`/`pending` reuses the attempt) |
| `msisdn` | `2547…`, **cleared 90 days after a terminal status** |
| `msisdnMasked` | `2547•••••678` |
| `callbackTokenHash` | SHA-256 hex |
| `merchantRequestId`, `checkoutRequestId` | optional |
| `requestedAt`, `paidAt`, `closedAt` | optional |
| `mpesaReceipt` | optional |
| `queryCount`, `nextQueryAt` | numbers |
| `failure` | `{ stage: "request" \| "result", code: string }`, optional |
| `late`, `refundDue` | booleans |
| `refund` | `{ reference, reason, byUserId, at }`, optional |

Indexes: `by_payerUserId_and_purpose_and_status`, `by_payerUserId_and_requestedAt`, `by_status_and_nextQueryAt`, `by_callbackTokenHash`, `by_checkoutRequestId`, `by_mpesaReceipt`, `by_refundDue_and_closedAt`.

**`paymentEvents`** (append-only): `paymentId`, `kind: "request" | "request_error" | "callback" | "query" | "anomaly" | "admin"`, `resultCode?`, `summary` (≤ 140; no phone, token, receipt or raw body), `at`. Index `by_paymentId_and_at`.

**`subscriptions`**: `userId` (a Fundi), `activeUntil`, `active` (flag kept by the cron), `mode: "sandbox" | "production"` (on prod only `production` sets `listings.subscriber`), `remindedForUntil?` (the `activeUntil` a reminder was sent for), `updatedAt`. Indexes `by_userId`, `by_active_and_activeUntil`.

**`prices`**: `purpose: "fundi_pro"`, `amountKsh` (1–5,000), `periodDays`, `updatedByUserId`, `updatedAt`. Index `by_purpose`.

```ts
// ---- public / signed in ---------------------------------------------------
payments.config() (query) → {
  enabled: boolean;                   // PAYMENTS_ENABLED and allowed for this caller in this mode (§9)
  testMode: boolean;                  // DARAJA_ENV !== "production"
  fundiPro: { amountKsh: number; periodDays: number } | null;
}
subscriptions.mine() (query, requireFundi) → { active: boolean; activeUntil: number | null }

// ---- Fundi (requireFundi) ---------------------------------------------------
payments.startSubscription({ msisdn?: string; confirmOtherNumber?: boolean }) →  // defaults to users.phone
  | { ok: true; paymentId: Id<"payments"> }            // new, or the existing created/pending one
  | { ok: false; reason: "disabled" | "bad_phone" | "confirm_other_number" | "rate_limited"
                       | "msisdn_limit" | "not_allowed_in_test_mode" }
  // "confirm_other_number": msisdn ≠ users.phone and confirmOtherNumber !== true
  // "msisdn_limit": 3 STK prompts a day to one MSISDN, across all Users
payments.abandon({ paymentId }) → null                 // owner only; throws for anyone else
payments.get({ paymentId }) (query) → {             // owner or Admin only
  status: "created" | "pending" | "paid" | "cancelled" | "failed" | "expired" | "abandoned" | "refunded";
  amountKsh: number; mode: "sandbox" | "production";
  failureCopyKey: string | null;                     // an i18n key from §5.1, never the raw ResultDesc
  mpesaReceipt: string | null; paidAt: number | null;
}
payments.listMine({ paginationOpts }) (query) → PaginationResult<{ paymentId; purpose; amountKsh; status; mpesaReceipt; paidAt; mode }>

// ---- Admin (requireAdmin; auditLog on every write) --------------------------
payments.adminList({ status?, refundDue?, paginationOpts }) (query)
payments.requery({ paymentId }) → null
payments.recordRefund({ paymentId, refundReference, reason }) → null
prices.set({ purpose: "fundi_pro", amountKsh, periodDays: 30 }) → null

// ---- for other modules ----------------------------------------------------------
isFundiPro(ctx, userId): Promise<boolean>     // helper in convex/payments/subscriptions.ts; reads the stored flag
                                              // used by contact.reveal (whatsapp) and syncListing only;
                                              // lists (interests.listForJob, listings.search) read listings.subscriber

// ---- internal ---------------------------------------------------------------------
daraja.stkPush({ paymentId }) / daraja.stkQuery({ paymentId })     // internalAction
payments.markPending / payments.markFailed                          // internalMutation
payments.applyResult({ paymentId, source: "callback" | "query", resultCode, amount?, receipt?, checkoutRequestId })
                                                                    // internalMutation; the only place a payment settles;
                                                                    // a late or no-stored-ID callback schedules stkQuery
                                                                    // and settles only when the query confirms (§7 rule 4)
subscriptions.extend({ userId, days, paymentId })                   // internalMutation; calls syncListing
payments.reconcile / subscriptions.markExpired / subscriptions.remind / payments.purgeMsisdn   // crons, batches of 50
// payments.reconcile also expires `created` rows older than 2 minutes
// subscriptions.remind (hourly): for active Fundi Pro rows with activeUntil ≤ now + 10 days and no reminder sent
//   for this period, write a `fundi_pro_renewal` notification (Spec A notifications) and set remindedForUntil.
registerPaymentRoutes(http)                                         // adds POST pathPrefix /payments/stk-callback/
```

**HTTP action `POST /payments/stk-callback/<token>`:** hash the token → payment (404 if none) → parse JSON as `unknown` and narrow (400 if malformed) → `payments.applyResult` → **200** `{"ResultCode":0,"ResultDesc":"Accepted"}` for accepted and duplicate callbacks (the acknowledgement body is **UNVERIFIED** for STK; Daraja documents one for C2B).

---

## 13. Tests

**Part A (convex role, in Spec A §17 #19–21):** Pay-to reveal only to the hiring Client; Pochi never public; Till public only with opt-in; change notices; no phone patterns in query results.

**Part B (convex-test, through public functions and the HTTP action; `fetch` replaced with fixtures from `.claude/skills/mpesa-daraja/fixtures/`; Daraja never called):**
1. `startSubscription` by a non-Fundi throws.
2. With `PAYMENTS_ENABLED=false`, `payments.config` returns `enabled: false` and `startSubscription` returns `disabled`.
3. `startSubscription` inserts one `created` payment and schedules `daraja.stkPush`.
4. **Double tap:** two calls while `created`/`pending` return the same `paymentId`; only one push is scheduled.
5. STK response `ResponseCode "0"` → `pending` with both request ids; a non-zero code or a thrown `fetch` → `failed`.
6. **Callback success:** valid token + `ResultCode 0` + matching CheckoutRequestID + matching Amount + new receipt → `paid`; `subscriptions.activeUntil = now + 30 days`; `isFundiPro` true; the `listings` rows now have `subscriber: true` and the re-tiered `sortKey` in the same transaction.
7. **Callback twice:** the same success callback again → 200, no change, one extension only.
8. **Cancel:** `ResultCode 1032` → `cancelled`, no extension.
9. Other codes → `failed` with `failureCopyKey` from §5.1; an unknown code → the generic key.
10. **Security:** unknown token → 404, no write; wrong CheckoutRequestID → anomaly, no settle; wrong Amount → anomaly, no settle; a receipt already used → anomaly, no settle; malformed body → 400.
11. **Reconciliation:** a `pending` payment with no callback gets queries at 90 s, 3 min and 5 min (fake timers), settles on a query `ResultCode 0`, and expires at 15 minutes otherwise.
12. **Late payment:** a success callback after `expired` settles only when the STK Query fixture confirms `ResultCode 0` → `paid`, `late: true`, subscription extended; with a non-confirming query it stays `expired` and writes an anomaly.
13. **Double charge:** two payments settle within 10 minutes → the later one gets `refundDue: true`; after `recordRefund` its 30 days are removed.
14. `recordRefund` by a non-Admin throws; on a non-`paid` payment it throws; otherwise → `refunded` + `auditLog`.
15. **Test-mode gate:** with `SF_DEPLOYMENT=prod` and `DARAJA_ENV=sandbox`, a Fundi not in `PAYMENTS_TESTERS` (matched on the token's verified email) gets `enabled: false` and `not_allowed_in_test_mode`; an Admin can subscribe, and the resulting sandbox subscription leaves `listings.subscriber` false.
16. **No leaks:** no query result contains `msisdn` (only the masked form), `callbackTokenHash`, the token, or a Daraja secret; `payments.get` by another User throws.
17. `purgeMsisdn` clears `msisdn` 90 days after a terminal status and keeps `msisdnMasked`.
18. Rate limit: the 4th `startSubscription` in 10 minutes → `rate_limited`.
19. `prices.set` by a non-Admin throws; outside 1–5,000 throws; every change writes `auditLog`.
20. **Fundi Pro and ranking (ADR-28):** Spec A §17 #15 and #37–39 pass: Pro rows are in the first tiers and always carry `pro: true`; on Electrical and Solar, verified rows come before not-yet-verified Pro rows (D-48); `interests.listForJob` orders by `listings.subscriber`; a subscription never adds a Badge or `verified`; start, expiry and refund each re-sync the Listing.
21. `subscriptions.markExpired` clears `active` once `activeUntil` passes; `contact.reveal({ channel: "whatsapp" })` then returns `fundi_not_pro` (D-46), and the Fundi's rows lose `subscriber`, the Pro tier and the tag.
22. `subscriptions.remind` writes exactly one `fundi_pro_renewal` notification per period when `activeUntil` is 10 days away (fake timers), none after a renewal extends `activeUntil`, and a lapse notice on the day it ends.
23. **Stuck `created`:** a `created` row older than 2 minutes becomes `expired` (fake timers).
24. **No stored ID:** a callback for a payment with no `checkoutRequestId` settles only with a matching token and amount, an unused receipt and a confirming STK Query, and then stores the ID; without the query confirmation it doesn't settle.
25. **MSISDN guards:** a number other than `users.phone` without `confirmOtherNumber` → `confirm_other_number`; the 4th prompt in a day to one MSISDN (any User) → `msisdn_limit`.
26. `payments.abandon` by another User throws.
27. `recordRefund` that ends the period sets `active = false` and clears `subscriber` in the same mutation.

**Other seams:** a Playwright run against sandbox fixtures ("Test mode" tag, the waiting screen, "Subscribed until…"); a manual sandbox run by the mpesa agent recorded in its handoff (a real push, a real callback, one cancel).

### 13.1 Kenyan edge cases

| # | Scenario | Result |
| --- | --- | --- |
| P1 | A Fundi in Githurai taps Pay, then cancels the prompt. | `1032` → cancelled; "Payment cancelled". |
| P2 | Safaricom sends the success callback twice. | Test 7: one extension, both acknowledged. |
| P3 | The Fundi pays from a relative's line. | The editable M-Pesa number on the pay sheet, with a confirm step; 3 prompts a day per number (test 25). |
| P4 | The phone is off; no callback comes. | Queries, then `expired` at 15 minutes with the "If money left your account" line. |
| P5 | The prompt times out, the Fundi taps Try again, then both succeed. | Test 13: the later one gets `refundDue`. |
| P6 | Someone scripts fake success callbacks. | No valid token → 404. With a stolen token, the CheckoutRequestID, amount and unique-receipt checks still hold. |
| P7 | A Client pays a hired Fundi's Pochi and the name shown differs. | Part A: the name-check line warned them; report `wrong_pay_to_details`; Smart Fundis never had the money (Spec A E16). |
| P8 | A Fundi asks the Client to "pay through the app". | There is no such flow; the hire screen says Smart Fundis doesn't handle the job payment; report `asks_for_payment`. |

---

## 14. Open questions for the operator (payments)

| # | Question | Recommendation |
| --- | --- | --- |
| V2-Q13 | Refund policy for the subscription. | §8.3 text; manual refunds through the Org portal. |
| V2-Q28 | How long to keep payment records? | Keep payment rows (without the full phone) for the period counsel or the accountant gives for tax records (UNVERIFIED); clear the full MSISDN after 90 days. |
| V2-Q29 | VAT / eTIMS on the subscription? | Ask an accountant before any real charge; stay in sandbox until answered. |
| V2-Q30 | Legal sign-off on the CBK stance? | Yes: a short opinion from counsel before `DARAJA_ENV=production`. |
| V2-Q31 | Till or Paybill for our own fees? | A Till (Buy Goods) is simpler for one product; a Paybill if more fees are expected. The operator decides with Safaricom. |
| V2-Q32 | Approve the `mpesa` agent and the `mpesa-daraja` skill? | Yes; list the agent in `AGENTS.md` (Spec A §23) when V11 is sliced; write the skill as **V11's** first ticket, which also checks the two UNVERIFIED items in §7 rule 4. |
| V2-Q41 | Ranking order. | **Answered in round 3:** Fundi Pro (verified first) → verified → Demo → not yet verified. **Amended (D-48):** on Electrical and Solar, verified Pro → verified → Demo → not-yet-verified Pro → not yet verified. |
| V2-Q42 | Fundi Pro price. | **Answered in round 6:** KSh 200 a month. |
| V2-Q46 | Does "a Till or Pochi … for an STK push" mean Smart Fundis pushes Client payments into the Fundi's Till? | **Operator-confirmed by default, no objection raised:** no. Clients pay Fundis directly; our STK Push is only for Fundi Pro into our own Till. |
| V2-Q43 | Boost on `/fundis` too? | **Answered in round 3:** yes, `/fundis` and Job responses. |
| V2-Q44 | Who sees a Fundi Pro's WhatsApp in V2? | **Answered in round 4:** any signed-in Client, until Enterprise Pro exists. **Amended (D-46):** any Client with a Client profile, through `contact.reveal`. |
| V2-Q45 | Email renewal reminders? | Not in V2 (in-app only). If wanted, choose an email provider (for example Resend) as a separate decision; Clerk's custom-email support is UNVERIFIED. |
| V2-Q35 | Till number and Org-portal access. | The operator will provide the Till (round 2); until it and an Org-portal Business Administrator exist: sandbox + "Test mode". |

---

## 15. Out of scope

- escrow; holding, splitting or passing on money between Client and Fundi; deposits; wallets; balances
- verifying Pay-to details (for example checking a till's registered name through an API)
- B2C payouts, C2B registration, reversal and Transaction Status APIs
- Job post fees, boosts or featured placement for Jobs; any paid placement other than the labelled subscription tier (ADR-28)
- subscriber-only in-app chat and AI voice search (later phases, on `/roadmap`)
- Enterprise Pro, a Client subscription (on `/roadmap`)
- automatic renewal (a Daraja recurring-mandate API could not be confirmed on 2026-09-26; UNVERIFIED and out)
- card payments, Airtel Money, T-Kash
- automatic refunds
- installing a community Daraja MCP server or library as a runtime dependency

---

## 16. Changes to earlier decisions

| Earlier rule | Where | Change | Proposed as |
| --- | --- | --- | --- |
| "Bookings & M-Pesa" are Roadmap-only | CONTEXT "Roadmap", architecture spec §8, §12 | Direct pay to the Fundi's self-declared Pochi/Till is live from V8 (operator Q2). STK Push for Smart Fundis' own subscriptions from V11, after V9 (operator rounds 2–4; order V7 → V8 → V9 → V11 → V10, D-45, D-58), Test mode first. The Roadmap item becomes "Escrow & in-app payment to fundis". | D-41, ADR-27 |
| No payments role | AGENTS folder ownership and skills table | A new `mpesa` role owns `convex/payments/`; UI suggestions only. | D-42 |
| No paid placement; verified-first as the only boost | ADR-22, D-24, find-a-fundi §7 | **Superseded (round 3):** Fundi Pro ranks first, verified or not, always tagged, with the legend and the "Verified only" chip kept. | D-44, ADR-28, R-37 |
| AGENTS rule 4 names only `NVIDIA_API_KEY` | AGENTS rule 4 | Daraja keys only in the Convex env and the root `.env`. | Spec A §23 diff |
| Pro tag "Fundi Pro"; SW legend "usajili wa kulipia" | ADR-28, Spec A §8.4a | "FUNDI PRO · PAID" / "FUNDI PRO · AMELIPIA", a 48 px button, also on `/f/[id]`; SW legend "Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi" (native check, R-20). | D-47 |
| Pro first on every Trade | ADR-28, D-44 | Verified first on Electrical and Solar. | D-48 |
| Settle on any `ResultCode 0` callback | §4.3, §7 | Late and no-stored-ID callbacks need a confirming STK Query; `created` rows expire at 2 minutes. | review §3.3 |
| Job responses read `isFundiPro` at query time | §5.2 | They read `listings.subscriber`; on prod only production subscriptions set it. | review §3.3, rai S1 |
| WhatsApp to "any signed-in Client" via `jobs.openWhatsApp` | §2, R4-1 | Any Client with a profile, via `contact.reveal`, counted in the per-Fundi cap. | D-46 |
| `mpesa-daraja` skill as V10's first ticket | §14 V2-Q32 | V11's first ticket (V10 is now last and optional). | D-58 |

## 17. Proposed `AGENTS.md` changes

In the combined diff in Spec A §23 and review §5 (the operator applies them): rule 4 (Daraja secrets, plus `AI_PARSE_SECRET`; `NVIDIA_API_KEY` only while the hosted fallback exists, D-32), the `mpesa` rows in the skills and folder tables (with "UI suggestions only"), the "Test mode" clause in "Nothing may look live", the non-negotiable "Smart Fundis never holds, stores or passes on money between a Client and a Fundi", the Fundi Pro non-negotiable "FUNDI PRO · PAID on every boosted result, and verified first on Electrical and Solar" (D-47, D-48), and "every reveal needs a Client profile and is capped per Fundi per day" (D-46).
