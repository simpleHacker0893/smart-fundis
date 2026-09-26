# NVIDIA fit for the next Smart Fundis phase

- **Date:** 2026-09-26. Every web source below was accessed on this date.
- **Scope:** what the NVIDIA models we already use (Cosmos Reason 2 and Nemotron) can add to dashboards, Client job posts and proximity search. This is research, not a decision. The Architect decides.
- **Sibling file:** [Kenya domain research](./2026-09-26-kenya-domain-research.md) covers the Kenyan side (counties, trades, prices and similar). This file covers only the NVIDIA side.
- **Rule used here:** a claim without a primary source is marked **UNVERIFIED**. Every UNVERIFIED item is listed in the table at the end.

## NVIDIA fit

### 0. What we run today (from the repo)

| Model | What it is | How it is called | Where |
| --- | --- | --- | --- |
| Cosmos Reason 2 8B, with a 2B fallback | A video vision-language model | The `openai` SDK against vLLM (`--reasoning-parser qwen3`, `fps: 4`, `video_url` part) | On the Brev H100 80GB (PRD §2 ADR-3/12, PRD §6 Phase 4, `ai-service/app/settings.py`) |
| Nemotron, as the code stands: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | The model id that the #9 smoke printed live (`docs/handoff/9.md`) | `ChatNVIDIA(model, api_key, temperature=0).with_structured_output(<Pydantic>)` from `langchain-nvidia-ai-endpoints` 1.4.3 (`ai-service/app/nemotron.py`) | The **hosted** NVIDIA API at build.nvidia.com (ADR-4) |
| **Nemotron, the new direction (operator, 2026-09-26)** | **`nemotron-3-nano-30b-a3b`** or **`nemotron-3-super-120b-a12b`** | vLLM's OpenAI-compatible server, reached through a LangChain chat model | **Self-hosted with vLLM on Brev GPUs** |

**The operator's instruction on 2026-09-26:** "we are working with vLLM and hosting on brev GPUs. we are now using nemotron-3-nano-30b-a3b or super-120b-a12b or langchain models". This reverses ADR-4 (hosted Nemotron) and is recorded as **D-32** in `planning/DECISIONS.md`. `app/nemotron.py` and `AGENTS.md` rule 4 (`NVIDIA_API_KEY` only on Brev) still need updating when the code switches. **§2.0a below is the self-hosted analysis.** The hosted-API notes in §2.0 still apply to the current code until it is switched.

The repo does not yet contain a Cosmos client. `ai-service/app/` has only `nemotron.py`, `settings.py`, `tracing.py` and `main.py`, so the Cosmos details come from the PRD and the architecture spec. Nemotron gets the Rubric and the Observations but never the video (spec §6).

