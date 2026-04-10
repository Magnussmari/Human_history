#!/bin/bash
# Usage: run_year.sh <year_int>
# Runs a single Claude Code research agent for one year.
# Designed for 70-day unattended operation.

set -eu  # NO pipefail — we handle pipe failures explicitly

YEAR=$1
BASE="/workspace"
[ ! -d "$BASE/state" ] && BASE="$HOME/Human_history"

OUTPUT="${BASE}/outputs/json/${YEAR}.json"
LOGFILE="${BASE}/outputs/logs/${YEAR}.log"
LOCKFILE="${BASE}/state/lock/${YEAR}.lock"
PROGRESS="${BASE}/state/progress.json"
MAX_RETRIES=${MAX_RETRIES:-3}
RATE_LIMIT_WAIT=300
MAX_RATE_LIMIT_WAITS=50
AGENT_TIMEOUT=900  # 15 minutes max per Claude invocation

log() { echo "[${YEAR}] $1" | tee -a "$LOGFILE" 2>/dev/null || echo "[${YEAR}] $1"; }

# --- Skip if already completed ---
if jq -e ".completed | index(${YEAR})" "$PROGRESS" > /dev/null 2>&1; then
  echo "[${YEAR}] Already completed, skipping."
  exit 0
fi

# --- Locking (with stale lock detection) ---
if [ -f "$LOCKFILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 900 ]; then  # 15 minutes
    echo "[${YEAR}] Lock exists (${LOCK_AGE}s old), skipping."
    exit 0
  fi
  log "Stale lock detected (${LOCK_AGE}s old), removing."
  rm -f "$LOCKFILE"
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE" "${OUTPUT}.tmp" "${OUTPUT}.raw"' EXIT

# --- Mark in-progress (using flock for safety) ---
{
  flock -w 5 200 || true
  jq ".in_progress += [${YEAR}] | .in_progress |= unique" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
} 200>"${PROGRESS}.lock"

# --- Generate prompt ---
PROMPT=$(bash "${BASE}/scripts/generate_prompt.sh" "$YEAR")

# --- Rate limit detection ---
is_rate_limited() {
  local file="$1"
  [ ! -s "$file" ] && return 1
  local content
  content=$(cat "$file" 2>/dev/null) || return 1
  if echo "$content" | grep -qi "hit your limit\|rate limit\|resets\|too many requests\|overloaded\|429"; then
    return 0
  fi
  return 1
}

# --- Extract JSON from Claude output ---
extract_json() {
  local tmpfile="$1"
  local outfile="$2"

  # Step 1: Get the .result field from Claude's wrapper JSON
  local result_file="${tmpfile}.result"
  if ! jq -r '.result // empty' "$tmpfile" > "$result_file" 2>/dev/null; then
    rm -f "$result_file"
    return 1
  fi

  # Empty result
  if [ ! -s "$result_file" ]; then
    rm -f "$result_file"
    return 1
  fi

  # Step 2: Strip markdown fences (```json, ```) — write to file, not pipe
  sed -i '/^```/d' "$result_file" 2>/dev/null || true

  # Step 3: Try to parse as JSON directly
  if jq -e '.year' "$result_file" > /dev/null 2>&1; then
    jq '.' "$result_file" > "$outfile" 2>/dev/null
    rm -f "$result_file"
    return 0
  fi

  # Step 4: Try to extract JSON object from mixed text
  # Use perl for reliable multiline extraction (available in Ubuntu)
  if perl -0777 -ne 'print $1 if /(\{.*"year".*\})/s' "$result_file" 2>/dev/null | jq -e '.year' > /dev/null 2>&1; then
    perl -0777 -ne 'print $1 if /(\{.*"year".*\})/s' "$result_file" | jq '.' > "$outfile" 2>/dev/null
    rm -f "$result_file"
    return 0
  fi

  rm -f "$result_file"
  return 1
}

# --- Main retry loop ---
ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
  ATTEMPT=$((ATTEMPT + 1))
  log "Attempt ${ATTEMPT}/${MAX_RETRIES}"

  # Rate limit retry loop (doesn't consume attempts)
  RATE_LIMIT_HITS=0
  while true; do
    rm -f "${OUTPUT}.tmp" "${OUTPUT}.raw"

    # Run Claude with timeout
    CLAUDE_EXIT=0
    timeout "$AGENT_TIMEOUT" claude -p "${PROMPT}" \
      --dangerously-skip-permissions \
      --output-format json \
      > "${OUTPUT}.tmp" 2>> "$LOGFILE" || CLAUDE_EXIT=$?

    # Timeout returns 124
    if [ "$CLAUDE_EXIT" -eq 124 ]; then
      log "Agent timed out after ${AGENT_TIMEOUT}s."
      rm -f "${OUTPUT}.tmp"
      break
    fi

    # Check for rate limiting
    if is_rate_limited "${OUTPUT}.tmp"; then
      RATE_LIMIT_HITS=$((RATE_LIMIT_HITS + 1))
      if [ $RATE_LIMIT_HITS -ge $MAX_RATE_LIMIT_WAITS ]; then
        log "Rate limited ${RATE_LIMIT_HITS} times, giving up."
        break
      fi
      log "Rate limited (${RATE_LIMIT_HITS}/${MAX_RATE_LIMIT_WAITS}). Waiting ${RATE_LIMIT_WAIT}s..."
      rm -f "${OUTPUT}.tmp"
      sleep $RATE_LIMIT_WAIT
      continue
    fi

    break  # Not rate limited, proceed to extraction
  done

  # Skip extraction if we broke out due to rate limit exhaustion
  [ $RATE_LIMIT_HITS -ge $MAX_RATE_LIMIT_WAITS ] && continue

  # --- Validate output ---
  # Check 1: Did Claude write the file directly via its Write tool?
  #          (Claude Code in agent mode often writes to the target path itself)
  if [ -s "$OUTPUT" ] && jq -e '.year' "$OUTPUT" > /dev/null 2>&1; then
    rm -f "${OUTPUT}.tmp" "${OUTPUT}.raw"
    SUCCESS=true
    log "Completed successfully (agent wrote file directly)."
  # Check 2: Extract JSON from Claude's wrapper output
  elif [ -s "${OUTPUT}.tmp" ] && extract_json "${OUTPUT}.tmp" "${OUTPUT}.raw"; then
    mv "${OUTPUT}.raw" "$OUTPUT"
    rm -f "${OUTPUT}.tmp"
    SUCCESS=true
    log "Completed successfully (extracted from output)."
  else
    log "Output failed JSON extraction/validation on attempt ${ATTEMPT}."
    # Save failed output for debugging
    if [ -s "${OUTPUT}.tmp" ]; then
      jq -r '.result // "NO RESULT FIELD"' "${OUTPUT}.tmp" > "${BASE}/outputs/failed/${YEAR}-attempt${ATTEMPT}.txt" 2>/dev/null || \
        cp "${OUTPUT}.tmp" "${BASE}/outputs/failed/${YEAR}-attempt${ATTEMPT}.txt" 2>/dev/null || true
    fi
    rm -f "${OUTPUT}.tmp" "${OUTPUT}.raw"
  fi

  # Back off before retry
  if [ "$SUCCESS" = false ] && [ $ATTEMPT -lt $MAX_RETRIES ]; then
    sleep 30
  fi
done

# --- Update progress (with file locking) ---
{
  flock -w 10 200 || true
  if [ "$SUCCESS" = true ]; then
    jq "(.in_progress |= map(select(. != ${YEAR}))) | .completed += [${YEAR}] | .completed |= unique" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
  else
    jq "(.in_progress |= map(select(. != ${YEAR}))) | .failed += [${YEAR}] | .failed |= unique" "$PROGRESS" > "${PROGRESS}.tmp" && mv "${PROGRESS}.tmp" "$PROGRESS"
    log "FAILED after ${MAX_RETRIES} attempts."
  fi
} 200>"${PROGRESS}.lock"
