#!/usr/bin/env bash
# Freshness agent runner. Usage:
#   run-agent.sh check <refs...> [--no-pr]
#   run-agent.sh sweep [--full] [--no-pr]
#   run-agent.sh news <refs...> [--no-pr]
#   run-agent.sh news-sweep [--no-pr]
#   run-agent.sh awin-digest        # marketing: weekly AWIN digest
#   run-agent.sh content-factory    # marketing: weekly social queue + email digest
#   run-agent.sh daily-social       # marketing: DAILY social → schedules straight into Buffer (auto-publish)
#   run-agent.sh forum-scout        # marketing: draft forum replies from tools/social/forum-leads.md
#   run-agent.sh reel-factory       # marketing: weekly reel batch (script + VO + MP4) for review
#   run-agent.sh loop-digest        # marketing: weekly reel loop digest (analytics → recommendations)
#   PRINT_CMD=1 run-agent.sh ...   # print the claude command instead of running it (no side effects)
set -euo pipefail

# Repo root derived from this script's location — portable (works on macOS + CI),
# no hardcoded path.
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

MODE="${1:-}"
case "$MODE" in
  news)            shift; PROMPT="/news-watch check $*" ;;
  news-sweep)      shift; PROMPT="/news-watch sweep $*" ;;
  awin-digest)     PROMPT="/awin-digest" ;;       # marketing: weekly AWIN digest → docs/reports/
  content-factory) PROMPT="/content-factory" ;;   # marketing: weekly social queue + email digest → tools/social/
  daily-social)    PROMPT="/parkmath-daily-social" ;;  # marketing: DAILY social → schedules straight into Buffer (auto-publish)
  forum-scout)     PROMPT="/forum-scout" ;;       # marketing: draft forum replies from tools/social/forum-leads.md
  reel-factory)    PROMPT="/reel-factory" ;;       # marketing: weekly reel batch → tools/reels/review/
  loop-digest)     PROMPT="/loop-digest" ;;        # marketing: reel loop digest → docs/reports/ + recommendations.json
  *)               PROMPT="/freshness $*" ;;
esac
# daily-social posts via the Buffer MCP, which isn't in this repo's MCP config —
# load it explicitly so the headless run can reach Buffer (HOME has a space, so the
# path must stay a single quoted array element, not unquoted word-splitting).
if [[ "$MODE" == "daily-social" ]]; then
  CMD=(claude -p "$PROMPT" --max-turns 200 --dangerously-skip-permissions --mcp-config "$HOME/.config/company/buffer-mcp.json")
else
  CMD=(claude -p "$PROMPT" --max-turns 200 --dangerously-skip-permissions)
fi

# Dry-run: print the command and exit before any filesystem side effects.
if [[ "${PRINT_CMD:-0}" == "1" ]]; then
  printf '%q ' "${CMD[@]}"; echo
  exit 0
fi

LOG_DIR="$HOME/Library/Logs/mathfamily-freshness"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y-%m-%d_%H%M)
export FRESHNESS_RUN_ID="$STAMP"
cd "$REPO"

"${CMD[@]}" >"$LOG_DIR/$STAMP.log" 2>&1
date +%s > "$LOG_DIR/last-success"   # general "any run" beacon
if [[ "$MODE" == "sweep" ]]; then date +%s > "$LOG_DIR/last-sweep-success"; fi  # sweep-only beacon
echo "freshness run complete — log: $LOG_DIR/$STAMP.log"
tail -5 "$LOG_DIR/$STAMP.log"
