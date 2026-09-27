# Brev log: sessions, measurements and spend

Budget: **$100**. Stop new work at **$85**; keep $15 for the demo. One row per session (see `brev-prompts.md` P6).

| Date | Who | GPU and $/h | Start → stop | Hours | Cost | Running total | What was done |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-27 | gpu-devops agent (#8) | 1× L4 24 GB (GCP g2-standard-4), $0.85/h | 14:40 UTC → still running at 17:00 UTC | 2.3 so far | ~$2.00 so far | ~$2.00 | Box set up; Cosmos-Reason2-8B BF16 served on vLLM, 2B downloaded; smoke measured (see `docs/handoff/8.md`). The 521 GB disk bills ~$0.15/GB/month even when stopped. |

## Measurements (filled in by P3 and P4)

- **#8, 2026-09-27, L4:** Cosmos-Reason2-8B BF16 at `--max-model-len 8192 --gpu-memory-utilization 0.92 --max-num-seqs 4`, vLLM 0.30.0. Weights 16.65 GiB, KV cache 12,800 tokens, 20.3 GB on the GPU. Prompt tokens (synthetic 640×360): 8 s clip, 3,080 at fps 4 and 1,896 at fps 2; 90 s clip, 4,372 at fps 4 and 3,392 at fps 2. Latency: 10–15 s with the `<think>` suffix, 3.5–5.6 s without. Cold start is about 3.5 min.
- **V2 spike (`v2/spike-real-e2e`), 2026-09-27, L4, the real demo clip.** **Consent:** the operator confirmed that `docs/demo_videos/electrical_video.mp4` is cleared for use (demo and eval). The clip is 17.63 s, 576×1024 (portrait), mean luma 112.7, so the guard passes.
  - **Setup:** Cosmos-Reason2-8B at max_model_len 8192, reached from the laptop through `ssh -N -L 18000:127.0.0.1:8000 smartfundi`. The video is sent as a base64 `data:video/mp4;base64,…` URL, which vLLM 0.30.0 accepts, so nothing is copied to `/data`. max_tokens is 2048, and the pixel budget (`longest_edge`) is 5,662,310. The prompt is `observe.v1`, with NVIDIA's `<think>` suffix.
  - **Tokens and latency (one request at a time):**
    - fps 4: prompt **3,110**, completion 941, **62.9 s**;
    - fps 2: prompt **3,249**, completion 811, **52.9 s**;
    - the worker path again at fps 4: prompt 3,110, completion 691, 45.4 s.
    - With the same pixel budget, fps changes the frame size, not the token count. Both runs fit 8192 with room to spare.
  - **Per item** (isolate, test_dead, terminals, earth, no_bare_copper, faceplate, function_test):
    - fps 4, run 1: **all `unclear`**;
    - fps 2: no, no, unclear, no, **yes**, no, no;
    - fps 4, run 2 (worker path): **all `no`**.
    - Every timestamp is 0, and no `liveness_digits` were read (as expected: no code on paper).
    - The clip shows cutting and handling wires in a panel, not the Rubric's steps. The model tells "not shown" apart from "done wrong" inconsistently at temperature 0.6. By ADR-11 that flips the final Verdict between `needs_review` and `fail` on the same clip. This needs a decision in V2 (the prompt or temperature, measured on non-eval clips per ADR-14); the prompt was not tuned on this clip.
  - **Nemotron** (hosted `nvidia/nemotron-3-super-120b-a12b`; the `.env` `nano-30b-a3b` is 410): one attempt each; structured output valid.
    - On fps 4 run 1: draft `needs_review` in **6.8 s**.
    - On the worker path: draft `fail` in **15.5 s**.
  - **Final after ADR-11:** `needs_review` for run 1 (five safety items `unclear`, Liveness not matched) and `fail` for the worker path (a safety item `no`). Nemotron never overrode the rules.
  - **End to end, claim to callback without Convex:** 62.9 s. Download ~0 s (local), Cosmos 45.4 s, Nemotron 15.5 s.
  - Parsed runs: `ai-service/eval/runs/2026-09-27-electrical_video.json`.
