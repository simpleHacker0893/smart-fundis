"""The V1 stub worker (#40): polls Convex for jobs and posts a canned result.

It speaks the real pull-model contract (spec §6, ADR-9; the source of truth is
``convex/lib/aiContract.ts``) but runs no AI and needs no GPU. It exists so a
Fundi's upload moves ``queued -> analyzing -> awaiting_review`` in dev before
the V2 pipeline lands. It is never for real users.

The canned outcome comes from the job's ``clipName`` (case-insensitive):

- contains ``reshoot`` -> a ``reshoot`` with reason ``too_dark``;
- else contains ``review`` -> a ``needs_review`` result: the first safety Rubric
  item is ``unclear`` and flagged, and liveness is ``unclear``;
- else (or no ``clipName``) -> a ``pass`` result, every item ``yes``.

``reshoot`` wins when both words appear.

Run from ``ai-service/``::

    uv run python scripts/stub_worker.py [--once | --max-jobs N] [--poll-interval S]
        [--hold-seconds S] [--worker-id ID]

``--hold-seconds S`` (0 to 300) waits S seconds between claiming a job and
posting its callback, so the Assessment stays ``analyzing`` long enough for an
end-to-end test to see the status chip change. It stays far below Convex's
10-minute requeue.

It reads ``CONVEX_SITE_URL``, ``AI_SHARED_SECRET`` and ``CONVEX_DEPLOYMENT``
from the environment or the repo-root ``.env`` (D-13, through ``app.settings``).
It never logs the video URL, the secret, the job body or the clip name.

It never runs against production (RAI S2):

- it refuses to start unless ``CONVEX_DEPLOYMENT`` starts with ``dev:``;
- its worker id always starts with ``stub`` (``stub-`` is prepended if not);
- Convex answers 403 ``stub_disabled`` unless the deployment sets
  ``AI_STUB_ENABLED=1`` (dev only), and the worker then exits 1.

Every result it posts has ``model`` "stub-v1" and ``confidence`` 0.
"""

from __future__ import annotations

import argparse
import json
import logging
import socket
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

AI_SERVICE_DIR = Path(__file__).resolve().parents[1]

MODEL = "stub-v1"
MAX_WORKER_ID_LENGTH = 100  # convex/lib/aiContract.ts MAX_WORKER_ID_LENGTH
MAX_BACKOFF_S = 60.0
HTTP_TIMEOUT_S = 30.0
DEFAULT_POLL_INTERVAL_S = 5.0
# Far below the 10-minute requeue in Convex, so a held job is never re-claimed.
MAX_HOLD_S = 300.0

STUB_NOTE = "Stub result: no AI ran."
# Always 0: a made-up number must never look like model confidence. Any metric
# must drop rows whose ``model`` starts with "stub".
STUB_CONFIDENCE = 0

Outcome = Literal["pass", "review", "reshoot"]
Sleep = Callable[[float], None]

log = logging.getLogger("stub_worker")


STUB_PREFIX = "stub-"
DEV_DEPLOYMENT_PREFIX = "dev:"
STUB_DISABLED = "stub_disabled"  # convex/lib/aiStub.ts


class Unauthorized(Exception):
    """Convex answered 401: the secret is wrong, or not set on the deployment."""


class Forbidden(Exception):
    """Convex answered 403. ``error`` is the body's error field (``stub_disabled``
    when the deployment hasn't set ``AI_STUB_ENABLED=1``)."""

    def __init__(self, endpoint: str, error: str) -> None:
        super().__init__(endpoint, error)
        self.endpoint = endpoint
        self.error = error


@dataclass(frozen=True)
class WorkerConfig:
    site_url: str
    secret: str
    worker_id: str
    poll_interval: float = DEFAULT_POLL_INTERVAL_S
    once: bool = False
    hold_seconds: float = 0.0
    max_jobs: int | None = None


# --- the canned outcome ----------------------------------------------------------


def pick_outcome(clip_name: str | None) -> Outcome:
    """The canned outcome for a clip name. ``reshoot`` wins over ``review``."""
    name = (clip_name or "").lower()
    if "reshoot" in name:
        return "reshoot"
    if "review" in name:
        return "review"
    return "pass"


