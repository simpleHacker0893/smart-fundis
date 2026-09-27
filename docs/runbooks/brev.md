# Running Smart Fundis V2 on Brev

- **Owner:** gpu-devops. Human-only steps are marked 👤.
- **Status:** plan, 2026-09-27. Commands are from the live Brev, NVIDIA Cosmos and HF docs (sources in `docs/research/2026-09-27-v2-real-ai-prep.md`). The scripts it names (`serve_vllm.sh`, `up.sh`, `poller.py`) are built in V2 tickets V2-a and V2-f.
- **Shape (ADR-9):** the box makes only **outbound** calls. It pulls jobs from Convex `/ai/claim` and posts to `/ai/callback`. No inbound port is opened, and Convex never calls the box.

```
Brev GPU box (/home/ubuntu/workspace, persists across stop)
├─ vLLM :8000  Cosmos-Reason2-8B  (or 2B fallback)   gpu-mem 0.45
├─ vLLM :8001  Nemotron-3-Nano-30B-A3B-FP8            gpu-mem 0.40
├─ ai-service  FastAPI /health :8080 (localhost only)
└─ poller      QUEUE_MODE=inline → graph → callback   ──HTTPS──▶ https://<deployment>.convex.site/ai/*
               (Redis + Celery only when QUEUE_MODE=celery)
```

## 1. One-time setup 👤

