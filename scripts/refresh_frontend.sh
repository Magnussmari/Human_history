#!/bin/bash
# Auto-refresh frontend data chunks and push to GitHub
# Run via cron every 30 minutes

set -eu

cd ~/Human_history

# Check if there are new JSON files since last aggregation
MANIFEST_TIME=$(stat -c %Y frontend/public/data/manifest.json 2>/dev/null || echo 0)
NEWEST_JSON=$(find outputs/json -name "*.json" -newer frontend/public/data/manifest.json 2>/dev/null | head -1)

if [ -z "$NEWEST_JSON" ] && [ "$MANIFEST_TIME" -gt 0 ]; then
  echo "[$(date -u)] No new data since last aggregation"
  exit 0
fi

echo "[$(date -u)] New data detected, refreshing..."

# Re-aggregate
node frontend/scripts/aggregate-data.mjs 2>&1

# Git push
git add frontend/public/data/ outputs/json/ state/progress.json 2>/dev/null || true
if ! git diff --cached --quiet 2>/dev/null; then
  YEARS=$(jq .total_years frontend/public/data/manifest.json)
  EVENTS=$(jq .total_events frontend/public/data/manifest.json)
  git commit -m "Auto-refresh: ${YEARS} years, ${EVENTS} events" 2>/dev/null
  git push origin main 2>/dev/null && echo "[$(date -u)] Pushed to GitHub" || echo "[$(date -u)] Push failed"
else
  echo "[$(date -u)] No changes to push"
fi