def canned_callback(job: dict[str, Any], outcome: Outcome, latency_ms: int) -> dict[str, Any]:
    """The /ai/callback body for ``job``. English only for now (D-64): no ``sw`` fields."""
    target = {"assessmentId": job["assessmentId"], "attempt": job["attempt"]}
    if outcome == "reshoot":
        return {
            **target,
            "outcome": "reshoot",
            "reason": {
                "code": "too_dark",
                "en": f"{STUB_NOTE} The clip is treated as too dark. Record again in good light.",
            },
        }

    items: list[dict[str, Any]] = job["rubric"]["items"]
    unclear_id: str | None = None
    if outcome == "review" and items:
        # The first safety item, or the first item when the Rubric has none.
        unclear_id = next((i["id"] for i in items if i["safety"]), items[0]["id"])

    observations = [
        {
            "itemId": item["id"],
            "result": "unclear" if item["id"] == unclear_id else "yes",
            "evidence": f"{STUB_NOTE} Canned "
            + ("'unclear'" if item["id"] == unclear_id else "'yes'")
            + " for this Rubric item.",
            "timestampS": 0,
        }
        for item in items
    ]
    safety_ids = {i["id"] for i in items if i["safety"]}

    if outcome == "review":
        liveness: dict[str, Any] = {"read": None, "check": "unclear"}
        verdict = {
            "verdict": "needs_review",
            "confidence": STUB_CONFIDENCE,
            "strengths": [STUB_NOTE],
            "gaps": [f"{STUB_NOTE} One Rubric item and the Liveness code are canned 'unclear'."],
            "feedbackEn": f"{STUB_NOTE} This canned needs_review result tests the review path.",
        }
        flags = [unclear_id] if unclear_id in safety_ids else []
    else:
        liveness = {"read": job["livenessCode"], "check": "yes"}
        verdict = {
            "verdict": "pass",
            "confidence": STUB_CONFIDENCE,
            "strengths": [STUB_NOTE],
            "gaps": [],
            "feedbackEn": f"{STUB_NOTE} This canned pass tests the pipeline only.",
        }
        flags = []

    return {
        **target,
        "outcome": "result",
        "observations": observations,
        "liveness": liveness,
        "verdict": verdict,
        "safetyFlags": flags,
        "model": MODEL,
        "fallbackModel": False,
        "latencyMs": max(0, latency_ms),
    }


# --- HTTP ------------------------------------------------------------------------


def post_json(cfg: WorkerConfig, path: str, body: dict[str, Any]) -> tuple[int, Any]:
    """POST ``body`` to ``site_url + path``; return (status, parsed JSON or None).

    HTTP error statuses are returned, not raised. Network failures raise
    ``OSError`` (``urllib.error.URLError`` is one). Error text never includes
    the URL: urllib's messages don't, and the video URL is never sent here.
    """
    request = urllib.request.Request(  # noqa: S310 - the scheme is checked in main()
        cfg.site_url + path,
        data=json.dumps(body).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {cfg.secret}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_S) as response:  # noqa: S310
            status, raw = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, raw = error.code, error.read()
    try:
        parsed = json.loads(raw) if raw else None
    except ValueError:
        parsed = None
    return status, parsed


def error_field(body: Any) -> str:
    if isinstance(body, dict) and isinstance(body.get("error"), str):
        return body["error"]
    return "(no error field)"


def claim(cfg: WorkerConfig) -> dict[str, Any] | None:
    """One /ai/claim. The job, or None when nothing is queued (204)."""
    status, body = post_json(cfg, "/ai/claim", {"workerId": cfg.worker_id})
    if status == 200 and isinstance(body, dict):
        return body
    if status == 204:
        return None
    if status == 401:
        raise Unauthorized
    if status == 403:
        raise Forbidden("/ai/claim", error_field(body))
    log.error("claim: unexpected HTTP %s (%s); treating it as no job", status, error_field(body))
    return None


