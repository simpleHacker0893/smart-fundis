"""Build the ``/ai/callback`` bodies (``convex/lib/aiContract.ts``).

``build_result`` joins the Cosmos Observations, the Nemotron draft and the
ADR-11 rules into one ``result`` body within every Convex limit. English only
for now (D-64): no ``feedbackSw``.
"""

from __future__ import annotations

from typing import Any

from app.assess import AssessReply
from app.contract import (
    MAX_ERROR_CODE_LENGTH,
    MAX_LIST_ITEMS,
    MAX_MODEL_LENGTH,
    Observation,
    RubricItem,
    clip_list,
    clip_text,
)
from app.rules import RuledVerdict, apply_hard_rules
from app.video import ReshootReason

# Not calibrated yet, so never shown as model confidence (as the stub does).
SPIKE_CONFIDENCE = 0


def target(job: dict[str, Any]) -> dict[str, Any]:
    return {"assessmentId": job["assessmentId"], "attempt": job["attempt"]}


def rule_verdict(
    items: list[RubricItem],
    observations: list[Observation],
    draft: AssessReply,
    liveness_read: str | None,
    liveness_code: str,
) -> RuledVerdict:
    return apply_hard_rules(
        items, observations, draft.verdict, draft.safetyFlags, liveness_read, liveness_code
    )


def build_result(
    job: dict[str, Any],
    observations: list[Observation],
    liveness_read: str | None,
    draft: AssessReply,
    model: str,
    latency_ms: int,
    fallback_model: bool = False,
) -> dict[str, Any]:
    """The ``outcome: "result"`` body, with ADR-11 applied after the draft."""
    items = [RubricItem.from_job(i) for i in job["rubric"]["items"]]
    ruled = rule_verdict(items, observations, draft, liveness_read, job["livenessCode"])
    return {
        **target(job),
        "outcome": "result",
        "observations": [o.to_callback() for o in observations],
        "liveness": {
            "read": clip_text(liveness_read) if liveness_read else None,
            "check": ruled.liveness_check,
        },
        "verdict": {
            "verdict": ruled.verdict,
            "confidence": SPIKE_CONFIDENCE,
            "strengths": clip_list(draft.strengths),
            "gaps": clip_list(draft.gaps),
            "feedbackEn": clip_text(draft.feedbackEn.strip()),
        },
        "safetyFlags": ruled.safety_flags[:MAX_LIST_ITEMS],
        "model": model[:MAX_MODEL_LENGTH],
        "fallbackModel": fallback_model,
        "latencyMs": max(0, int(latency_ms)),
    }


def build_reshoot(job: dict[str, Any], reason: ReshootReason) -> dict[str, Any]:
    return {
        **target(job),
        "outcome": "reshoot",
        "reason": {"code": reason.code, "en": clip_text(reason.en)},
    }


def build_error(job: dict[str, Any], error_code: str) -> dict[str, Any]:
    return {**target(job), "outcome": "error", "errorCode": error_code[:MAX_ERROR_CODE_LENGTH]}
