# Brev prompts: run V2 on a $100 budget

Paste-ready prompts and CLI steps for the team. The laptops are Linux or macOS with the Brev CLI. The coding agent (Hermes, or any agent) runs on the laptop or on the Brev box.

- **Why:** get the real models (Cosmos Reason 2, Nemotron) running on Brev, analyse the demo clip `docs/demo_videos/electrical_video.mp4`, then connect the app to Brev.
- **Background:** `docs/runbooks/brev.md` (the runbook) and `docs/research/2026-09-27-v2-real-ai-prep.md` (facts and decisions).
- **Order:** P1 → P2 → P3 → P4 → P5, then P6 at the end of **every** session.

> **Spike, not the final V2.** P4 and P5 build a small, working bridge so the team can see real AI output on the demo clip now. The proper V2 (the graph, `rules.py`, Nemotron Verdicts, the eval) still goes through prompt 10 (grill), prompt 20 (spec) and the tickets. Keep spike code on `v2/spike-*` branches, each with a PR.

## Budget: $100

- **Hours** = `100 ÷ hourly price`. Check the price in P2 with `brev search … --sort price`. At about $2.5/h that is about 40 GPU hours, and at about $4/h about 25.
- **Rule 1:** the box runs only while someone is actively working on it. **P6 (`brev stop`) ends every session.** Brev documents no auto-stop.
- **Rule 2:** log every start and stop in `docs/runbooks/brev-log.md`: date, who, hours, what was done, running total in dollars. **Stop new work at $85** and keep $15 for the demo.
- **Rule 3:** the model weights (about 50 GB) live on the box's persistent disk. `brev stop` keeps them, and **`brev delete` loses them**. Delete only at the end.

## Rules to paste above every agent prompt

```
Project rules (Smart Fundis, repo simpleHacker0893/smart-fundis):
- Read AGENTS.md and CONTEXT.md first. pnpm only (never npm/npx). Python via uv in ai-service/.
- Never print, log or commit secrets. On the Brev box, secrets live only in /home/ubuntu/workspace/.env.brev (chmod 600).
  Never read or copy anyone's laptop .env.
- The box only makes OUTBOUND calls (ADR-9). Never open an inbound port or expose vLLM publicly.
- Never log a video URL, the job body or the Liveness code.
- A real worker's workerId and model must NOT start with "stub" (convex/lib/aiStub.ts).
- Work on a branch named v2/spike-<topic>, commit small, open a PR. Never merge it yourself.
- Stop and ask me before anything that costs money beyond the running box, or anything irreversible (brev delete).
```

---

## P1: Laptop setup (human, one-time per laptop)

```bash
# macOS
brew install brevdev/homebrew-brev/brev
# Linux
bash -c "$(curl -fsSL https://raw.githubusercontent.com/brevdev/brev-cli/main/bin/install-latest.sh)"

brev login                 # opens a browser
brev set                   # list orgs
brev set <team-org>        # the org holding the $100
brev ls                    # see whether the team box already exists; don't create a second one
```

If the box already exists, skip P2 and run `brev start smart-fundis-gpu`.

## P2: Create the one team box (human, once)

```bash
brev search --gpu-name H100 --min-vram 80 --sort price
brev search --gpu-name A100 --min-vram 80 --sort price
# Pick the cheapest 80 GB+ card. Write its $/h in docs/runbooks/brev-log.md.
brev create smart-fundis-gpu --gpu-name <H100|A100> --min-vram 80 --min-disk 500
brev shell smart-fundis-gpu
```

- **The card:** 44–48 GB cards (L40S, A6000) can't hold both models.
- **Hugging Face:** before P3, one teammate opens https://huggingface.co/nvidia/Cosmos-Reason2-8B (and the 2B) and **accepts the licence**, then creates a read token.

## P3: Box setup and first-hour measurements (agent on the box)

Open `brev shell smart-fundis-gpu`, start the agent in `/home/ubuntu/workspace`, and paste the rules plus:

```
Task: set up the Smart Fundis V2 GPU box and measure it. Follow docs/runbooks/brev.md sections 3 and 4 exactly.
1. Clone the repo into /home/ubuntu/workspace/smart-fundis (skip if present; git pull if present).
2. Create /home/ubuntu/workspace/.env.brev (chmod 600) by ASKING me for each value, and never echo them:
   HF_TOKEN, CONVEX_SITE_URL (the DEV deployment's https://<name>.convex.site), AI_SHARED_SECRET (same as the
   dev Convex deployment), CONVEX_DEPLOYMENT=dev:<name>, QUEUE_MODE=inline, HF_HOME=/home/ubuntu/workspace/hf-cache.
3. Install uv, run `uv sync` in ai-service/, and install vllm>=0.12.0 into that environment.
4. Download nvidia/Cosmos-Reason2-8B and nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8 into HF_HOME. Report `du -sh`.
5. Egress check: curl -sI https://huggingface.co ; and a POST to $CONVEX_SITE_URL/ai/claim with NO auth header,
   which must return 401.
6. Start Cosmos in tmux session "cosmos" with the runbook's vllm serve command (port 8000, --max-model-len 32768,
   --gpu-memory-utilization 0.45, --reasoning-parser qwen3). Wait for /v1/models.
7. Start Nemotron FP8 in tmux session "nemotron" (port 8001, --gpu-memory-utilization 0.40, --max-model-len 8192,
   --kv-cache-dtype fp8). Wait for /v1/models. If it OOMs, stop it and tell me before trying Cosmos-2B.
8. Report nvidia-smi memory per process.
9. Write the numbers (disk sizes, egress results, memory, vLLM version, GPU type, $/h) to docs/runbooks/brev-log.md
   under today's date, commit on branch v2/spike-box-setup, push, open a PR.
Do not build any pipeline code in this task.
```

