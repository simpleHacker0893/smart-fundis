"""The V1 stub worker (#40) against a fake Convex site on localhost.

The fake server is stdlib ``http.server`` in a thread, so the worker's real
``urllib`` request code runs. Each test scripts the responses per path and
checks the requests the worker sent.
"""

from __future__ import annotations

import json
import logging
import threading
from collections.abc import Iterator
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import pytest

from scripts import stub_worker
from scripts.stub_worker import WorkerConfig

SECRET = "fake-shared-secret"
VIDEO_URL = "https://fake.convex.cloud/api/storage/SIGNED-VIDEO-URL-abc123?token=zzz"
MAX_LIST_ITEMS = 20
MAX_TEXT_LENGTH = 2000


def make_job(clip_name: str | None = "socket.mp4", attempt: int = 1) -> dict[str, Any]:
    job: dict[str, Any] = {
        "assessmentId": "k17assessment0001",
        "attempt": attempt,
        "videoUrl": VIDEO_URL,
        "trade": {"slug": "electrical", "name": "Electrical"},
        "task": {"slug": "install-13a-socket", "name": "Install a 13A socket"},
        "rubric": {
            "id": "k17rubric0001",
            "version": 1,
            "items": [
                {"id": "isolate", "text": "Isolates the supply", "safety": True},
                {"id": "strip", "text": "Strips the cable", "safety": False},
                {"id": "earth", "text": "Connects the earth", "safety": True},
                {"id": "fix", "text": "Fixes the faceplate", "safety": False},
            ],
        },
        "livenessCode": "472",
    }
    if clip_name is not None:
        job["clipName"] = clip_name
    return job


@dataclass
class Reply:
    status: int
    body: Any = None


@dataclass
class Recorded:
    path: str
    headers: dict[str, str]
    body: Any


@dataclass
class FakeConvex:
    """Scripted replies per path; when a path's script runs out it answers 204."""

    url: str = ""
    replies: dict[str, list[Reply]] = field(default_factory=dict)
    requests: list[Recorded] = field(default_factory=list)

    def script(self, path: str, *replies: Reply) -> None:
        self.replies.setdefault(path, []).extend(replies)

    def calls(self, path: str) -> list[Recorded]:
        return [r for r in self.requests if r.path == path]


@pytest.fixture
def fake() -> Iterator[FakeConvex]:
    state = FakeConvex()

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self) -> None:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            state.requests.append(
                Recorded(self.path, dict(self.headers.items()), json.loads(raw) if raw else None)
            )
            queue = state.replies.get(self.path, [])
            reply = queue.pop(0) if queue else Reply(204)
            payload = b"" if reply.body is None else json.dumps(reply.body).encode()
            self.send_response(reply.status)
            if payload:
                self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, format: str, *args: Any) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    state.url = f"http://127.0.0.1:{server.server_address[1]}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield state
    server.shutdown()
    server.server_close()


class StopLoop(Exception):
    """Raised by the fake sleep to end an otherwise endless loop."""


class FakeSleep:
    def __init__(self, stop_after: int | None = None) -> None:
        self.calls: list[float] = []
        self.stop_after = stop_after

    def __call__(self, seconds: float) -> None:
        self.calls.append(seconds)
        if self.stop_after is not None and len(self.calls) >= self.stop_after:
            raise StopLoop


def config(url: str, *, once: bool = True, poll_interval: float = 2.0) -> WorkerConfig:
    return WorkerConfig(
        site_url=url,
        secret=SECRET,
        worker_id="stub-test",
        poll_interval=poll_interval,
        once=once,
    )


def run_one(fake: FakeConvex, job: dict[str, Any], callback: Reply) -> dict[str, Any]:
    """Claim one job, answer its callback, and return the callback body the worker sent."""
    fake.script("/ai/claim", Reply(200, job))
    fake.script("/ai/callback", callback)
    code = stub_worker.run(config(fake.url), sleep=FakeSleep())
    assert code == 0
    [sent] = fake.calls("/ai/callback")
    return sent.body