def send_callback(cfg: WorkerConfig, body: dict[str, Any]) -> None:
    """One /ai/callback, logging what Convex made of it."""
    status, reply = post_json(cfg, "/ai/callback", body)
    assessment = body["assessmentId"]
    if status == 200:
        new_status = reply.get("status") if isinstance(reply, dict) else None
        log.info("callback %s: Assessment is now %s", assessment, new_status)
    elif status == 409:
        log.warning("callback %s: stale (409), skipping it", assessment)
    elif status == 400:
        log.error(
            "callback %s: rejected with 400 %s; this is a worker bug",
            assessment,
            error_field(reply),
        )
    elif status == 401:
        raise Unauthorized
    elif status == 403:
        raise Forbidden("/ai/callback", error_field(reply))
    else:
        log.error("callback %s: unexpected HTTP %s (%s)", assessment, status, error_field(reply))


def process(cfg: WorkerConfig, job: dict[str, Any], sleep: Sleep = time.sleep) -> None:
    started = time.monotonic()
    try:
        outcome = pick_outcome(job.get("clipName"))
        log.info(
            "claimed Assessment %s (attempt %s): canned %s",
            job["assessmentId"],
            job["attempt"],
            outcome,
        )
        if cfg.hold_seconds > 0:
            log.info("holding %s for %g s", job["assessmentId"], cfg.hold_seconds)
            sleep(cfg.hold_seconds)
        latency_ms = int((time.monotonic() - started) * 1000)
        body = canned_callback(job, outcome, latency_ms)
    except (KeyError, TypeError, IndexError) as error:
        # Never log the job itself: it carries the signed video URL.
        log.error("the job doesn't match the §6 contract (%s); this is a worker bug", type(error))
        return
    send_callback(cfg, body)


# --- the loop ----------------------------------------------------------------------


def backoff_seconds(poll_interval: float, failures: int) -> float:
    """Exponential back-off after ``failures`` network errors in a row, capped."""
    return min(poll_interval * 2 ** max(0, failures - 1), MAX_BACKOFF_S)


def run(cfg: WorkerConfig, sleep: Sleep = time.sleep) -> int:
    """Poll until stopped (or, with ``once`` or ``max_jobs``, until enough jobs are
    done). Returns the exit code."""
    log.info("stub worker %s polling every %ss", cfg.worker_id, cfg.poll_interval)
    max_jobs = 1 if cfg.once else cfg.max_jobs
    done = 0
    failures = 0
    while True:
        try:
            job = claim(cfg)
            if job is not None:
                process(cfg, job, sleep)
                done += 1
            failures = 0
        except Unauthorized:
            log.error(
                "Convex answered 401: AI_SHARED_SECRET is wrong, or not set on this deployment "
                "(pnpm exec convex env set AI_SHARED_SECRET ...). Exiting."
            )
            return 1
        except Forbidden as forbidden:
            if forbidden.error == STUB_DISABLED:
                log.error(
                    "Convex answered 403 stub_disabled on %s: this deployment has not enabled "
                    "the stub worker. On the DEV deployment only, run "
                    "`pnpm exec convex env set AI_STUB_ENABLED 1` from the repo root; "
                    "never on prod. Exiting.",
                    forbidden.endpoint,
                )
            else:
                log.error(
                    "Convex answered 403 on %s (%s): the stub worker is not allowed here. Exiting.",
                    forbidden.endpoint,
                    forbidden.error,
                )
            return 1
        except OSError as error:
            failures += 1
            delay = backoff_seconds(cfg.poll_interval, failures)
            log.warning("network error (%s); retrying in %ss", type(error).__name__, delay)
            sleep(delay)
            continue
        if job is not None:
            if max_jobs is not None and done >= max_jobs:
                return 0
            continue  # more may be queued: poll again straight away
        sleep(cfg.poll_interval)


# --- the CLI -----------------------------------------------------------------------


def default_worker_id(hostname: str | None = None) -> str:
    return f"{STUB_PREFIX}{hostname or socket.gethostname()}"[:MAX_WORKER_ID_LENGTH]


