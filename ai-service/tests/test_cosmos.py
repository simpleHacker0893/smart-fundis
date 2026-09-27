"""The Cosmos observe step: prompt, request, parse and validate. No GPU, no network."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any

import pytest

from app import cosmos
from app.contract import RubricItem

ITEMS = [
    RubricItem("isolate", "Switches the breaker off.", True),
    RubricItem("earth", "Connects the earth.", True),
    RubricItem("faceplate", "Fixes the faceplate.", False),
]
VIDEO_URL = "https://fake.convex.cloud/api/storage/SIGNED?token=zzz"


def answer(observations: list[dict[str, Any]], digits: Any = None) -> str:
    return json.dumps({"observations": observations, "liveness_digits": digits})


# --- prompt and request ----------------------------------------------------------------


def test_prompt_lists_every_item_and_ends_with_the_reasoning_suffix() -> None:
    prompt = cosmos.build_prompt("Electrical", "Install a 13A socket", ITEMS)
    for item in ITEMS:
        assert f"- {item.id}: {item.text}" in prompt
    assert prompt.endswith(cosmos.REASONING_SUFFIX)
    assert "Install a 13A socket" in prompt
    assert "$" not in prompt  # every placeholder filled


def test_prompt_never_carries_a_liveness_code() -> None:
    # ADR-19: the builder has no code parameter; it only asks for digits on paper.
    prompt = cosmos.build_prompt("Electrical", "Install a 13A socket", ITEMS)
    assert "liveness_digits" in prompt
    assert "472" not in prompt


def test_request_follows_the_measured_client_contract() -> None:
    request = cosmos.build_request("m", VIDEO_URL, "p", fps=4, max_tokens=2048, max_model_len=8192)
    extra = request["extra_body"]
    assert extra["media_io_kwargs"] == {"video": {"fps": 4}}
    assert extra["mm_processor_kwargs"]["size"]["longest_edge"] == int((8192 - 2048) * 1024 * 0.9)
    assert "do_sample_frames" not in json.dumps(request)
    content = request["messages"][0]["content"]
    assert content[0] == {"type": "video_url", "video_url": {"url": VIDEO_URL}}
    assert request["temperature"] == 0.6 and request["top_p"] == 0.95


def test_video_data_url(tmp_path: Any) -> None:
    clip = tmp_path / "c.mp4"
    clip.write_bytes(b"abc")
    assert cosmos.video_data_url(clip) == "data:video/mp4;base64,YWJj"


# --- the call (fake client) ---------------------------------------------------------------


def fake_client(
    content: str | None = "{}", finish: str = "stop", error: Exception | None = None
) -> Any:
    def create(**_: Any) -> Any:
        if error is not None:
            raise error
        message = SimpleNamespace(content=content)
        usage = SimpleNamespace(prompt_tokens=3000, completion_tokens=900)
        return SimpleNamespace(
            choices=[SimpleNamespace(message=message, finish_reason=finish)], usage=usage
        )

    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


def test_call_returns_content_and_tokens() -> None:
    run = cosmos.call_cosmos(fake_client('{"a": 1}'), {})
    assert run.content == '{"a": 1}'
    assert (run.prompt_tokens, run.completion_tokens) == (3000, 900)


@pytest.mark.parametrize(
    ("content", "finish"), [(None, "stop"), ("  ", "stop"), ('{"a": 1}', "length")]
)
def test_call_rejects_empty_or_truncated_answers(content: str | None, finish: str) -> None:
    with pytest.raises(cosmos.CosmosError):
        cosmos.call_cosmos(fake_client(content, finish), {})


def test_call_error_never_quotes_the_url_and_has_no_chain() -> None:
    with pytest.raises(cosmos.CosmosError) as caught:
        cosmos.call_cosmos(fake_client(error=RuntimeError(f"bad {VIDEO_URL}")), {})
    assert VIDEO_URL not in str(caught.value)
    assert caught.value.__cause__ is None and caught.value.__context__ is None


# --- parse and validate ---------------------------------------------------------------------


def test_extract_json_strips_think_and_fences() -> None:
    body = {"observations": [], "liveness_digits": None}
    assert cosmos.extract_json(f"<think>a {{x}} b</think>\n{json.dumps(body)}") == body
    assert cosmos.extract_json(f"reasoning</think>\n```json\n{json.dumps(body)}\n```") == body


@pytest.mark.parametrize("content", ["no json here", "{not json}", "[1, 2]"])
def test_extract_json_rejects_non_objects(content: str) -> None:
    with pytest.raises(cosmos.CosmosParseError):
        cosmos.extract_json(content)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (3, 3.0),
        (4.567, 4.57),
        ("12.5", 12.5),
        ("7s", 7.0),
        ("0:05", 5.0),
        ("1:02:03", 3723.0),
        (-2, 0.0),
        ("soon", 0.0),
        (None, 0.0),
        (True, 0.0),
        (float("nan"), 0.0),
    ],
)
def test_parse_timestamp(value: Any, expected: float) -> None:
    assert cosmos.parse_timestamp(value) == expected


def test_parse_timestamp_is_clamped_to_the_clip() -> None:
    assert cosmos.parse_timestamp(99, 17.6) == 17.6
    assert cosmos.parse_timestamp("0:05", 17.6) == 5.0


def test_validate_keeps_rubric_order_and_fills_missing_items() -> None:
    content = answer(
        [
            {"itemId": "earth", "result": "YES", "evidence": "Green-yellow to E.", "timestampS": 9},
            {
                "itemId": "isolate",
                "result": "no",
                "evidence": "Never switched off.",
                "timestampS": 1,
            },
        ],
        digits="4 7 2",
    )
    result = cosmos.parse_observe_reply(content, ITEMS, duration_s=17.6)
    assert [o.item_id for o in result.observations] == ["isolate", "earth", "faceplate"]
    assert [o.result for o in result.observations] == ["no", "yes", "unclear"]
    assert result.observations[2].evidence == cosmos.MISSING_EVIDENCE
    assert result.liveness_digits == "472"
    assert result.issues == ["faceplate: missing, set to unclear"]


def test_validate_drops_unknown_and_duplicate_ids_and_bad_results() -> None:
    content = answer(
        [
            {"itemId": "isolate", "result": "yes", "evidence": "e", "timestampS": 1},
            {"itemId": "isolate", "result": "no", "evidence": "dup", "timestampS": 2},
            {"itemId": "made_up", "result": "yes", "evidence": "x", "timestampS": 0},
            {"itemId": "earth", "result": "maybe", "evidence": "", "timestampS": "0:03"},
            "not an object",
            {"itemId": "faceplate", "result": "yes", "evidence": "x" * 5000, "timestampS": 4},
        ]
    )
    result = cosmos.parse_observe_reply(content, ITEMS)
    by_id = {o.item_id: o for o in result.observations}
    assert len(result.observations) == 3
    assert by_id["isolate"].result == "yes"  # the first one wins
    assert by_id["earth"].result == "unclear" and by_id["earth"].timestamp_s == 3.0
    assert len(by_id["faceplate"].evidence) == 2000
    assert len(result.issues) == 4


def test_validate_without_an_observations_list_is_all_unclear() -> None:
    result = cosmos.parse_observe_reply('{"liveness_digits": "none"}', ITEMS)
    assert [o.result for o in result.observations] == ["unclear"] * 3
    assert result.liveness_digits is None
