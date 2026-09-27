"""The Cosmos Reason 2 observe step: prompt, request, parse and validate.

The client contract was measured on vLLM 0.30.0 (``docs/handoff/8.md``):
- append NVIDIA's ``<think>`` format suffix, then read ``message.content``;
- fps goes in ``media_io_kwargs.video.fps``;
- the video's total pixel budget goes in ``mm_processor_kwargs.size.longest_edge``;
- never send ``do_sample_frames``.

The prompt never contains the Liveness code (ADR-19): it only asks the model
to read any digits shown on paper. Nothing here logs the video URL.
"""

from __future__ import annotations

import base64
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from string import Template
from typing import Any

from app.contract import RESULTS, Observation, Result, RubricItem, clip_text

PROMPT_VERSION = "observe.v1"
PROMPT_FILE = Path(__file__).parent / "prompts" / f"{PROMPT_VERSION}.txt"
# cosmos_reason2_utils.text.REASONING_PROMPT
REASONING_SUFFIX = (
    "Answer the question using the following format:\n\n"
    "<think>\nYour reasoning.\n</think>\n\n"
    "Write your final answer immediately after the </think> tag."
)
DEFAULT_MAX_MODEL_LEN = 8192
DEFAULT_MAX_TOKENS = 2048
# NVIDIA's reasoning defaults.
TEMPERATURE = 0.6
TOP_P = 0.95
# Qwen3-VL's minimum pixels per frame, as in NVIDIA's inference.py.
SHORTEST_EDGE = 131072
REQUEST_TIMEOUT_S = 240.0

MISSING_EVIDENCE = "The model did not report this item."
_THINK = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)
_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
_CLOCK = re.compile(r"^\s*(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)\s*$")


class CosmosError(RuntimeError):
    """The Cosmos call failed, was cut off, or gave no answer."""


class CosmosParseError(ValueError):
    """The answer had no JSON object we could read."""


@dataclass(frozen=True)
class CosmosRun:
    content: str
    prompt_tokens: int
    completion_tokens: int
    latency_s: float
    finish_reason: str | None


@dataclass
class ObserveResult:
    observations: list[Observation]
    liveness_digits: str | None
    issues: list[str] = field(default_factory=list)


# --- prompt and request (pure) ----------------------------------------------------


def build_prompt(trade: str, task: str, items: list[RubricItem]) -> str:
    """The observe prompt for one Rubric, with the reasoning suffix appended."""
    lines = "\n".join(f"- {item.id}: {item.text}" for item in items)
    body = Template(PROMPT_FILE.read_text(encoding="utf-8")).substitute(
        trade=trade, task=task, items=lines
    )
    return f"{body.rstrip()}\n\n{REASONING_SUFFIX}"


def pixel_budget(max_model_len: int, max_tokens: int) -> int:
    """The total video pixel budget that leaves room for the answer (NVIDIA inference.py)."""
    return int((max_model_len - max_tokens) * 1024 * 0.9)


