"""Analyse one clip with Cosmos Reason 2 (and optionally Nemotron): the V2 spike (P4).

Run from ``ai-service/`` with the SSH tunnel to the box open
(``ssh -N -L 18000:127.0.0.1:8000 smartfundi``)::

    uv run python scripts/analyze_clip.py [--clip PATH] [--fps 4 2] [--assess]
        [--cosmos-url http://127.0.0.1:18000] [--out eval/runs/<date>-<clip>.json]

It probes the clip (OpenCV), sends it to Cosmos as a base64 ``data:`` URL at
each fps, parses and validates every answer against the Rubric, and prints
the tokens, latency and the Observations table. ``--assess`` then sends the
first run's Observations to hosted Nemotron and applies the ADR-11 rules.
No Liveness code was issued for a standalone clip, so liveness is never
matched and the rules cap the Verdict at ``needs_review``.

The saved JSON holds the parsed runs only: no URL, no raw answer, no secret.
Settings (``NVIDIA_API_KEY``, ``NEMOTRON_MODEL``) come from ``app.settings``;
an env var wins over the repo-root ``.env``.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

AI_SERVICE_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_SERVICE_DIR.parent
if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))

from app import cosmos  # noqa: E402
from app.contract import Observation, RubricItem  # noqa: E402
from app.video import VideoProbe, guard, probe  # noqa: E402

DEFAULT_CLIP = REPO_ROOT / "docs" / "demo_videos" / "electrical_video.mp4"
DEFAULT_RUBRIC = AI_SERVICE_DIR / "eval" / "rubrics" / "electrical.13a-socket.v1.json"
DEFAULT_COSMOS_URL = "http://127.0.0.1:18000"


def load_rubric(path: Path = DEFAULT_RUBRIC) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def rubric_items(rubric: dict[str, Any]) -> list[RubricItem]:
    return [RubricItem.from_job(i) for i in rubric["items"]]


def observations_table(observations: list[Observation], items: list[RubricItem]) -> str:
    """A plain-text table: item, safety, result, time, evidence."""
    safety = {i.id: i.safety for i in items}
    rows = [f"{'item':<15} {'safety':<6} {'result':<8} {'t (s)':>6}  evidence"]
    for o in observations:
        rows.append(
            f"{o.item_id:<15} {'yes' if safety.get(o.item_id) else 'no':<6} {o.result:<8} "
            f"{o.timestamp_s:>6.1f}  {o.evidence}"
        )
    return "\n".join(rows)


def observations_json(observations: list[Observation]) -> list[dict[str, Any]]:
    return [o.to_callback() for o in observations]


def observations_from_json(raw: list[dict[str, Any]]) -> list[Observation]:
    return [
        Observation(o["itemId"], o["result"], o["evidence"], float(o["timestampS"])) for o in raw
    ]


def run_cosmos(
    clip: Path,
    video: VideoProbe,
    rubric: dict[str, Any],
    cosmos_url: str,
    fps: int,
    max_tokens: int,
    max_model_len: int,
    model: str,
) -> dict[str, Any]:
    """One Cosmos run at ``fps``, parsed and validated. Never includes the URL."""
    items = rubric_items(rubric)
    prompt = cosmos.build_prompt(rubric["trade"]["name"], rubric["task"]["name"], items)
    request = cosmos.build_request(
        model, cosmos.video_data_url(clip), prompt, fps, max_tokens, max_model_len
    )
    run = cosmos.call_cosmos(cosmos.make_client(cosmos_url), request)
    parsed = cosmos.parse_observe_reply(run.content, items, video.duration_s)
    return {
        "fps": fps,
        "maxTokens": max_tokens,
        "maxModelLen": max_model_len,
        "pixelBudget": cosmos.pixel_budget(max_model_len, max_tokens),
        "promptTokens": run.prompt_tokens,
        "completionTokens": run.completion_tokens,
        "latencyS": round(run.latency_s, 2),
        "finishReason": run.finish_reason,
        "observations": observations_json(parsed.observations),
        "livenessDigits": parsed.liveness_digits,
        "parseIssues": parsed.issues,
    }


def run_assess(rubric: dict[str, Any], observations: list[Observation]) -> dict[str, Any]:
    """Nemotron's draft plus the ADR-11 rules (no Liveness code issued: never matched)."""
    from app.assess import assess, build_prompt, fallback_reply, structured_invoker
    from app.rules import apply_hard_rules
    from app.settings import get_settings

    items = rubric_items(rubric)
    invoke, model, key = structured_invoker(get_settings())
    prompt = build_prompt(rubric["trade"]["name"], rubric["task"]["name"], items, observations)
    outcome = assess(prompt, invoke, model, key)
    draft = outcome.reply or fallback_reply(items, observations)
    ruled = apply_hard_rules(items, observations, draft.verdict, draft.safetyFlags, None, "")
    return {
        "model": outcome.model,
        "promptVersion": "assess.v1",
        "attempts": outcome.attempts,
        "usedFallback": outcome.reply is None,
        "latencyS": round(outcome.latency_s, 2),
        "draft": draft.model_dump(),
        "final": asdict(ruled),
    }


