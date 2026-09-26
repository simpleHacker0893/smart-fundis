---
status: proposed
date: 2026-09-26
deciders: operator (V2-Q8, 2026-09-26: "near me" via navigator.geolocation snapped to ~1 km; no Google; county → sub-county/ward picker + landmark; D-54, D-55, D-56 in the V2 review, grilling round 1); architect (the rest, proposed; V2-Q11 open, now a V8 dependency)
supersedes: PRD ADR-6 ("(Phase 2+) Geohash index for nearest-fundi search in Convex")
amends: D-18 ("geohash, maps and distance stay out"), ADR-22 consequences (listings gain private geo fields)
---

# ADR-25: Device location snapped to ~1 km, an administrative-area picker, distance bands, and no map

## Context

V2 needs "near me" for Jobs and Fundis. A Fundi's home pin is personal data under the Data Protection Act (s.2), and minimisation applies (s.25(d)). Kenya has no statutory street addressing, so people describe places by estate, ward and landmark (research §4, F4.4).

The Google Maps Platform terms (fetched 2026-09-26, modified 2026-06-10) allow caching Geocoding and Places coordinates for **30 days** only, allow indefinite caching only for a single End User's own view, forbid creating content from Google content, forbid use with a non-Google map, and forbid using the Core Services "in a listings or directory service" (ToS §3.2.3(d)(iii)). `@convex-dev/geospatial` is beta (v0.2.1) and sorts ascending only. On 2026-09-26 the operator chose browser location plus a county → sub-county/ward picker and dropped Google from V2.

## Decision

1. A **Location** is `county` (47) + optional **sub-county** and **ward** from our own `areas` picker (administrative units from a public dataset, V2-Q11) + a free-text **landmark** (Jobs only, shown only to a connected Fundi) + an optional **point** from the User's own device (`navigator.geolocation`), **snapped once at write time** to a 0.01° grid (~1.1 km). **V8 imports ward names only** (IEBC / LN 14/2012) for the six first counties; point capture and centroids come in V9 (D-56).
2. Points and geohashes are **never returned** by any query. People see **distance bands** only ("Within 2 km" … "Over 50 km", or "In <County>"). Results sort **by band**, never by exact km, and the server snaps every query point before it computes bands (D-55).
3. **Public and pre-hire Job bands use the ward centroid**, never the Client's point, and `clientProfiles` stores **no point** (D-55). The ~1 km snap is an explicit **floor**, not a guarantee of anonymity: repeated queries can narrow a point to about its grid cell, and we accept that. The copy says "others can tell only roughly which area (about 1 km)", never "never shown". `fundi.setServiceArea` is rate-limited.
4. **Amended (D-54):** proximity uses **`@convex-dev/geospatial` `nearest()`** behind the `ProximityIndex` interface, with one call per tier (`filterKeys: { scope, tier }`), storing only snapped points. Our own precision-5 geohash ring search stays as the **fallback** behind the same interface, and one contract suite runs against both. `convex-expert` confirms the choice in V9's first ticket. This supersedes the earlier "own geohash cells, bounded per cell" choice (D-37), whose `.take(50)` per cell returned rows that weren't the nearest and ignored tiers.
5. **No geocoding service in V2**, and no `GeoProvider` interface until a real provider exists (review §3.2). If a provider is ever added, we store only its place id and our own ward id, never provider coordinates, and counsel reads the provider's terms first.
6. **No map** in V2.

## Options considered

### Option A: Google Places + Geocoding, stored lat/lng, Google map

| Dimension | Assessment |
| --- | --- |
| UX | Best address search |
| Terms | 30-day cache limit; "listings or directory service" clause; must use a Google map |
| Cost | 10k free per SKU per month, then $2.83–$7.00 per 1,000 |

### Option B: `@convex-dev/geospatial` with exact points

| Dimension | Assessment |
| --- | --- |
| Maturity | Beta; ascending sort only; pagination on `nearest` unverified |
| Privacy | Exact points stored |

The rejection was of **exact points**, not of the component. With snapped points only, the component is the chosen index (D-54).

### Option C: Snapped device points + ward picker + bands, with `@convex-dev/geospatial` `nearest()` behind `ProximityIndex` (chosen, amended D-54)

| Dimension | Assessment |
| --- | --- |
| Terms/cost | No third-party terms or fees |
| Privacy | ~1 km floor; nothing shown but bands; Job bands from ward centroids (D-55) |
| Correctness | `nearest()` per tier returns the true nearest rows; own ring search as fallback |
| Effort | Ward names in V8; centroids and points in V9 (D-56) |
| UX | No street search; wards and landmarks are how Kenyans describe places anyway |

## Trade-off analysis

Option C trades address-search polish for zero ToS exposure, zero map cost and a privacy story we can state in one sentence. The ward import is a real cost, but it also makes a ward name mean the same place for everyone. Using a beta component risks API churn; the `ProximityIndex` interface and the own ring-search fallback, tested by the same contract suite, bound that risk (D-54). Option A stays available if counsel clears a provider's terms.

## Consequences

- New `areas` table (sub-counties and wards; names in V8, centroids in V9, D-56); a `location` value object on Client profiles (**no point**, D-55), Fundi service areas and Jobs; private snapped `point` on `listings`, indexed by `@convex-dev/geospatial` (D-54). Centroids are copied onto each Fundi or Job at write time, so `areas` edits do not propagate.
- Location consent line (EN + SW, shown to visitors too) before the first "Use my location"; turning location off deletes the point at once.
- Footer attribution for whichever public dataset supplies the centroids (for example "© OpenStreetMap contributors" under ODbL).
- Tests: marketplace spec §17 #25–29, a `ProximityIndex` contract suite run against both implementations, and a sort-by-band test.
