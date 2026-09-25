---
status: proposed
date: 2026-09-26
deciders: architect (awaiting operator review)
relates-to: D-1 (Badges derived), D-2 (Verified Fundis only)
---

# ADR-22: Listings are a derived projection, and only Verified Fundis are listed

## Context

Find a Fundi filters by Trade, county (47) and free-text area, with pagination. Badges are **derived** from approved Assessments (D-1) and never stored. A Fundi can hold Badges in several Trades, and "is this Fundi listed" depends on four tables (`assessments`, `fundiProfiles`, `users`, Admin hide). Convex indexes cannot index array fields, cannot join, and a text search index returns relevance order only and filters by equality on declared filter fields. Computing the list at read time would mean scanning every approved Assessment for every page view, and paginating over a join.

## Decision

1. **Listed = at least one Badge + `publicListing` on + not hidden by Admin.** Fundis without a Badge are not listed, whatever their Portfolio (D-19).
2. A new table **`listings`** holds a **derived, disposable projection**: one row per (Listed Fundi × verified Trade) plus one `scope: "all"` row per Listed Fundi, carrying only public card fields. Rows exist only for Listed Fundis.
3. Exactly one helper, **`syncListing(ctx, fundiUserId)`**, writes it, called inside every mutation that changes an input (the caller table in the Find a Fundi spec §10.3), so it is transactional. `listings.rebuildAll` repairs it.
4. Public discovery queries read **only** `listings` (plus storage URLs for covers). A trade filter matches verified Trades only.

## Options considered

### Option A: Derive at read time

| Dimension | Assessment |
| --- | --- |
| Complexity | Low schema, complex query |
| Performance | Scans approved Assessments per request; pagination over a join is not possible with `.paginate()` |
| Correctness | Always fresh |

### Option B: Denormalised fields on `fundiProfiles` (`verifiedTrades[]`, `listed`)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Search | Cannot index an array, so the Trade filter needs a scan |
| Privacy | Public queries read a table that also holds private fields; one missed projection leaks |

### Option C: Separate `listings` projection (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: one table, one helper, many call sites |
| Performance | One index range or one search-index query per page |
| Privacy | Public queries touch a table that contains no private field by construction |
| Risk | A missed `syncListing` call leaves stale rows |

## Trade-off analysis

Option C trades a "remember to call the helper" obligation for fast, simple, privacy-safe reads. The obligation is mitigated by a convex-test that compares the projection with a recomputation after every caller, and by a rebuild function. Badges stay derived at the source of truth; the projection is a cache we can drop.

## Consequences

- `sortKey` puts real Fundis before Demo profiles, newest Badge first; area search uses relevance order (Convex constraint).
- The V1 `reviews.decide`, V4 appeal/override, V3 profile edits and V5 `seed.demo` must call `syncListing` once V6 lands (V6 ticket 1 adds the calls).
- Empty Trades (no Rubric yet) show "Coming soon" instead of results. Operator question Q-1 records the alternative.

## Action items

1. convex: `listings` schema, `syncListing`, `listings.search`, `listings.rebuildAll`, tests 1–4 and 13–15 (plan-first ticket).
2. architect: confirm with the operator (Q-1), then mark this ADR accepted.
