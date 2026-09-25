# ai-service

Python service for the AI pipeline (FastAPI + LangGraph), run on the Brev box. It is not a pnpm workspace package.

This folder is still mostly a skeleton. It has a minimal uv project (`pyproject.toml`, `uv.lock`, pytest) and the LangSmith tracing module. Ticket #7 (V0: ai-service scaffold) adds FastAPI `/health`, ruff and the rest of the scaffold.

- `app/`: the service code (ai-pipeline owns it). `app/tracing.py` is the tracing setup.
- `eval/`: eval clips list and results (qa owns it)
- `scripts/`: vLLM serving and smoke scripts (gpu-devops owns it)
- `tests/`: pytest tests, with fixtures in `tests/fixtures/`

Secrets (`NVIDIA_API_KEY`, `LANGSMITH_API_KEY`, the Hugging Face token) are never committed. On the Brev box they're set in the box's environment. For local runs they go in the git-ignored repo-root `.env`, which `app/tracing.py` loads by path. Values already in the environment always win.

## Run

```bash
cd ai-service
uv sync
uv run pytest
```

## Tracing (LangSmith)

Traces go to the LangSmith project **`smart-fundis-agent`** (D-14). Three env vars control it:

| Variable | Value |
| --- | --- |
| `LANGSMITH_API_KEY` | Your LangSmith key. |
| `LANGSMITH_TRACING` | `true` to send traces. When it's unset or has no key, nothing is sent. |
| `LANGSMITH_PROJECT` | `smart-fundis-agent`. This is also the default when it's unset. |

**Masking (ADR-13).** Traces must never contain video URLs, prompts or feedback text. `app/tracing.py` builds the only LangSmith client the pipeline may use. That client's `anonymizer` runs on inputs, outputs, metadata and error text before upload:

- **An allow-list.** A string is kept only under a structural key in `SAFE_KEYS`, such as `assessment_id`, `trade`, `rubric_item_id`, `observed`, `verdict` or `status`. Every other string becomes `[masked]`. That includes prompts, `messages`, `feedback_en`/`feedback_sw` and `video_url`.
- **URLs are always redacted**, even under an allowed key.
- **Errors keep only the exception type**, because tracebacks can quote prompts or URLs.
- **Numbers, booleans and None are kept.** Timestamps and durations stay visible.

A new field is masked until someone adds its key to `SAFE_KEYS`. Only allow-list keys that can never hold free text or a URL.

**Using it:**

```python
from app.tracing import configure_tracing, pipeline_context, traced

configure_tracing()  # once at startup: loads the repo-root .env, defaults the project

@traced("rules")  # a plain function, traced through the masked client
def apply_rules(observations: list[dict]) -> dict: ...

with pipeline_context(assessment_id=assessment_id):  # LangGraph/LangChain runs
    graph.invoke(state)
```

Don't use `langsmith.traceable` or `langsmith.Client` directly, because they bypass the mask. `traced` supports sync functions; add an async variant when the pipeline needs one.

**Check the setup.** Set `LANGSMITH_TRACING=true` and your key in the repo-root `.env`, then run:

```bash
uv run python -m app.tracing
```

It sends one masked `tracing_smoke` trace and prints the project name. Look for it in LangSmith under `smart-fundis-agent`.

**Query traces.** The `langsmith-trace` skill (installed in `.claude/skills/`) covers the `langsmith` CLI, for example `langsmith trace list --project smart-fundis-agent --limit 10`.
