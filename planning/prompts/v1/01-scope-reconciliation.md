# 01 — Scope reconciliation: fit the new brief into the plan

Run this in a fresh session. You make the decisions; the agents gather the facts.

```
You are the main session, in the Architect role. Read: AGENTS.md, CONTEXT.md, docs/adr/*, planning/DECISIONS.md, planning/RISKS.md, planning/STATE.md, planning/slices/V1.md–V6.md, docs/superpowers/specs/2026-09-25-architecture-design.md, docs/superpowers/specs/2026-09-26-find-a-fundi-design.md, docs/PRD.md (§1 scope, §5 roles, §6 stories, §8 RAI, §10 later phases), and docs/research/2026-kenya-services-marketplace.md if step 00 has finished.

The operator's new brief:
- Dashboards for every user (Fundi, Client, Expert, Admin).
- Fundis submit work videos by in-app upload **or** YouTube/TikTok links.
- Fundis find jobs.
- Clients find Fundis and **post jobs** for a skill or service.
- Location with **geo-mapping and proximity** in Nairobi and other urban areas.
- Ranking by proximity, skill, verification and **pricing**.
- Designed around the NVIDIA Nemotron and Cosmos AI.

Load anthropic-skills:120x-architect and mattpocock-skills:grilling. Use the `architect` subagent to write an impact analysis. For each part of the brief, give the decisions and ADRs it touches: ADR-6 geohash post-MVP, ADR-7 links showcase-only, ADR-19 paper liveness code, D-2 clients have no account, D-18 county+area and no maps, D-20/D-24 listing, D-27 V6 core timing, PRD §1 out of scope (marketplace, bookings, payments), and the privacy promises on /privacy and /responsible-ai. Include the cost (slices, risk, timeline) and a recommendation.

Then grill me, one numbered question per conflict, each with your recommended answer:
1. Video input: in-app upload earns Badges, and YouTube/TikTok links are showcase only (keep ADR-7)? Or would a verification path for links break liveness (ADR-19)? Explain why.
2. Client accounts and job posting: when do they arrive (a V7 slice after the demo, or earlier)? Clerk role "Client", moderation, and anti-fraud.
3. Geo and proximity: keep county+area for V1/V6 and map proximity in the jobs phase (geohash in Convex, a map provider, location consent under KDPA)? Or pull proximity forward?
4. Pricing: Fundi rates (self-declared, V6), job budgets and quotes (jobs phase), platform fees (/pricing). Which of these, and when?
5. Nemotron and Cosmos in the dashboards: which AI surfaces are in V1? The recommendation: Cosmos Observations with timestamps plus the Nemotron Verdict and feedback, which exist in the contract. Which new AI helpers (bio drafting, job-description helper, match ranking) go to rai-reviewer for later?
6. What V1 must now contain. The recommendation:
   - V1 keeps the MVP loop (spec §9)
   - it adds role dashboards: Fundi (profile, record/upload, assessments, Badges, AI feedback, showcase links), Expert (queue, review with timestamp jump), Admin (minimal: Experts, overrides stub) and Client (none yet, since there are no accounts, or a signed-out "saved searches" stub? Decide)
   - the jobs marketplace becomes V7+
Ask the rai-reviewer subagent to check the recommendations against PRD §8 before you ask me.

After I answer:
- Add decisions D-29 onwards to planning/DECISIONS.md, and ADRs where all three ADR tests are met (engineering:architecture format).
- Rewrite planning/slices/V1.md: demo, scope, grill focus, risky tickets.
- Add a stub planning/slices/V7.md, "Jobs marketplace (to be mapped)", pointing to prompt 10.
- Update planning/STATE.md and RISKS.md.
Commit on branch `plan/v1-scope` as "docs: V1 scope reconciliation and dashboards brief", push it, and open a docs PR. Tell me to run prompt 02 next, in a new session.
```

**Agents:** architect, rai-reviewer. **Skills:** 120x-architect, grilling, engineering:architecture.
