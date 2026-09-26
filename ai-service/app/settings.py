"""Service settings, read from the environment and the repo-root ``.env`` (D-13).

Every local secret lives in one file, the git-ignored ``.env`` at the repo
root. This module reads that file by path; there is never an
``ai-service/.env``. On Brev the values come from the box's own environment,
and values already in the environment always win over the file. A missing
file is fine (CI, fresh clones).

Nothing is read at import time. Call ``get_settings()`` where a value is
needed, for example inside a request handler or a pipeline node.

Secrets are ``SecretStr``: they never show up in ``repr``, logs or
``model_dump()``. Call ``.get_secret_value()`` only at the point of use.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, SecretStr, field_validator
from pydantic_core import PydanticUseDefault

# PRD section 4.3 serves these two. The Nemotron model id has no default:
# #9 picks it from build.nvidia.com and sets NEMOTRON_MODEL.
DEFAULT_COSMOS_MODEL = "nvidia/Cosmos-Reason2-8B"
DEFAULT_COSMOS_FALLBACK_MODEL = "nvidia/Cosmos-Reason2-2B"


def repo_root_env(module_file: Path = Path(__file__)) -> Path:
    """The repo-root ``.env`` for a module at ``<root>/ai-service/app/<module>.py``."""
    return module_file.resolve().parents[2] / ".env"


REPO_ROOT_ENV = repo_root_env()


class Settings(BaseModel):
    """Env names match PRD section 7 (Brev row)."""

    model_config = ConfigDict(frozen=True)

    # Cosmos Reason 2 on vLLM (ADR-3/12)
    vllm_base_url: str | None = None
    cosmos_model: str = DEFAULT_COSMOS_MODEL
    cosmos_fallback_model: str = DEFAULT_COSMOS_FALLBACK_MODEL
    # Nemotron via the hosted NVIDIA API (ADR-4)
    nvidia_api_key: SecretStr | None = None
    nemotron_model: str | None = None
    # Convex pull loop (ADR-9)
    convex_site_url: str | None = None
    ai_shared_secret: SecretStr | None = None
    # Queue (ADR-5)
    redis_url: str | None = None
    queue_mode: Literal["inline", "celery"] = "inline"

    @field_validator("*", mode="before")
    @classmethod
    def _blank_is_unset(cls, value: Any) -> Any:
        """Trim values; a blank or whitespace-only value means "use the default"."""
        if isinstance(value, SecretStr):
            trimmed = value.get_secret_value().strip()
            if not trimmed:
                raise PydanticUseDefault
            return SecretStr(trimmed)
        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                raise PydanticUseDefault
            return trimmed
        return value


_FIELDS = tuple(Settings.model_fields)


def load_settings(env_file: Path = REPO_ROOT_ENV) -> Settings:
    """Build settings from ``env_file`` overlaid by the process environment.

    Unlike ``load_dotenv``, this does not write the file into ``os.environ``.
    Blank or whitespace-only values count as unset, so a blank env var falls
    through to the file, and a blank file value falls through to the default.
    """
    file_values = dotenv_values(env_file) if env_file.is_file() else {}
    values: dict[str, str] = {}
    for field in _FIELDS:
        name = field.upper()
        for candidate in (os.environ.get(name), file_values.get(name)):
            if candidate and candidate.strip():
                values[field] = candidate.strip()
                break
    return Settings(**values)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """The process-wide settings, built on first use."""
    return load_settings()
