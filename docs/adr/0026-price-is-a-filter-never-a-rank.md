---
status: proposed
date: 2026-09-26
deciders: architect (proposed); operator to confirm
extends: CONTEXT "Rates" ("Smart Fundis never suggests, compares or sorts by Rates"), find-a-fundi spec §7 rule 4
---

# ADR-26: Price is a filter, never a rank

## Context

The operator wants "pricing should matter" in V2. V2 adds a Client's **Budget** on a Job; Fundis already have self-declared **Rates**; the operator chose no price amount on Interests for now (V2-Q4) but may add one later. In Kenya, trade prices are mostly ranges, "from" prices or "contact for price" (research §3, N3.1), and no platform sets labour prices. Ranking people by price pushes Fundis to underbid and implies Smart Fundis judges value, which Consumer Protection Act s.12 and Competition Act s.55 make risky if wrong. Our only quality signal is the Badge. Paid subscriptions (round 2) do move Fundis up, but that is a separate, labelled mechanism (ADR-28), not a price ranking.

## Decision

1. No list is ever ordered by Rates, Budget or any future Interest price. Orders are verification (in the relevant Trade), the labelled subscription tier (ADR-28), distance band, then time.
2. A User may **filter** by price: Fundis by "Budget at least KSh X" on the Job board. Filters always say what they hide.
3. Every price carries its owner: "Set by the fundi — not verified", "Budget set by the client".
4. Smart Fundis never computes an average, a "typical price", "best value" or "cheapest", never pre-fills a budget, and the AI never invents a price.
5. No price filter on `/fundis` in V2, because Rates mix units.
6. If a price is ever added to Interests, rules 1–4 apply to it unchanged.

## Options considered

### Option A: Sort by price

| Dimension | Assessment |
| --- | --- |
| UX | Familiar from e-commerce |
| Harm | A race to the bottom; implies we judge value; ignores skill |

### Option B: No price features at all

| Dimension | Assessment |
| --- | --- |
| UX | Fundis can't skip Jobs below what they charge |

### Option C: Filter, never rank (chosen)

| Dimension | Assessment |
| --- | --- |
| UX | People can hide what doesn't fit their budget |
| Honesty | Order reflects verification and distance only |

## Trade-off analysis

Option C lets price matter to the person deciding without Smart Fundis making a claim about value, and extends to future prices. The cost is a little e-commerce familiarity.

## Consequences

- A test swaps Budgets and Rates between fixtures and asserts no order changes; subscription ordering is tested under ADR-28 (marketplace spec §17 #15, #37–39).
- The copy test forbids "cheapest", "best price", "best value", "premium fundi".