def assert_result_shape(body: dict[str, Any], job: dict[str, Any]) -> None:
    """The §6 result rules from convex/lib/aiContract.ts (callbackBodyValidator, resultInBounds)."""
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
    assert body["assessmentId"] == job["assessmentId"]
    assert body["attempt"] == job["attempt"]
    assert body["outcome"] == "result"
    item_ids = [item["id"] for item in job["rubric"]["items"]]
    # Every Rubric item exactly once.
    assert sorted(o["itemId"] for o in body["observations"]) == sorted(item_ids)
    for observation in body["observations"]:
        assert set(observation) == {"itemId", "result", "evidence", "timestampS"}
        assert observation["result"] in {"yes", "no", "unclear"}
        assert isinstance(observation["evidence"], str)
        assert "Stub" in observation["evidence"]
        assert 0 < len(observation["evidence"]) <= MAX_TEXT_LENGTH
        assert observation["timestampS"] >= 0
    assert set(body["liveness"]) == {"read", "check"}
    assert body["liveness"]["check"] in {"yes", "unclear"}
    verdict = body["verdict"]
    # English only for now (D-64): feedbackSw is omitted, not empty.
    assert set(verdict) == {"verdict", "confidence", "strengths", "gaps", "feedbackEn"}
    assert verdict["verdict"] in {"pass", "needs_review", "fail"}
    assert 0 <= verdict["confidence"] <= 1
    assert 0 < len(verdict["feedbackEn"]) <= MAX_TEXT_LENGTH
    for texts in (verdict["strengths"], verdict["gaps"], body["safetyFlags"]):
        assert len(texts) <= MAX_LIST_ITEMS
        assert all(isinstance(t, str) and len(t) <= MAX_TEXT_LENGTH for t in texts)
    assert set(body["safetyFlags"]) <= set(item_ids)
    assert body["fallbackModel"] is False
    assert body["model"] == "stub-v1"
    assert isinstance(body["latencyMs"], int)
    assert body["latencyMs"] >= 0


# --- the canned outcome from the clip name ---------------------------------


@pytest.mark.parametrize(
    ("clip_name", "expected"),
    [
        (None, "pass"),
        ("", "pass"),
        ("socket.mp4", "pass"),
        ("please-REVIEW-me.mov", "review"),
        ("Reshoot.mp4", "reshoot"),
        ("review-then-reshoot.mp4", "reshoot"),  # reshoot wins when both appear
    ],
)
def test_pick_outcome_from_the_clip_name(clip_name: str | None, expected: str) -> None:
    assert stub_worker.pick_outcome(clip_name) == expected


def test_pass_result(fake: FakeConvex) -> None:
    job = make_job("socket.mp4")
    body = run_one(fake, job, Reply(200, {"status": "awaiting_review"}))

    assert_result_shape(body, job)
    assert body["verdict"]["verdict"] == "pass"
    assert all(o["result"] == "yes" for o in body["observations"])
    assert body["liveness"] == {"read": "472", "check": "yes"}
    assert body["safetyFlags"] == []
    # Canned numbers must not look like model confidence.
    assert body["verdict"]["confidence"] == 0


def test_pass_when_the_job_has_no_clip_name(fake: FakeConvex) -> None:
    job = make_job(None)
    body = run_one(fake, job, Reply(200, {"status": "awaiting_review"}))

    assert_result_shape(body, job)
    assert body["verdict"]["verdict"] == "pass"
    assert body["verdict"]["confidence"] == 0


def test_needs_review_result(fake: FakeConvex) -> None:
    job = make_job("my-review-clip.mp4")
    body = run_one(fake, job, Reply(200, {"status": "awaiting_review"}))

    assert_result_shape(body, job)
    assert body["verdict"]["verdict"] == "needs_review"
    assert body["liveness"] == {"read": None, "check": "unclear"}
    unclear = [o for o in body["observations"] if o["result"] == "unclear"]
    assert [o["itemId"] for o in unclear] == ["isolate"]  # the first safety item
    assert body["safetyFlags"] == ["isolate"]
    assert body["verdict"]["confidence"] == 0


