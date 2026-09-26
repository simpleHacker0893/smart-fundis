# V2-00 — Domain research (background)

Run this first. The other V2 prompts read its output. It runs as background agents, so you can start V2-10 prep while it reads.

> The first run was started on 2026-09-26 and writes `docs/research/2026-09-26-kenya-domain-research.md`. Re-run this prompt only to refresh that file, or run part B on its own.

## A. Kenya market, law and payments

```
/mattpocock-skills:research Kenya domain research for Smart Fundis Version 2 (dashboards, Client job posts,
proximity search). Primary sources only, every claim cited with URL and access date, and "UNVERIFIED" instead of
a guess.

Read CONTEXT.md and planning/slices/V6.md first for the vocabulary. Cover:
1. Competitors in Kenya/Nairobi for hiring fundis, artisans, mechanics and beauty services, and for posting small
   jobs. VERIFY each one is operating now (live app/site, app-store update date, recent news). For each: what it
   does, how it vets workers, pricing and commission, how location and discovery work, payment method, and the
   gap Smart Fundis could fill.
2. Formal skill vetting: NITA trade tests, KNQA and RPL, TVET CDACC, EPRA electrician licences and NCA
   registration. What each one certifies, and why our copy must say "verified by Smart Fundis".
3. Nairobi price ranges for common small jobs, and whether platforms show fixed prices, ranges or quotes.
4. Geo: the 47 counties and sub-county/ward lists (official source), landmark-based addressing, location privacy,
   map providers usable from Next.js (Google Maps Platform, Mapbox, MapLibre + OSM) with their official pricing,
   and approximate/fuzzed location patterns. Also check the Convex geospatial component (@convex-dev/geospatial)
   in the live Convex docs.
5. M-Pesa Daraja: STK Push, C2B, B2C, transaction status, sandbox vs go-live requirements, tariffs, and CBK /
   National Payment System Act limits on holding client money (escrow).
6. Data protection: Kenya DPA 2019 and the 2021 Regulations (registration, consent, sensitive data including
   biometrics from face and voice video, children, cross-border transfer to US GPU/cloud, DPIA, breach notice),
   ODPC enforcement examples, and consumer-protection rules on reviews and ratings.
7. A separate "Implications for V2" section tying each design implication to a cited finding.

Save to docs/research/<DATE>-kenya-domain-research.md (docs/research/ is the convention for research notes).
Change no other file.
```

## B. NVIDIA fit for the dashboards (run in parallel with A)

```
Use nvidia-skill-finder and the official NVIDIA docs listed in docs/research-links.md. Research, with citations:
1. What Cosmos Reason 2 outputs we can surface in dashboards: timestamped observations, reasoning traces and
   confidence. Say which of these ADR-11 and the Responsible-AI rules (PRD §8) let us show, and to whom (Fundi,
   Expert or Admin).
2. What Nemotron (the model already in ai-service/app/nemotron.py) could safely do in V2: structuring a Client's
   free-text job post into Trade + task + county/area + budget; plain-language Fundi feedback in English and
   Kiswahili; matching a job to Trades. For each: latency and cost on the Brev box, the structured-output API,
   and the failure mode if it's wrong.
3. Any NVIDIA UI or design guidance worth borrowing for AI-evidence displays. Say plainly if there is none, and
   say that we must not use NVIDIA branding as our own.

Write the result as a section "NVIDIA fit" appended to the research file from part A (or
docs/research/<DATE>-nvidia-fit.md if A is still running). Change no code.
```

**Next:** when both files exist, open a fresh session and run `V2-10`.
