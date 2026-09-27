#!/usr/bin/env python3
"""Smoke test: send one short clip to Cosmos Reason 2 on vLLM and print the reply and latency.

Ticket #8. Standard library only, so it runs on the Brev box's system Python with no installs.

The request follows NVIDIA's own online client (cosmos-reason2 ``script/inference.py``):
a ``video_url`` part with a ``file://`` path under ``--allowed-local-media-path`` and a total pixel
budget of ``(max_model_len - max_tokens) * 1024 * 0.9`` (``mm_processor_kwargs.size.longest_edge``)
so the video always fits the context. Measured on vLLM 0.30.0: fps must be sent in
``media_io_kwargs`` and ``do_sample_frames`` must be left out (see the comment in the body).

Usage (on the box, vLLM on 127.0.0.1:8000, clip under /data):
    python3 smoke_cosmos.py --clip /data/smoke.mp4
    python3 smoke_cosmos.py --clip /data/smoke.mp4 --fps 2 --no-reasoning

From a laptop, forward the port first (`ssh -L 8000:127.0.0.1:8000 smartfundi`); the clip path must
still be a path on the box, because vLLM reads it locally.

It prints no secrets (it needs none) and never logs anything but the local clip path.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

PIXELS_PER_TOKEN = 32 * 32  # patch 16 x spatial merge 2 (cosmos_reason2_utils.vision)
VIDEO_MIN_PIXELS = 128 * PIXELS_PER_TOKEN  # qwen_vl_utils VIDEO_MIN_TOKEN_NUM * PIXELS_PER_TOKEN
SYSTEM_PROMPT = "You are a helpful assistant."
REASONING_PROMPT = (
    "Answer the question using the following format:\n\n<think>\nYour reasoning.\n</think>\n\n"
    "Write your final answer immediately after the </think> tag."
)
DEFAULT_PROMPT = (
    "Describe what happens in this video in two short sentences. "
    "Then say what number, if any, is visible at the end."
)


def _request(url: str, body: dict | None = None, timeout: float = 600) -> dict:
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers)  # noqa: S310 - scheme checked in main()
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
        return json.load(resp)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--base-url", default="http://127.0.0.1:8000/v1")
    p.add_argument("--clip", default="/data/smoke.mp4", help="path on the vLLM host")
    p.add_argument("--fps", type=float, default=4.0, help="4 matches Cosmos training")
    p.add_argument("--max-tokens", type=int, default=1024)
    p.add_argument("--prompt", default=DEFAULT_PROMPT)
    p.add_argument(
        "--no-reasoning",
        dest="reasoning",
        action="store_false",
        help="omit NVIDIA's <think> suffix (the qwen3 parser then files the answer as reasoning)",
    )
    args = p.parse_args(argv)
    if not args.base_url.startswith(("http://", "https://")):
        print("smoke failed: --base-url must be http:// or https://", file=sys.stderr)
        return 1

    try:
        models = _request(f"{args.base_url}/models", timeout=10)["data"]
    except (urllib.error.URLError, OSError) as e:
        reason = type(e).__name__
        print(f"smoke failed: vLLM not reachable at {args.base_url} ({reason})", file=sys.stderr)
        return 1
    model = models[0]
    max_model_len = int(model.get("max_model_len") or 8192)
    if max_model_len <= args.max_tokens:
        print("smoke failed: max_model_len must exceed --max-tokens", file=sys.stderr)
        return 1
    total_pixels = int((max_model_len - args.max_tokens) * PIXELS_PER_TOKEN * 0.9)

    user_text = args.prompt + (f"\n\n{REASONING_PROMPT}" if args.reasoning else "")
    body = {
        "model": model["id"],
        "messages": [
            {"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]},
            {
                "role": "user",
                "content": [
                    {"type": "video_url", "video_url": {"url": f"file://{args.clip}"}},
                    {"type": "text", "text": user_text},
                ],
            },
        ],
        "max_tokens": args.max_tokens,
        # NVIDIA's defaults: reasoning 0.6/0.95, plain 0.7/0.8
        "temperature": 0.6 if args.reasoning else 0.7,
        "top_p": 0.95 if args.reasoning else 0.8,
        # vLLM 0.30: frames are sampled at decode time, so fps goes in media_io_kwargs (server
        # started with --media-io-kwargs '{"video": {"num_frames": -1}}' to allow it). fps in
        # mm_processor_kwargs alone is ignored (vLLM keeps its ~2 fps default), and
        # "do_sample_frames": true, as in NVIDIA's client, makes Qwen3VLProcessor fail (HTTP 400).
        # size.longest_edge is the total pixel budget across all frames; it caps the video tokens.
        "media_io_kwargs": {"video": {"fps": args.fps}},
        "mm_processor_kwargs": {
            "fps": args.fps,
            "size": {"shortest_edge": VIDEO_MIN_PIXELS, "longest_edge": total_pixels},
        },
    }

    t0 = time.perf_counter()
    try:
        out = _request(f"{args.base_url}/chat/completions", body)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        print(f"smoke failed: HTTP {e.code}: {detail}", file=sys.stderr)
        return 1
    except (urllib.error.URLError, OSError) as e:
        print(f"smoke failed: {type(e).__name__}", file=sys.stderr)
        return 1
    latency = time.perf_counter() - t0

    msg = out["choices"][0]["message"]
    usage = out.get("usage") or {}
    print(f"model: {model['id']}  max_model_len: {max_model_len}")
    print(f"clip: {args.clip}  fps: {args.fps}  pixel budget: {total_pixels}")
    # Print both raw fields. With --reasoning-parser qwen3 on vLLM 0.30.0 (measured):
    # - with NVIDIA's <think> suffix (the default here), the trace is in `reasoning` and the
    #   answer in `content`;
    # - without it the model emits no </think>, so the parser files the whole answer under
    #   `reasoning` and `content` is null.
    reasoning = (msg.get("reasoning_content") or msg.get("reasoning") or "").strip()
    content = (msg.get("content") or "").strip()
    print(f"--- reasoning ({'present' if reasoning else 'empty'}) ---")
    print(reasoning)
    print(f"--- content ({'present' if content else 'empty'}) ---")
    print(content)
    print("---")
    print(
        f"prompt_tokens: {usage.get('prompt_tokens')}"
        f"  completion_tokens: {usage.get('completion_tokens')}"
        f"  finish_reason: {out['choices'][0].get('finish_reason')}"
    )
    print(f"latency_s: {latency:.2f}")
    finish = out["choices"][0].get("finish_reason")
    if not content and not reasoning:
        print("SMOKE FAILED: both content and reasoning are empty", file=sys.stderr)
        return 1
    if finish == "length":
        print(
            "SMOKE FAILED: output truncated (finish_reason=length); raise --max-tokens",
            file=sys.stderr,
        )
        return 1
    if not content:
        print(
            "SMOKE FAILED: content is empty; the answer is only in reasoning "
            "(expected with --no-reasoning under the qwen3 parser)",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
