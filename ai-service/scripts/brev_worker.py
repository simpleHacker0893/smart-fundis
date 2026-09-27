"""The V2 spike worker: real Cosmos Observations + a hosted Nemotron Verdict (P5).

It claims jobs from the Convex DEV deployment, analyses the video with Cosmos
Reason 2 (reached through an SSH tunnel to the Brev box; nothing inbound is
opened on Brev, ADR-9), drafts the Verdict with hosted Nemotron, applies the
ADR-11 rules after Nemotron, and posts the callback.

Start the tunnel, then the worker, from ``ai-service/``::

    ssh -N -L 18000:127.0.0.1:8000 smartfundi &
    NEMOTRON_MODEL=nvidia/nemotron-3-super-120b-a12b \\
      uv run python scripts/brev_worker.py --once --cosmos-url http://127.0.0.1:18000

Flags: ``[--once | --max-jobs N] [--poll-interval S] --cosmos-url URL``, and
``--dry-run SAVED.json`` to print a callback built from a saved analysis
without any network call.

Per job: claim -> download the video to a private temp dir -> probe -> guard
(outside 10-90 s, short side under 360 px, too dark -> ``reshoot``) -> Cosmos
(fps 4 up to 45 s, else fps 2) -> parse and validate -> Nemotron (one retry on
a None reply, then ``needs_review``) -> ADR-11 -> ``result``. Any failure
posts ``error`` with a short code. The video file is always deleted.

It reuses ``stub_worker``'s HTTP client, loop, back-off and 401/403 handling.
It never logs the video URL, the job body, the Liveness code or the digits read.
Settings (CONVEX_SITE_URL, AI_SHARED_SECRET, CONVEX_DEPLOYMENT, NVIDIA_API_KEY,
NEMOTRON_MODEL, COSMOS_MODEL) come from ``app.settings``: env wins over the
repo-root ``.env``. It refuses to start unless CONVEX_DEPLOYMENT starts with dev:.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import shutil
import socket
import sys
import tempfile
import time
import urllib.error
import urllib.request
from collections.abc import Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

AI_SERVICE_DIR = Path(__file__).resolve().parents[1]
for extra in (AI_SERVICE_DIR, AI_SERVICE_DIR / "scripts"):
    if str(extra) not in sys.path:
        sys.path.insert(0, str(extra))

import stub_worker  # noqa: E402

from app import cosmos  # noqa: E402
from app.assess import (  # noqa: E402
    AssessError,
    Invoke,
    assess,
    fallback_reply,
    structured_invoker,
)
from app.assess import build_prompt as build_assess_prompt  # noqa: E402
from app.contract import MAX_MODEL_LENGTH, RubricItem  # noqa: E402
from app.result import build_error, build_reshoot, build_result  # noqa: E402
from app.video import ProbeError, choose_fps, guard, probe  # noqa: E402

WORKER_PREFIX = "brev-"
MODEL = "cosmos-reason2-8b+nemotron-3-super@observe.v1-spike"
DEFAULT_COSMOS_URL = "http://127.0.0.1:18000"
MAX_VIDEO_BYTES = 200 * 1024 * 1024
DOWNLOAD_TIMEOUT_S = 120.0
_CHUNK = 1024 * 1024
_SAFE_NAME = re.compile(r"[^A-Za-z0-9_-]")

log = logging.getLogger("brev_worker")


class JobError(Exception):
    """A step failed; ``code`` is the short ``errorCode`` sent to Convex."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass
class Pipeline:
    cosmos_client: Any
    cosmos_model: str
    invoke: Invoke
    nemotron_model: str
    secret: str = ""  # only for scrubbing Nemotron errors
    max_tokens: int = cosmos.DEFAULT_MAX_TOKENS
    max_model_len: int = cosmos.DEFAULT_MAX_MODEL_LEN
    timings: dict[str, float] = field(default_factory=dict)


# --- identity ----------------------------------------------------------------------


