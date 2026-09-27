"""The spike worker: Nemotron retry, the result builder and one job end to end.

Cosmos, Nemotron and the download are faked: no GPU, no network.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from app.assess import AssessError, AssessReply, assess, fallback_reply
from app.assess import build_prompt as assess_prompt
from app.contract import MAX_LIST_ITEMS, MAX_TEXT_LENGTH, Observation, RubricItem
from app.result import build_error, build_result
from scripts import brev_worker

AI_SERVICE = Path(__file__).resolve().parents[1]
RUBRIC_FILE = AI_SERVICE / "eval" / "rubrics" / "electrical.13a-socket.v1.json"
TRADES_TS = AI_SERVICE.parent / "convex" / "lib" / "trades.ts"
VIDEO_URL = "https://fake.convex.cloud/api/storage/SIGNED-VIDEO-URL-abc123?token=zzz"
CODE = "472"


def make_job() -> dict[str, Any]:
    rubric = json.loads(RUBRIC_FILE.read_text())
    return {
        "assessmentId": "k17assessment0001",
        "attempt": 1,
        "videoUrl": VIDEO_URL,
        "trade": rubric["trade"],
        "task": rubric["task"],
        "rubric": {"id": "k17rubric0001", "version": 1, "items": rubric["items"]},
        "livenessCode": CODE,
    }


def items(job: dict[str, Any]) -> list[RubricItem]:
    return [RubricItem.from_job(i) for i in job["rubric"]["items"]]


def all_yes(job: dict[str, Any]) -> list[Observation]:
    return [Observation(i.id, "yes", "seen", 1.0) for i in items(job)]


def reply(verdict: str = "pass", **kw: Any) -> AssessReply:
    base: dict[str, Any] = {
        "verdict": verdict,
        "strengths": ["Good."],
        "gaps": [],
        "feedbackEn": "Well done.",
        "safetyFlags": [],
    }
    return AssessReply.model_validate({**base, **kw})


def test_the_rubric_fixture_matches_convex_trades_ts() -> None:
    source = TRADES_TS.read_text()
    fixture = json.loads(RUBRIC_FILE.read_text())
    assert [i["id"] for i in fixture["items"]] == [
        "isolate",
        "test_dead",
        "terminals",
        "earth",
        "no_bare_copper",
        "faceplate",
        "function_test",
    ]
    for item in fixture["items"]:
        assert f'id: "{item["id"]}"' in source and item["text"] in source


# --- assess --------------------------------------------------------------------------------------


def test_assess_prompt_has_the_observations_but_no_liveness_code() -> None:
    job = make_job()
    prompt = assess_prompt("Electrical", "Install a 13A socket", items(job), all_yes(job))
    assert '"itemId": "isolate"' in prompt and "isolate (safety)" in prompt
    assert CODE not in prompt and VIDEO_URL not in prompt and "$" not in prompt


def test_a_none_reply_gets_one_retry() -> None:
    calls: list[str] = []
    answers: list[Any] = [None, reply("needs_review")]

    def invoke(prompt: str) -> Any:
        calls.append(prompt)
        return answers.pop(0)

    outcome = assess("p", invoke, "m", sleep=lambda _: None)
    assert outcome.attempts == 2 and outcome.reply is not None
    assert outcome.reply.verdict == "needs_review"


def test_two_none_replies_leave_no_reply_and_the_fallback_is_needs_review() -> None:
    outcome = assess("p", lambda _: None, "m", sleep=lambda _: None)
    assert (outcome.reply, outcome.attempts) == (None, 2)
    job = make_job()
    observations = all_yes(job)
    observations[0] = Observation("isolate", "unclear", "", 0.0)
    fallback = fallback_reply(items(job), observations)
    assert fallback.verdict == "needs_review" and fallback.safetyFlags == ["isolate"]


def test_a_raising_call_is_scrubbed_with_no_chain() -> None:
    secret = "nvapi-SECRETSECRETSECRET"

    def invoke(_: str) -> Any:
        raise RuntimeError(f"401 for key {secret}")

    with pytest.raises(AssessError) as caught:
        assess("p", invoke, "m", secret)
    assert secret not in str(caught.value)
    assert caught.value.__cause__ is None and caught.value.__context__ is None


# --- the result builder ---------------------------------------------------------------


def test_result_applies_adr11_after_nemotron_and_fits_the_contract() -> None:
    job = make_job()
    observations = all_yes(job)
    observations[1] = Observation("test_dead", "unclear", "x" * 5000, -3)
    draft = reply("pass", strengths=["s"] * 30, gaps=["g" * 5000], feedbackEn="f" * 5000)
    body = build_result(job, observations, None, draft, brev_worker.MODEL, 1234)

    assert body["outcome"] == "result" and body["verdict"]["verdict"] == "needs_review"
    assert body["liveness"] == {"read": None, "check": "unclear"}
    assert body["safetyFlags"] == ["test_dead"]
    assert [o["itemId"] for o in body["observations"]] == [i.id for i in items(job)]
    assert all(o["timestampS"] >= 0 for o in body["observations"])
    assert all(len(o["evidence"]) <= MAX_TEXT_LENGTH for o in body["observations"])
    verdict = body["verdict"]
    assert len(verdict["strengths"]) == MAX_LIST_ITEMS
    assert all(len(g) <= MAX_TEXT_LENGTH for g in verdict["gaps"])
    assert len(verdict["feedbackEn"]) <= MAX_TEXT_LENGTH
    assert verdict["confidence"] == 0 and "feedbackSw" not in verdict
    assert body["fallbackModel"] is False and body["latencyMs"] == 1234
    assert not body["model"].lower().startswith("stub")
    assert set(body) == {
        "assessmentId",
        "attempt",
        "outcome",
        "observations",
        "liveness",
        "verdict",
        "safetyFlags",
        "model",
        "fallbackModel",
        "latencyMs",
    }


def test_a_matched_code_and_all_yes_keeps_the_pass() -> None:
    job = make_job()
    body = build_result(job, all_yes(job), CODE, reply("pass"), brev_worker.MODEL, 1)
    assert body["verdict"]["verdict"] == "pass"
    assert body["liveness"] == {"read": CODE, "check": "yes"}


def test_a_safety_no_fails_even_when_nemotron_says_pass() -> None:
    job = make_job()
    observations = all_yes(job)
    observations[0] = Observation("isolate", "no", "Live wires touched.", 2.0)
    body = build_result(job, observations, CODE, reply("pass"), brev_worker.MODEL, 1)
    assert body["verdict"]["verdict"] == "fail" and body["safetyFlags"] == ["isolate"]


def test_error_code_is_capped() -> None:
    assert len(build_error(make_job(), "e" * 500)["errorCode"]) == 200


# --- one job, end to end with fakes ------------------------------------------------------


def write_clip(path: Path, seconds: float, luma: int = 110) -> None:
    cv2 = pytest.importorskip("cv2")
    np = pytest.importorskip("numpy")
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 5.0, (360, 640))
    for _ in range(int(seconds * 5)):
        writer.write(np.full((640, 360, 3), luma, dtype=np.uint8))
    writer.release()


def cosmos_client(content: str, seen: list[dict[str, Any]]) -> Any:
    def create(**request: Any) -> Any:
        seen.append(request)
        return SimpleNamespace(
            choices=[
                SimpleNamespace(message=SimpleNamespace(content=content), finish_reason="stop")
            ],
            usage=SimpleNamespace(prompt_tokens=3100, completion_tokens=900),
        )

    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


@pytest.fixture
def workdirs(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> list[Path]:
    made: list[Path] = []

    def mkdtemp(prefix: str = "") -> str:
        path = tmp_path / f"{prefix}{len(made)}"
        path.mkdir()
        made.append(path)
        return str(path)

    monkeypatch.setattr(brev_worker.tempfile, "mkdtemp", mkdtemp)
    return made


def run_job(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    seconds: float,
    cosmos_answer: str,
    nemotron: Any,
    luma: int = 110,
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    source = tmp_path / "source.mp4"
    write_clip(source, seconds, luma)

    def fake_download(url: str, dest: Path, max_bytes: int = 0) -> None:
        assert url == VIDEO_URL
        dest.write_bytes(source.read_bytes())

    monkeypatch.setattr(brev_worker, "download", fake_download)
    seen: list[dict[str, Any]] = []
    pipe = brev_worker.Pipeline(
        cosmos_client=cosmos_client(cosmos_answer, seen),
        cosmos_model="nvidia/Cosmos-Reason2-8B",
        invoke=nemotron,
        nemotron_model="nvidia/nemotron-3-super-120b-a12b",
    )
    cfg = brev_worker.stub_worker.WorkerConfig(site_url="http://x", secret="s", worker_id="brev-t")
    return brev_worker.handle_job(cfg, make_job(), pipe), seen


def cosmos_json(result: str = "yes", digits: str | None = None) -> str:
    ids = [i["id"] for i in make_job()["rubric"]["items"]]
    observations = [
        {"itemId": i, "result": result, "evidence": f"{i} seen", "timestampS": 1.5} for i in ids
    ]
    body = json.dumps({"observations": observations, "liveness_digits": digits})
    return f"<think>looking</think>\n{body}"


def test_a_job_becomes_a_capped_result_and_the_video_is_deleted(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    workdirs: list[Path],
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.DEBUG)
    body, seen = run_job(
        monkeypatch, tmp_path, 12, cosmos_json(digits=None), lambda _: reply("pass")
    )
    assert body is not None and body["outcome"] == "result"
    assert body["verdict"]["verdict"] == "needs_review"  # no Liveness code on paper
    assert body["liveness"]["check"] == "unclear"
    assert seen[0]["extra_body"]["media_io_kwargs"] == {"video": {"fps": 4}}
    assert seen[0]["messages"][0]["content"][0]["video_url"]["url"].startswith(
        "data:video/mp4;base64,"
    )
    assert CODE not in json.dumps(seen[0]["messages"])  # ADR-19
    assert workdirs and not any(d.exists() for d in workdirs)
    assert VIDEO_URL not in caplog.text and "SIGNED" not in caplog.text
    assert not re.search(r"\b472\b", caplog.text)


def test_the_matched_code_passes(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    body, _ = run_job(monkeypatch, tmp_path, 12, cosmos_json(digits="4-7-2"), lambda _: reply())
    assert body is not None and body["verdict"]["verdict"] == "pass"


def test_a_short_clip_is_a_reshoot_without_calling_the_models(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    def never(_: str) -> Any:
        raise AssertionError("Nemotron must not run")

    body, seen = run_job(monkeypatch, tmp_path, 4, cosmos_json(), never)
    assert body is not None and body["outcome"] == "reshoot"
    assert body["reason"]["code"] == "too_short" and seen == []
    assert not any(d.exists() for d in workdirs)


def test_a_dark_clip_is_a_reshoot(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    body, _ = run_job(monkeypatch, tmp_path, 12, cosmos_json(), lambda _: reply(), luma=10)
    assert body is not None and body["reason"]["code"] == "too_dark"


def test_an_unparseable_cosmos_answer_is_an_error(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    body, _ = run_job(monkeypatch, tmp_path, 12, "I could not decide.", lambda _: reply())
    assert body is not None and body["outcome"] == "error"
    assert body["errorCode"] == "cosmos_unparseable"
    assert not any(d.exists() for d in workdirs)


def test_nemotron_none_twice_falls_back_to_needs_review(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    monkeypatch.setattr("app.assess.time.sleep", lambda _: None)
    body, _ = run_job(monkeypatch, tmp_path, 12, cosmos_json(digits="472"), lambda _: None)
    assert body is not None and body["verdict"]["verdict"] == "needs_review"


def test_a_failed_download_is_an_error_and_cleans_up(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, workdirs: list[Path]
) -> None:
    def failing(url: str, dest: Path, max_bytes: int = 0) -> None:
        dest.write_bytes(b"partial")
        raise brev_worker.JobError("download_failed_URLError")

    monkeypatch.setattr(brev_worker, "download", failing)
    pipe = brev_worker.Pipeline(
        cosmos_client=None, cosmos_model="m", invoke=lambda _: None, nemotron_model="n"
    )
    cfg = brev_worker.stub_worker.WorkerConfig(site_url="http://x", secret="s", worker_id="brev-t")
    body = brev_worker.handle_job(cfg, make_job(), pipe)
    assert body == {**body, "outcome": "error", "errorCode": "download_failed_URLError"}
    assert not any(d.exists() for d in workdirs)


def test_download_refuses_non_http_urls(tmp_path: Path) -> None:
    with pytest.raises(brev_worker.JobError, match="download_bad_url"):
        brev_worker.download("file:///etc/passwd", tmp_path / "x.mp4")


# --- identity and start-up ---------------------------------------------------------------


def test_worker_id_and_model_pass_the_stub_gate() -> None:
    assert brev_worker.default_worker_id("box") == "brev-box"
    assert len(brev_worker.default_worker_id("h" * 300)) == 100
    assert not brev_worker.MODEL.lower().startswith("stub")


@pytest.mark.parametrize("deployment", [None, "prod:big-otter-1", "  "])
def test_refuses_to_start_unless_dev(
    monkeypatch: pytest.MonkeyPatch, deployment: str | None, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(
        brev_worker.stub_worker, "load_env", lambda: ("https://x.convex.site", "s", deployment)
    )
    assert brev_worker.main(["--once"]) == 1
    assert "dev:" in capsys.readouterr().err


def test_dry_run_builds_a_valid_body_from_a_saved_analysis(tmp_path: Path) -> None:
    job = make_job()
    saved = {
        "runs": [
            {
                "fps": 4,
                "latencyS": 60.0,
                "livenessDigits": None,
                "observations": [o.to_callback() for o in all_yes(job)],
            }
        ],
        "assess": {"latencyS": 7.0, "draft": reply("pass").model_dump()},
    }
    path = tmp_path / "saved.json"
    path.write_text(json.dumps(saved))
    body = brev_worker.dry_run(path, RUBRIC_FILE)
    assert body["verdict"]["verdict"] == "needs_review" and body["latencyMs"] == 67000
