# 10 — Grill a slice

Paste the whole block **as the first message** of a fresh session. `grill-with-docs` can only be started by a slash command at the very start of a message. Claude can't start it for you.

```
/mattpocock-skills:grill-with-docs Slice: <SLICE>

Read AGENTS.md, CONTEXT.md, docs/adr/, docs/superpowers/specs/2026-09-25-architecture-design.md,
planning/STATE.md, planning/slices/<SLICE>.md, docs/reviews/, and every closed spec issue from earlier slices
(gh issue list --state closed --label spec).

Start from the "Grill focus" list in planning/slices/<SLICE>.md. That list is where to start, not a limit.
- Work in rounds. Number each question and give your recommended answer.
- Find the facts yourself: the codebase, the live docs (docs/research-links.md), and nvidia-skill-finder for GPU
  and model questions. For a library or version fact, send a subagent to fetch the live docs, and bring back
  only the answer. Only ask me for decisions.
- Use mattpocock-skills:codebase-design when a question is about module shape or where a seam goes.
- Invent concrete edge-case scenarios for every status change and role check this slice touches.
- Update CONTEXT.md as soon as a term is settled. Offer an ADR only when all three ADR tests are met.
- If an answer changes the architecture spec, say so and update that section of the spec too.

Stop when every branch has been visited, and ask me to confirm we have a shared understanding.
Don't write the spec issue in this session. That's prompt 20, in the same session.
```
