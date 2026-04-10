#!/bin/bash
# Pushes current progress to GitHub.
# Called by orchestrator.sh every ~20 years of progress.

set -eu

BASE="/workspace"
[ ! -d "$BASE/.git" ] && BASE="$HOME/Human_history"

cd "$BASE"

COMPLETED=$(jq '.completed | length' state/progress.json 2>/dev/null || echo "?")
FAILED=$(jq '.failed | length' state/progress.json 2>/dev/null || echo "?")
TOTAL=5226

# Stage outputs and state
git add outputs/json/*.json state/progress.json LEDGER.md 2>/dev/null || true

# Check if there are changes
if git diff --cached --quiet 2>/dev/null; then
  echo "[GIT SYNC] No changes to commit."
  exit 0
fi

git commit -m "Progress: ${COMPLETED}/${TOTAL} years completed (${FAILED} failed)" 2>/dev/null || {
  echo "[GIT SYNC] Commit failed."
  exit 1
}

# Try pushing — if main is protected, push to a data branch and log it
if git push origin main 2>/dev/null; then
  echo "[GIT SYNC] Pushed to main: ${COMPLETED} completed years."
else
  echo "[GIT SYNC] Main is protected. Pushing to data branch."
  BRANCH="data/progress-$(date +%Y%m%d)"
  git push origin "main:${BRANCH}" 2>/dev/null || echo "[GIT SYNC] Push failed entirely (will retry)."
fi
