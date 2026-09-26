---
status: proposed
date: 2026-09-26
deciders: operator (rounds 2–3, 2026-09-26: Fundi Pro subscription paid by STK Push to Smart Fundis' own Till; Pro ranks first, verified or not; boost on /fundis and Job responses; label "Fundi Pro"; Enterprise Pro for Clients is future; D-47 and D-48 in the V2 review, grilling round 1); architect (the guards and wording, proposed)
supersedes: D-24's "verified Fundis sort first" rule; ADR-22's listings sortKey tiers
amends: find-a-fundi spec §4 ("no ranking … language", readout "Verified first") and §7 rule 3; R-17 mitigation
relates-to: ADR-26 (price is a filter, never a rank), ADR-27 (M-Pesa only for our own fees)
---

# ADR-28: Paid subscription (Fundi Pro) and a labelled ranking boost

## Context

The operator wants Fundis to pay a subscription, **Fundi Pro**, so they "easily get jobs". It buys a WhatsApp link and a higher place in Job responses and in Find a fundi; later, AI voice search (roadmap). In round 3 the operator chose that **Fundi Pro ranks first, verified or not**, "because they pay inside the platform": Pro (within Pro, verified first) → verified → Demo (as today) → not yet verified. The only V2 subscription is Fundi Pro; a Client tier, **Enterprise Pro**, is future.

Until now the only thing that moved a Fundi up was verification (ADR-22 tiers: real verified → Demo → real not yet verified). That order, together with the neutral "Not yet verified" label, was the main mitigation for R-17 (Clients mistaking an unverified Fundi for a vetted one).

Paid placement in a list of people is a representation to the Client. Consumer Protection Act 2012 s.12(2)(a)–(c) treats as false or misleading a representation that services have "sponsorship, approval … or qualities they do not have", that the supplier has "approval, status, affiliation" they don't have, or that services are of "a particular standard, quality, grade" if they are not (Kenya Law, fetched 2026-09-26). Competition Act (Cap. 504, Rev. 2022) s.55(a)(ii), (v) and (vi) make similar false representations an offence (CAK copy, fetched 2026-09-26). If a paid place looked like a verification, Smart Fundis would be making exactly that kind of claim.

## Decision

1. **Order** in Job responses and on `/fundis` (default and "near me"): real Fundi Pro verified in scope → real Fundi Pro not yet verified → real verified → Demo → real not yet verified; then distance band (near me) and the existing time key. "Verified" keeps its D-25 meaning in scope (a Badge or the Expert verifier mark). Area text search keeps relevance order (a Convex constraint).
   **Safety Trades exception (D-48):** on **Electrical and Solar**, verified comes first and Pro is tagged within each tier: verified Pro → verified → Demo → not-yet-verified Pro → not yet verified. Every other Trade keeps the order above (D-44).
2. **Disclosure on the result itself (D-47).** Every Fundi Pro result carries the tag **"FUNDI PRO · PAID"** (SW **"FUNDI PRO · AMELIPIA"**), on Job responses, `/fundis` cards **and** `/f/[id]`. The tag is a 48 px button; tapping it opens the US-8.32 explanation: "This fundi pays Smart Fundis to appear first. It says nothing about their skill. Only ✓ badges are verified by Smart Fundis." Every list that contains one shows the legend **"Pro = paid subscription, not a verification."** SW draft **"Pro = amelipia ili aonekane kwanza, si uthibitisho wa ujuzi"**, pending a native-speaker check (R-20); the earlier draft's "usajili" is dropped because it reads as official registration. The forbidden-word copy test allow-lists "Paid".
3. A subscription **never** creates or implies a Badge, never sets `verified`, never uses "Verified by Smart Fundis", the ✓ or the amber tick. The tag is a dashed outline with a receipt icon and the word PAID, styled unlike a Badge or the Expert verifier mark (marketplace spec §13 tag table).
4. The **"Verified only"** chip always filters to verified Fundis, Pro or not.
5. `listings` gains a public `subscriber` flag and the five-tier `sortKey`; Fundi Pro start, expiry and refund call `syncListing` in the same mutation. Job responses (`interests.listForJob`) read `listings.subscriber`, not the subscription at query time. **On `prod`, only `mode: "production"` subscriptions set `subscriber`**: a sandbox subscription never boosts a real visitor's results (review rai S1).
6. Price is still never a rank (ADR-26). Fundi Pro is the only paid placement. Jobs are never boosted.
7. Fundi Pro's WhatsApp link is shown to any Client in V2 (operator round 4), through `contact.reveal` with `requireClient` and the per-Fundi cap (D-46); a Client's number and WhatsApp are never shown to a Fundi. Fundi Pro is monthly, renewed by a manual STK Push, with a reminder 10 days before it lapses; the price is KSh 200 a month (operator round 6).

## Options considered

### Option A: No ranking effect (Pro buys WhatsApp only)

| Dimension | Assessment |
| --- | --- |
| Honesty | Strongest; order means verification only |
| Fit | Rejected: the subscription must help Fundis "easily get jobs" |

### Option B: Pro first within each verification level (verified Pro > verified > unverified Pro > unverified)

| Dimension | Assessment |
| --- | --- |
| Honesty | "Verified first" stays true; payment can't bury a verified Fundi |
| Fit | The Architect's earlier recommendation; the operator chose Option C |

### Option C: Pro first, verified or not, always tagged (operator's choice)

| Dimension | Assessment |
| --- | --- |
| Revenue | The strongest reason to subscribe |
| Honesty | An unverified Pro can sit above an Expert-approved Fundi (except on Electrical and Solar, D-48); mitigated by the "PAID" tag on the result, the legend, the chip and distinct Badges |
| Complexity | One flag, a five-tier sortKey, three extra `syncListing` callers |

## Trade-off analysis

Option C gives the operator the clearest paid benefit at the cost of the product's simplest promise ("verified first"). What keeps it honest is disclosure: a paid place is always visibly paid, on the result itself ("FUNDI PRO · PAID", D-47), the legend says in one line that Pro is not a verification, the ✓ stays the only verification signal, and the Client can hide everyone unverified with one chip. That is the safer reading under CPA s.12 and Competition Act s.55, but it is weaker than Option B, and R-17 and R-37 record the residual risk. On the safety Trades, Electrical and Solar, where an unskilled job can injure someone, Option B applies (D-48). If complaints or reports show Clients reading "Fundi Pro" as a quality mark elsewhere, Option B is the fallback for every Trade and needs only a sortKey change.

## Consequences

- Marketplace spec §8.2, §8.4a, §15.2, §16 (`pro` on `ResponseRow` and `ListingCard`) and tests §17 #15, #37–39; payments spec §5.2 and tests 6, 20, 21.
- The find-a-fundi readout "Verified first" becomes "Fundi Pro first, then verified" (on Electrical and Solar, "Verified first", D-48), with the legend beside it.
- Tests: the D-48 order on Electrical and Solar; a sandbox subscription on `prod` leaves `subscriber` false; the word-boundary forbidden-word test allow-lists "Paid".
- `/roadmap` loses "Fundi Pro" when V11 (next sprint) ships and gains "Enterprise Pro", "In-app chat for subscribers" and "AI voice search".
- The designer adds the tag and legend to the dashboard system (V2-40); rai-reviewer signs off the EN and SW copy, and a native speaker checks the SW tag and legend (R-20).
- R-17 (weakened mitigation), R-36 and R-37 track the risks.
