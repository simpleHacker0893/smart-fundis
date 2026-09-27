"""ADR-11 hard rules and the video guard. Pure code: no GPU, no network."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.contract import Observation, Result, RubricItem, VerdictName
from app.rules import apply_hard_rules, liveness_check
from app.video import VideoProbe, choose_fps, guard, probe, sample_indices

ITEMS = [
    RubricItem("isolate", "Breaker off.", True),
    RubricItem("earth", "Earth to E.", True),
    RubricItem("faceplate", "Faceplate level.", False),
]
CODE = "472"


def obs(isolate: Result, earth: Result, faceplate: Result = "yes") -> list[Observation]:
    return [
        Observation("isolate", isolate, "e", 1.0),
        Observation("earth", earth, "e", 2.0),
        Observation("faceplate", faceplate, "e", 3.0),
    ]


# --- rules ------------------------------------------------------------------------------------


def test_liveness_matches_only_the_exact_code() -> None:
    assert liveness_check("472", CODE) == "yes"
    assert liveness_check("473", CODE) == "unclear"
    assert liveness_check(None, CODE) == "unclear"
    assert liveness_check("", "") == "unclear"


def test_all_yes_with_liveness_keeps_a_pass() -> None:
    ruled = apply_hard_rules(ITEMS, obs("yes", "yes"), "pass", [], CODE, CODE)
    assert (ruled.verdict, ruled.capped, ruled.safety_flags) == ("pass", False, [])


def test_missing_liveness_caps_a_pass() -> None:
    ruled = apply_hard_rules(ITEMS, obs("yes", "yes"), "pass", [], None, CODE)
    assert (ruled.verdict, ruled.capped, ruled.liveness_check) == ("needs_review", True, "unclear")


@pytest.mark.parametrize("result", ["unclear", "no"])
def test_a_safety_item_not_yes_is_flagged_and_caps(result: Result) -> None:
    ruled = apply_hard_rules(ITEMS, obs("yes", result), "pass", [], CODE, CODE)
    assert ruled.verdict == ("fail" if result == "no" else "needs_review")
    assert ruled.safety_flags == ["earth"]


@pytest.mark.parametrize("model_verdict", ["pass", "needs_review", "fail"])
def test_a_safety_no_is_always_a_fail(model_verdict: VerdictName) -> None:
    ruled = apply_hard_rules(ITEMS, obs("no", "yes"), model_verdict, [], CODE, CODE)
    assert ruled.verdict == "fail"


def test_a_missing_safety_observation_is_flagged() -> None:
    ruled = apply_hard_rules(ITEMS, obs("yes", "yes")[1:], "pass", [], CODE, CODE)
    assert (ruled.verdict, ruled.safety_flags) == ("needs_review", ["isolate"])


def test_the_rules_never_raise_the_model_verdict() -> None:
    for model_verdict in ("needs_review", "fail"):
        ruled = apply_hard_rules(ITEMS, obs("yes", "yes"), model_verdict, [], CODE, CODE)
        assert ruled.verdict == model_verdict


def test_a_non_safety_gap_does_not_cap_but_model_flags_are_filtered() -> None:
    ruled = apply_hard_rules(
        ITEMS, obs("yes", "yes", "no"), "pass", ["faceplate", "made_up", "earth"], CODE, CODE
    )
    assert ruled.verdict == "pass"
    assert ruled.safety_flags == ["earth"]  # only known safety ids, once each


def test_a_duplicate_observation_cannot_hide_a_no() -> None:
    observations = [*obs("yes", "yes"), Observation("isolate", "no", "e", 4.0)]
    assert apply_hard_rules(ITEMS, observations, "pass", [], CODE, CODE).verdict == "fail"


# --- video guard ---------------------------------------------------------------------------------


def clip(duration: float = 20.0, w: int = 576, h: int = 1024, luma: float = 110.0) -> VideoProbe:
    return VideoProbe(duration_s=duration, width=w, height=h, mean_luma=luma)


@pytest.mark.parametrize(
    ("video", "code"),
    [
        (clip(), None),
        (clip(duration=9.9), "too_short"),
        (clip(duration=10.0), None),
        (clip(duration=90.0), None),
        (clip(duration=90.1), "too_long"),
        (clip(w=640, h=359), "low_res"),
        (clip(w=640, h=360), None),
        (clip(luma=39.9), "too_dark"),
        (clip(luma=40.0), None),
    ],
)
def test_guard(video: VideoProbe, code: str | None) -> None:
    reason = guard(video)
    assert (reason.code if reason else None) == code
    if reason:
        assert reason.en and "certif" not in reason.en.lower()


def test_fps_is_4_up_to_45_s_then_2() -> None:
    assert (choose_fps(17.6), choose_fps(45.0), choose_fps(45.1), choose_fps(90)) == (4, 4, 2, 2)


def test_sample_indices_spread_evenly() -> None:
    assert sample_indices(160, 16) == list(range(5, 160, 10))
    assert sample_indices(3, 16) == [0, 1, 2]
    assert sample_indices(0, 16) == []


def test_probe_reads_a_generated_clip(tmp_path: Path) -> None:
    cv2 = pytest.importorskip("cv2")
    np = pytest.importorskip("numpy")
    path = tmp_path / "grey.mp4"
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 10.0, (64, 48))
    for _ in range(30):
        writer.write(np.full((48, 64, 3), 100, dtype=np.uint8))
    writer.release()
    video = probe(path)
    assert (video.width, video.height) == (64, 48)
    assert video.duration_s == pytest.approx(3.0, abs=0.2)
    assert video.mean_luma == pytest.approx(100, abs=3)
