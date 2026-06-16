#!/usr/bin/env bash
# Build every reel in a review folder: voice-over (Kokoro/MLX) -> MP4 -> PNG still.
# Usage: REELS_DATE=2026-06-16 tools/reels/build-week.sh
# Env: REELS_PYTHON (default ~/reels-venv312/bin/python), REELS_TTS (default kokoro).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PY="${REELS_PYTHON:-$HOME/reels-venv312/bin/python}"
DATE="${REELS_DATE:-$(date +%F)}"
DIR="$ROOT/tools/reels/review/$DATE"
export REELS_TTS="${REELS_TTS:-kokoro}"

shopt -s nullglob
for f in "$DIR"/parkmath-*.json; do
  case "$f" in *.timing.json) continue ;; esac
  echo "=== $(basename "$f") ==="
  "$PY" "$ROOT/tools/reels/tts/synth.py" "$f"
  node "$ROOT/tools/reels/render.mjs" "$f"
  node "$ROOT/tools/reels/still.mjs" "$f"
done
echo "week built -> $ROOT/tools/reels/out/$DATE/"