def default_worker_id(hostname: str | None = None) -> str:
    """``brev-<hostname>``, capped at 100 chars. Never starts with ``stub``."""
    return f"{WORKER_PREFIX}{hostname or socket.gethostname()}"[: stub_worker.MAX_WORKER_ID_LENGTH]


# --- one job -------------------------------------------------------------------------


def download(url: str, dest: Path, max_bytes: int = MAX_VIDEO_BYTES) -> None:
    """Stream ``url`` to ``dest``. Errors name the failure type only, never the URL."""
    if not url.startswith(("https://", "http://")):
        raise JobError("download_bad_url")
    failure: str | None = None
    try:
        request = urllib.request.Request(url)  # noqa: S310 - the scheme is checked above
        with (
            urllib.request.urlopen(request, timeout=DOWNLOAD_TIMEOUT_S) as response,  # noqa: S310
            dest.open("wb") as out,
        ):
            total = 0
            while chunk := response.read(_CHUNK):
                total += len(chunk)
                if total > max_bytes:
                    failure = "download_too_large"
                    break
                out.write(chunk)
    except (OSError, ValueError) as exc:
        failure = f"download_failed_{type(exc).__name__}"
    if failure is not None:
        raise JobError(failure)


def analyse(
    job: dict[str, Any], video_path: Path, pipe: Pipeline, started: float
) -> dict[str, Any]:
    """The callback body for a downloaded job (``reshoot`` or ``result``)."""
    items = [RubricItem.from_job(i) for i in job["rubric"]["items"]]
    trade, task = job["trade"]["name"], job["task"]["name"]

    try:
        video = probe(video_path)
    except ProbeError:
        raise JobError("probe_failed") from None
    reason = guard(video)
    if reason is not None:
        log.info("Assessment %s: guard asks for a reshoot (%s)", job["assessmentId"], reason.code)
        return build_reshoot(job, reason)

    fps = choose_fps(video.duration_s)
    request = cosmos.build_request(
        pipe.cosmos_model,
        cosmos.video_data_url(video_path),
        cosmos.build_prompt(trade, task, items),
        fps,
        pipe.max_tokens,
        pipe.max_model_len,
    )
    try:
        run = cosmos.call_cosmos(pipe.cosmos_client, request)
    except cosmos.CosmosError:
        raise JobError("cosmos_failed") from None
    del request  # holds the whole video
    pipe.timings["cosmos_s"] = run.latency_s
    try:
        observed = cosmos.parse_observe_reply(run.content, items, video.duration_s)
    except cosmos.CosmosParseError:
        raise JobError("cosmos_unparseable") from None
    log.info(
        "Assessment %s: Cosmos fps %s, %s+%s tokens, %.1f s, %s parse fix(es)",
        job["assessmentId"],
        fps,
        run.prompt_tokens,
        run.completion_tokens,
        run.latency_s,
        len(observed.issues),
    )

    prompt = build_assess_prompt(trade, task, items, observed.observations)
    try:
        outcome = assess(prompt, pipe.invoke, pipe.nemotron_model, pipe.secret)
    except AssessError:
        raise JobError("nemotron_failed") from None
    pipe.timings["nemotron_s"] = outcome.latency_s
    draft = outcome.reply or fallback_reply(items, observed.observations)
    log.info(
        "Assessment %s: Nemotron %s in %.1f s (%s attempt(s)%s)",
        job["assessmentId"],
        draft.verdict,
        outcome.latency_s,
        outcome.attempts,
        ", fallback needs_review" if outcome.reply is None else "",
    )
    latency_ms = int((time.monotonic() - started) * 1000)
    return build_result(
        job, observed.observations, observed.liveness_digits, draft, MODEL, latency_ms
    )


