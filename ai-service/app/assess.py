"""The assess step: hosted Nemotron turns Observations into a draft Verdict (ADR-4).

It sees the Rubric and the validated Cosmos Observations only: never the
video, its URL or the Liveness code (ADR-19). Its answer is a draft; the
ADR-11 rules in ``app.rules`` run after it and can only lower it.

A ``None`` structured reply (the schema didn't fit) gets one retry; after
that the caller falls back to ``needs_review`` (``fallback_reply``). A call
that raises becomes ``AssessError`` with scrubbed text and no exception chain,
because provider errors can echo the API key (as in ``app.nemotron``).
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from string import Template
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.contract import Observation, RubricItem
from app.nemotron import _require, _scrub
from app.settings import Settings
from app.tracing import pipeline_context

PROMPT_VERSION = "assess.v1"
PROMPT_FILE = Path(__file__).parent / "prompts" / f"{PROMPT_VERSION}.txt"
MAX_ATTEMPTS = 2  # the first call plus one retry on a None reply


class AssessReply(BaseModel):
    """The structured output Nemotron must fill."""

    verdict: Literal["pass", "needs_review", "fail"] = Field(
        description="pass only if every item is yes; fail if any safety item is no; "
        "otherwise needs_review."
    )
    strengths: list[str] = Field(description="Short sentences on what was clearly done well.")
    gaps: list[str] = Field(
        description="Short sentences, one per item that is no or unclear, on what to show or fix."
    )
    feedbackEn: str = Field(description="2 to 4 plain, respectful English sentences to the Fundi.")
    safetyFlags: list[str] = Field(description="Ids of safety items that are not yes.")


class AssessError(RuntimeError):
    """The Nemotron call raised (network, auth, model retired)."""


@dataclass(frozen=True)
class AssessOutcome:
    reply: AssessReply | None  # None after the retry: use fallback_reply()
    attempts: int
    latency_s: float
    model: str


Invoke = Callable[[str], Any]


def build_prompt(trade: str, task: str, items: list[RubricItem], obs: list[Observation]) -> str:
    """The assess prompt. It holds no URL and no Liveness code."""
    item_lines = "\n".join(
        f"- {i.id} ({'safety' if i.safety else 'not safety'}): {i.text}" for i in items
    )
    observations = json.dumps(
        [
            {
                "itemId": o.item_id,
                "result": o.result,
                "evidence": o.evidence,
                "timestampS": o.timestamp_s,
            }
            for o in obs
        ],
        ensure_ascii=False,
        indent=1,
    )
    return Template(PROMPT_FILE.read_text(encoding="utf-8")).substitute(
        trade=trade, task=task, items=item_lines, observations=observations
    )


def fallback_reply(items: list[RubricItem], obs: list[Observation]) -> AssessReply:
    """The draft used when Nemotron gave no valid reply after the retry."""
    flagged = {o.item_id for o in obs if o.result != "yes"}
    return AssessReply(
        verdict="needs_review",
        strengths=[],
        gaps=["The written summary could not be produced. An Expert will check each step."],
        feedbackEn="Thank you for your video. An Expert will review it and send you feedback.",
        safetyFlags=[i.id for i in items if i.safety and i.id in flagged],
    )


def structured_invoker(settings: Settings, temperature: float = 0.0) -> tuple[Invoke, str, str]:
    """(invoke, model id, key) for hosted Nemotron, built like ``app.nemotron``."""
    from langchain_nvidia_ai_endpoints import ChatNVIDIA

    key, model = _require(settings)
    llm = ChatNVIDIA(model=model, api_key=key, temperature=temperature)
    return llm.with_structured_output(AssessReply).invoke, model, key


def assess(
    prompt: str,
    invoke: Invoke,
    model: str,
    secret: str = "",
    sleep: Callable[[float], None] = time.sleep,
) -> AssessOutcome:
    """Call Nemotron; retry once on a None (or non-fitting) reply."""
    started = time.monotonic()
    attempts = 0
    reply: AssessReply | None = None
    while attempts < MAX_ATTEMPTS and reply is None:
        attempts += 1
        failure: str | None = None
        try:
            with pipeline_context(stage="assess", model=model):
                raw = invoke(prompt)
        except Exception as exc:
            failure = f"Nemotron call failed ({type(exc).__name__}): {_scrub(str(exc), secret)}"
        if failure is not None:
            raise AssessError(failure)  # outside except: no chain that may quote the key
        if isinstance(raw, AssessReply):
            reply = raw
        elif isinstance(raw, dict):
            try:
                reply = AssessReply.model_validate(raw)
            except ValueError:
                reply = None
        if reply is None and attempts < MAX_ATTEMPTS:
            sleep(1.0)
    return AssessOutcome(
        reply=reply, attempts=attempts, latency_s=time.monotonic() - started, model=model
    )
