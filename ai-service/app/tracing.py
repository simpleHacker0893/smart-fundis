"""LangSmith tracing with ADR-13 masking.

Every trace from the AI pipeline goes through ``masked_client()``. Its
anonymizer runs on inputs, outputs, metadata and error text before upload,
so traces never carry video URLs, prompts or feedback text.

Masking is an allow-list: strings survive only under the structural keys in
``SAFE_KEYS``, and even there a URL is redacted. Numbers, booleans and None
are kept. Anything new the pipeline adds is masked until it is allow-listed.

Wiring:
- plain functions: decorate with ``traced("name")``
- LangGraph/LangChain runs: wrap the call in ``pipeline_context()``
"""

from __future__ import annotations

import os
import re
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from functools import cache, wraps
from pathlib import Path
from typing import Any, TypeVar

from dotenv import load_dotenv
from langsmith import Client, traceable
from langsmith.run_helpers import tracing_context

from app.settings import REPO_ROOT_ENV

DEFAULT_PROJECT = "smart-fundis-agent"
MASKED = "[masked]"

# String values under these keys are kept. Everything else is masked.
SAFE_KEYS = frozenset(
    {
        "assessment_id",
        "trade",
        "task",
        "task_id",
        "rubric_version",
        "rubric_item_id",
        "stage",
        "status",
        "verdict",
        "observed",
        "safety",
        "reason_code",
        "liveness_match",
        "model",
        "run_type",
        # LangSmith's own metadata, useful for filtering and cost views.
        "ls_provider",
        "ls_model_name",
        "ls_model_type",
        "ls_method",
        "revision_id",
    }
)

_URL = re.compile(r"(https?://|www\.)\S+", re.IGNORECASE)
_TRUTHY = {"1", "true", "yes", "on"}

F = TypeVar("F", bound=Callable[..., Any])


def mask(value: Any, key: str | None = None) -> Any:
    """Return ``value`` with every non-allow-listed string replaced by ``MASKED``."""
    if isinstance(value, dict):
        if key is None and set(value) == {"error"} and isinstance(value["error"], str):
            # The client passes error text as {"error": repr(exc) + traceback}.
            return {"error": _exception_type(value["error"])}
        return {k: mask(v, str(k)) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [mask(v, key) for v in value]
    if isinstance(value, str):
        if key in SAFE_KEYS and not _URL.search(value):
            return value
        return MASKED
    return value


def _exception_type(error: str) -> str:
    match = re.match(r"\s*([A-Za-z_][\w.]*)", error)
    return match.group(1) if match else MASKED


def configure_tracing(env_file: Path = REPO_ROOT_ENV) -> bool:
    """Load the repo-root .env (D-13), default the project, and report whether tracing is on.

    Values already in the environment win, so the Brev box's own env is never overridden.
    """
    load_dotenv(env_file, override=False)
    masked_client.cache_clear()  # a client built earlier has no key
    if not os.environ.get("LANGSMITH_PROJECT"):
        os.environ["LANGSMITH_PROJECT"] = DEFAULT_PROJECT
    tracing_on = os.environ.get("LANGSMITH_TRACING", "").strip().lower() in _TRUTHY
    return tracing_on and bool(os.environ.get("LANGSMITH_API_KEY"))


@cache
def masked_client(api_key: str | None = None) -> Client:
    """The only LangSmith client the pipeline may use."""
    return Client(api_key=api_key, anonymizer=mask)


def traced(name: str, run_type: str = "chain") -> Callable[[F], F]:
    """``@traceable`` routed through the masked client (sync functions).

    The client is looked up per call, not at decoration: decoration happens at
    import, before configure_tracing() has loaded LANGSMITH_API_KEY.
    """

    def decorate(fn: F) -> F:
        inner = traceable(name=name, run_type=run_type)(fn)

        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            with tracing_context(client=masked_client()):
                return inner(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorate


@contextmanager
def pipeline_context(**metadata: Any) -> Iterator[None]:
    """Route LangGraph/LangChain auto-tracing through the masked client."""
    with tracing_context(
        client=masked_client(),
        project_name=os.environ.get("LANGSMITH_PROJECT", DEFAULT_PROJECT),
        metadata=metadata or None,
    ):
        yield


@traced("tracing_smoke")
def smoke() -> dict[str, str]:
    """A tiny traced run for checking the setup. Its inputs are masked like real ones."""
    return {"assessment_id": "smoke-0001", "verdict": "needs_review"}


if __name__ == "__main__":
    enabled = configure_tracing()
    result = smoke()
    masked_client().flush()
    project = os.environ["LANGSMITH_PROJECT"]
    if enabled:
        print(f"Sent one masked trace to LangSmith project '{project}': {result}")
    else:
        print(
            "Tracing is off: set LANGSMITH_TRACING=true and LANGSMITH_API_KEY "
            "in the repo-root .env."
        )