def stub_worker_id(worker_id: str) -> str:
    """``worker_id``, prefixed with "stub-" unless it already starts with "stub"
    (any case, as Convex matches it), capped at 100 chars."""
    worker_id = worker_id.strip()
    if not worker_id.lower().startswith("stub"):
        worker_id = STUB_PREFIX + worker_id
    return worker_id[:MAX_WORKER_ID_LENGTH]


def is_dev_deployment(deployment: str | None) -> bool:
    """True only for a ``CONVEX_DEPLOYMENT`` of the form "dev:<name>"."""
    return deployment is not None and deployment.strip().startswith(DEV_DEPLOYMENT_PREFIX)


def load_env() -> tuple[str | None, str | None, str | None]:
    """(CONVEX_SITE_URL, AI_SHARED_SECRET, CONVEX_DEPLOYMENT) from the env or the
    repo-root .env (D-13)."""
    if str(AI_SERVICE_DIR) not in sys.path:
        sys.path.insert(0, str(AI_SERVICE_DIR))  # `python scripts/stub_worker.py` from anywhere
    from app.settings import load_settings

    settings = load_settings()
    secret = settings.ai_shared_secret
    return (
        settings.convex_site_url,
        secret.get_secret_value() if secret else None,
        settings.convex_deployment,
    )


def parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="V1 stub worker: claim jobs from Convex and post canned results. "
        "Dev only; never for real users."
    )
    parser.add_argument("--once", action="store_true", help="exit after one job is processed")
    parser.add_argument(
        "--max-jobs",
        type=int,
        default=None,
        help="exit after N jobs are processed (--once is --max-jobs 1)",
    )
    parser.add_argument(
        "--hold-seconds",
        type=float,
        default=0.0,
        help="seconds to wait between claiming a job and posting its callback, so it stays "
        f"'analyzing' (0 to {MAX_HOLD_S:g}; default 0)",
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        default=DEFAULT_POLL_INTERVAL_S,
        help=f"seconds between polls when nothing is queued (default {DEFAULT_POLL_INTERVAL_S})",
    )
    parser.add_argument(
        "--worker-id",
        default=None,
        help='default: stub-<hostname>; "stub-" is prepended if the id does not start with "stub"',
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="debug logging")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    site_url, secret, deployment = load_env()
    missing = [
        name
        for name, value in (("CONVEX_SITE_URL", site_url), ("AI_SHARED_SECRET", secret))
        if not value
    ]
    if missing or site_url is None or secret is None:
        print(f"stub worker: set {' and '.join(missing)} in the root .env", file=sys.stderr)
        return 1
    if not is_dev_deployment(deployment):
        print(
            "stub worker: refusing to start: CONVEX_DEPLOYMENT must start with 'dev:' "
            "(it is missing or not a dev deployment). The stub never runs against prod; "
            "run `pnpm exec convex dev` against your dev deployment first.",
            file=sys.stderr,
        )
        return 1
    if not site_url.startswith(("http://", "https://")):
        print("stub worker: CONVEX_SITE_URL must start with http:// or https://", file=sys.stderr)
        return 1
    if args.poll_interval <= 0:
        print("stub worker: --poll-interval must be positive", file=sys.stderr)
        return 1
    if not 0 <= args.hold_seconds <= MAX_HOLD_S:  # also refuses nan
        print(
            f"stub worker: --hold-seconds must be between 0 and {MAX_HOLD_S:g} "
            "(it must stay well under the 10-minute requeue)",
            file=sys.stderr,
        )
        return 1
    if args.max_jobs is not None and args.max_jobs < 1:
        print("stub worker: --max-jobs must be at least 1", file=sys.stderr)
        return 1
    cfg = WorkerConfig(
        site_url=site_url.rstrip("/"),
        secret=secret,
        worker_id=stub_worker_id(args.worker_id or default_worker_id()),
        poll_interval=args.poll_interval,
        once=args.once,
        hold_seconds=args.hold_seconds,
        max_jobs=args.max_jobs,
    )
    try:
        return run(cfg)
    except KeyboardInterrupt:
        log.info("stopped")
        return 0


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG if "-v" in sys.argv or "--verbose" in sys.argv else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    sys.exit(main())