def test_needs_review_with_no_safety_item_flags_nothing(fake: FakeConvex) -> None:
    job = make_job("review.mp4")
    for item in job["rubric"]["items"]:
        item["safety"] = False
    body = run_one(fake, job, Reply(200, {"status": "awaiting_review"}))

    assert_result_shape(body, job)
    assert body["verdict"]["verdict"] == "needs_review"
    assert body["safetyFlags"] == []
    assert [o["result"] for o in body["observations"]].count("unclear") == 1
    assert body["verdict"]["confidence"] == 0


def test_reshoot(fake: FakeConvex) -> None:
    job = make_job("dark-RESHOOT.mp4", attempt=2)
    body = run_one(fake, job, Reply(200, {"status": "reshoot"}))

    assert set(body) == {"assessmentId", "attempt", "outcome", "reason"}
    assert body["assessmentId"] == job["assessmentId"]
    assert body["attempt"] == 2
    assert body["outcome"] == "reshoot"
    # English only for now (D-64): reason.sw is omitted.
    assert set(body["reason"]) == {"code", "en"}
    assert body["reason"]["code"] == "too_dark"
    assert 0 < len(body["reason"]["en"]) <= MAX_TEXT_LENGTH


# --- the HTTP loop -------------------------------------------------------------


def test_claim_sends_the_worker_id_and_the_exact_bearer_header(fake: FakeConvex) -> None:
    run_one(fake, make_job(), Reply(200, {"status": "awaiting_review"}))

    for request in fake.requests:
        assert request.headers["Authorization"] == f"Bearer {SECRET}"
        assert request.headers["Content-Type"] == "application/json"
    [claim] = fake.calls("/ai/claim")
    assert claim.body == {"workerId": "stub-test"}


def test_204_sleeps_then_polls_again(fake: FakeConvex) -> None:
    fake.script("/ai/claim", Reply(204), Reply(204), Reply(200, make_job()))
    fake.script("/ai/callback", Reply(200, {"status": "awaiting_review"}))
    sleep = FakeSleep()

    code = stub_worker.run(config(fake.url, poll_interval=3.0), sleep=sleep)

    assert code == 0
    assert len(fake.calls("/ai/claim")) == 3
    assert sleep.calls == [3.0, 3.0]
    assert len(fake.calls("/ai/callback")) == 1


def test_keeps_polling_after_a_job_without_once(fake: FakeConvex) -> None:
    fake.script("/ai/claim", Reply(200, make_job()), Reply(204))
    fake.script("/ai/callback", Reply(200, {"status": "awaiting_review"}))

    with pytest.raises(StopLoop):
        stub_worker.run(config(fake.url, once=False), sleep=FakeSleep(stop_after=1))

    assert len(fake.calls("/ai/claim")) == 2


def test_401_on_claim_exits_with_a_clear_message(
    fake: FakeConvex, caplog: pytest.LogCaptureFixture
) -> None:
    fake.script("/ai/claim", Reply(401, {"error": "unauthorized"}))

    with caplog.at_level(logging.INFO):
        code = stub_worker.run(config(fake.url), sleep=FakeSleep())

    assert code != 0
    assert "AI_SHARED_SECRET" in caplog.text
    assert "401" in caplog.text
    assert fake.calls("/ai/callback") == []


def test_401_on_callback_exits(fake: FakeConvex, caplog: pytest.LogCaptureFixture) -> None:
    fake.script("/ai/claim", Reply(200, make_job()))
    fake.script("/ai/callback", Reply(401, {"error": "unauthorized"}))

    with caplog.at_level(logging.INFO):
        code = stub_worker.run(config(fake.url, once=False), sleep=FakeSleep(stop_after=5))

    assert code != 0
    assert "AI_SHARED_SECRET" in caplog.text


def test_409_logs_stale_and_continues(fake: FakeConvex, caplog: pytest.LogCaptureFixture) -> None:
    fake.script("/ai/claim", Reply(200, make_job()), Reply(200, make_job("two.mp4")))
    fake.script(
        "/ai/callback", Reply(409, {"error": "stale"}), Reply(200, {"status": "awaiting_review"})
    )

    with caplog.at_level(logging.INFO), pytest.raises(StopLoop):
        stub_worker.run(config(fake.url, once=False), sleep=FakeSleep(stop_after=1))

    assert "stale" in caplog.text
    assert len(fake.calls("/ai/callback")) == 2
    assert "awaiting_review" in caplog.text


