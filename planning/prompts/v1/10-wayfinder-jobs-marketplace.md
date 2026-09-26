# 10 — Map the jobs marketplace (wayfinder)

Start **session B**, separate from V1, with this as the first message. This effort is too large and unclear for one session, so it's charted as decision tickets before anything is specced.

```
/mattpocock-skills:wayfinder Destination: a buildable spec for the Smart Fundis jobs marketplace. Clients post jobs for a skill or service; Fundis find and respond to jobs by location and proximity (Nairobi and other urban areas); matching weighs proximity, skill, verification (Badges, the Expert verifier mark) and pricing; everything sits on top of the existing verification loop and the V6 Find a Fundi discovery.

Before charting, read: AGENTS.md, CONTEXT.md, docs/adr/* (ADR-6 geohash, ADR-7, ADR-9, ADR-20 to 22), planning/DECISIONS.md (D-2, D-18 to D-29+), docs/superpowers/specs/2026-09-26-find-a-fundi-design.md, docs/research/2026-kenya-services-marketplace.md (step 00) and docs/PRD.md §10.

Chart decision tickets (questions whose answer is a decision, not a build task) on the GitHub tracker, labelled `wayfinder` and `slice:v7`. Expect at least:
1. **Client accounts:** the Clerk role, onboarding, what a Client can see and do, identity checks, and abuse limits.
2. **Job model:** fields (trade, task, location, budget or "ask for quote", timing, photos), lifecycle (draft → open → matched → done → closed), expiry, and editing.
3. **Response model:** direct contact (the V6 phone reveal), quotes inside the app, or invites; who sees what, and when.
4. **Geo and proximity:**
   - location capture (pin, estate or area picker, GPS with consent), and precision and fuzzing so a home address is never shown
   - the geo index in Convex (geohash buckets, ADR-6)
   - the map provider (cost, offline and low-bandwidth), the distance display, and KDPA consent
5. **Ranking and matching:** how proximity, verification, skill match, rates, recency and response rate combine; fairness to unverified Fundis; and no pay-to-rank unless declared.
6. **Pricing and payments:** budgets vs Fundi rates vs platform fees (/pricing); M-Pesa (Daraja) now or later; escrow; and the commission model already planned (PRD §10: 2.5% + 2.5%).
7. **Trust and safety:**
   - scams (deposit fraud, fake jobs), reporting and moderation, the Admin tools
   - ratings and reviews (in or out)
   - dispute handling
8. **AI helpers with NVIDIA Nemotron:** a job-description helper, trade classification of a free-text job, a match explanation. Each needs a rai-reviewer sign-off (the model sees no personal data, and a human confirms).
9. **Notifications:** SMS, WhatsApp, email and push; cost; and opt-in.
10. **Legal:** KDPA (location, phone), the terms of service, and liability ("we verify skills, not conduct").
Resolve one ticket at a time with me, using mattpocock-skills:grilling. Facts are your job and decisions are mine. Use engineering:system-design for the geo and matching architecture options. Plan, don't build.
When the map is clear, tell me to run prompt 11.
```

**Agents:** architect (for ADR drafting), designer (for early flows once tickets 2–4 are decided). **Skills:** mattpocock-skills:wayfinder, mattpocock-skills:grilling, engineering:system-design, engineering:architecture.