def print_run(run: dict[str, Any], items: list[RubricItem]) -> None:
    print(
        f"\n== fps {run['fps']}: prompt {run['promptTokens']} + completion "
        f"{run['completionTokens']} tokens, {run['latencyS']} s, finish {run['finishReason']}"
    )
    print(observations_table(observations_from_json(run["observations"]), items))
    print(f"liveness digits read: {run['livenessDigits']}")
    if run["parseIssues"]:
        print("parse issues: " + "; ".join(run["parseIssues"]))


def print_assess(result: dict[str, Any]) -> None:
    draft, final = result["draft"], result["final"]
    print(
        f"\n== Nemotron {result['model']} ({result['attempts']} attempt(s), "
        f"{result['latencyS']} s, fallback {result['usedFallback']})"
    )
    print(f"draft verdict: {draft['verdict']}  safetyFlags: {draft['safetyFlags']}")
    print("strengths: " + json.dumps(draft["strengths"], ensure_ascii=False))
    print("gaps: " + json.dumps(draft["gaps"], ensure_ascii=False))
    print(f"feedbackEn: {draft['feedbackEn']}")
    print(
        f"FINAL (ADR-11): {final['verdict']}  capped={final['capped']}  "
        f"liveness={final['liveness_check']}  flags={final['safety_flags']}  "
        f"reasons={final['reasons']}"
    )


def parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyse one clip with Cosmos (+ Nemotron).")
    parser.add_argument("--clip", type=Path, default=DEFAULT_CLIP)
    parser.add_argument("--rubric", type=Path, default=DEFAULT_RUBRIC)
    parser.add_argument("--cosmos-url", default=DEFAULT_COSMOS_URL)
    parser.add_argument("--model", default=None, help="default: COSMOS_MODEL from settings")
    parser.add_argument("--fps", type=int, nargs="+", default=[4, 2])
    parser.add_argument("--max-tokens", type=int, default=cosmos.DEFAULT_MAX_TOKENS)
    parser.add_argument("--max-model-len", type=int, default=cosmos.DEFAULT_MAX_MODEL_LEN)
    parser.add_argument("--assess", action="store_true", help="then run Nemotron + ADR-11")
    parser.add_argument(
        "--assess-only",
        type=Path,
        default=None,
        help="skip Cosmos: assess the first run in this saved JSON and write it back",
    )
    parser.add_argument("--out", type=Path, default=None)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    rubric = load_rubric(args.rubric)
    items = rubric_items(rubric)

    if args.assess_only is not None:
        saved = json.loads(args.assess_only.read_text(encoding="utf-8"))
        first = saved["runs"][0]
        print_run(first, items)
        saved["assess"] = {
            "fromFps": first["fps"],
            **run_assess(rubric, observations_from_json(first["observations"])),
        }
        print_assess(saved["assess"])
        args.assess_only.write_text(json.dumps(saved, indent=2, ensure_ascii=False) + "\n")
        print(f"\nsaved {args.assess_only}")
        return 0

    from app.settings import get_settings

    model = args.model or get_settings().cosmos_model
    video = probe(args.clip)
    reason = guard(video)
    print(
        f"clip {args.clip.name}: {video.duration_s:.2f} s, {video.width}x{video.height}, "
        f"mean luma {video.mean_luma:.1f}; guard: {reason.code if reason else 'ok'}"
    )
    runs = []
    for fps in args.fps:
        run = run_cosmos(
            args.clip,
            video,
            rubric,
            args.cosmos_url,
            fps,
            args.max_tokens,
            args.max_model_len,
            model,
        )
        print_run(run, items)
        runs.append(run)

    saved: dict[str, Any] = {
        "date": datetime.now(UTC).strftime("%Y-%m-%d"),
        "clip": args.clip.name,
        "consent": "cleared for demo and eval by the operator, 2026-09-27",
        "cosmosModel": model,
        "promptVersion": cosmos.PROMPT_VERSION,
        "rubric": {
            "trade": rubric["trade"]["slug"],
            "task": rubric["task"]["slug"],
            "version": rubric["version"],
        },
        "probe": {
            "durationS": round(video.duration_s, 2),
            "width": video.width,
            "height": video.height,
            "meanLuma": round(video.mean_luma, 1),
            "guard": reason.code if reason else "ok",
        },
        "runs": runs,
    }
    if args.assess:
        saved["assess"] = {
            "fromFps": runs[0]["fps"],
            **run_assess(rubric, observations_from_json(runs[0]["observations"])),
        }
        print_assess(saved["assess"])

    out = args.out or (AI_SERVICE_DIR / "eval" / "runs" / f"{saved['date']}-{args.clip.stem}.json")
    out.write_text(json.dumps(saved, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nsaved {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
