"""The Python side of the pull-model AI contract (``convex/lib/aiContract.ts``).

Shapes and limits only. Convex re-checks all of them (and ADR-11) on every
callback; a worker that breaks one gets a 400.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

# convex/lib/aiContract.ts
MAX_LIST_ITEMS = 20
MAX_TEXT_LENGTH = 2000
MAX_MODEL_LENGTH = 200
MAX_ERROR_CODE_LENGTH = 200

Result = Literal["yes", "no", "unclear"]
VerdictName = Literal["pass", "needs_review", "fail"]
LivenessCheck = Literal["yes", "unclear"]
RESULTS: frozenset[str] = frozenset({"yes", "no", "unclear"})


@dataclass(frozen=True)
class RubricItem:
    id: str
    text: str
    safety: bool

    @classmethod
    def from_job(cls, item: dict[str, Any]) -> RubricItem:
        return cls(id=str(item["id"]), text=str(item["text"]), safety=bool(item["safety"]))


@dataclass(frozen=True)
class Observation:
    item_id: str
    result: Result
    evidence: str
    timestamp_s: float

    def to_callback(self) -> dict[str, Any]:
        return {
            "itemId": self.item_id,
            "result": self.result,
            "evidence": clip_text(self.evidence),
            "timestampS": max(0.0, float(self.timestamp_s)),
        }


def clip_text(text: str, limit: int = MAX_TEXT_LENGTH) -> str:
    """``text`` cut to ``limit`` characters (an ellipsis marks the cut)."""
    return text if len(text) <= limit else text[: limit - 1] + "…"


def clip_list(values: list[str]) -> list[str]:
    """At most ``MAX_LIST_ITEMS`` non-empty strings, each within ``MAX_TEXT_LENGTH``."""
    return [clip_text(v.strip()) for v in values if v and v.strip()][:MAX_LIST_ITEMS]
