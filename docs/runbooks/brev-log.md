# Brev log: sessions, measurements and spend

Budget: **$100**. Stop new work at **$85**; keep $15 for the demo. One row per session (see `brev-prompts.md` P6).

| Date | Who | GPU and $/h | Start → stop | Hours | Cost | Running total | What was done |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-27 | gpu-devops agent (#8) | 1× L4 24 GB (GCP g2-standard-4), $0.85/h | 14:40 UTC → still running at 17:00 UTC | 2.3 so far | ~$2.00 so far | ~$2.00 | Box set up; Cosmos-Reason2-8B BF16 served on vLLM, 2B downloaded; smoke measured (see `docs/handoff/8.md`). The 521 GB disk bills ~$0.15/GB/month even when stopped. |

## Measurements (filled in by P3 and P4)

- **#8, 2026-09-27, L4:** Cosmos-Reason2-8B BF16 at `--max-model-len 8192 --gpu-memory-utilization 0.92 --max-num-seqs 4`, vLLM 0.30.0. Weights 16.65 GiB, KV cache 12,800 tokens, 20.3 GB on the GPU. Prompt tokens (synthetic 640×360): 8 s clip, 3,080 at fps 4 and 1,896 at fps 2; 90 s clip, 4,372 at fps 4 and 3,392 at fps 2. Latency: 10–15 s with the `<think>` suffix, 3.5–5.6 s without. Cold start is about 3.5 min.
