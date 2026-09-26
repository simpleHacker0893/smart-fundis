---
status: accepted
date: 2026-09-26
deciders: operator (Q-1), architect
relates-to: D-1 (Badges derived), D-2 (amended by D-24), D-25 (Expert verifier mark)
---

# ADR-22: Listings are a derived projection; every Listed Fundi appears, and verification is shown, not required

## Context

Find a Fundi filters by Trade, county (47), free-text area and a "Verified only" chip, sorts verified Fundis first, and paginates.

The operator decided (Q-1, 2026-09-26) that **all** Fundis with `publicListing` on and not hidden by an Admin appear, not only Fundis with a Badge:
- Unverified Fundis carry a neutral "Not yet verified" label.
- Fundis who are active Experts carry an "Expert verifier · <Trade>" mark.
- The Trade filter matches declared Trades as well as verified ones.

Badges are **derived** from approved Assessments (D-1), and roles, including Expert, are derived from the `experts` table (ADR-18). Neither is stored on the profile.

What one card shows depends on six tables: `users`, `fundiProfiles`, `assessments`, `experts`, `trades` and `portfolioItems`. Convex has three limits here:
- indexes cannot cover array fields
- queries cannot join
- a text search index returns results in relevance order only, filtered by equality on declared filter fields

Computing the list at read time would mean joining those tables on every page view, and paginating over a join.

## Decision

1. **Listed** means that a Fundi profile exists, `publicListing` is on, and `hiddenByAdmin` is unset. A Badge is **not** required (D-24).
2. A new table, **`listings`**, holds a **derived, disposable projection**. Each Listed Fundi gets one row per scope:
   - one row per Trade in scope (declared ∪ Badge Trades ∪ Expert Trades)
   - plus one `scope: "all"` row

   Each row carries only public card fields:
   - `verified`: a skill Badge **or** the Expert mark in this scope
   - `badges` (at most 3) and `badgeCount`
   - `isExpert` and `expertTrades`
   - `notYetVerifiedIn`
   - `isDemo`
   - a tiered `sortKey`: real verified → Demo → real not yet verified
3. **The Expert mark is derived** at sync time from an active `experts` row with a non-empty `approvedTrades`. It is never stored on `fundiProfiles`, is displayed separately from skill Badges, and counts as "verified" for sorting and the chip **in that Expert's Trades only**.
4. Exactly one helper, **`syncListing(ctx, fundiUserId)`**, writes the table. It runs inside every mutation that changes an input, listed in the caller table of the Find a Fundi spec §10.3, which includes Expert approval, Trade change and deactivation. So the table is transactional. `listings.rebuildAll` repairs it.
5. Public discovery queries read **only** `listings`, plus storage URLs for covers. `profiles.getPublic` and `contact.reveal` re-derive the Listed rule, the Badges and the Expert mark from the source tables, and do not trust the projection.

## Options considered

### Option A: Derive at read time

| Dimension | Assessment |
| --- | --- |
| Complexity | Low schema, complex query (six tables per card) |
| Performance | A join per card; `.paginate()` cannot paginate a join; verified-first ordering is impossible without scanning |
| Correctness | Always fresh |

### Option B: Denormalised fields on `fundiProfiles` (`verifiedTrades[]`, `isExpert`, `listed`)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Search | Can't index arrays, so the Trade filter and the per-Trade verified sort need a scan |
| Privacy | Public queries read a table that also holds private fields (phone flags, hidden reasons); one missed projection leaks |
| Derivation | Stores the Expert role on the profile, which ADR-18 forbids |

### Option C: A separate `listings` projection (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: one table, one helper, about eight call sites |
| Performance | One index range or one search-index query per page; verified-first is an index order |
| Privacy | By construction, public queries touch a table with no private field |
| Risk | A missed `syncListing` call leaves stale rows (R-16) |

## Trade-off analysis

Option C trades a "remember to call the helper" obligation for fast, simple, privacy-safe reads, and it is the only option that gives verified-first ordering, the "Verified only" chip and the per-Trade "Not yet verified in <Trade>" label with plain Convex indexes. Two things mitigate the obligation: a convex-test that compares the projection with a from-scratch recomputation after every caller, and the rebuild function. Badges and Expert status stay derived at the source of truth; the projection is a cache we can drop.

Listing unverified Fundis makes the directory useful across all 12 Trades from day one, but a Client may mistake an unverified Fundi for a vetted one (R-17). Three things mitigate that: the neutral label, verified-first sorting and the chip.

## Consequences

- `listings` grows with sign-ups, not with Badges. Every Trade, including those without a Rubric, has results once Fundis declare it, and `/trades` links every Trade to `/fundis`.
- When `area` is set, the order is search relevance, not tiers (a Convex constraint). The `verified` filter field keeps the chip working.
- These must call `syncListing` once V6 lands: onboarding (profile creation), V1 `reviews.decide`, V4 appeal/override/Expert approval and deactivation, V3 profile edits, and V5 `seed.demo`. V6-1 adds these calls.
- The public profile of a Fundi whose AI `pass` awaits review shows nothing about that Assessment, and looks exactly like "Not yet verified" (D-1 holds).
- Tests: Find a Fundi spec §12, cases 1–10 and 19–20.

## Action items

1. convex: the `listings` schema, `syncListing`, `listings.search` (with `verifiedOnly`), `listings.rebuildAll`, and the listing and label tests (V6-1, plan-first).
2. frontend: the label visual rules (spec §6.1) and the chip (V6-2).
3. designer: the legend and the three label styles on screens 03 v4 and 13 v2 (V6-0a).
