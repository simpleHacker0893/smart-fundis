# V2-10 — Grill the Version 2 scope

Paste this as the **first message** of a fresh session. `grill-with-docs` only starts from a slash command at the start of a message.

```
/mattpocock-skills:grill-with-docs Version 2 scope: role dashboards, Fundi video input, Client job posts,
proximity search and pricing.

Read first: AGENTS.md, CONTEXT.md, docs/adr/, docs/superpowers/specs/2026-09-25-architecture-design.md,
docs/superpowers/specs/2026-09-26-find-a-fundi-design.md, planning/DECISIONS.md, planning/RISKS.md,
planning/QUESTIONS.md, planning/STATE.md, planning/slices/V0.md … V6.md, planning/prompts/v2/README.md, and the
V2 research in docs/research/ (the Kenya domain research and the NVIDIA fit). Cite the research by section when
you use it.

Context: this is planning only, so change no code. The operator's intent for V2:
- a dashboard for every role (Fundi, Client, Expert, Admin)
- Fundis add video from three sources: in-app record/upload, a YouTube link, a TikTok link
- Fundis find jobs by location and Trade
- Clients post and advertise small jobs for a Trade or service, and find Fundis by proximity, Trade,
  verification status and price
- mechanics and the other Trades across Kenya, starting with Nairobi and other urban areas
- AI features use Nemotron and Cosmos Reason 2, and their output shows up in the dashboards

Work in rounds. Number each question and give your recommended answer, grounded in the research and the
existing ADRs. Find facts yourself (codebase, live docs, a subagent for library facts, and nvidia-skill-finder
for model questions), and ask me only for decisions. Cover at least these branches:

1. Superseding decisions: D-2/D-18/D-24 (Client accounts), ADR-6 (maps and distance), the Roadmap rule, and
   the "never sort by Rates" rule. For each: supersede, amend, or keep? Which "Coming soon" Roadmap items
   become live?
2. Roles and routing: is Client a new derived role (ADR-18)? Can one user be Fundi and Client at once? How does
   /dashboard route each role (spec §4)? What does each role's dashboard have to do in its first 10 seconds?
3. Fundi video input: confirm that ADR-7 stays (links are Showcase, never downloaded, never assessed). How does
   one "Add video" entry point make the three sources and what each earns obvious? Where does a live recording
   fit?
4. Jobs: the Job lifecycle (draft → open → has interest → hired → done / expired / cancelled), who can see a
   Job, what a Fundi does with it (express interest, quote, message, call), contact rules against ADR-21,
   moderation and Reports, and whether only verified Fundis may respond.
5. Proximity: the location model (county → sub-county → ward, plus an optional pin), how precise a Fundi's
   and a Client's location may be shown (fuzzing, the ODPC angle), the map provider and cost, the ranking
   formula (distance × verification × Trade match, and whether price can be a filter but never a rank), and
   the Convex geospatial component against a geohash.
6. Pricing: Rates vs Job budgets vs quotes. What Smart Fundis shows, labels "not verified", or never computes.
7. Payments: is M-Pesa in V2 or still Roadmap? If in, which Daraja flow (STK Push only, no escrow), and what the
   research says about the CBK licence risk.
8. AI in the dashboards: which Cosmos and Nemotron outputs each role sees; whether Nemotron structures a Job
   post; the honesty wording; and what happens when the AI is wrong or down (the fallback, ADR-11).
9. Data protection: consent for Client accounts and Job posts, retention, DPIA need, the cross-border transfer
   note, and children or third parties in Job photos.
10. Competitive position: from the verified competitor table, what Smart Fundis does that no one else does,
    and which competitor features we deliberately do not copy.
11. The slice order and the smallest V2 demo that proves the marketplace loop.

Invent concrete Kenyan edge-case scenarios for every status change and role check. Examples: a Client in
Ruiru posts "fix my Probox brakes" with no Trade picked; a Fundi turns off location; a Job is posted with a
child in the photo; two Fundis claim the same Job.

Update CONTEXT.md as soon as a term is settled (for example Job, Job post, Interest, Service area, Proximity).
Record each operator answer as a Q-row in planning/QUESTIONS.md. Offer an ADR only when all three ADR tests
pass, but write the ADRs themselves in V2-20.

Stop when every branch has been visited, and ask me to confirm we share an understanding. Then tell me to run
V2-20 in this same session.
```
