# 04 — Design V1: modules and dashboard screens (Stitch)

Same session A, after 03. Replace `<ISSUE>` with the V1 spec issue number.

```
Slice: V1. Spec issue: <ISSUE>

Run two design passes in parallel (superpowers:dispatching-parallel-agents).

1. The `architect` subagent uses mattpocock-skills:codebase-design to write the V1 module map. For each module: its path, public interface, what it hides, its test seam and its owner. Keep it to deep modules: an `assessments` module (the state machine), `reviews` (canDecide and decide), `ai` (the claim/callback HTTP contract), `badges` (derivation), and the web dashboard shells.

2. The `designer` subagent writes Stitch prompts for the dashboards, **one per screen**, numbered from 24 in design/stitch/prompts/. It follows design/stitch/DESIGN.md (D-9 Instrument, amber as punctuation, 360 px first), HANDOFF §0 (the v3 two-row header, the footer), and the CAUSTIC-style build-spec structure. The screen list:
   - 24 Fundi dashboard home: status of the current Assessment, Badges, "Record a skill", Showcase links (not verified), the profile summary
   - 25 Record flow: pick the Trade and Task, the Rubric preview
   - 26 The Liveness code on paper, plus the camera tips (paper-code-tip image)
   - 27 Verification consent (English and Kiswahili), with upload disabled until ticked
   - 28 Upload progress and live status (queued → analyzing → awaiting_review; reshoot with reasons; failed with "Record again")
   - 29 Assessment result (the Fundi's view): the Cosmos Observation timeline with timestamps and a video jump; the "AI recommendation" from Nemotron with plain-language feedback; the rules.py cap explained; "Waiting for an Expert" / approved Badge; never a score without explanation
   - 30 Expert queue: filtered by approved Trades, oldest first
   - 31 Expert review: the video plus the Observation list with timestamp jump, the paper-code check, the safety flags, and approve/reshoot/reject with a note
   - Admin screens use plain shadcn, so there's no Stitch prompt

   The AI UI rules (Cosmos and Nemotron): label every AI output "AI recommendation" or "AI observation". Show the evidence and timestamps, not a confidence number. Show the safety caps in amber ◐ "Needs review". The Expert's decision is the only "Verified" state. Name the models the way /responsible-ai does. Load stitch-design:generate-design and stitch-utilities:enhance-prompt. Describe photos inline, with no separate "image slot" section: an image-slot section makes Stitch render only a photo.

   Then the **main session generates each prompt in Stitch** through the API, using the key from the root .env with a long timeout (15 minutes). The script pattern is in design/LOG.md history. Download the html and png into design/stitch/exports/<NN>-<slug>-responsive.*, and log each in design/LOG.md. Show me the screenshots and stop for my approval after 24 and 29 before generating the rest.

3. The `rai-reviewer` subagent reviews the wording on 27, 28, 29 and 31 (consent, AI labels, caps, Expert decision) against PRD §8.

Show me the module map, the screenshots and the RAI result. Iterate until I approve. Then post one comment on <ISSUE>, "Design: modules and screens", with links to the exports. Tell me to run prompt 05 in this same session.
```

**Agents:** architect, designer, rai-reviewer. **Skills:** codebase-design, stitch-design:generate-design, stitch-utilities:enhance-prompt, design:ux-copy, design:accessibility-review, superpowers:dispatching-parallel-agents.
