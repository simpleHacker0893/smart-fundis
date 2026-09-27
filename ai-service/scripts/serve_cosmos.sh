#!/usr/bin/env bash
# Serve Cosmos Reason 2 with vLLM in Docker on the Brev box (ticket #8, ADR-3/12, R-3).
#
#   serve_cosmos.sh start [MODEL] [MAX_MODEL_LEN]   start detached (docker -d), then wait for /v1/models
#   serve_cosmos.sh stop                            stop and remove the container
#   serve_cosmos.sh status                          container state + /v1/models
#   serve_cosmos.sh logs                            follow the vLLM log (Ctrl-C to leave)
#   serve_cosmos.sh download MODEL                  download weights to the HF cache only (no GPU)
#
# Defaults are the settings measured on the 1x L4 (23 GB) box; see planning/RISKS.md R-3.
# Every setting can be overridden by env var, for example:
#   GPU_MEM_UTIL=0.90 serve_cosmos.sh start nvidia/Cosmos-Reason2-2B 16384
#
# ADR-9: vLLM is published on 127.0.0.1 only. No port is ever opened to the internet.
# Operators reach it with `brev port-forward` or `ssh -L 8000:127.0.0.1:8000`.
#
# Secrets: HF_TOKEN is read from the env, or from ENV_FILE (default
# /home/ubuntu/workspace/.env.brev, mode 600). Only HF_TOKEN is taken from that file.
# It is passed to Docker by name (`-e HF_TOKEN`), so the value never appears on a
# command line, in `ps`, or in this script's output.
set -euo pipefail

CMD="${1:-start}"
MODEL="${2:-${COSMOS_MODEL:-nvidia/Cosmos-Reason2-8B}}"
MAX_MODEL_LEN="${3:-${MAX_MODEL_LEN:-8192}}"

NAME="${NAME:-cosmos}"
PORT="${PORT:-8000}"
GPU_MEM_UTIL="${GPU_MEM_UTIL:-0.92}"
MAX_NUM_SEQS="${MAX_NUM_SEQS:-4}"
VLLM_IMAGE="${VLLM_IMAGE:-vllm/vllm-openai:v0.30.0}"   # vLLM 0.30.0, transformers 5.17 (Cosmos needs >=4.57)
WORKSPACE="${WORKSPACE:-/home/ubuntu/workspace}"
HF_CACHE="${HF_CACHE:-$WORKSPACE/hf-cache}"
MEDIA_DIR="${MEDIA_DIR:-/data}"
ENV_FILE="${ENV_FILE:-$WORKSPACE/.env.brev}"
EXTRA_ARGS="${EXTRA_ARGS:-}"
WAIT_SECS="${WAIT_SECS:-900}"

log() { printf '[serve_cosmos] %s\n' "$*" >&2; }

load_hf_token() {
  if [[ -z "${HF_TOKEN:-}" && -f "$ENV_FILE" ]]; then
    # Read only the HF_TOKEN line; never source the whole file or print it.
    local line
    line="$(grep -E '^(export +)?HF_TOKEN=' "$ENV_FILE" | tail -n1 || true)"
    if [[ -n "$line" ]]; then
      line="${line#export }"
      HF_TOKEN="${line#HF_TOKEN=}"
      HF_TOKEN="${HF_TOKEN%\"}"; HF_TOKEN="${HF_TOKEN#\"}"
      HF_TOKEN="${HF_TOKEN%\'}"; HF_TOKEN="${HF_TOKEN#\'}"
      export HF_TOKEN
    fi
  fi
  if [[ -z "${HF_TOKEN:-}" && "$MODEL" != nvidia/Cosmos-* ]]; then
    log "HF_TOKEN not set; fine for an ungated model ($MODEL)"
    export HF_TOKEN=""
    return 0
  fi
  if [[ -z "${HF_TOKEN:-}" ]]; then
    log "HF_TOKEN is not set (env or $ENV_FILE). nvidia/Cosmos-Reason2-* is gated on Hugging Face."
    log "Put HF_TOKEN=<read token> in $ENV_FILE (chmod 600) after accepting the model licence."
    return 1
  fi
}

models_json() { curl -sf --max-time 5 "http://127.0.0.1:${PORT}/v1/models"; }

case "$CMD" in
  start)
    load_hf_token
    mkdir -p "$HF_CACHE" "$MEDIA_DIR"
    if docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
      log "container '$NAME' exists; removing it first"
      docker rm -f "$NAME" >/dev/null
    fi
    log "model=$MODEL max_model_len=$MAX_MODEL_LEN gpu_mem_util=$GPU_MEM_UTIL max_num_seqs=$MAX_NUM_SEQS image=$VLLM_IMAGE"
    # shellcheck disable=SC2086
    docker run -d --name "$NAME" \
      --gpus all --ipc=host \
      --restart on-failure:2 \
      -p "127.0.0.1:${PORT}:8000" \
      -v "$HF_CACHE:/root/.cache/huggingface" \
      -v "$MEDIA_DIR:$MEDIA_DIR:ro" \
      -e HF_TOKEN \
      "$VLLM_IMAGE" \
      --model "$MODEL" \
      --host 0.0.0.0 --port 8000 \
      --max-model-len "$MAX_MODEL_LEN" \
      --gpu-memory-utilization "$GPU_MEM_UTIL" \
      --max-num-seqs "$MAX_NUM_SEQS" \
      --limit-mm-per-prompt '{"image": 0, "video": 1}' \
      --media-io-kwargs '{"video": {"num_frames": -1}}' \
      --reasoning-parser qwen3 \
      --allowed-local-media-path "$MEDIA_DIR" \
      $EXTRA_ARGS >/dev/null
    log "started container '$NAME' (127.0.0.1:${PORT} only); waiting up to ${WAIT_SECS}s for /v1/models"
    start=$(date +%s)
    while true; do
      if out="$(models_json)"; then
        log "ready after $(( $(date +%s) - start ))s"
        echo "$out"
        exit 0
      fi
      if ! docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
        log "container exited; last log lines:"
        docker logs --tail 40 "$NAME" >&2 2>&1 || true
        exit 1
      fi
      if (( $(date +%s) - start > WAIT_SECS )); then
        log "timed out; see: $0 logs"
        exit 1
      fi
      sleep 10
    done
    ;;
  stop)
    docker rm -f "$NAME" >/dev/null 2>&1 && log "stopped '$NAME'" || log "'$NAME' was not running"
    ;;
  status)
    docker ps -a --filter "name=^${NAME}$" --format '{{.Names}} {{.Status}} {{.Ports}}'
    models_json || { log "no answer on 127.0.0.1:${PORT}"; exit 1; }
    echo
    ;;
  logs)
    docker logs -f --tail 100 "$NAME"
    ;;
  download)
    load_hf_token
    mkdir -p "$HF_CACHE"
    log "downloading $MODEL to $HF_CACHE (no GPU used)"
    docker run --rm -e NVIDIA_VISIBLE_DEVICES=void \
      -v "$HF_CACHE:/root/.cache/huggingface" \
      -e HF_TOKEN \
      --entrypoint hf \
      "$VLLM_IMAGE" download "$MODEL" --quiet >/dev/null
    log "done: $(du -shL "$HF_CACHE/hub/models--${MODEL/\//--}/snapshots" | cut -f1)"
    ;;
  *)
    echo "usage: $0 {start [MODEL] [MAX_MODEL_LEN]|stop|status|logs|download MODEL}" >&2
    exit 2
    ;;
esac
