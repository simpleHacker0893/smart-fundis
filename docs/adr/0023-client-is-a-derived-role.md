---
status: proposed
date: 2026-09-26
deciders: operator (V2-Q7, 2026-09-26: Client derived through a Client profile, dual roles, no responding to own Job, dashboard switcher; D-46, D-55 in the V2 review); architect (the details)
amends: ADR-18 (derived roles), D-2
completes: D-30 (Clients have accounts in V2)
---

# ADR-23: Client is a derived role, held alongside any other role

## Context

D-30 gives Clients accounts in V2 and left it to the V2 spec to say how the Client role is derived. ADR-18 derives roles in Convex (Fundi = a Fundi profile, Expert = an active approval, Admin = allow-listed verified email) and forbids a stored role. In Kenya many Fundis also hire Fundis (a mason needs a plumber), so one person will hold both roles. The current code models the base role as `"fundi" | "none"`, which can't express that.

## Decision

A User is a **Client** while a `clientProfiles` row exists for them. Roles become four independent booleans `{ fundi, client, expert, admin }`, derived on the server on every call. `requireClient` returns the caller's Client profile, and **throws when `caller.user` is null** (a signed-in identity with no `users` row is not a Client; review §3.2). A Client profile carries a phone, 18+ and the accepted terms, and every contact reveal needs one (D-46). `clients.create` is rate-limited per identity (D-46). `clientProfiles` stores **no location point**: county and ward only (D-55). `/dashboard` goes to `users.dashboardPref` if the User still holds that role, otherwise the highest role in the order Admin → Expert → Fundi → Client. The preference is never a role and is checked against the derived roles when set. A Fundi can never respond to a Job they posted as a Client.

## Options considered

### Option A: A single chosen account type (Fundi or Client) at sign-up

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Fit | Poor: dual-role people need two accounts and two emails |
| ADR-18 | Breaks it (a stored, chosen role) |

### Option B: A stored `users.roles[]` array

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Drift | The array drifts from the profiles it describes; ADR-18 rejected this for Experts |

### Option C: Derived from a `clientProfiles` row (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low: one table, one helper, one change to `Roles` |
| Consistency | Same pattern as Fundi; no drift |
| Cost | Every guard reads one more indexed row |

## Trade-off analysis

Option C keeps ADR-18's single rule ("roles are derived, never stored") at the cost of one extra indexed read per guarded call, which is negligible. The Client profile also carries data the Client role needs anyway (display name, county, terms version, posting block).

## Consequences

- `convex/lib/auth.ts`: `Roles.base` is replaced by `fundi` and `client` booleans; every caller of `getRoles` updates (V7-1).
- Onboarding offers "I need a fundi", "I'm a fundi" and "Become a verifier", in any combination.
- **18+ for existing accounts:** Fundis and Experts who signed up before the 18+ question are asked at their next sign-in, and uploads are blocked until they confirm (review rai S9).
- Rate limit `clients.create` per identity; `contactFilter` runs on `displayName` and `businessName` in `clients.create/update`, and a write to `users.phone` or the display name calls `syncListing` (review §3.2).
- The role switcher writes `users.dashboardPref` through a guarded mutation.
- `interests.create` rejects `own_job`; a test covers a dual-role User.
- Tests: marketplace spec §17 #1–3, #13.
