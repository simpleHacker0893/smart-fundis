# V1 planning: dashboards for every role, plus the jobs marketplace map

This folder holds the prompts for the next planning phase. Paste them **one at a time**, in order. The generic loop prompts in `planning/prompts/` (40 implement, 50 PR, 60 close) are reused for building.

**Planning only.** No prompt here changes application code until step 06.

```
00 domain research (background) ─┐
                                 ├─▶ 01 scope reconciliation (you decide the conflicts)
                                 │
   ┌─────────────── V1: dashboards on the MVP loop ───────────────┐
   │ one session: 02 grill ─▶ 03 spec ─▶ 04 design ─▶ 05 tickets    │
   │ /clear ─▶ 06 build (/next-task per ticket) ─▶ 07 close V1     │
   └───────────────────────────────────────────────────────────────┘
   ┌──────── Jobs marketplace (V7+): too big for one session ──────┐
   │ 10 /wayfinder map ─▶ resolve decision tickets ─▶ 11 slices     │
   │ each slice then runs the normal 10–30 → 40/50 → 60 loop       │
   └───────────────────────────────────────────────────────────────┘
```

| # | File | Run in | Agents | Skills (bold = slash-only, start the message with it) | Output |
| --- | --- | --- | --- | --- | --- |
| 00 | `00-domain-research.md` | a fresh session | general-purpose (background) | **/mattpocock-skills:research**, Firecrawl search, design:research-synthesis | `docs/research/2026-kenya-services-marketplace.md` |
| 01 | `01-scope-reconciliation.md` | a fresh session | architect, rai-reviewer | anthropic-skills:120x-architect, mattpocock-skills:grilling, engineering:architecture | decisions D-29+, an updated slice map, a revised `planning/slices/V1.md` |
| 02 | `02-grill-v1-dashboards.md` | new session **A** | main session (architect role), ai-pipeline and designer for facts | **/mattpocock-skills:grill-with-docs**, mattpocock-skills:codebase-design | shared understanding, CONTEXT and ADR updates |
| 03 | `03-spec-v1.md` | same session A | — | **/mattpocock-skills:to-spec** | the `V1 spec` issue |
| 04 | `04-design-v1-dashboards.md` | same session A | designer, architect, rai-reviewer | stitch-design:generate-design, stitch-utilities:enhance-prompt, design:ux-copy, design:accessibility-review, mattpocock-skills:codebase-design | Stitch prompts 24–31, generated screens, and a "Design" comment on the spec |
| 05 | `05-tickets-v1.md` | same session A | — | **/mattpocock-skills:to-tickets** | V1 tickets, with blocking edges |
| 06 | `06-build-v1.md` | a fresh session per ticket | convex, auth, frontend, ai-pipeline, qa | **/next-task** (runs prompts 40 and 50), mattpocock-skills:tdd, convex-reviewer, code-review | one PR per ticket |
| 07 | `07-close-v1.md` | a fresh session | code-reviewer, rai-reviewer, qa, architect | **/review-phase**, 120x-architect | `docs/reviews/V1.md`, updated STATE |
| 10 | `10-wayfinder-jobs-marketplace.md` | a fresh session **B** | architect, then designer | **/mattpocock-skills:wayfinder**, mattpocock-skills:grilling, engineering:system-design | a map of decision tickets for jobs, client accounts, geo and pricing |
| 11 | `11-jobs-slices.md` | session B, once the map is clear | architect | **/mattpocock-skills:to-spec**, **/mattpocock-skills:to-tickets** | slice briefs V7 onwards, and their spec issues |

## Conflicts step 01 settles first
Your brief collides with locked decisions. Nothing is decided silently; step 01 puts each conflict to you.
1. **YouTube and TikTok as video input.** ADR-7 says links are showcase only, never downloaded, and never earn a Badge, because only an in-app video carries the paper Liveness code (ADR-19). The recommendation: an in-app upload earns Badges, and links show as "Showcase, not verified" (V6 already does this).
2. **Clients posting jobs.** D-2 says clients have no account in the MVP, and Client accounts are a roadmap item. Job posting needs accounts, moderation and anti-fraud, so it's a new slice family (V7+), after V1 and the V6 core.
3. **Geo-mapping and proximity.** ADR-6 (geohash) is post-MVP, and V6 chose county plus area with no maps (D-18). Proximity ranking needs location consent, a geo index and a map provider. It goes into the step-10 map.
4. **Pricing.** V6 rates are self-declared ("Set by the fundi, not verified"). Job budgets and quotes belong to the jobs map, while `/pricing` covers the platform's own fees.
5. **Nemotron and Cosmos in the dashboards.** Show the Cosmos Observations with timestamps and the Nemotron Verdict and feedback; that part is already in the spec. New AI helpers, such as drafting a bio, a job description or a match ranking, are **new AI features** that need a rai-reviewer sign-off.

## Order and dependencies
- Step 00 can run in the background while you run 01.
- V1 builds on V0: #6 (CI and Vercel) and #8 (Brev) are still open. V1 uses the **stub worker**, so it doesn't need #8.
- The V6 discovery core (#31) lands right after V1 and before V5 (D-27).
- The jobs marketplace is mapped now and built after the demo, unless step 01 decides otherwise.

## Rules every prompt carries
pnpm only (D-12); all local secrets in the root `.env` (D-13); every Convex function checks identity and role on the server; every string goes through next-intl, in English (consent in English and Kiswahili); amber is punctuation only (D-9); "verified by Smart Fundis", never "certified"; nothing looks live that isn't; one branch and PR per ticket, and the Architect merges.
