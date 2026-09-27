"""ADR-11 hard rules, applied in plain Python AFTER the language model.

The model's Verdict is only a starting point. These rules can lower it and
never raise it:
- any safety item ``no`` -> ``fail``;
- any safety item ``no`` or ``unclear`` (or missing), or the Liveness code not
  matched -> at most ``needs_review``.

Convex re-applies the same caps on every callback (``applyHardRules`` in
``convex/lib/aiContract.ts``), so a bug here can't publish a clean pass.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.contract import LivenessCheck, Observation, RubricItem, VerdictName

_RANK: dict[VerdictName, int] = {"fail": 0, "needs_review": 1, "pass": 2}


@dataclass(frozen=True)
class RuledVerdict:
    verdict: VerdictName
    liveness_check: LivenessCheck
    safety_flags: list[str]
    capped: bool  # True when the rules lowered the model's Verdict
    reasons: list[str]


def liveness_check(read: str | None, code: str) -> LivenessCheck:
    """``yes`` only when the digits read are exactly the issued Liveness code."""
    return "yes" if read is not None and code and read == code else "unclear"


def apply_hard_rules(
    items: list[RubricItem],
    observations: list[Observation],
    model_verdict: VerdictName,
    model_flags: list[str],
    liveness_read: str | None,
    liveness_code: str,
) -> RuledVerdict:
    """The final Verdict after ADR-11. ``model_flags`` that aren't safety items are dropped."""
    by_item: dict[str, list[Observation]] = {}
    for observation in observations:
        by_item.setdefault(observation.item_id, []).append(observation)

    safety_ids = [item.id for item in items if item.safety]
    safety_set = set(safety_ids)
    safety_no = [i for i in safety_ids if any(o.result == "no" for o in by_item.get(i, []))]
    safety_not_yes = [
        i
        for i in safety_ids
        if not by_item.get(i) or any(o.result != "yes" for o in by_item.get(i, []))
    ]
    check = liveness_check(liveness_read, liveness_code)

    ceiling: VerdictName = "pass"
    reasons: list[str] = []
    if safety_no:
        ceiling = "fail"
        reasons.append("safety item 'no': " + ", ".join(safety_no))
    elif safety_not_yes:
        ceiling = "needs_review"
        reasons.append("safety item not 'yes': " + ", ".join(safety_not_yes))
    if check != "yes" and _RANK[ceiling] > _RANK["needs_review"]:
        ceiling = "needs_review"
    if check != "yes":
        reasons.append("Liveness code not matched")

    verdict: VerdictName = model_verdict if _RANK[model_verdict] <= _RANK[ceiling] else ceiling
    if safety_no:
        verdict = "fail"  # a safety "no" is always a fail, whatever the model said

    flags: list[str] = []
    for item_id in [*safety_not_yes, *model_flags]:
        if item_id in safety_set and item_id not in flags:
            flags.append(item_id)

    return RuledVerdict(
        verdict=verdict,
        liveness_check=check,
        safety_flags=flags,
        capped=verdict != model_verdict,
        reasons=reasons,
    )
