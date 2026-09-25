# ai-service

Python service for the AI pipeline (FastAPI + LangGraph), run on the Brev box. It is not a pnpm workspace package.

It is a uv project on Python 3.12 (`.python-version`) with FastAPI, pytest and ruff. V0 serves only `GET /health`; the LangGraph pipeline and model clients arrive in V2.

- `app/`: the service code (ai-pipeline owns it)
  - `main.py`: the FastAPI app and `/health`
  - `settings.py`: env settings, loaded from the repo-root `.env` (see below)
  - `tracing.py`: LangSmith tracing with ADR-13 masking
- `eval/`: eval clips list and results (qa owns it)
- `scripts/`: vLLM serving and smoke scripts (gpu-devops owns it)
- `tests/`: pytest tests, with fixtures in `tests/fixtures/`

## Run

All commands run from `ai-service/`. You need [uv](https://docs.astral.sh/uv/); it installs Python 3.12 if it's missing.

```bash
uv sync                                  # install deps from uv.lock
uv run uvicorn app.main:app --reload     # start on http://localhost:8000
curl -s localhost:8000/health            # {"status":"ok","service":"ai-service","version":"0.1.0"}
```

## Test and lint

```bash
uv run pytest -q
uv run ruff check
uv run ruff format --check               # `uv run ruff format` to fix
```

CI runs the same four commands, with `uv sync --locked` so a stale `uv.lock` fails the build.

## Settings and secrets (D-13)

Every local secret lives in **one file, the git-ignored `.env` at the repo root**. Never create `ai-service/.env`. `app/settings.py` finds the root file by path (`REPO_ROOT_ENV`), so it works whatever the current directory is. A missing file is fine, for example in CI.

- **The environment wins.** Values already set in the process (the Brev box's own env) override the file.
- **Nothing is read at import time.** Call `get_settings()` where a value is needed. `/health` reads no settings at all.
- **Secrets are `SecretStr`** (`nvidia_api_key`, `ai_shared_secret`). They never show in `repr`, logs or `model_dump()`. Call `.get_secret_value()` only where the key is used.

The names follow PRD §7 (the Brev row), plus `COSMOS_FALLBACK_MODEL`. The Hugging Face token and the LangSmith variables are read by vLLM and `app/tracing.py`, not by `Settings`.

```python
from app.settings import get_settings

s = get_settings()
s.nemotron_model  # NEMOTRON_MODEL, None until set
s.nvidia_api_key.get_secret_value()  # NVIDIA_API_KEY; check `is not None` first
```

Tests never touch the real `.env`: they use `tests/fixtures/root.env` copied into a temp dir.

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