**NVIDIA skills catalog check.** Per the `nvidia-skill-finder` skill, I read the catalog JSON (https://raw.githubusercontent.com/NVIDIA/skills/main/skills.sh.json), because `skills add nvidia/skills --list` stalled while cloning on Windows, as `docs/research-links.md` warns. Four catalog skills touch our models: `tao-finetune-cosmos-reason`, `nemotron-customize`, `nemotron-policy-generator` and `rtvi-vlm-customize-model`. They cover fine-tuning and policy work. None covers serving Cosmos Reason 2, dashboards, evidence display or job-post parsing. I don't recommend installing any of them for this phase.

**Two stale links in `docs/research-links.md` (for the Architect to fix):**
- The NIM "API examples" link (`.../vision-language-models/latest/examples/cosmos-reason2/api.html`) now redirects to the NIM overview page. The Cosmos Reason2 page still exists under the **1.7.0** docs: https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/cosmos-reason2/api.html
- The Cosmos Reason 2 repository now says: *"This repository is no longer under active development and will receive only limited maintenance updates"*, and it points to Cosmos 3 (https://github.com/nvidia-cosmos/cosmos-reason2). This doesn't block us, but it matters for the Pilot.

---

### 1. Cosmos Reason 2 outputs we could show in dashboards

#### 1.1 What Cosmos Reason 2 actually produces

| Output | What the primary source says | Source |
| --- | --- | --- |
| **Text only** | "Output Type(s): Text". Anything structured is text that we parse. | [HF model card 8B](https://huggingface.co/nvidia/Cosmos-Reason2-8B) |
| **Reasoning trace (`<think>`)** | Reasoning is requested through the prompt: *"Answer the question in the following format: `<think>\nyour reasoning\n</think>\n\n<answer>\nyour answer\n</answer>`."* NVIDIA's reasoning examples use `max_tokens: 4096`. | [NIM 1.7.0 Cosmos Reason2 API](https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/cosmos-reason2/api.html); the model card recommends "4096 or more output max tokens to avoid truncation" |
| **Where vLLM puts the trace** | With `--reasoning-parser qwen3`, vLLM returns the trace in a separate `reasoning` field, which used to be called `reasoning_content`. *"Tool calling only parses functions from the content field, not from the reasoning."* | [vLLM reasoning outputs](https://docs.vllm.ai/en/latest/features/reasoning_outputs.html) |
| **Timestamps** | *"Our AI model recognizes timestamps added at the bottom of each frame for accurate temporal localization."* NVIDIA's own temporal-localization example asks for JSON with `start`, `end` and `caption` in `mm:ss.ff` format. The Cosmos Cookbook (a Reason 1 recipe) says *"We overlay timestamps on the video"* before inference. | [HF model card](https://huggingface.co/nvidia/Cosmos-Reason2-8B); [temporal_localization.log](https://github.com/nvidia-cosmos/cosmos-reason2/blob/main/assets/outputs/temporal_localization.log); [Cookbook recipe](https://nvidia-cosmos.github.io/cosmos-cookbook/recipes/post_training/reason1/temporal_localization/post_training.html) |
| **Timestamp precision** | *"The value of `fps` or `num_frames` is directly correlated to the temporal resolution of the model's outputs. For example, at 2 FPS, timestamp precision in the generated output will be at best within +/- 0.25 seconds."* The default and training rate is 4 FPS. | [NIM 1.7.0 Cosmos Reason2 API](https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/cosmos-reason2/api.html) |
| **2D points** | Point coordinates on **image** inputs, normalised to 0–1000. This isn't needed for our Rubric. | same NIM page |
| **Confidence** | **Neither the model card, the NIM page nor the vLLM reference documents any confidence score or calibration.** The reference guide doesn't mention logprobs or confidence. | [HF model card](https://huggingface.co/nvidia/Cosmos-Reason2-8B); [Cosmos Reason2 reference](https://docs.nvidia.com/cosmos/latest/reason2/reference.html) |
| **Known weak spots** | *"fast camera movements, overlapping human-object interactions, low lighting with high motion blur, and multiple people performing different actions simultaneously."* | [HF model card](https://huggingface.co/nvidia/Cosmos-Reason2-8B) |

**Is the confidence calibrated?** No. Nothing NVIDIA publishes says Cosmos Reason 2 gives a calibrated confidence. The `confidence` field in our callback contract (spec §6, the `verdict` object) is a number that **Nemotron writes as text inside its JSON**. It is not a probability. vLLM's OpenAI-compatible server may be able to return token logprobs, but I found nothing from NVIDIA that says those are calibrated for Cosmos, and our contract doesn't use them (**UNVERIFIED**: logprob availability and usefulness for Cosmos Reason 2 on our vLLM build). Until the eval (US-4.7, ADR-14) measures agreement per confidence band, treat `confidence` as uncalibrated.

**Precision we can claim.** At `fps: 4`, NVIDIA's rule suggests a best case of about ±0.125 s. That figure is my extrapolation from the documented 2 FPS example (±0.25 s), so it is **UNVERIFIED**. In the UI, show whole seconds and never imply frame-accuracy.

**The timestamp overlay is not in our spec.** The model card says the model reads timestamps drawn onto frames. Our spec (§6) passes a plain `video_url` at `fps: 4` and doesn't overlay timestamps. It is **UNVERIFIED** whether Cosmos Reason 2 returns reliable `timestampS` values without the overlay. The ai-pipeline agent should test both ways in the eval before the Expert "tap to jump" feature is trusted. `rules.py` rule 5 (each `timestampS` falls within the video length) is a sanity check, not an accuracy check.

#### 1.2 What we may show, and to whom

This comes from ADR-11 (via PRD §2 and `planning/DECISIONS.md`), ADR-19, PRD §8, spec §6–§7, and the AGENTS.md non-negotiables. It isn't legal advice. It applies our own rules to the outputs above.

| Output | Fundi | Expert | Admin | Public / Client | Why |
| --- | --- | --- | --- | --- | --- |
| **Observation per Rubric item** (`result` yes/no/unclear, one-line `evidence`, `timestampS`) | **Open question for the Architect.** US-4.4 gives the Fundi the Verdict's strengths, gaps and `feedbackEn`. No rule grants or bans raw Observations. My recommendation: show them only **after** an Expert decision, worded as "the AI noticed…", so the Fundi doesn't read an AI `no` as the decision. | **Yes. This is the V2 core** (spec §9 V2: "Real Observations show in the Expert review, and tapping one jumps the video to its timestamp"; US-4.3). | Yes | **Never.** The public profile hides "AI feedback, and rejected or pending Assessments" (spec §7). | ADR-11: the AI recommends and only an Expert decides |
| **Safety flags** (`safetyFlags[]`, set by `rules.py`) | Only as the reason the result is "needs review", in plain words. Never as an accusation. | Yes, shown first | Yes | Never | ADR-11; PRD §8 "Safety items can never be auto-passed" |
| **Liveness read** (`livenessRead`, `livenessCheck`) | Only "we couldn't read your code". Never the digits Cosmos read, so the check can't be gamed. | Yes | Yes | Never | ADR-19; R-2 (no accuracy claim until measured) |
| **Verdict label** (`pass` / `needs_review` / `fail`) | As "AI suggestion, waiting for an Expert". It must never look like a result. | Yes, marked as a recommendation | Yes | Never. Only a Badge is public. | ADR-11; AGENTS.md "Only an Expert approval creates a Badge" |
| **`confidence` number** | **No** | **Not as a number.** Showing an uncalibrated score to the decider invites automation bias. At most, show a coarse label once the eval has measured it. | Yes, in an eval or operations view, labelled "uncalibrated" | Never | §1.1 above; PRD §8 "Accuracy reported per trade" says we claim only what we measured |
| **`<think>` reasoning trace** | **No** | **Not in V2.** It isn't in the callback contract (spec §6), it roughly doubles or triples the output tokens (4096+), and no NVIDIA source claims the trace faithfully explains the answer (**UNVERIFIED** either way). | Only if the Architect adds it to the contract, and then in a debug view only | Never | It must never reach LangSmith: traces are masked, with no prompts or feedback text (AGENTS.md, D-14, ADR-13) |
| **`feedbackSw`** | **Yes, from V2 (D-29)**, under the same rules as `feedbackEn`: shown after the Expert decides and labelled as an AI suggestion. See §2.2: no Nemotron card lists Kiswahili, so a native-speaker check comes first (R-20). | n/a | Yes, for review | Never | D-29; AGENTS.md rule 5 (amended) |
| **`model`, `fallbackModel`, `latencyMs`** | No | "Checked with the backup model" (a `fallbackModel` note) helps the Expert | Yes, for the operations dashboard | Only in aggregate on the project card (US-6.3) | US-4.6, US-6.3 |

**Wording rule for every dashboard:** "verified by Smart Fundis", never "certified" (PRD §8). Show AI output as "AI suggestion" or "the AI noticed", and never "AI verified". "Nothing may look live that isn't" also applies to dashboard tiles: accuracy tiles stay empty until `eval/results.csv` exists.

---

### 2. What Nemotron could safely do in the next phase

#### 2.0 Facts about the current code (hosted Omni model; see §2.0a for the self-hosted direction)

- **Exact model and call:** `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, hosted, called with `ChatNVIDIA(...).with_structured_output(Model)` (`docs/handoff/9.md`, `app/nemotron.py`).
- **Structured output isn't officially supported for our model id.** `langchain-nvidia-ai-endpoints` 1.4.3 lists `supports_structured_output=True` for `nvidia/nemotron-3-nano-30b-a3b` and `nvidia/nemotron-3-super-120b-a12b`, but not for the Omni id. For an unlisted model it warns *"Model '…' is not known to support structured output. Your output may fail at inference time."* This is risk R-14 in `planning/RISKS.md`. Source: the installed package, `langchain_nvidia_ai_endpoints/_statics.py` and `chat_models.py` (upstream: https://github.com/langchain-ai/langchain-nvidia).
- **How `with_structured_output` works (from the same source):** a Pydantic schema is always sent in strict mode (`include_raw=True` raises `NotImplementedError`). For the hosted endpoint it tries OpenAI `response_format={"type":"json_schema"}` first, then top-level `guided_json`, then `nvext.guided_json`. When the model doesn't finish its answer, **the call returns `None` instead of raising**. That is why handoff #9 says "treat `None` as a retry, then `needs_review`".
- **Structured-output APIs by runtime:**
  - **NIM for LLMs:** `extra_body={"nvext": {"guided_json": schema}}`, plus `guided_regex`, `guided_choice` and `guided_grammar`. NVIDIA recommends `guided_json` over `response_format={"type":"json_object"}`, which *"permits the model to produce any valid JSON, including empty objects"*. Source: [NIM LLM 1.13.0 structured generation](https://docs.nvidia.com/nim/large-language-models/1.13.0/structured-generation.html).
  - **NIM for VLMs:** `response_format` with `type: json_schema`, and `nvext` `guided_regex` / `guided_choice` / `guided_grammar`. Source: [NIM VLM structured generation](https://docs.nvidia.com/nim/vision-language-models/1.0.0/structured-generation.html).
  - **vLLM (for anything self-hosted on Brev, including Cosmos):** `guided_json` and its siblings **were removed in v0.12.0**. Use `structured_outputs: {json | choice | regex | grammar | structural_tag}` or `response_format` `json_schema`. For some reasoning models, structured output is off while reasoning unless `--structured-outputs-config.enable_in_reasoning=True` is set. The documented case is Qwen3 Coder. Source: [vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html).
  - **Tool calling:** the Omni model card says it "Supports tool calling" and "Supports JSON output format". ChatNVIDIA supports `bind_tools` and a `supports_tools` flag. Sources: [Omni model card](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning/modelcard); [LangChain ChatNVIDIA](https://docs.langchain.com/oss/python/integrations/chat/nvidia_ai_endpoints).
- **Reasoning mode is on by default.** The Omni card says: *"Default (omitted): Reasoning is on"*. Pass `"chat_template_kwargs": {"enable_thinking": false}` to turn it off. The card's recommended "Instruct mode" is `temperature 0.2, top_k 1, max_tokens 1024`, and its "Thinking mode" uses `max_tokens 20480` with a `reasoning_budget` of 16384. For short extraction tasks, instruct mode is the right setting, because thinking mode can spend thousands of tokens before the JSON. Source: [Omni model card](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning/modelcard). Current `app/nemotron.py` doesn't set `enable_thinking`, so it runs with reasoning on.
- **Language: English only.** The Omni card says *"Language support: English only"*. Nemotron 3 Nano 30B lists "English, German, Spanish, French, Italian, and Japanese" ([HF card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16)). Nemotron 3 Super lists "English, French, German, Italian, Japanese, Spanish, Chinese" ([build card](https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b/modelcard)). **None of the three lists Kiswahili.**
- **Hosted API terms:**
  - The trial is *"for limited trial purposes only and without use of the API Service or Generated Content in production"*. Production needs a paid Subscription ([NVIDIA API Trial Terms §1.2](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf)).
  - §3.3(iv) says NVIDIA collects *"User Content and Generated Content to improve NVIDIA products and services, including AI models"*.
  - An NVIDIA staff member (Sophie Watts, 17 Sep 2025) says build.nvidia.com *"no longer use[s] a credit-based system … replaced by rate limits for trial usage"*, and that production use needs an NVIDIA AI Enterprise license ([forum](https://forums.developer.nvidia.com/t/request-more-4-000-credits-option-on-build-nvidia-com/344567)).
  - The figure of **40 requests per minute** appears only in user forum posts, not in official docs (**UNVERIFIED**).
- **Cost and latency.** Nemotron doesn't run on Brev, so the Brev box adds only the network hop. I found no official per-token price for the hosted trial (it is free but rate-limited) and no published latency for the Omni model on build.nvidia.com. **Latency: UNVERIFIED** (the #9 handoff didn't record it; measure it in the eval, US-4.7). **Production price (NVIDIA AI Enterprise): UNVERIFIED.**
- **The self-host option on Brev.** The Omni weights are 61.5 GB in BF16, 32.8 GB in FP8 and 20.9 GB in NVFP4, and serving them needs vLLM 0.20.0 ([Omni card](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning/modelcard)). Cosmos Reason 2 8B needs at least 32 GB of GPU memory ([HF card](https://huggingface.co/nvidia/Cosmos-Reason2-8B)). Whether FP8 Nemotron and Cosmos 8B fit together on one H100 80GB with enough KV cache is **UNVERIFIED**. The repo has no Brev hourly rate. A Brev launchable page shows "$10.00/hr" for **4×** H100 80GB ([launchable](https://brev.nvidia.com/launchable/deploy?launchableID=env-39czrpTlsxUjV3kJzRRbNt0bR7H)). That is a single provider's listing, so our **one-H100 hourly cost is UNVERIFIED** (see `planning/QUESTIONS.md` Q3).

#### 2.0a Self-hosting Nemotron with vLLM on Brev (the new direction)

| | Nemotron 3 Nano 30B-A3B | Nemotron 3 Super 120B-A12B |
| --- | --- | --- |
| Size | "30B parameters in total", "3.5B active" (MoE) | 120B total, 12B active |
| GPUs | Serves with `--tensor-parallel-size 1`. Tested on "NVIDIA H100-80GB, NVIDIA A100" | **"Minimum GPU Requirement: 8× H100-80GB"**. NVIDIA's vLLM example uses `--tensor-parallel-size 4 --data-parallel-size 2` |
| vLLM version | `vllm>=0.12.0` | `vllm==0.15.1` in the card's example |
| Variants | BF16 and FP8 (the FP8 command adds `--kv-cache-dtype fp8` and `VLLM_USE_FLASHINFER_MOE_FP8=1`) | BF16 checkpoint; the model is "trained using NVFP4 quantization" |
| Reasoning parser | A custom plugin downloaded from the HF repo: `--reasoning-parser-plugin nano_v3_reasoning_parser.py --reasoning-parser nano_v3` | A custom plugin: `--reasoning_parser super_v3` (`super_v3_reasoning_parser.py`) |
| Tool calling | `--enable-auto-tool-choice --tool-call-parser qwen3_coder` | `--tool-call-parser qwen3_coder` |
| Reasoning | On by default. Turn it off with `extra_body={"chat_template_kwargs": {"enable_thinking": False}}`. With reasoning on, the card recommends "a high value (e.g., 10,000) for max_tokens" | Toggled with `enable_thinking` in the chat template. The card says "Use temperature=1.0 and top_p=0.95 across all tasks" |
| Languages | English, German, Spanish, French, Italian, Japanese. **No Kiswahili** | English, French, German, Italian, Japanese, Spanish, Chinese. **No Kiswahili** |
| Sources | [HF BF16 card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16), [HF FP8 card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8) | [build.nvidia.com card](https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b/modelcard) |

**What this means for us:**
- **Super 120B doesn't fit our box.** The spec's Brev box is **one H100 80GB** (PRD ADR-3/12), and Super's documented minimum is **8× H100-80GB**. Super would need its own 8-GPU instance, at a cost that is **UNVERIFIED** (Brev lists vary by provider and are often out of stock). **Nano 30B-A3B is the realistic choice.**
- **Sharing one H100 with Cosmos.** Cosmos Reason 2 8B needs at least 32 GB ([HF card](https://huggingface.co/nvidia/Cosmos-Reason2-8B)). Nano's documented serve command uses `--max-model-len 262144`, which reserves a lot of KV cache, and we need only a few thousand tokens. Two vLLM servers on one GPU need their `--gpu-memory-utilization` values split, for example about 0.45 each, and a small `--max-model-len` for Nemotron (8k–16k is plenty for a Verdict). **Whether Nano FP8 and Cosmos 8B fit together on one H100 80GB with usable KV cache is UNVERIFIED.** gpu-devops must measure it. The alternatives are a second GPU on the box, or running Nemotron on the same GPU between Cosmos jobs.
- **Privacy gets better.** Self-hosting removes the hosted-trial problems (§2.0: no production use, and NVIDIA may use content to train models). The data stays on "our AI on Smart Fundis' GPU", which is what the consent text already says (spec §7). The Nemotron weights are covered by the NVIDIA Nemotron Open Model License, per the Nano HF card. The ai-pipeline agent should check the licence text before the Pilot. LangSmith masking (D-14) still applies.
- **Latency and cost.** Nothing new is billed per token: the cost is the Brev GPU hours we already pay for Cosmos, plus any extra GPU. NVIDIA publishes no latency figure for Nano on one H100 for our prompt sizes (**UNVERIFIED**). Nano has only 3.5B active parameters, so it should be fast next to Cosmos's video prefill, but measure it in the eval (US-4.7, p50 latency). Reasoning off matters most here: with reasoning on, the card's `max_tokens` of about 10,000 dominates the latency.

**Structured output through vLLM, and the LangChain catch:**
- **vLLM API:** `structured_outputs: {"json": schema}` (or `choice`, `regex`, `grammar`), or OpenAI `response_format={"type":"json_schema", ...}`. `guided_json` was **removed in vLLM v0.12.0** ([vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html)). Both Nemotron cards require vLLM 0.12 or later.
- **ChatNVIDIA against a self-hosted server:** `ChatNVIDIA(base_url="http://localhost:8000/v1", model=...)` is the documented way to point it at a local endpoint ([LangChain ChatNVIDIA](https://docs.langchain.com/oss/python/integrations/chat/nvidia_ai_endpoints)).
- **The catch.** In `langchain-nvidia-ai-endpoints` 1.4.3, `with_structured_output` on a **non-hosted** `base_url` tries, in order: top-level `guided_json`, then `nvext.guided_json`, then `response_format` `json_schema`. It moves to the next format when a format raises an error or parses to `None` (`chat_models.py`, `_FallbackRunnable`). On vLLM 0.12 or later, the first two are removed parameters. **It is UNVERIFIED whether vLLM rejects them (costing two failed round trips) or silently ignores them (returning unconstrained text, which may still parse).** Either way, the schema may not actually be enforced on the first attempts.
- **What to do.** Pick one LangChain path and pin it with a test that records the request body. Either:
  - use `langchain-openai`'s `ChatOpenAI(base_url=<vLLM>/v1)` with `with_structured_output(Model, method="json_schema")`, which sends `response_format` `json_schema`, or
  - call vLLM with `extra_body={"structured_outputs": {"json": Model.model_json_schema()}}`.

  Then validate with Pydantic, retry once with a repair prompt, and fall back to `needs_review` (spec §6 "Invalid output").
- **Reasoning and structured output together:** vLLM's docs mention a case (Qwen3 Coder) where structured output is off while reasoning unless `--structured-outputs-config.enable_in_reasoning=True` is set. For the Verdict and the extraction tasks, run with `enable_thinking: False`, which avoids the question entirely. Whether the `nano_v3` parser plus structured output works with reasoning on is **UNVERIFIED**.

#### 2.1 Use (a): turn a Client's free-text job post into Trade, task, county/area and budget

**Scope, now decided.** Clients have accounts in V2 and post Jobs (D-30, 2026-09-26), and the demo seeds Demo Clients with mock Jobs (D-31). Client accounts leave `/roadmap` only when the feature ships, because nothing may look live before it is. Demo Jobs must carry the "Demo" tag, and parsing them is a good eval set for this use.

| Aspect | Finding |
| --- | --- |
| Can Nemotron do it? | Technically yes. It is short-text extraction into a fixed schema. Use instruct mode (`enable_thinking: false`, temperature 0.2). |
| Structured output | A Pydantic model with **closed enums**. `trade` must be one of the live Trade slugs, and `county` one of the 47 county names (the sibling file has the list). Everything else is optional: `task` is free text, `area` is free text, and `budget_kes` is an integer or null. With vLLM `structured_outputs` / `json_schema` (§2.0a), the model can't invent a Trade slug, but it can still pick the wrong one. Use self-hosted Nano 30B-A3B with `enable_thinking: False`. |
| Latency / cost | Self-hosted on Brev: no per-call fee, only GPU time. Latency is **UNVERIFIED** (§2.0a). One call per post, and the input is small. The Client waits on this call, so it needs a timeout of a few seconds and a manual-form fallback. A new product question for gpu-devops: job posts arrive at any hour, so the Brev box must be up whenever Clients post, not just when Assessments are queued. |
| Failure modes | (1) The wrong Trade sends the Client to the wrong Fundis. (2) An invented budget or area: the model fills a field the Client never gave. (3) Kiswahili or Sheng input: the model isn't documented for Kiswahili (2.0), so quality there is **UNVERIFIED** and probably poor. (4) Personal data in free text: Clients type phone numbers and names. Self-hosting keeps it on our GPU, but it could still leak into logs or LangSmith. (5) The Brev box is down or busy with Cosmos jobs, so the call times out. |
| Mitigation | The **AI pre-fills and the Client confirms**: show the parsed fields in an editable form, and never post without the Client's tap. Allow null and say "not stated" rather than guess. Strip phone numbers and emails with a regex **before** the call, and mask the call in LangSmith (D-14). Put a "we use AI to read your post; you check it before it goes live" line in the Client disclosure (a rai-reviewer item). On a timeout, `None` or an unparseable reply, fall back to the plain manual form. Never block posting on the AI. The rest of the page (for example the budget unit and the county list) should validate in code, not in the model. |

#### 2.2 Use (b): plain-language Fundi feedback in English and Kiswahili

| Aspect | Finding |
| --- | --- |
| English (`feedbackEn`) | This is already in the V2 contract (`verdict.feedbackEn`, spec §6). It suits the model. Keep it grounded: build the prompt only from the Observations and Rubric, which is already the case, and have `rules.py` check that every "gap" mentions a Rubric item. |
| Kiswahili (`feedbackSw`) | **Kiswahili is now agreed and shown (D-29).** But **no NVIDIA Nemotron model card I checked lists Kiswahili** (§2.0, §2.0a), so output quality is **UNVERIFIED** and is the main risk (R-20). |
| Structured output | This is already the `Verdict` Pydantic schema. Keep `feedbackEn` short with a `max_length` in the schema. |
| Latency / cost | Self-hosted: GPU time only, and latency is **UNVERIFIED** (§2.0a). It is one call per Assessment, inside the pipeline's 10-minute stuck-job window (spec §3). |
| Failure modes | (1) Feedback that contradicts the Verdict or the Expert, for example "great job" on an Assessment the Expert rejected. (2) Invented steps that aren't in the Rubric. (3) A wrong or embarrassing Kiswahili translation shown to a Fundi. (4) A tone that reads as a final decision. |
| Mitigation | Show feedback to the Fundi **only after the Expert decides**, next to the Expert's note, labelled as the AI's suggestion. Before any Kiswahili is shown, get a native-speaker review of a sample set (a rai-reviewer or Expert task), or use a model whose card documents Kiswahili (which NVIDIA model, if any, is **UNVERIFIED**). Never let feedback text reach LangSmith (D-14). |

#### 2.3 Use (c): match a job to Trades

| Aspect | Finding |
| --- | --- |
| Can Nemotron do it? | Yes, as classification into a closed list. Use `guided_choice`, an `Enum` schema (ChatNVIDIA's `with_structured_output` accepts an `Enum`), or a list of up to 3 slugs with a JSON schema. |
| Is an LLM needed? | Often not. With a Trade picker plus a keyword map (EN + common Kiswahili words from the sibling file), the Client chooses the Trade and no model call is needed. The LLM helps only with vague text ("my sink is leaking and the wall socket sparks"). |
| Latency / cost | Self-hosted: GPU time only, and latency is **UNVERIFIED** (§2.0a). This is the same call as (a) if both are done in one prompt. |
| Failure modes | A wrong Trade hides the right Fundis. A job that spans several Trades gets forced into one. Over-matching could look like the AI recommending specific Fundis. |
| Mitigation | Return up to 3 **suggested** Trades and let the Client pick. Rank Fundis in code (the Listing rules: verified first, ADR-22 / D-24) and **never** let the model rank or recommend a named Fundi, because that is a judgement about a person. Fall back to the manual Trade picker on any failure. |

#### 2.4 Proximity search

This needs no NVIDIA model. It is a geography query on the Listing projection (county and area now, maybe coordinates later). The NVIDIA catalog has cuOpt routing skills (`cuopt-routing-api-python`), but vehicle-routing optimisation is far heavier than "Fundis near me" needs. I don't recommend it for this phase.

---

### 3. NVIDIA UI or design guidance for AI-evidence displays

- **I found no NVIDIA design system or UX guidance for showing AI evidence** (confidence, reasoning or timestamps) to end users. NVIDIA's model cards (Model Card++) document explainability for developers, not UI patterns.
- **One pattern worth borrowing:** NVIDIA's **VSS reference UI** (Video Search and Summarization blueprint) is a working example of timestamped AI evidence ([VSS 3.1.0 UI](https://docs.nvidia.com/vss/3.1.0/vss-ui.html)). It shows:
  - a table with a **Thumbnail** that opens a player modal on click, plus sortable **Timestamp** and **End** columns
  - a **VLM Verdict** column with explicit states ("Confirmed • Rejected • Failed • N/A")
  - times in `HH:mm:ss`, with **`--:--:--` shown when a timestamp is invalid or missing**
  - any score labelled for what it is ("Cosine similarity value (-1.00 - 1.00)"), not as "confidence"

  For our Expert review, the parts worth copying are: an evidence row → tap → the player seeks to `timestampS`; an explicit "no timestamp" state rather than a fake `0:00`; and a separate state for "the AI couldn't tell" (`unclear`), distinct from `no`. It is a reference UI for operators, not guidance for consumers, so our own Instrument brand (D-9) and the "AI suggestion" wording still apply.
- **We must not use NVIDIA branding as our own.** NVIDIA's [Logo & Brand Guidelines](https://www.nvidia.com/en-us/about-nvidia/legal-info/logo-brand-usage/) say:
  - *"These assets may not be used in any manner that isn't expressly authorized in writing by NVIDIA."*
  - *"Do not use NVIDIA branding (logo, names, visual style) in any way that implies affiliation, endorsements, or sponsorship that isn't approved."*
  - *"Do not appropriate NVIDIA intellectual trademarks (logo, names) with your own names, brands, logos, website, slogan, or design."*

  The trial terms also bar using NVIDIA's trademarks in certain ways (Trial Terms, prohibited uses (j)). In practice:
  - No NVIDIA logo or NVIDIA green in the Smart Fundis UI.
  - No "NVIDIA-verified" or "powered by NVIDIA" badge unless NVIDIA approves it in writing.
  - The project card (US-6.3) may name the models and Brev in plain text, as a factual description.
  - Our "Verified by Smart Fundis" Badge must never sit next to an NVIDIA mark.

---

### 4. Recommendations for the Architect (not decisions)

1. **Record the switch to self-hosted Nemotron as an ADR** that supersedes ADR-4. Choose **Nano 30B-A3B**, because Super needs at least 8× H100 while our box has one. gpu-devops must measure whether Nano FP8 and Cosmos 8B share one H100 80GB, and fix the LangChain path so the request carries vLLM `structured_outputs` or `response_format` `json_schema`, not the removed `guided_json` (§2.0a). Use `enable_thinking: False` for the Verdict and extraction calls. This also closes R-14.
2. Keep `confidence` and `<think>` off Fundi and Expert screens until the eval measures them. Add neither to the callback contract without an ADR.
3. Add a timestamp-overlay test to the V2 eval (with and without frame timestamps) before shipping "tap to jump".
4. Kiswahili is agreed (D-29), but no Nemotron card lists it. Before the Fundi sees `feedbackSw`, add Kiswahili cases to the eval and run a native-speaker check on a sample. If quality is poor, fall back to reviewed template phrases per Rubric item (R-20).
5. Until `app/nemotron.py` moves off the hosted API, treat it as **trial only**. The terms bar production use and allow NVIDIA to use submitted content for training. Once the code is self-hosted, remove `NVIDIA_API_KEY` from the pipeline's needs.
6. Client accounts, Jobs and Demo Clients are decided (D-30, D-31). The V2 spec (V2-20) still has to define the Client role derivation (ADR-18), the Job schema and the job-post consent and privacy text.
7. Fix the two stale links in `docs/research-links.md` (§0).

### UNVERIFIED items

| # | Item |
| --- | --- |
| 1 | Whether vLLM token logprobs are available and useful as confidence for Cosmos Reason 2 |
| 2 | Timestamp precision of about ±0.125 s at 4 FPS (extrapolated from NVIDIA's 2 FPS example) |
| 3 | Whether Cosmos returns reliable `timestampS` without timestamps drawn on the frames |
| 4 | Whether the `<think>` trace faithfully explains the answer (no NVIDIA claim either way) |
| 5 | The hosted build.nvidia.com rate limit of 40 RPM (user forum posts only) |
| 6 | Nemotron latency (hosted, or self-hosted Nano on one H100) for our prompts |
| 7 | Production price (NVIDIA AI Enterprise subscription) |
| 8 | Whether Nemotron (Nano FP8, or Omni FP8) and Cosmos 8B fit together on one H100 80GB |
| 9 | Our one-H100 Brev hourly cost |
| 10 | Job-post parsing quality for Kiswahili or Sheng input |
| 11 | Kiswahili feedback quality from Nemotron |
| 12 | Which NVIDIA model, if any, documents Kiswahili support |
| 13 | Whether vLLM 0.12+ rejects or ignores the `guided_json` / `nvext` parameters that ChatNVIDIA sends first to a self-hosted `base_url` |
| 14 | Whether the `nano_v3` reasoning parser works with structured output while reasoning is on |
| 15 | The Brev cost of an 8× H100 instance for Super 120B |