def handle_job(
    cfg: stub_worker.WorkerConfig, job: dict[str, Any], pipe: Pipeline
) -> dict[str, Any] | None:
    """Process one job and return its callback body (None if the job is malformed).

    The local video is always deleted.
    """
    started = time.monotonic()
    pipe.timings.clear()
    try:
        assessment_id = str(job["assessmentId"])
        _ = job["attempt"]  # must exist for any callback
    except (KeyError, TypeError):
        log.error("the job doesn't match the §6 contract; this is a worker bug")
        return None
    log.info("claimed Assessment %s (attempt %s)", assessment_id, job["attempt"])
    workdir = Path(tempfile.mkdtemp(prefix="sf-job-"))
    try:
        video_path = workdir / f"{_SAFE_NAME.sub('_', assessment_id)[:80]}.mp4"
        try:
            download(str(job["videoUrl"]), video_path)
            pipe.timings["download_s"] = time.monotonic() - started
            body = analyse(job, video_path, pipe, started)
        except JobError as error:
            log.error("Assessment %s: %s", assessment_id, error.code)
            body = build_error(job, error.code)
        except (KeyError, TypeError, IndexError, ValueError) as error:
            log.error("Assessment %s: bad job or data (%s)", assessment_id, type(error).__name__)
            body = build_error(job, f"worker_bad_input_{type(error).__name__}")
        except Exception as error:  # never let one job kill the loop without a callback
            log.error("Assessment %s: unexpected %s", assessment_id, type(error).__name__)
            body = build_error(job, f"worker_internal_{type(error).__name__}")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
    timings = ", ".join(f"{k} {v:.1f}" for k, v in pipe.timings.items())
    log.info(
        "Assessment %s: outcome %s%s in %.1f s (%s)",
        assessment_id,
        body["outcome"],
        f" {body['verdict']['verdict']}" if body["outcome"] == "result" else "",
        time.monotonic() - started,
        timings or "no stage timings",
    )
    return body


def make_handler(pipe: Pipeline) -> stub_worker.JobHandler:
    def handler(
        cfg: stub_worker.WorkerConfig, job: dict[str, Any], sleep: stub_worker.Sleep
    ) -> None:
        body = handle_job(cfg, job, pipe)
        if body is not None:
            stub_worker.send_callback(cfg, body)

    return handler


# --- dry run ------------------------------------------------------------------------


def dry_run(saved_path: Path, rubric_path: Path) -> dict[str, Any]:
    """A ``result`` body from a saved analysis (``analyze_clip.py --assess``) and a
    fake job. No network. The fake Liveness code is never the digits read."""
    from app.assess import AssessReply
    from app.contract import Observation

    saved = json.loads(saved_path.read_text(encoding="utf-8"))
    rubric = json.loads(rubric_path.read_text(encoding="utf-8"))
    run = saved["runs"][0]
    job = {
        "assessmentId": "dry-run",
        "attempt": 1,
        "videoUrl": "(not used)",
        "trade": rubric["trade"],
        "task": rubric["task"],
        "rubric": {"id": "dry-run", "version": rubric["version"], "items": rubric["items"]},
        "livenessCode": "dry-run-no-code",
    }
    observations = [
        Observation(o["itemId"], o["result"], o["evidence"], float(o["timestampS"]))
        for o in run["observations"]
    ]
    draft = AssessReply.model_validate(saved["assess"]["draft"])
    latency_ms = int((run["latencyS"] + saved["assess"]["latencyS"]) * 1000)
    return build_result(job, observations, run["livenessDigits"], draft, MODEL, latency_ms)


# --- the CLI --------------------------------------------------------------------------


def cosmos_ready(base_url: str, timeout: float = 10.0) -> str | None:
    """The served model id from ``/v1/models``, or None when unreachable."""
    root = base_url.rstrip("/")
    root = root if root.endswith("/v1") else root + "/v1"
    try:
        with urllib.request.urlopen(root + "/models", timeout=timeout) as response:  # noqa: S310
            data = json.loads(response.read())
        return str(data["data"][0]["id"])
    except (OSError, ValueError, KeyError, IndexError, TypeError):
        return None


def parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="V2 spike worker: Cosmos Observations + Nemotron Verdict. Dev only."
    )
    parser.add_argument("--once", action="store_true", help="exit after one job")
    parser.add_argument("--max-jobs", type=int, default=None, help="exit after N jobs")
    parser.add_argument("--poll-interval", type=float, default=stub_worker.DEFAULT_POLL_INTERVAL_S)
    parser.add_argument("--cosmos-url", default=DEFAULT_COSMOS_URL)
    parser.add_argument("--max-tokens", type=int, default=cosmos.DEFAULT_MAX_TOKENS)
    parser.add_argument("--max-model-len", type=int, default=cosmos.DEFAULT_MAX_MODEL_LEN)
    parser.add_argument(
        "--dry-run",
        type=Path,
        default=None,
        help="print the callback built from a saved analysis JSON; no network",
    )
    parser.add_argument(
        "--rubric",
        type=Path,
        default=AI_SERVICE_DIR / "eval" / "rubrics" / "electrical.13a-socket.v1.json",
        help="the Rubric for --dry-run",
    )
    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    if args.dry_run is not None:
        print(json.dumps(dry_run(args.dry_run, args.rubric), indent=2, ensure_ascii=False))
        return 0

    site_url, secret, deployment = stub_worker.load_env()
    if not site_url or not secret:
        print("brev worker: set CONVEX_SITE_URL and AI_SHARED_SECRET", file=sys.stderr)
        return 1
    if not stub_worker.is_dev_deployment(deployment):
        print(
            "brev worker: refusing to start: CONVEX_DEPLOYMENT must start with 'dev:' "
            "(the spike is dev-only).",
            file=sys.stderr,
        )
        return 1
    if not site_url.startswith(("http://", "https://")):
        print("brev worker: CONVEX_SITE_URL must start with http:// or https://", file=sys.stderr)
        return 1
    if args.poll_interval <= 0 or (args.max_jobs is not None and args.max_jobs < 1):
        print("brev worker: --poll-interval must be > 0 and --max-jobs >= 1", file=sys.stderr)
        return 1

    from app.nemotron import NemotronConfigError
    from app.settings import get_settings
    from app.tracing import configure_tracing

    configure_tracing()
    settings = get_settings()
    try:
        invoke, nemotron_model, key = structured_invoker(settings)
    except NemotronConfigError as exc:
        print(f"brev worker: {exc}", file=sys.stderr)
        return 1
    served = cosmos_ready(args.cosmos_url)
    if served is None:
        print(
            f"brev worker: Cosmos is not reachable at {args.cosmos_url}. Open the tunnel: "
            "ssh -N -L 18000:127.0.0.1:8000 smartfundi",
            file=sys.stderr,
        )
        return 1
    worker_id = default_worker_id()
    if worker_id.lower().startswith("stub") or len(MODEL) > MAX_MODEL_LENGTH:
        print("brev worker: bad worker id or model name", file=sys.stderr)
        return 1
    log.info(
        "Cosmos %s via %s; Nemotron %s; model tag %s",
        served,
        args.cosmos_url,
        nemotron_model,
        MODEL,
    )
    pipe = Pipeline(
        cosmos_client=cosmos.make_client(args.cosmos_url),
        cosmos_model=served,
        invoke=invoke,
        nemotron_model=nemotron_model,
        secret=key,
        max_tokens=args.max_tokens,
        max_model_len=args.max_model_len,
    )
    cfg = stub_worker.WorkerConfig(
        site_url=site_url.rstrip("/"),
        secret=secret,
        worker_id=worker_id,
        poll_interval=args.poll_interval,
        once=args.once,
        max_jobs=args.max_jobs,
    )
    try:
        return stub_worker.run(cfg, handle=make_handler(pipe))
    except KeyboardInterrupt:
        log.info("stopped")
        return 0


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG if "-v" in sys.argv or "--verbose" in sys.argv else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    # httpx (httpx2 under openai 3.x) logs full request URLs at INFO; keep them out.
    for noisy in ("httpx", "httpx2", "httpcore", "openai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    sys.exit(main())
