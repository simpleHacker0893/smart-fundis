"""Hosted Nemotron smoke through ``ChatNVIDIA`` with structured output (#9, ADR-4).

One fixed prompt, no user data, parsed into ``SmokeReply``. It proves the
NVIDIA API key, the model id and structured output before the V2 pipeline.

The key and model come from ``get_settings()`` (repo-root ``.env`` or the Brev
env, D-13). The key is passed explicitly and never printed. HTTP errors can
echo it, so error text is scrubbed (the key, its base64 and URL-encoded forms,
and any ``nvapi-`` token), and the error is raised with no exception chain.

Tracing goes only through ``app.tracing`` (D-14), so any LangSmith run is masked
(ADR-13). Run it with ``uv run python -m app.nemotron``.
"""

from __future__ import annotations

import base64
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote, quote_plus

from langchain_nvidia_ai_endpoints import ChatNVIDIA
from pydantic import BaseModel, Field

from app.settings import Settings, get_settings
from app.tracing import configure_tracing, masked_client, pipeline_context

PROMPT_FILE = Path(__file__).parent / "prompts" / "nemotron_smoke.v1.txt"
_MAX_ERROR_CHARS = 300
_REDACTED = "[redacted]"
# Any NVIDIA API key, or a partial or masked echo of one.
_NVAPI_TOKEN = re.compile(r"nvapi-[A-Za-z0-9_-]{8,}")
# LangSmith keys can show up in a flush error.
_LANGSMITH_TOKEN = re.compile(r"lsv2_[A-Za-z0-9_]{8,}")


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
    # Settings already treats blank or whitespace-only values as unset.
    if settings.nvidia_api_key is None:
        raise NemotronConfigError(
            "NVIDIA_API_KEY is not set. Put it in the repo-root .env (or the Brev env)."
        )
    if settings.nemotron_model is None:
        raise NemotronConfigError(
            "NEMOTRON_MODEL is not set. Use a model id from build.nvidia.com, "
            "for example one listed by ChatNVIDIA.get_available_models()."
        )
    return settings.nvidia_api_key.get_secret_value(), settings.nemotron_model


def _encoded_forms(secret: str) -> set[str]:
    raw = secret.encode()
    forms = {secret, quote(secret, safe=""), quote(secret), quote_plus(secret)}
    for encoded in (base64.b64encode(raw).decode(), base64.urlsafe_b64encode(raw).decode()):
        forms |= {encoded, encoded.rstrip("=")}
    return {form for form in forms if form}


def _scrub(text: str, *secrets: str) -> str:
    """Redact the secrets in every echo form, then truncate."""
    for secret in secrets:
        if not secret:
            continue
        for form in sorted(_encoded_forms(secret), key=len, reverse=True):
            text = text.replace(form, _REDACTED)
    text = _NVAPI_TOKEN.sub(_REDACTED, text)
    text = _LANGSMITH_TOKEN.sub(_REDACTED, text)
    return text if len(text) <= _MAX_ERROR_CHARS else text[:_MAX_ERROR_CHARS] + "..."


def nemotron_smoke(settings: Settings) -> SmokeResult:
    """Call Nemotron once with the fixed prompt and parse the structured reply."""
    key, model = _require(settings)
    failure: str | None = None
    try:
        llm = ChatNVIDIA(model=model, api_key=key, temperature=0)
        structured = llm.with_structured_output(SmokeReply)
        with pipeline_context(stage="nemotron_smoke", model=model):
            reply = structured.invoke(load_prompt())
    except Exception as exc:
        failure = (
            f"Nemotron call failed for model {model} ({type(exc).__name__}): "
            f"{_scrub(str(exc), key)}"
        )
    # Raised outside the except block, so __context__ and __cause__ stay None:
    # the original exception, which may quote the key, is not reachable.
    if failure is not None:
        raise NemotronSmokeError(failure)
    if not isinstance(reply, SmokeReply):
        raise NemotronSmokeError(
            f"Model {model} replied, but the reply did not fit the SmokeReply schema."
        )
    return SmokeResult(model=llm.model, reply=reply)


def _flush_traces(settings: Settings) -> None:
    """Flush LangSmith. A failure is one scrubbed stderr line, never a crash."""
    try:
        masked_client().flush()
    except Exception as exc:
        secrets = [os.environ.get("LANGSMITH_API_KEY", "")]
        if settings.nvidia_api_key is not None:
            secrets.append(settings.nvidia_api_key.get_secret_value())
        detail = _scrub(str(exc), *secrets).replace("\n", " ")
        print(f"LangSmith flush failed ({type(exc).__name__}): {detail}", file=sys.stderr)


def main() -> int:
    """Print the model id and the parsed JSON. Exit 0 on success, 1 on failure."""
    tracing_on = configure_tracing()
    settings = get_settings()
    code = 0
    try:
        result = nemotron_smoke(settings)
    except (NemotronConfigError, NemotronSmokeError) as exc:
        print(f"Nemotron smoke failed: {exc}", file=sys.stderr)
        code = 1
    else:
        print(f"model: {result.model}")
        print(result.reply.model_dump_json())
    if tracing_on:
        _flush_traces(settings)  # never changes the exit code
    return code


if __name__ == "__main__":
    sys.exit(main())
