# V2-20 — Write the V2 design spec and ADRs

Run this straight after V2-10, in the **same** session. It starts with `120x-architect`, which the model can invoke itself, so this doesn't need to be the first line.

```
Use anthropic-skills:120x-architect (Architect layer) with superpowers:writing-plans for structure,
engineering:architecture for the ADRs, and mattpocock-skills:codebase-design for module seams.

Turn the V2-10 grilling into records. This is planning only: change nothing in web/, convex/ or ai-service/.

1. Spec: write docs/superpowers/specs/<DATE>-v2-marketplace-design.md in the same shape as
   2026-09-26-find-a-fundi-design.md. Include:
   - operator decisions (OD-/Q- ids)
   - roles and routing
   - the data model: new tables, indexes and changes to users / fundiProfiles / listings
   - the Job lifecycle as a state table
   - the location model and privacy
   - the ranking and filter rules
   - pricing labels
   - payments (in, or explicitly out)
   - AI in the dashboards: which Cosmos and Nemotron outputs, which roles see them, the ADR-11 guard, and
     the fallback
   - consent and the privacy table
   - honesty and copy rules
   - a test-case list (numbered, like find-a-fundi §12)
   - out of scope
   Where it amends the architecture spec, add an "Amended <DATE> (D-n)" note in that spec section too, as D-18
   did.
2. ADRs: add docs/adr/0023-… onward, one per decision that passes the three ADR tests. Likely: Client accounts
   and the derived Client role; Jobs; the location model and proximity (superseding PRD ADR-6); price as a
   filter, not a rank; M-Pesa scope. Each ADR names what it supersedes.
3. planning/DECISIONS.md: add D-29 onward, and mark the superseded rows the way D-19 is marked.
4. planning/RISKS.md: add risks, including map-provider cost, location privacy, Job spam and scams, fake
   Client accounts, M-Pesa/CBK licensing, Nemotron mis-structuring a Job, and ODPC registration.
5. CONTEXT.md: finalise the new terms and the changed ones ("Client", "Roadmap", "Rates").
6. AGENTS.md: if a non-negotiable changes (for example "Post-MVP features appear only on /roadmap"), do NOT
   edit it. Write the proposed diff into the spec's "Proposed AGENTS.md changes" section for me to apply, the
   way the find-a-fundi spec §14.1 did.

Before writing the data-model section, dispatch the convex:convex-expert subagent (read-only, pnpm, and tell it
to read convex/_generated/ai/guidelines.md and the live Convex docs) to answer: geospatial component vs our own
geohash index, pagination with distance sort, search-index + geo combinations, and bandwidth cost at 10k
Listings and 2k open Jobs. Put its answer, with doc links, in the spec.

Show me the spec outline first, then the full draft. Iterate until I approve it. Then commit on a docs branch
(docs/v2-spec) with a message ending in the repo's Co-Authored-By line. Don't open a PR unless I ask.

Then tell me to open a fresh session and run V2-25.
```
