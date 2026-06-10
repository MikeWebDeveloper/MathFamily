#!/bin/zsh
# Freshness agent runner. Usage:
#   run-agent.sh check <refs...> [--no-pr]
#   run-agent.sh sweep [--full] [--no-pr]
#   PRINT_CMD=1 run-agent.sh ...   # print the claude command instead of running it
set -euo pipefail

REPO="/Volumes/TB4 Workstation/Users/mike/Desktop/Projects/MathFamily"
LOG_DIR="$HOME/Library/Logs/mathfamily-freshness"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y-%m-%d_%H%M)
export FRESHNESS_RUN_ID="$STAMP"

cd "$REPO"
PROMPT="/freshness $*"
CMD=(claude -p "$PROMPT" --max-turns 200 --dangerously-skip-permissions)

if [[ "${PRINT_CMD:-0}" == "1" ]]; then
  printf '%q ' "${CMD[@]}"; echo
  exit 0
fi

"${CMD[@]}" >"$LOG_DIR/$STAMP.log" 2>&1
date +%s > "$LOG_DIR/last-success"   # recency beacon for the n8n stale-sweep alert
echo "freshness run complete — log: $LOG_DIR/$STAMP.log"
tail -5 "$LOG_DIR/$STAMP.log"
