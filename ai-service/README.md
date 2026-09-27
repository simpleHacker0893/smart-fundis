# ai-service

Python service for the AI pipeline (FastAPI + LangGraph), run on the Brev box. It is not a pnpm workspace package.

It is a uv project on Python 3.12 (`.python-version`) with FastAPI, pytest and ruff. V0 serves only `GET /health`; the LangGraph pipeline and model clients arrive in V2.

- `app/`: the service code (ai-pipeline owns it)
  - `main.py`: the FastAPI app and `/health`
  - `settings.py`: env settings, loaded from the repo-root `.env` (see below)
  - `tracing.py`: LangSmith tracing with ADR-13 masking
  - `nemotron.py`: the hosted Nemotron structured-output smoke (see below)
  - `prompts/`: versioned prompt files
- `eval/`: eval clips list and results (qa owns it)
- `scripts/`: vLLM serving, smoke scripts and the V1 stub worker (gpu-devops owns it)
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

## Nemotron smoke (ADR-4, #9)

`app/nemotron.py` makes one hosted Nemotron call through `ChatNVIDIA` with `with_structured_output(SmokeReply)` (`trade`, `ok`, `note`). The prompt is fixed, holds no user data, and lives in `app/prompts/nemotron_smoke.v1.txt`. The call proves that the key, the model id and structured output all work before V2.

It reads `NVIDIA_API_KEY` and `NEMOTRON_MODEL` through `get_settings()`, so from the **repo-root `.env`** or the Brev env (D-13). The key is passed to `ChatNVIDIA` explicitly and never printed. Error text is scrubbed of the key (raw, base64 and URL-encoded) and of any `nvapi-` token, and errors carry no exception chain. Blank or whitespace-only values count as unset. There's no default model id. Pick one from build.nvidia.com that supports structured output, for example with `uv run python -c "from langchain_nvidia_ai_endpoints import ChatNVIDIA; print([m.id for m in ChatNVIDIA.get_available_models() if 'nemotron' in m.id])"` (this listing needs `NVIDIA_API_KEY` in your shell).

```bash
uv run python -m app.nemotron
# model: <the model id ChatNVIDIA used>
# {"trade":"electrical","ok":true,"note":"..."}
```

It exits 0 on success. A missing key or model, an HTTP error, or a reply that doesn't fit the schema prints `Nemotron smoke failed: ...` to stderr and exits 1. If LangSmith tracing is on, the run goes through `app/tracing.py` and is masked (ADR-13).

The tests (`tests/test_nemotron.py`) make no network call. They fake only `requests.Session.get`/`post` and replay `tests/fixtures/nemotron_smoke_response.json`, so the real `ChatNVIDIA` request and parsing code runs.

## Stub worker (V1, #40)

`scripts/stub_worker.py` stands in for the AI pipeline until V2. It speaks the real pull-model contract (spec §6, ADR-9; `convex/lib/aiContract.ts` is the source of truth) but runs no AI and needs no GPU. It loops:

1. `POST {CONVEX_SITE_URL}/ai/claim` with `{"workerId": "stub-<hostname>"}` and the header `Authorization: Bearer <AI_SHARED_SECRET>`.
2. On a job, it posts a **canned** result to `/ai/callback`, so the Fundi's upload goes `queued → analyzing → awaiting_review` (or `reshoot`) on its own.

**It is for dev and tests only, never for real users.** Its evidence and feedback text all start with "Stub result: no AI ran."

**The clip-name rule.** The outcome comes from the job's `clipName`, the uploaded file's name, matched case-insensitively:

| `clipName` | Callback |
| --- | --- |
| contains `reshoot` | `reshoot` with reason `too_dark` |
| else contains `review` | `result`, Verdict `needs_review`: the first safety Rubric item is `unclear` and in `safetyFlags` (the first item, unflagged, if the Rubric has no safety item), and liveness is `{read: null, check: "unclear"}` |
| anything else, or no `clipName` | `result`, Verdict `pass`: every item `yes`, liveness `{read: <livenessCode>, check: "yes"}`, no flags |

`reshoot` wins when both words appear (`review-reshoot.mp4` is a reshoot). Every result sends each Rubric item exactly once, `model: "stub-v1"`, `fallbackModel: false`, and English only (D-64): `feedbackSw` and `reason.sw` are omitted.

**How it handles responses.**
- `/ai/claim` 204: sleep for the poll interval, then poll again. After a job it polls again at once.
- 401 from either endpoint: exit 1 with a message naming `AI_SHARED_SECRET`.
- `/ai/callback` 200: log the new status. 409: log "stale" and carry on. 400: log the `error` field as a worker bug and carry on.
- Network errors: log the error type and back off (1×, 2×, 4× the interval, up to 60 s). A callback lost this way leaves the Assessment `analyzing` until the requeue cron picks it up after 10 minutes.

It never logs the video URL, the secret or the job body; it logs the Assessment id, the attempt and the canned outcome.

**Prerequisites.**
- `AI_SHARED_SECRET` is set on the **dev** Convex deployment, from the repo root: `pnpm exec convex env set AI_SHARED_SECRET <value>`.
- The same value, and `CONVEX_SITE_URL` (the dev deployment's `https://<name>.convex.site` URL), are in the **repo-root `.env`** (D-13), or in your shell env, which wins. Never commit the secret.

**Run** from `ai-service/`:

```bash
uv run python scripts/stub_worker.py                    # poll every 5 s until Ctrl-C
uv run python scripts/stub_worker.py --once             # wait for one job, process it, exit 0
uv run python scripts/stub_worker.py --poll-interval 2 --worker-id stub-alice
```

Then upload a clip in the app (named e.g. `socket-review.mp4` for the review path) and watch its status chip change. Exit codes: 0 on Ctrl-C or after `--once`, 1 on a 401 or missing or invalid settings.

The tests (`tests/test_stub_worker.py`) run the worker against a fake Convex site (stdlib `http.server` in a thread), so the real `urllib` request code runs. They check each canned payload against the contract rules, the Bearer header, the 204/401/409/400 handling, back-off, and that the video URL never reaches the logs.

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

configure_tracing()  # once at startup: copies only LANGSMITH_* from the root .env, defaults the project


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
