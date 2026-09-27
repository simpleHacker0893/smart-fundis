#!/usr/bin/env bash
# Generate the synthetic smoke clip for smoke_cosmos.py (ticket #8).
# ffmpeg's built-in test pattern, so no person, no stock footage, no licence question (ADR-14).
#   make_smoke_clip.sh [OUT] [SECONDS]      default /data/smoke.mp4, 8 s, 640x360 at 30 fps
set -euo pipefail
OUT="${1:-/data/smoke.mp4}"
SECS="${2:-8}"
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: sudo apt-get install -y ffmpeg" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"
ffmpeg -loglevel error -y -f lavfi -i "testsrc2=size=640x360:rate=30:duration=${SECS}" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$OUT"
echo "$OUT"