1. **Brev CLI on Windows runs in WSL** (there's no native binary):
   ```bash
   wsl --install -d Ubuntu-22.04          # PowerShell, once
   # in the Ubuntu shell:
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/brevdev/brev-cli/main/bin/install-latest.sh)"
   brev login                             # opens a browser
   brev set                               # list orgs
   brev set <org>                         # the org that holds the credits
   ```
2. **Hugging Face:**
   - Sign in to the account whose token goes on the box.
   - Open `https://huggingface.co/nvidia/Cosmos-Reason2-8B` and **accept the licence**. Do the same for the 2B.
   - Create a read token.
   - The Nemotron FP8 repo is `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8`.
3. **Secrets for the box.** They never go in the repo or the repo-root `.env`, and the box never reads your laptop's `.env` (D-13 is about local dev):

   | Name | Value |
   | --- | --- |
   | `HF_TOKEN` | the read token from step 2 |
   | `CONVEX_SITE_URL` | `https://<dev deployment>.convex.site` (dev first; prod only at V2-i) |
   | `AI_SHARED_SECRET` | the **same** value as on that Convex deployment (`pnpm exec convex env set AI_SHARED_SECRET …`) |
   | `CONVEX_DEPLOYMENT` | `dev:<name>` (the poller logs it) |
   | `QUEUE_MODE` | `inline` |
   | `VLLM_BASE_URL` / `NEMOTRON_BASE_URL` | `http://localhost:8000/v1` / `http://localhost:8001/v1` |
   | `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT=smart-fundis-agent` | optional; tracing stays masked (D-14) |
   | `NVIDIA_API_KEY` | only while the hosted Nemotron fallback exists (D-32) |

   Keep these in `/home/ubuntu/workspace/.env.brev` on the box (mode 600). Write the file over `brev shell`; don't copy it from a file in the repo.

## 2. Create the box

```bash
brev search --gpu-name H100 --min-vram 80 --sort price     # the docs list H100 as 96GB; check what's offered
brev search --gpu-name A100 --min-vram 80 --sort price     # fallback with the same memory plan
brev create smart-fundis-gpu --gpu-name H100 --min-vram 80 --min-disk 500
brev shell smart-fundis-gpu
```

- **The disk:** 500 GB holds both Cosmos sizes and Nemotron FP8 with room to spare.
- **Weights:** keep them under `/home/ubuntu/workspace/hf-cache` (`HF_HOME`) so a stop and start doesn't re-download them. `/tmp` is wiped.
- **L40S or other 44–48 GB cards:** they **can't** hold Cosmos-8B and Nemotron together. They'd need Cosmos-2B plus hosted Nemotron, which is a decision, not a default.

## 3. Install on the box

```bash
cd /home/ubuntu/workspace
git clone https://github.com/simpleHacker0893/smart-fundis.git && cd smart-fundis/ai-service
curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.bashrc
uv sync                                   # V2 adds langgraph, langchain-openai, opencv-python-headless, redis, celery
uv pip install "vllm>=0.12.0"             # Cosmos needs ≥0.11 and transformers ≥4.57; Nemotron needs ≥0.12
export HF_HOME=/home/ubuntu/workspace/hf-cache
set -a; source /home/ubuntu/workspace/.env.brev; set +a
huggingface-cli download nvidia/Cosmos-Reason2-8B
huggingface-cli download nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8
du -sh $HF_HOME/hub/*                     # record the real FP8 size (research extrapolated ~32 GB)
```

## 4. First hour: measure before building on assumptions

Run these in order, and record the numbers in the V2-a handoff.

1. **Egress** (UNVERIFIED in the docs):
   ```bash
   curl -sI https://huggingface.co | head -1
   curl -s -o /dev/null -w "%{http_code}\n" -X POST "$CONVEX_SITE_URL/ai/claim"
   ```
   The second call should return **401**, because no secret was sent. That proves the route is reachable.
2. **Serve Cosmos alone.** Use NVIDIA's flags, with our context and memory split:
   ```bash
   vllm serve nvidia/Cosmos-Reason2-8B --port 8000 \
     --max-model-len 32768 --gpu-memory-utilization 0.45 \
     --media-io-kwargs '{"video": {"num_frames": -1}}' \
     --reasoning-parser qwen3 --allowed-local-media-path /home/ubuntu/workspace
   ```
3. **R-3 token count.** Send one request with a real 13A-socket clip:
   - the demo clip `docs/demo_videos/electrical_video.mp4`, copied to the box with `brev copy`;
   - a `video_url` part and `extra_body={"media_io_kwargs": {"video": {"fps": 4}}}`.

   Read `usage.prompt_tokens`, then repeat at fps 2. Set `--max-model-len` and the fps rule (prep doc G1) from the result.
4. **Serve Nemotron FP8 beside it:**
   ```bash
   VLLM_USE_FLASHINFER_MOE_FP8=1 vllm serve nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8 --port 8001 \
     --served-model-name nemotron --max-model-len 8192 --max-num-seqs 8 \
     --kv-cache-dtype fp8 --gpu-memory-utilization 0.40 --trust-remote-code
   ```
   With both processes up, send one Cosmos video request and one Nemotron structured call **at the same time**. Watch `nvidia-smi`. If there's an OOM, serve Cosmos-2B in place of the 8B (same flags).
5. **Structured output.** Check that `ChatOpenAI(base_url="http://localhost:8001/v1", model="nemotron", extra_body={"chat_template_kwargs": {"enable_thinking": False}}).with_structured_output(Verdict, method="json_schema")` returns a valid `Verdict`.

## 5. Run the service (after V2-a and V2-f land)

A launchable's startup script does **not** re-run after a restart, so everything restarts from `up.sh` inside tmux:

```bash
cd /home/ubuntu/workspace/smart-fundis/ai-service
tmux new -d -s sf 'bash scripts/up.sh'    # starts both vLLM servers, waits for health, then the poller
tmux attach -t sf                          # watch; Ctrl-b d to detach
curl -s localhost:8080/health              # {status, models, queue_mode, redis}
```

- **The poller** claims with `workerId = brev-<hostname>` and a `model` string that **doesn't** start with `stub`, so the Convex stub gate never blocks it.
- **Jobs:** it processes one job at a time (`inline`) and posts the callback.
- **Stopping the V1 stub:** once the real poller runs against a deployment, stop the stub there. Two pollers race for the same jobs. The race is safe, because the claim is atomic and a stale callback gets 409, but it is confusing.

## 6. Failure drills (the V2 demo)

| Drill | Do | Expect |
| --- | --- | --- |
| vLLM down | `tmux kill-session`, or stop the :8000 server; `up.sh` restarts on the 2B | The next result has `fallbackModel: true`; the Expert sees "Checked with the backup model" |
| Redis down | Only when `QUEUE_MODE=celery`: stop Redis, set `QUEUE_MODE=inline`, restart the poller | Jobs still flow |
| Worker dies mid-job | Kill the poller during `analyzing` | After 10 min the Convex cron requeues it (attempt 2), or fails it at attempt 2 |
| Wrong paper code | Upload with a wrong code on paper | `livenessCheck: unclear`, and the Verdict is capped at `needs_review` (ADR-11) |

## 7. Cost control 👤

- **No auto-stop is documented.** Stop the box at the end of every work session: `brev stop smart-fundis-gpu`. That stops compute billing, and only storage is charged. The weights on `/home/ubuntu/workspace` survive.
- `brev start smart-fundis-gpu`, then `tmux new -d -s sf 'bash scripts/up.sh'` to resume.
- `brev delete smart-fundis-gpu` only when the project is done. It is irreversible, and the weights are gone.
- Log each session's start and stop, with the hours, in the V2 handoff so credit burn is visible (QUESTIONS #3).

## 8. Switch to prod (V2-i, Architect only 👤)

1. Set `AI_SHARED_SECRET` on the **prod** Convex deployment to a **new** value (separate from dev, spec §3). Never set `AI_STUB_ENABLED` on prod.
2. On the box, change `CONVEX_SITE_URL`, `AI_SHARED_SECRET` and `CONVEX_DEPLOYMENT` in `.env.brev` to prod, then restart the poller.
3. Upload once on prod and watch `awaiting_review` arrive. To switch back, restore the dev values and restart.
