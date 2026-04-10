#!/bin/bash
# Main daemon loop. Picks next N years, launches parallel agents, waits, repeats.
# Designed for 70-day unattended operation.

set -eu

PARALLEL=${PARALLEL_AGENTS:-5}
INTERVAL=${CYCLE_INTERVAL_SECONDS:-1200}
START=${START_YEAR:-2025}
END=${END_YEAR:--3200}

BASE="/workspace"
[ ! -d "$BASE/state" ] && BASE="$HOME/Human_history"

PROGRESS="${BASE}/state/progress.json"
LEDGER="${BASE}/LEDGER.md"
GIT_SYNC="${BASE}/scripts/git_sync.sh"
SCRIPT="${BASE}/scripts/run_year.sh"

# --- Startup: clean stale state ---
# Remove stale locks (older than 15 min)
find "${BASE}/state/lock" -name "*.lock" -mmin +15 -delete 2>/dev/null || true

# Clear in_progress (anything there on startup is from a crash)
{
  flock -w 5 200 || true
  jq '.in_progress = []' "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
} 200>"${PROGRESS}.lock"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Orchestrator starting clean."

get_next_years() {
  local count=0
  local year=$START

  while [ "$year" -ge "$END" ] && [ "$count" -lt "$PARALLEL" ]; do
    if ! jq -e "(.completed + .failed) | index(${year})" "$PROGRESS" > /dev/null 2>&1; then
      echo "$year"
      count=$((count + 1))
    fi
    year=$((year - 1))
  done
}

write_ledger_entry() {
  local cycle=$1 completed=$2 failed=$3 total=$4 timestamp=$5

  # Every 4 cycles (= ~20 years)
  if [ $((cycle % 4)) -eq 0 ] && [ "$cycle" -gt 0 ]; then
    local earliest latest
    earliest=$(jq -r '[.completed[]] | sort | first // "none"' "$PROGRESS" 2>/dev/null || echo "?")
    latest=$(jq -r '[.completed[]] | sort | last // "none"' "$PROGRESS" 2>/dev/null || echo "?")

    printf '\n## Cycle %d — %s\n\n' "$cycle" "$timestamp" >> "$LEDGER"
    printf '- **Progress:** %d/%d completed (%d failed)\n' "$completed" "$total" "$failed" >> "$LEDGER"
    printf '- **Year range covered:** %s → %s\n' "$latest" "$earliest" >> "$LEDGER"
    printf '- **Status:** Running nominally\n\n---\n' >> "$LEDGER"
    echo "  [LEDGER] Wrote summary at cycle ${cycle}"

    # Git sync (non-fatal)
    bash "$GIT_SYNC" 2>&1 || echo "  [GIT SYNC] Failed (non-fatal)"
  fi
}

# Initialize ledger if missing
if [ ! -f "$LEDGER" ]; then
  printf '# Human History Daemon — Ledger\n\n> Append-only log.\n> Started: %s\n\n---\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LEDGER"
fi

CYCLE=0
CONSECUTIVE_ZERO_PROGRESS=0

while true; do
  CYCLE=$((CYCLE + 1))
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  COMPLETED=$(jq '.completed | length' "$PROGRESS")
  FAILED=$(jq '.failed | length' "$PROGRESS")
  TOTAL=$((START - END + 1))
  REMAINING=$((TOTAL - COMPLETED - FAILED))

  echo ""
  echo "========================================"
  echo "[${TIMESTAMP}] Cycle ${CYCLE}"
  echo "  Progress: ${COMPLETED}/${TOTAL} completed, ${FAILED} failed, ${REMAINING} remaining"
  echo "========================================"

  # All done?
  if [ "$REMAINING" -le 0 ]; then
    echo "All years processed. Daemon complete."
    printf '{"status":"complete","completed":%d,"failed":%d,"timestamp":"%s"}\n' "$COMPLETED" "$FAILED" "$TIMESTAMP" > "${BASE}/state/final_status.json" 2>/dev/null || true
    bash "$GIT_SYNC" 2>&1 || true
    exit 0
  fi

  # Get next batch
  YEARS=$(get_next_years)

  if [ -z "$YEARS" ]; then
    # All years are either completed, failed, or in-progress
    # If nothing is in-progress, clear failed to allow retries
    IN_PROGRESS=$(jq '.in_progress | length' "$PROGRESS")
    if [ "$IN_PROGRESS" -eq 0 ] && [ "$FAILED" -gt 0 ]; then
      echo "  All remaining years have failed. Clearing failed list for retry."
      {
        flock -w 5 200 || true
        jq '.failed = []' "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
      } 200>"${PROGRESS}.lock"
    else
      echo "  No years available. Waiting..."
    fi
    sleep "$INTERVAL"
    continue
  fi

  echo "  Launching agents for years: $(echo $YEARS | tr '\n' ' ')"

  # Launch agents in parallel
  PIDS=()
  for year in $YEARS; do
    bash "$SCRIPT" "$year" &
    PIDS+=("$!")
    sleep 2  # Stagger to avoid API burst
  done

  # Wait for all agents
  for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
  done

  # Check progress
  NEW_COMPLETED=$(jq '.completed | length' "$PROGRESS")
  CYCLE_PROGRESS=$((NEW_COMPLETED - COMPLETED))

  if [ "$CYCLE_PROGRESS" -eq 0 ]; then
    CONSECUTIVE_ZERO_PROGRESS=$((CONSECUTIVE_ZERO_PROGRESS + 1))
    BACKOFF=$((INTERVAL + CONSECUTIVE_ZERO_PROGRESS * 300))  # Escalating backoff
    [ "$BACKOFF" -gt 3600 ] && BACKOFF=3600  # Cap at 1 hour
    echo "  WARNING: No progress (${CONSECUTIVE_ZERO_PROGRESS} consecutive). Backing off ${BACKOFF}s."
    sleep "$BACKOFF"
  else
    CONSECUTIVE_ZERO_PROGRESS=0
    echo "  Cycle completed: +${CYCLE_PROGRESS} years."
  fi

  # Re-read for ledger
  COMPLETED=$(jq '.completed | length' "$PROGRESS")
  FAILED=$(jq '.failed | length' "$PROGRESS")

  write_ledger_entry "$CYCLE" "$COMPLETED" "$FAILED" "$TOTAL" "$TIMESTAMP"

  echo "  Sleeping ${INTERVAL}s before next cycle."
  sleep "$INTERVAL"
done