## P4: Analyse the demo video directly (agent on the box)

```
Task: analyse docs/demo_videos/electrical_video.mp4 with Cosmos Reason 2 on this box, and measure R-3.
Context: the Rubric is Electrical → "Install a 13A socket" in convex/lib/trades.ts (item ids: isolate, test_dead,
terminals, earth, no_bare_copper, faceplate, function_test; the first five are safety items). The Cosmos server
from P3 runs on localhost:8000 (OpenAI-compatible). Facts: docs/research/2026-09-27-v2-real-ai-prep.md §2–§3.

Build ai-service/scripts/analyze_clip.py (Python 3.12, uv, typed, with pytest for the pure parts):
- Probe the clip with OpenCV: duration, width, height, mean luma of 16 sampled frames. Print them.
- Build ONE prompt (ai-service/app/prompts/observe.v1.txt) that lists every Rubric item (id + text) and asks for
  JSON: {"observations":[{"itemId","result":"yes|no|unclear","evidence","timestampS"}],"liveness_digits": string|null}.
  The prompt must NOT contain any Liveness code (ADR-19); it only asks the model to read any digits written on paper.
- Send the video to Cosmos as a video_url part (a file:// path under the allowed media path), with
  extra_body={"media_io_kwargs":{"video":{"fps": FPS}}}. Run at FPS=4, then FPS=2.
- Parse the answer (strip any <think> block), validate against the Rubric ids, and print per run:
  prompt_tokens, completion_tokens, latency seconds, and the observations table.
- Save the two runs' parsed JSON (no URLs, no secrets) to ai-service/eval/runs/<date>-electrical_video.json.
Unit-test the parse and validate functions with fixtures (no GPU in tests).
Then write a short report in docs/runbooks/brev-log.md: tokens at fps 4 and 2, latency, whether the video fit
32768, which items were yes/no/unclear, and what that says for G1 (the fps rule) in the prep doc.
Commit on branch v2/spike-analyze-clip, push, open a PR.
```

**What to expect:** the demo clip was recorded before any Liveness code was issued, so `liveness_digits` will be `null` or won't match. That is correct: in the app it caps the Verdict at `needs_review` (ADR-11).

## P5: Connect the app to Brev (agent on the box, after P4 works)

```
Task: a minimal real worker that connects the Smart Fundis app (Convex DEV deployment) to this Brev box, so an
upload in the app is analysed by the real Cosmos model. This is a spike on branch v2/spike-brev-worker.

Read first: ai-service/scripts/stub_worker.py (reuse its HTTP client: post_json, claim, send_callback,
backoff_seconds, the 204/401/403/409/400 handling and its logging rules), convex/lib/aiContract.ts (the exact job
and callback shapes and limits), convex/lib/aiStub.ts (the stub gate), docs/handoff/39.md "Contracts",
docs/runbooks/brev.md §5, and ai-service/scripts/analyze_clip.py from P4.

Build ai-service/scripts/brev_worker.py:
- Load CONVEX_SITE_URL, AI_SHARED_SECRET and CONVEX_DEPLOYMENT from /home/ubuntu/workspace/.env.brev. Refuse to start
  unless CONVEX_DEPLOYMENT starts with "dev:" (the spike is dev-only).
- workerId = "brev-<hostname>" and model = "cosmos-reason2-8b@observe.v1+rules-spike" (neither starts with "stub").
- Loop: claim → download job.videoUrl to /home/ubuntu/workspace/jobs/<assessmentId>.mp4 (never log the URL) →
  probe with the P4 code → guard: outside 10–90 s, short side under 360 px, or too dark → callback outcome "reshoot"
  with the right reason code and an English reason → otherwise observe with Cosmos (fps 4 up to 45 s, else fps 2)
  → build the "result" callback:
    observations: one per Rubric item exactly once (fill missing as unclear), timestampS ≥ 0;
    liveness: {read: liveness_digits or null, check: "yes" only if digits == job.livenessCode, else "unclear"};
    verdict (spike rules, no Nemotron yet): any safety item "no" → "fail"; all items "yes" and liveness yes →
      "pass"; otherwise "needs_review". confidence 0, strengths/gaps from the evidence (≤ 20 items, ≤ 2000 chars
      each), feedbackEn a short English summary. safetyFlags = safety item ids that are not "yes".
    fallbackModel false; latencyMs measured.
  On any exception, send outcome "error" with a short errorCode. Always delete the local video file afterwards.
- pytest for the result builder and the verdict rules (no GPU, no network).
- Run it in tmux session "worker". Tell me to STOP the V1 stub worker on dev first (two pollers race).

Then the end-to-end test, with me:
1. I upload docs/demo_videos/electrical_video.mp4 in the app at /fundi (Electrical → Install a 13A socket) as a
   Fundi account on the DEV deployment.
2. You watch the worker log: claimed → callback → awaiting_review (or reshoot if the guard rejects the clip).
3. I open /expert as a seeded Expert (a different account) and check: real Observations with evidence and
   timestamps, "Liveness read" vs the code, and a Verdict capped at needs_review (the clip has no code on paper).
4. Record the result, the latency and any errors in docs/runbooks/brev-log.md. Commit, push, open a PR.
```

## P6: End of every session (human, 1 minute)

```bash
# in the box: stop the worker and the models cleanly
tmux kill-session -t worker; tmux kill-session -t nemotron; tmux kill-session -t cosmos
exit
# on the laptop:
brev stop smart-fundis-gpu
brev ls                      # confirm it shows stopped
```

Add the session's hours and cost to `docs/runbooks/brev-log.md`.

**To resume later:** run `brev start smart-fundis-gpu`, `brev shell smart-fundis-gpu`, then restart the tmux sessions from P3 steps 6–7, and P5's worker.
