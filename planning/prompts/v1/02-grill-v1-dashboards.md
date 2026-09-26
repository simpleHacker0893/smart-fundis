# 02 — Grill V1: role dashboards on the MVP loop

Start **session A** with this as the first message. Run 03, 04 and 05 in the same session.

```
/mattpocock-skills:grill-with-docs Slice: V1, role dashboards on the MVP loop

Read AGENTS.md, CONTEXT.md, docs/adr/*, planning/DECISIONS.md (D-29 onwards are from step 01), planning/slices/V1.md, docs/superpowers/specs/2026-09-25-architecture-design.md (§4 routing, §5 data model, §6 AI contracts, §7 privacy), docs/superpowers/specs/2026-09-26-find-a-fundi-design.md, docs/research/2026-kenya-services-marketplace.md, design/HANDOFF.md and design/stitch/DESIGN.md.

Start from V1.md's grill focus, and add these branches:
1. **Information architecture per role.** /dashboard routing (spec §4), then /fundi, /expert, /admin (and /client if step 01 said so). For each role: the home view, primary action, empty state, and what's in the header and account menu.
2. **The Fundi's record or upload flow.** Trade → Task → Rubric → Liveness code on paper (ADR-19) → consent (English and Kiswahili) → native camera `<input capture>` (ADR-10) or pick a file → upload progress. Showcase links (YouTube/TikTok) are a separate "Showcase" section, labelled "not verified" (ADR-7). Edge cases: poor network, a file over the size limit, 10–90 s, a wrong format, the app closed mid-upload, retry.
3. **The Assessment status UI** for every state: queued, analyzing, awaiting_review, approved, reshoot, rejected, failed. Live updates through Convex with no polling. What the Fundi sees for the guard's reshoot reasons.
4. **Showing the AI honestly (Cosmos and Nemotron).**
   - The Observation timeline: each Rubric item as yes/no/unclear, with evidence and a timestamp that jumps the video.
   - The Nemotron Verdict as "AI recommendation", never a decision.
   - The rules.py caps shown as "capped at needs review because…".
   - Confidence: show it or not? RAI says no scores unless explained.
   - The feedback in English (Kiswahili is stored but not shown).
   - What the Fundi sees before an Expert decides: the spec says the public profile shows nothing. Does the private dashboard show the AI recommendation? Decide with rai-reviewer.
5. **The Expert workspace.** The queue filtered by approved Trades, oldest first. The review screen: the video player plus the Observation list with timestamp jump, the paper-code check result, the safety flags, and approve/reshoot/reject with a note. `canDecide` rules. Keyboard use and a 360 px layout.
6. **Admin (minimal in V1).** The seeded Expert, a read-only audit log, and a stub for the override. Plain shadcn (spec §8).
7. **Badges and profile.** The Badge derivation on approval, and the unstyled /f/[id] (V6 styles it later).
8. **Performance at 360 px on a cheap Android phone and slow 3G.** What is server-rendered and what is client-rendered, and upload chunking.
Find facts yourself: the ai-pipeline agent for what Cosmos and Nemotron actually return (spec §6, app/nemotron.py), the designer agent for the existing exports, and nvidia-skill-finder for Cosmos output fields. Only ask me for decisions. Number the questions and recommend an answer. Update CONTEXT.md as terms settle. Offer ADRs only when all three tests are met.
Stop when every branch is covered, and confirm we share an understanding. Don't write the spec yet (that's prompt 03).
```
