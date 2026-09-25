# Handoff: LangSmith tracing foundation (D-14)

## What changed

- **Skills:** installed `langchain-ai/langsmith-skills` into `.claude/skills/`: `langsmith-trace`, `langsmith-dataset`, `langsmith-evaluator` and `langsmith-custom-apps`. They're pinned in `skills-lock.json`.
- **`ai-service/`:** a minimal uv project (`pyproject.toml`, `uv.lock`) with langsmith, python-dotenv and pytest. Ticket #7 extends it.
- **`ai-service/app/tracing.py`:** the only LangSmith client the pipeline may use.
  - Its `anonymizer` is an allow-list mask covering inputs, outputs, metadata and errors, which implements ADR-13.
  - `configure_tracing()` loads the repo-root `.env` and defaults `LANGSMITH_PROJECT=smart-fundis-agent`.
  - `traced()` traces plain functions and `pipeline_context()` traces LangGraph runs.
  - `uv run python -m app.tracing` sends a smoke trace.
- **`ai-service/tests/test_tracing.py`:** 9 tests. They cover:
  - video URLs, prompts, `messages` and feedback text are masked
  - structural fields are kept
  - URLs are masked even under allowed keys
  - errors reduce to the exception type
  - every client upload path is masked
  - the project default doesn't override a value that's already set
  - the client isn't built before the key is loaded
- **Docs:**
  - `LANGSMITH_PROJECT` added to PRD §7 and `.env.example`.
  - D-14 in `planning/DECISIONS.md`.
  - A Tracing section in `ai-service/README.md`.
  - The LangSmith skills added to the AGENTS.md role table, and a `tracing.py` rule added to its non-negotiables.
  - The skills repo linked in `docs/research-links.md`.

## How to verify

```bash
cd ai-service && uv sync && uv run pytest     # 9 passed
node scripts/check-env-example.mjs            # check:env OK
```

For an end-to-end check, set `LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY` and `LANGSMITH_PROJECT=smart-fundis-agent` in the repo-root `.env`, then run `uv run python -m app.tracing` and find the `tracing_smoke` trace in LangSmith. This wasn't run here, because the local `.env` had no LangSmith key.

## Acceptance

- The PRD §8 item "LangSmith traces masked: no video URLs, prompts or feedback text" is enforced in code and by tests. It's re-checked once the real pipeline (P4.2) is traced.

## Next agent

- P4.2 (the LangGraph pipeline) should wrap `graph.invoke` in `pipeline_context(...)` and trace non-LangChain steps with `@traced`. New trace fields stay masked until they're added to `SAFE_KEYS`.
- `traced` supports sync functions only.
