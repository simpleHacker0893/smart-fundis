"""Hosted Nemotron smoke through ``ChatNVIDIA`` with structured output (#9, ADR-4).

One fixed prompt, no user data, parsed into ``SmokeReply``. It proves the
NVIDIA API key, the model id and structured output before the V2 pipeline.

The key and model come from ``get_settings()`` (repo-root ``.env`` or the Brev
env, D-13). The key is passed explicitly and never printed: error text is
scrubbed and exception chains are dropped, because HTTP errors can echo it.

Tracing goes only through ``app.tracing`` (D-14), so any LangSmith run is masked
(ADR-13). Run it with ``uv run python -m app.nemotron``.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

from langchain_nvidia_ai_endpoints import ChatNVIDIA
from pydantic import BaseModel, Field

from app.settings import Settings, get_settings
from app.tracing import configure_tracing, masked_client, pipeline_context

PROMPT_FILE = Path(__file__).parent / "prompts" / "nemotron_smoke.v1.txt"
_MAX_ERROR_CHARS = 300


class SmokeReply(BaseModel):
    """The small schema the model must fill."""

    trade: str = Field(description="The trade name, exactly 'electrical'.")
    ok: bool = Field(description="Always true.")
    note: str = Field(description="One short sentence confirming structured output works.")


@dataclass(frozen=True)
class SmokeResult:
    model: str  # the model id ChatNVIDIA actually used
    reply: SmokeReply


class NemotronConfigError(RuntimeError):
    """NVIDIA_API_KEY or NEMOTRON_MODEL is missing."""


class NemotronSmokeError(RuntimeError):
    """The call failed or the reply did not fit the schema."""


def load_prompt() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


def _require(settings: Settings) -> tuple[str, str]:
    key = settings.nvidia_api_key.get_secret_value().strip() if settings.nvidia_api_key else ""
    if not key:
        raise NemotronConfigError(
            "NVIDIA_API_KEY is not set. Put it in the repo-root .env (or the Brev env)."
        )
    model = (settings.nemotron_model or "").strip()
    if not model:
        raise NemotronConfigError(
            "NEMOTRON_MODEL is not set. Use a model id from build.nvidia.com, "
            "for example one listed by ChatNVIDIA.get_available_models()."
        )
    return key, model


def _scrub(text: str, secret: str) -> str:
    text = text.replace(secret, "[redacted]")
    return text if len(text) <= _MAX_ERROR_CHARS else text[:_MAX_ERROR_CHARS] + "..."


def nemotron_smoke(settings: Settings) -> SmokeResult:
    """Call Nemotron once with the fixed prompt and parse the structured reply."""
    key, model = _require(settings)
    try:
        llm = ChatNVIDIA(model=model, api_key=key, temperature=0)
        structured = llm.with_structured_output(SmokeReply)
        with pipeline_context(stage="nemotron_smoke", model=model):
            reply = structured.invoke(load_prompt())
    except Exception as exc:
        detail = _scrub(str(exc), key)
        # `from None`: the chained traceback could quote the key or the prompt.
        raise NemotronSmokeError(
            f"Nemotron call failed for model {model} ({type(exc).__name__}): {detail}"
        ) from None
    if not isinstance(reply, SmokeReply):
        raise NemotronSmokeError(
            f"Model {model} replied, but the reply did not fit the SmokeReply schema."
        )
    return SmokeResult(model=llm.model, reply=reply)


def main() -> int:
    """Print the model id and the parsed JSON. Exit 0 on success, 1 on failure."""
    tracing_on = configure_tracing()
    try:
        result = nemotron_smoke(get_settings())
    except (NemotronConfigError, NemotronSmokeError) as exc:
        print(f"Nemotron smoke failed: {exc}", file=sys.stderr)
        return 1
    finally:
        if tracing_on:
            masked_client().flush()
    print(f"model: {result.model}")
    print(result.reply.model_dump_json())
    return 0


if __name__ == "__main__":
    sys.exit(main())
