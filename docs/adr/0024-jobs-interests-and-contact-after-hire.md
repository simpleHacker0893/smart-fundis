---
status: proposed
date: 2026-09-26
deciders: operator (V2-Q4, V2-Q5, V2-Q6 and round 2, 2026-09-26; D-46 and D-53 in the V2 review, grilling round 1); architect (the rest, proposed)
amends: AGENTS non-negotiable "Post-MVP features appear only on /roadmap" (for Jobs), CONTEXT "Roadmap"
extends: ADR-21 (opt-in contact, revealed on tap), as amended by D-46
---

> **Filename note:** the filename says "contact-after-hire" for historical reasons. Contact is **not** gated on a hire or a shortlist: it is one-sided, Client → Fundi, through `contact.reveal` (D-46). Only the Pay-to details wait for a hire.

# ADR-24: Jobs and Interests, with contact only through logged steps

## Context

V2 turns Smart Fundis into a small-jobs marketplace: Clients post Jobs and Fundis "vie" for them, in public. Kenyan phone numbers in the open are harvested for spam and M-Pesa fraud (ADR-21), and a common fundi-job scam is a fake "client" asking the fundi to pay first. The Badge is our only trust signal, and Rates are never ranked. Competitors either book without skill proof or list without trust (research N1.1, N1.3).

The operator decided on 2026-09-26: a Fundi responds with **"I'm interested" + a short note** (no price); **all Fundis** may respond, not only verified ones; Fundis and Clients **talk on WhatsApp**, not in an in-app chat; the WhatsApp link is **subscriber-only**; the public board is `/jobs` plus a landing strip and a JOBS tab. In rounds 2–3 the operator added: **a Client's phone number and WhatsApp are never shown to Fundis**; WhatsApp links are for subscribers (Fundi Pro) only; in-app chat for subscribers comes in a later phase. In the V2 review the operator accepted D-46 (every reveal needs a Client profile) and D-53 (hired Jobs auto-close).

## Decision

1. A **Job** belongs to a Client, has one Trade and one Location, and follows the state table in the marketplace spec §6.1 (`draft → open ⇄ shortlisted → hired → done`, plus `expired`, `cancelled`, `removed`). One helper, `setJobStatus`, performs every transition. **A hired Job auto-closes to `done` 30 days after `hiredAt`**, and the Client gets a notice; retention counts from the close (D-53).
2. Any Fundi may send one **Interest** per Job (a note ≤ 280), subject to the spec's guards (not their own Job, not hidden, caps, rate limits; the Fundi must be Listed, V2-Q37).
3. The Client **shortlists** and **hires one** Fundi.
4. **Contact is one-sided, Client → Fundi only, through one logged, rate-limited mutation, never through queries or HTML (D-46).** Every reveal runs `contact.reveal({ fundiProfileId, channel, jobId?, interestId? })`, which calls `requireClient` (a Client profile with a phone, 18+ and the terms accepted) and one internal helper keyed on `userId`. It replaces `jobs.revealFundiPhone` and `jobs.openWhatsApp`, and the V6 anonymous `visitorKey` reveal is retired. A **per-Fundi daily cap** (100 a day) is counted across all channels:
   - `call`: the Fundi's phone, only if the Fundi opted in to "Show my phone to clients" (ADR-21, operator round 4);
   - `whatsapp`: a `wa.me` link to a **Fundi Pro** (operator round 4; strict subscriber-to-subscriber contact only once Enterprise Pro exists);
   - `pay_to`: the Fundi's self-declared Pay-to details, to the hiring Client only (ADR-27). A Pochi number is the Fundi's phone, so the Pay-to form warns the Fundi.

   Reveals are logged in `contactShares` (`jobId` optional). **No function ever returns a Client's phone to a Fundi.** A Fundi learns a Client's WhatsApp number only if the Client starts a WhatsApp chat, which the screen says.
5. The public **Job board** shows Trade, title, county · ward, budget, age and a bucketed response count only. The description and photos need sign-in; the Client's identity, phone, landmark and location point are never public.

## Options considered

### Option A: Directory only (V6); Clients keep calling Fundis

| Dimension | Assessment |
| --- | --- |
| Complexity | None |
| Fit | Misses the operator's marketplace intent |

### Option B: Jobs with in-app chat before hire

| Dimension | Assessment |
| --- | --- |
| Complexity | High: messaging, moderation, notifications, abuse |
| Fit | The operator chose WhatsApp instead |
| Scam surface | Chat before any commitment is where "pay me first" scams happen |

### Option C: Jobs with Interest + note; contact through one logged reveal; WhatsApp outside the app (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: a handful of tables, one status helper, one reveal mutation |
| Scam surface | A Fundi can never reach a Client; only Clients with a profile can reveal a Fundi's opted-in phone or a Fundi Pro's WhatsApp; every reveal is logged and capped per Fundi |
| Friction | A Fundi can't ask the Client a question; the description, photos and "When" field carry most of that, and the Client calls |

## Trade-off analysis

Option C gives the public "people vying" activity and a clear decision point for the Client, keeps the Fundi's number out of reach until a deliberate, one-sided, logged step by a Client with a profile, and matches how Kenyans already talk (WhatsApp). It gives up Fundi-initiated questions; "the fundi didn't work out" (once, within 7 days) covers a bad first pick. The core loop works without any subscription, because any Client can call an opted-in Fundi. Requiring a Client profile makes fake Clients cost a sign-up, a phone and a rate-limited `clients.create`; the per-Fundi cap bounds what one Fundi can lose to harvesting (D-46).

## Consequences

- New tables `clientProfiles`, `jobs`, `jobPhotos`, `interests`, `contactShares`, `jobReports`, `notifications` (marketplace spec §15). `contactReveals` is retired (D-46); V8 owns the migration and removes the V6 WhatsApp button.
- A consistency test for `setJobStatus`, like the `syncListing` test (R-16); a fake-timer test for the 30-day auto-close (D-53).
- Rate limits on posting, Interests, reveals, `clients.create` and reports; a contact-details filter on free text.
- JOBS appears in the header and the landing strip only in the release that ships it; the strip never shows Demo Jobs.
- Tests: marketplace spec §17 #4–24.
