#!/usr/bin/env python3
"""Backfill _meta field on existing JSON outputs that lack it."""

import json
import os
from pathlib import Path
from datetime import datetime

BASE = Path(os.environ.get("BASE_DIR", os.path.expanduser("~/Human_history")))
JSON_DIR = BASE / "outputs" / "json"

updated = 0
skipped = 0

for f in sorted(JSON_DIR.glob("*.json")):
    try:
        with open(f) as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, Exception):
        continue

    if "_meta" in data:
        skipped += 1
        continue

    # Determine which model produced this file based on file modification time
    # All pre-optimization files were produced by Claude Code CLI using claude-sonnet-4-6
    # (the Max subscription default model)
    mtime = datetime.utcfromtimestamp(f.stat().st_mtime).isoformat()

    data["_meta"] = {
        "processed_at": mtime,
        "model": "claude-sonnet-4-6",
        "method": "claude-code-cli",
        "note": "Produced via Claude Code CLI (Max subscription) before API migration"
    }

    with open(f, "w") as fh:
        json.dump(data, fh, indent=2)

    updated += 1
    print(f"  Backfilled: {f.name}")

print(f"\nDone. Updated: {updated}, Already had _meta: {skipped}")