def test_400_logs_the_error_as_a_worker_bug_and_continues(
    fake: FakeConvex, caplog: pytest.LogCaptureFixture
) -> None:
    fake.script("/ai/claim", Reply(200, make_job()))
    fake.script("/ai/callback", Reply(400, {"error": "duplicate_item"}))

    with caplog.at_level(logging.INFO), pytest.raises(StopLoop):
        stub_worker.run(config(fake.url, once=False), sleep=FakeSleep(stop_after=1))

    assert "duplicate_item" in caplog.text
    assert "worker bug" in caplog.text
    assert len(fake.calls("/ai/claim")) == 2  # it kept polling


def test_network_error_backs_off_without_crashing(caplog: pytest.LogCaptureFixture) -> None:
    # Nothing listens on port 9 of localhost in the test environment.
    sleep = FakeSleep(stop_after=3)

    with caplog.at_level(logging.INFO), pytest.raises(StopLoop):
        stub_worker.run(config("http://127.0.0.1:9", poll_interval=1.0), sleep=sleep)

    assert "network error" in caplog.text
    assert sleep.calls == [1.0, 2.0, 4.0]  # exponential back-off


def test_backoff_is_capped() -> None:
    assert stub_worker.backoff_seconds(1.0, failures=20) == stub_worker.MAX_BACKOFF_S


def test_never_logs_the_video_url_secret_or_clip_name(
    fake: FakeConvex, caplog: pytest.LogCaptureFixture, capsys: pytest.CaptureFixture[str]
) -> None:
    # A clip name can carry personal data: a name and a phone number.
    personal_clip = "Wanjiru 0722000000 review.mp4"
    fake.script("/ai/claim", Reply(200, make_job(personal_clip)), Reply(200, make_job()))
    fake.script("/ai/callback", Reply(409, {"error": "stale"}), Reply(400, {"error": "x"}))

    with caplog.at_level(logging.DEBUG), pytest.raises(StopLoop):
        stub_worker.run(config(fake.url, once=False), sleep=FakeSleep(stop_after=1))

    out = capsys.readouterr()
    for text in (caplog.text, out.out, out.err):
        assert "SIGNED-VIDEO-URL" not in text
        assert "fake.convex.cloud" not in text
        assert SECRET not in text
        assert personal_clip not in text
        assert "0722000000" not in text
        assert "Wanjiru" not in text
    assert "k17assessment0001" in caplog.text  # it does log the id
    assert "review" in caplog.text  # and the canned outcome


# --- settings and the CLI --------------------------------------------------------


def test_worker_id_is_stub_hostname() -> None:
    assert stub_worker.default_worker_id("box-1") == "stub-box-1"
    assert len(stub_worker.default_worker_id("x" * 300)) <= 100


def test_main_exits_when_settings_are_missing(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(stub_worker, "load_env", lambda: (None, None))

    code = stub_worker.main(["--once"])

    assert code != 0
    err = capsys.readouterr().err
    assert "CONVEX_SITE_URL" in err
    assert "AI_SHARED_SECRET" in err


def test_main_runs_against_the_configured_site(
    fake: FakeConvex, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(stub_worker, "load_env", lambda: (fake.url + "/", SECRET))
    fake.script("/ai/claim", Reply(200, make_job()))
    fake.script("/ai/callback", Reply(200, {"status": "awaiting_review"}))

    code = stub_worker.main(["--once", "--poll-interval", "0.5", "--worker-id", "stub-cli"])

    assert code == 0
    [claim] = fake.calls("/ai/claim")  # the trailing slash is dropped, not doubled
    assert claim.body == {"workerId": "stub-cli"}


def test_main_rejects_a_non_http_site_url(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(stub_worker, "load_env", lambda: ("file:///etc/passwd", SECRET))

    assert stub_worker.main(["--once"]) != 0
    assert "http" in capsys.readouterr().err
