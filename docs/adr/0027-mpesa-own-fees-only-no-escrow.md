---
status: proposed
date: 2026-09-26
deciders: operator (V2-Q2 direct pay, V2-Q9 agent scope, round 2 subscriptions via STK Push to our own Till, 2026-09-26); legal counsel to confirm the CBK reading (V2-Q30)
amends: CONTEXT "Roadmap" ("bookings & M-Pesa"), architecture spec §8 and §12
---

# ADR-27: Clients pay Fundis directly; M-Pesa is used only for Smart Fundis' own fees; no escrow

## Context

The operator wants M-Pesa. A marketplace would normally hold the Client's money until the job is done. In Kenya, a person "sending, receiving, storing or processing of payments" for others through an electronic system may be a payment service provider needing CBK authorisation (NPS Act 2011 s.2, s.12: fine up to KSh 500,000 and/or 3 years), and an authorised PSP must hold customer money in a trust, never commingled (NPS Regulations 2014 r.25). Whether our own Paybill holding Client money for a Fundi counts is unverified and needs counsel (research F5.8–F5.11). No Kenyan competitor checked says it holds Client money (N1.4). Daraja's STK Push is asynchronous (F5.2).

The operator decided on 2026-09-26: **direct pay only**; the Client pays the Fundi's own **Pochi la Biashara or Till**; Fundis may add that number to their profile as self-declared; the `mpesa` agent owns the payment backend and contracts but no UI. In rounds 2–3 the operator added the **Fundi Pro** subscription, paid by STK Push to Smart Fundis' own Safaricom Till.

## Decision

1. **Direct pay.** Money for the work passes directly between Client and Fundi (Pochi, Till or cash). Smart Fundis never receives, holds, splits, stores or pays out that money: no escrow, wallet, balance, deposit or payout.
2. **Pay-to details** (a Till or Pochi number) are required only for Fundis who respond to Jobs, not to register (operator, V2-Q47), self-declared, labelled, name-checked by the payer, and revealed only to the Client who hired that Fundi through a logged mutation (`contact.reveal`, channel `pay_to`, resolved through `job.hiredInterestId` and counted in the per-Fundi daily cap, D-46). Neither is ever public. A Pochi number is the Fundi's phone, so the Pay-to form warns the Fundi.
3. **M-Pesa Express (STK Push)** is used only to collect **Smart Fundis' own fees** into its own Till or Paybill. The only V2 fee is the **Fundi Pro** subscription (price and period V2-Q42); Enterprise Pro for Clients is future. No Job post fee and no pay-to-respond. Fundi Pro's ranking effect is governed by ADR-28.
4. Payments settle only on a callback or status query with `ResultCode 0`; everything is idempotent and reconciled (payments spec §4–§8). **Amended (V2 review §3.3):** because callbacks are unsigned, a late callback (`expired`/`failed`/`abandoned → paid`) and a callback for a payment with no stored `checkoutRequestId` settle only when a confirming **STK Query** agrees (plus the token, amount and unused-receipt checks).
5. Sandbox first, with a visible "Test mode" tag; on production while in sandbox, only Admins and named testers (matched on the verified token email) can pay, and those sandbox subscriptions never set `listings.subscriber` on production (ADR-28).
6. A dedicated `mpesa` role owns `convex/payments/` and the contracts, and gives UI suggestions; frontend alone writes `web/`.
7. Escrow stays on `/roadmap` and can only ever be done by a CBK-authorised PSP or a bank escrow product, under a new ADR.

## Options considered

### Option A: Escrow on our own Paybill

| Dimension | Assessment |
| --- | --- |
| UX | Strongest Client protection |
| Legal | Likely PSP activity; trust-fund rules; criminal exposure without authorisation |

### Option B: A licensed PSP's escrow or split-payment product

| Dimension | Assessment |
| --- | --- |
| Legal | Moves the licence burden to the partner |
| Effort/cost | Partner selection, contracts, fees; not needed to prove the marketplace |

### Option C: Direct pay + STK Push only for our own fees (chosen)

| Dimension | Assessment |
| --- | --- |
| Legal | Direct pay touches no money; the subscription is a merchant selling its own service (counsel to confirm) |
| Effort | Small: profile fields, one API, one callback, one cron |
| Client protection | None for the work payment; mitigated by Badges, logged hires, the name-check line and reports |

## Trade-off analysis

Option C matches how Kenyan Clients already pay fundis, keeps Smart Fundis outside the money path, and proves M-Pesa end to end with the least legal and engineering risk. It gives up payment protection for the work itself. Option B stays open for a later version.

## Consequences

- `fundiProfiles.payTo` (convex role); tables `payments`, `paymentEvents`, `subscriptions`, `prices` (mpesa role); an HTTP action at `/payments/stk-callback/<token>`; a reconciliation cron.
- `DARAJA_*` secrets only in the Convex env and the root `.env`.
- Go-live needs human steps: a Till or Paybill, an Org-portal Business Administrator, counsel's CBK opinion and a tax answer (payments spec §9–§10).
- Tests: payments spec §13; marketplace spec §17 #19–21.
