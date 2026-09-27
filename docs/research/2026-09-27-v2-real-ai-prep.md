# V2 "Real AI": prep for the grill (prompt 10)

- **Date:** 2026-09-27
- **Slice:** MVP V2, Real AI (`planning/slices/V2.md`). This is not the V2 *track* (V7 to V11, the marketplace).
- **Purpose:** the facts and recommended answers the V2 grilling needs, so prompt 10 only has to confirm decisions. The companion runbook is `docs/runbooks/brev.md`.
- **Sources:**
  - live docs fetched 2026-09-27: NVIDIA Cosmos Reason 2 reference, the HF model cards, the vLLM docs, the Brev docs;
  - `docs/research/2026-09-26-nvidia-fit.md`;
  - a read of the code on `main` at `4233341`.

Anything marked **UNVERIFIED** must be measured on the Brev box in the first hour (runbook §4).

## 1. Where V2 starts

| Area | State on `main` | Evidence |
| --- | --- | --- |
| Pull contract (`/ai/claim`, `/ai/callback`, the requeue cron, ADR-11 applied again on the server) | **Done** in V1 | `convex/lib/aiContract.ts`, `convex/http.ts`, `convex/aiJobs.ts` |
| Stub gate | Done. A real worker must use a `workerId` **and** a `model` that don't start with `stub` | `convex/lib/aiStub.ts` |
| HTTP client pieces (Bearer POST, 204/401/403/409/400 handling, back-off, settings loaded from the root `.env`, never logging the URL) | Done in the stub, **reusable** | `ai-service/scripts/stub_worker.py`: `post_json`, `claim`, `send_callback`, `backoff_seconds`, `run` |
| LangSmith masking (D-14) | **Done** | `ai-service/app/tracing.py` |
| Settings (`vllm_base_url`, `cosmos_model`, `cosmos_fallback_model`, `redis_url`, `queue_mode`) | Fields only, no logic | `ai-service/app/settings.py` |
| Nemotron client | Hosted `ChatNVIDIA` smoke only. D-32 replaces it | `ai-service/app/nemotron.py` |
| Graph, `video.py`, `cosmos.py`, `rules.py`, pipeline prompts, `poller.py`, `callback.py`, Celery `worker.py`, `serve_vllm.sh`, `up.sh`, `/health` with model and queue | **Missing** | Nothing in the repo |
| Python deps (langgraph, openai / langchain-openai, opencv, redis, celery) | **Missing** from `pyproject.toml` | `ai-service/pyproject.toml` |
| Expert UI: Liveness code against the digits read, backup-model note | Done in V1 | `review-detail.tsx` |
| Expert UI: tap an Observation to seek the video | **Missing on purpose**. DESIGN §D5 keeps timestamps as plain text until the timestamp eval passes (#41 deferral) | `design/stitch/DESIGN.md` §D5, `docs/handoff/41.md` |
| Eval (`eval/clips.csv`, `POST /eval/run`) | Empty | `ai-service/eval/` |
| Test clip | `docs/demo_videos/electrical_video.mp4` (2.4 MB, untracked) | See §5 on where clips live |

## 2. Hard facts that shape the plan

1. **Both models fit on one 80 GB GPU only with Nemotron in FP8.**
   - Cosmos-Reason2-8B needs at least 32 GB, and the 2B at least 24 GB (HF cards).
   - Nemotron 3 Nano 30B-A3B is 63.2 GB in BF16 (the HF repo), so BF16 can't share the box with either Cosmos. FP8 is about 32 GB (**UNVERIFIED**, extrapolated).
   - Cosmos-8B plus Nemotron FP8 is about 64 GB of weights, which leaves about 16 GB for two KV caches and CUDA. That's tight.
2. **R-3 is real.** Cosmos Reason 2 is built on Qwen3-VL. At about (frames ÷ 2) × (H/28) × (W/28), a 90 s clip at fps 4 and 360p is roughly **53k visual tokens** (**UNVERIFIED**; the config is gated). That is far over 8192, and over NVIDIA's own 16384 example.
3. **Minimum vLLM is 0.12.0** (Nemotron's floor; Cosmos needs 0.11.0 and transformers 4.57.0). `guided_json` was removed in 0.12.0, so use `response_format: json_schema`.
4. **Cosmos-Reason2 is gated on HF.** The `HF_TOKEN` account must accept the licence before the first `vllm serve`.
5. **Brev on Windows means WSL**, with no native CLI.
   - Nothing survives a stop outside `/home/ubuntu/workspace`.
   - A launchable's startup script does **not** re-run on restart.
   - **No auto-stop is documented.**
   - The public GPU list says "H100 96GB", but the repo assumes 80 GB. Check with `brev search` on the day.
6. **Egress from a Brev box to `*.convex.site` and `huggingface.co`** is expected to work like any cloud VM, but that is **UNVERIFIED**. `curl` both in the first hour.

## 3. Grill questions with recommended answers

These start from the "Grill focus" in `planning/slices/V2.md`, plus the ones this research adds. Each answer is a recommendation for the operator to confirm in prompt 10.

| # | Question | Recommended answer | Why | Cost if wrong |
| --- | --- | --- | --- | --- |
| G1 (R-3) | fps 4 × 90 s against the context window | Serve Cosmos with **`--max-model-len 32768`**. Keep **fps 4 up to 45 s**; above that, send **fps 2** (the request's `media_io_kwargs`). The 90 s cap stays. Measure the real token count on the demo clip in hour 1 and adjust | fps 4 matches training and gives the best timestamps; long clips pay precision (±0.25 s at fps 2 per NVIDIA) instead of failing. Raising the context costs a few GB of KV cache on an 8B | Long clips time out or OOM; fall back to Cosmos-2B |
| G2 | One Cosmos call for all Rubric items, or one per item | **One call** that returns every item's Observation and the `liveness_digits`, as JSON | Rubrics have about 5–8 items, and one pass keeps latency down (one video prefill, not N) | If accuracy drops, the eval shows it; switch to per-item for safety items only |
| G3 | Guard thresholds | OpenCV probe: **10 ≤ duration ≤ 90 s**, **short side ≥ 360 px**, **too dark** when the mean luma of 16 sampled frames is **< 40/255**. Tune the dark threshold on the team clips | Cheap, deterministic, and testable without a GPU | False "too dark" reshoots; tune one constant |
| G4 | Nemotron retries and latency | **One repair retry** (spec §6), then an `error` callback. Timeout 60 s per call. Demo budget: **p95 under 3 minutes** from claim to callback | Convex already requeues an error once (`MAX_ATTEMPTS = 2`) | A slow demo; the cron recovers stuck jobs |
| G5 (ADR-19) | "No cut between the code and the work" | **The Expert checks it**: a required "code and work in one take" line in the Expert detail, not an AI judgement | Cut detection isn't reliable at fps 2–4; ADR-11 already caps unclear liveness | An Expert misses a splice; this is an RAI note |
| G6 | GPU layout | One box: **Cosmos-8B (`--gpu-memory-utilization 0.45`) + Nemotron-FP8 (`0.40`)**, two vLLM processes on ports 8000/8001. If the H100 SKU is 96 GB, keep the split and gain headroom. The 2B fallback swaps in for the 8B, never alongside it | Facts 2.1 and 2.5 | OOM under load; use 2B |
| G7 | Queue | **`QUEUE_MODE=inline` is the MVP default** (the poller runs the graph in its own process, one job at a time). Redis and Celery stay behind the switch for the ADR-5 demo | One GPU and one job at a time; fewer moving parts | Throughput; one worker per GPU is fine for the demo |
| G8 | Real worker identity | `workerId = brev-<hostname>`; `model = "cosmos-reason2-8b@p1 + nemotron-3-nano-fp8@p1"` (spec §6 format) | It passes the stub gate (fact 1 row 2) and names the prompt versions | A 403 `stub_disabled` if it starts with `stub` |
| G9 | Tap-to-seek (the slice demo says "the Expert taps one and the video jumps") | **Build it behind a setting that stays off** until the timestamp eval passes (DESIGN §D5, NF §1.1). The demo turns it on only if the eval passes | Honesty rule: nothing may look reliable before it's measured | The demo shows plain timestamps |
| G10 | Eval clips | `ai-service/eval/clips.csv` with blind labels. The **video files stay out of Git**: a private bucket or the Brev disk, with only file names and labels in the repo (ADR-14; a recognisable person must never sit next to a critical verdict) | Privacy and repo size | Clips leak in Git history |
| G11 | Prod switch | The Architect flips the poller's `CONVEX_SITE_URL` and `AI_SHARED_SECRET` to prod (V2.md "Human steps"). The stub gate stays unset on prod | ADR-9, spec §3 | — |
| G12 | Stub honesty (V1 finding R-V1-1) | Decide before V2 ships: once the real pipeline runs, "The AI is watching your video" becomes true. **Keep the copy and retire the stub from any user-facing deployment** | It resolves R-V1-1 with no code | Confusion while the stub is still used on dev |

## 4. Proposed ticket cut (input for prompts 20 and 30)

Order: lane B builds against fixtures from hour 0, and lane A is small.

| # | Ticket | Owner | Plan-first | Blocked by |
| --- | --- | --- | --- | --- |
| V2-a | Brev box: create, serve both models (`serve_vllm.sh` with the 8B/2B switch), `up.sh`, first-hour measurements (R-3 tokens, `nvidia-smi` under a real pair, egress, FP8 size) | gpu-devops (+ **human**: HF licence, org, credits) | no (`ready-for-human` parts) | — |
| V2-b | `video.py` guard: probe and thresholds (G3), with pytest fixtures | ai-pipeline | no | — |
| V2-c | `cosmos.py` client and prompt `observe.v1` (G1, G2), with the parse tested on recorded fixtures | ai-pipeline | no | V2-a for the live check only |
| V2-d | `nemotron.py`, self-hosted: `ChatOpenAI` + `json_schema`, `enable_thinking: false`, with the hosted fallback behind a setting (D-32, G4) | ai-pipeline | no | V2-a for the live check only |
| V2-e | `rules.py` and the LangGraph graph `ingest → guard → observe → assess → rules` (spec §6 rules 1–5, ADR-11/19) | ai-pipeline | **yes** | V2-b, V2-c, V2-d |
| V2-f | `poller.py` + `callback.py` (reuse the stub's HTTP client), `QUEUE_MODE=inline`, Celery `worker.py` behind the switch, `/health` reports model, Redis and mode (G7, G8) | gpu-devops | no | V2-e |
| V2-g | Expert detail: tap-to-seek behind a setting (G9), and the "one take" check line (G5) | frontend | no | — |
| V2-h | Eval harness: `clips.csv`, `POST /eval/run`, agreement %, safety recall, p50/p95 per model and Trade, and the timestamp-reliability check that unlocks G9 | qa + ai-pipeline | no | V2-f |
| V2-i | Switch the poller to prod and run the demo | **human** (Architect) | — | V2-f, V2-h |

**Test seams (spec §10):**
- the graph as a black box through pytest, with the model clients faked;
- `rules.py` for every liveness and safety combination;
- the guard thresholds;
- "the Cosmos prompt never contains the Liveness code" (ADR-19).

The Convex contract is unchanged, so no convex-test work is expected.

## 5. Decisions the operator must make (not researchable)

1. The **Brev org and credit budget** (QUESTIONS #3), and whether to **stop** (keep the disk, pay storage) or **delete** between sessions.
2. Which **HF account** holds `HF_TOKEN`, and whether it has **accepted the Cosmos-Reason2 licence**.
3. Whether `docs/demo_videos/electrical_video.mp4` may be used as an eval clip (who is in it; consent under ADR-14). Where the clips live (G10).
4. Whether to keep **V7's order** in `planning/STATE.md` (V7 next) or to run **MVP V2 first**. V2's real pipeline also makes the V7 "video analysis" dashboard meaningful.

## 6. V1 loose ends before starting

- `docs/reviews/V1.md` on `main` has **no "Human checks (#43)" results**. Run `scripts/wizards/v1-real-phone-check.sh`, commit the output, then close #43 and #36 (prompt 60).
- R-V1-1 and R-V1-2 (copy honesty) are open. R-V1-2 is a one-line copy fix each.
