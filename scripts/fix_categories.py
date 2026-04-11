#!/usr/bin/env python3
"""Fix compound categories (e.g., 'political | military') by keeping only the first."""

import json
import os
from pathlib import Path

VALID_CATEGORIES = {
    "political", "military", "scientific", "cultural", "economic",
    "demographic", "technological", "religious", "environmental",
    "exploration", "legal"
}

BASE = Path(os.environ.get("BASE_DIR", os.path.expanduser("~/Human_history")))
JSON_DIR = BASE / "outputs" / "json"

fixed_files = 0
fixed_events = 0

for f in sorted(JSON_DIR.glob("*.json")):
    if f.name.endswith(".tmp"):
        continue
    try:
        with open(f) as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, Exception):
        continue

    changed = False
    for event in data.get("events", []):
        cat = event.get("category", "")
        if cat not in VALID_CATEGORIES and "|" in cat:
            # Take the first valid category from the compound
            parts = [p.strip() for p in cat.split("|")]
            new_cat = next((p for p in parts if p in VALID_CATEGORIES), parts[0])
            if new_cat not in VALID_CATEGORIES:
                # Map common non-standard categories
                mapping = {
                    "administrative": "political",
                    "colonial": "exploration",
                    "social": "demographic",
                    "intellectual": "cultural",
                    "artistic": "cultural",
                }
                new_cat = mapping.get(new_cat, "political")
            event["category"] = new_cat
            changed = True
            fixed_events += 1
        elif cat not in VALID_CATEGORIES:
            mapping = {
                "administrative": "political",
                "colonial": "exploration",
                "social": "demographic",
                "intellectual": "cultural",
                "artistic": "cultural",
            }
            if cat in mapping:
                event["category"] = mapping[cat]
                changed = True
                fixed_events += 1

    if changed:
        with open(f, "w") as fh:
            json.dump(data, fh, indent=2)
        fixed_files += 1

print(f"Fixed {fixed_events} events across {fixed_files} files")