def video_data_url(path: Path) -> str:
    """The clip as a base64 ``data:`` URL (the box can't see a laptop file path)."""
    return "data:video/mp4;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def build_request(
    model: str,
    video_url: str,
    prompt: str,
    fps: int,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    max_model_len: int = DEFAULT_MAX_MODEL_LEN,
) -> dict[str, Any]:
    """The ``chat.completions.create`` keyword arguments (no ``do_sample_frames``)."""
    return {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": TEMPERATURE,
        "top_p": TOP_P,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "video_url", "video_url": {"url": video_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        "extra_body": {
            "media_io_kwargs": {"video": {"fps": fps}},
            "mm_processor_kwargs": {
                "size": {
                    "shortest_edge": SHORTEST_EDGE,
                    "longest_edge": pixel_budget(max_model_len, max_tokens),
                }
            },
        },
    }


# --- the call -----------------------------------------------------------------------


def make_client(base_url: str) -> Any:
    """An OpenAI client for vLLM at ``base_url`` (with or without ``/v1``)."""
    from openai import OpenAI

    root = base_url.rstrip("/")
    if not root.endswith("/v1"):
        root += "/v1"
    return OpenAI(base_url=root, api_key="EMPTY", timeout=REQUEST_TIMEOUT_S, max_retries=0)


def call_cosmos(client: Any, request: dict[str, Any]) -> CosmosRun:
    """One Cosmos call. Raises ``CosmosError`` on an empty or truncated answer.

    Errors never carry the request: it holds the video URL.
    """
    started = time.monotonic()
    failure: str | None = None
    try:
        response = client.chat.completions.create(**request)
    except Exception as exc:
        failure = f"Cosmos call failed ({type(exc).__name__})"
    if failure is not None:
        raise CosmosError(failure)
    latency = time.monotonic() - started
    choice = response.choices[0]
    content = (choice.message.content or "").strip()
    if choice.finish_reason == "length":
        raise CosmosError("Cosmos answer was cut off (finish_reason=length)")
    if not content:
        raise CosmosError("Cosmos gave an empty answer")
    usage = response.usage
    return CosmosRun(
        content=content,
        prompt_tokens=int(getattr(usage, "prompt_tokens", 0) or 0),
        completion_tokens=int(getattr(usage, "completion_tokens", 0) or 0),
        latency_s=latency,
        finish_reason=choice.finish_reason,
    )


# --- parse and validate (pure) ------------------------------------------------------


def extract_json(content: str) -> dict[str, Any]:
    """The JSON object in an answer: drop any ``<think>`` block and code fence."""
    text = _THINK.sub("", content)
    if "</think>" in text:  # an opening tag the parser already removed
        text = text.rsplit("</think>", 1)[1]
    fenced = _FENCE.search(text)
    if fenced:
        text = fenced.group(1)
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise CosmosParseError("no JSON object in the answer")
    try:
        parsed = json.loads(text[start : end + 1])
    except ValueError as exc:
        raise CosmosParseError(f"invalid JSON ({exc.__class__.__name__})") from None
    if not isinstance(parsed, dict):
        raise CosmosParseError("the JSON is not an object")
    return parsed


def parse_timestamp(value: Any, duration_s: float | None = None) -> float:
    """Seconds from a number or an ``m:ss`` / ``h:mm:ss`` string, clamped to the clip."""
    seconds = 0.0
    if isinstance(value, bool):
        seconds = 0.0
    elif isinstance(value, (int, float)):
        seconds = float(value)
    elif isinstance(value, str):
        clock = _CLOCK.match(value)
        if clock:
            hours, minutes, secs = clock.groups()
            if hours is None:  # "m:ss"
                seconds = int(minutes) * 60 + float(secs)
            else:
                seconds = int(hours) * 3600 + int(minutes) * 60 + float(secs)
        else:
            try:
                seconds = float(value.strip().rstrip("s"))
            except ValueError:
                seconds = 0.0
    if seconds != seconds or seconds < 0:  # NaN or negative
        seconds = 0.0
    if duration_s is not None:
        seconds = min(seconds, duration_s)
    return round(seconds, 2)


def normalize_digits(value: Any) -> str | None:
    """Only the digits the model read, or None when there are none."""
    if value is None or isinstance(value, bool):
        return None
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    return digits or None


def validate_observations(
    data: dict[str, Any], items: list[RubricItem], duration_s: float | None = None
) -> ObserveResult:
    """Exactly one Observation per Rubric item, in Rubric order.

    Unknown ids and duplicates are dropped, a bad result becomes ``unclear``,
    and a missing item is filled as ``unclear`` (spec §6 rule 2). Each fix is
    recorded in ``issues``.
    """
    issues: list[str] = []
    known = {item.id for item in items}
    found: dict[str, Observation] = {}
    raw = data.get("observations")
    if not isinstance(raw, list):
        issues.append("no observations list")
        raw = []
    for entry in raw:
        if not isinstance(entry, dict):
            issues.append("an observation is not an object")
            continue
        item_id = str(entry.get("itemId", entry.get("item_id", ""))).strip()
        if item_id not in known:
            issues.append(f"unknown itemId {item_id[:40]!r}")
            continue
        if item_id in found:
            issues.append(f"duplicate itemId {item_id!r}")
            continue
        result_raw = str(entry.get("result", "")).strip().lower()
        result: Result
        if result_raw in RESULTS:
            result = result_raw  # type: ignore[assignment]
        else:
            issues.append(f"{item_id}: result {result_raw[:20]!r} is not yes/no/unclear")
            result = "unclear"
        evidence = entry.get("evidence")
        found[item_id] = Observation(
            item_id=item_id,
            result=result,
            evidence=clip_text(str(evidence).strip()) if evidence else "",
            timestamp_s=parse_timestamp(
                entry.get("timestampS", entry.get("timestamp_s")), duration_s
            ),
        )
    observations: list[Observation] = []
    for item in items:
        if item.id in found:
            observations.append(found[item.id])
        else:
            issues.append(f"{item.id}: missing, set to unclear")
            observations.append(Observation(item.id, "unclear", MISSING_EVIDENCE, 0.0))
    return ObserveResult(
        observations=observations,
        liveness_digits=normalize_digits(data.get("liveness_digits")),
        issues=issues,
    )


def parse_observe_reply(
    content: str, items: list[RubricItem], duration_s: float | None = None
) -> ObserveResult:
    """Parse and validate one Cosmos answer. Raises ``CosmosParseError``."""
    return validate_observations(extract_json(content), items, duration_s)
