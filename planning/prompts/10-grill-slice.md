# 10 — Grill a slice

```
Slice: <SLICE>

Read AGENTS.md, CONTEXT.md, docs/adr/, docs/superpowers/specs/2026-09-25-architecture-design.md,
planning/STATE.md, planning/slices/<SLICE>.md, and every closed issue and review from earlier slices
(gh issue list --state closed --label spec).

Run /mattpocock-skills:grill-with-docs on this slice. Start from the "Grill focus" list in
planning/slices/<SLICE>.md. That list is where to start, not a limit.
- Work in rounds. Number each question and give your recommended answer.
- Find facts yourself: the codebase, the live docs (docs/research-links.md), nvidia-skill-finder for GPU and model
  questions. Only ask me for decisions.
- Invent concrete edge-case scenarios for every status change and role check this slice touches.
- Update CONTEXT.md the moment a term is settled. Offer an ADR only when all three ADR tests are met.
- If an answer changes the architecture spec, say so and update the spec section too.

Stop when every branch has been visited, and ask me to confirm we have a shared understanding.
Don't write the spec issue in this session. That's prompt 20.
```
