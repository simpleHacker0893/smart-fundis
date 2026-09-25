---
status: accepted
date: 2026-09-26
deciders: operator (OD-2), architect
amends: spec §7 ("the public profile hides phone"), PRD US-5.7
---

# ADR-21: Contact is opt-in and the phone is revealed on tap

## Context

A verified Fundi who cannot be reached gains nothing from Find a Fundi. Clients have no account (D-2), so there is no in-app messaging and no identity to gate contact on. The spec (§7) hid the phone on the public profile. Kenyan phone numbers published in plain HTML are harvested for spam, SIM-swap and M-Pesa fraud attempts. The phone (`users.phone`, ADR-16) is self-declared and not OTP-verified.

## Decision

The Fundi opts in with **"Show my phone to clients"** (off by default) and, separately, **"This number is on WhatsApp"**. If on, `/f/[id]` shows Call and WhatsApp buttons; if off, there is no contact button at all. The number is **never** in a query result, card, or server-rendered HTML. It is returned only by the mutation `contact.reveal`, which re-checks the Listing and the opt-in, applies rate limits (`@convex-dev/rate-limiter`: per anonymous `visitorKey` and per Fundi), and logs a minimal row (`contactReveals`: hashed visitor key, channel, time; purged after 30 days).

## Options considered

### Option A: Plain phone on the profile

| Dimension | Assessment |
| --- | --- |
| Complexity | Lowest |
| Scraping | Trivial: in HTML, search caches and list responses |
| Fundi control | Only all-or-nothing via the listing toggle |

### Option B: In-app contact form / relay

| Dimension | Assessment |
| --- | --- |
| Complexity | High: messaging, delivery (SMS/email), abuse handling |
| Scope | Messaging and Client accounts are out of MVP (spec §12) |
| Fit | Kenyan Clients call or WhatsApp; a form adds friction |

### Option C: Opt-in + tap-to-reveal mutation with rate limits (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: one mutation, one component, one small table, one cron |
| Scraping | Deterred, not prevented: `visitorKey` is client-generated and Convex sees no IP |
| Fundi control | Full; off by default |
| Cost | Negligible |

## Trade-off analysis

Option C keeps the number out of every passive channel (HTML, lists, caches, search engines) and bounds bulk harvesting with a per-Fundi cap, at the cost of one extra tap. It does not stop a determined attacker rotating visitor keys; the per-Fundi cap (100/day) limits the damage, and Turnstile or an IP-keyed limit remain available (Q-3). The per-Fundi cap could be exhausted deliberately to hide one Fundi's number for a day; we accept that over unlimited reveals.

## Consequences

- `profiles.getPublic` returns `contact: { available, whatsapp }` only; a convex-test asserts no phone pattern appears in any public query result.
- Onboarding copy changes from "Never shown publicly" to "Hidden unless you turn on 'Show my phone to clients'".
- A wrong or someone-else's number is handled by the report reason `wrong_phone` and Admin hide (R-15); OTP is Pilot.
- Demo profiles never have a phone (a made-up number may belong to a real person).
- The profile carries the line "Smart Fundis verified the tasks above only. Agree the price and the work directly with the fundi."

## Action items

1. convex: `profiles.setContact`, `contact.reveal`, rate limiter in `convex/convex.config.ts` (installed with pnpm at the root, D-11/D-12), purge cron, tests 5–7.
2. frontend: reveal button states (idle, revealing, revealed as `tel:`/`wa.me`, rate-limited, unavailable); `visitorKey` in `localStorage`.
3. designer: the contact block states in the `/f/[id]` screen.
