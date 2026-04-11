#!/usr/bin/env python3
"""
Human History Corpus Validator
Validates all year JSON files against the ICCRA schema.
Run from repo root: python3 scripts/validate_corpus.py
"""

import json
import sys
import os
from pathlib import Path
from collections import Counter, defaultdict
from typing import Any

BASE = Path(os.environ.get("BASE_DIR", os.path.expanduser("~/Human_history")))
JSON_DIR = BASE / "outputs" / "json"

VALID_CATEGORIES = {
    "political", "military", "scientific", "cultural", "economic",
    "demographic", "technological", "religious", "environmental",
    "exploration", "legal"
}

VALID_CERTAINTIES = {"confirmed", "probable", "approximate", "traditional", "legendary"}

VALID_DOC_LEVELS = {"rich", "moderate", "sparse", "minimal", "negligible"}

VALID_SOURCE_TYPES = {
    "primary_text", "archaeological", "epigraphic", "numismatic",
    "chronicle", "historiographic_consensus", "oral_tradition", "later_compilation"
}

VALID_RELATIONS = {"caused_by", "led_to", "contemporary_with", "contradicts", "part_of"}

REQUIRED_TOP_KEYS = {"year", "year_label", "era_context", "documentation_level",
                     "geographic_coverage_gaps", "events", "disconfirming_evidence",
                     "historiographic_note", "graph_edges"}

REQUIRED_EVENT_KEYS = {"id", "title", "region", "category", "description",
                       "key_figures", "sources", "certainty"}


class ValidationResult:
    def __init__(self, year: int, filename: str):
        self.year = year
        self.filename = filename
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str):
        self.errors.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)

    @property
    def valid(self) -> bool:
        return len(self.errors) == 0


def validate_event(event: dict, year: int, idx: int, result: ValidationResult):
    prefix = f"events[{idx}]"

    for key in REQUIRED_EVENT_KEYS:
        if key not in event:
            result.error(f"{prefix}: missing required key '{key}'")

    if "id" in event:
        if not isinstance(event["id"], str):
            result.error(f"{prefix}: 'id' must be string, got {type(event['id']).__name__}")

    if "category" in event:
        if event["category"] not in VALID_CATEGORIES:
            result.error(f"{prefix}: invalid category '{event['category']}'")

    if "certainty" in event:
        if event["certainty"] not in VALID_CERTAINTIES:
            result.error(f"{prefix}: invalid certainty '{event['certainty']}'")

    if "title" in event:
        if not isinstance(event["title"], str) or len(event["title"]) < 3:
            result.error(f"{prefix}: title too short or invalid")

    if "description" in event:
        if not isinstance(event["description"], str) or len(event["description"]) < 20:
            result.warn(f"{prefix}: description suspiciously short ({len(event.get('description', ''))} chars)")

    if "key_figures" in event:
        if not isinstance(event["key_figures"], list):
            result.error(f"{prefix}: key_figures must be array")

    if "sources" in event:
        if not isinstance(event["sources"], list):
            result.error(f"{prefix}: sources must be array")
        elif len(event["sources"]) == 0:
            result.warn(f"{prefix}: no sources listed")
        else:
            for si, src in enumerate(event["sources"]):
                if not isinstance(src, dict):
                    result.error(f"{prefix}.sources[{si}]: must be object")
                    continue
                if "name" not in src:
                    result.error(f"{prefix}.sources[{si}]: missing 'name'")
                if "type" in src and src["type"] not in VALID_SOURCE_TYPES:
                    result.warn(f"{prefix}.sources[{si}]: non-standard source type '{src['type']}'")
                if "contemporary" not in src:
                    result.warn(f"{prefix}.sources[{si}]: missing 'contemporary' boolean")

    if "cross_references" in event:
        if not isinstance(event["cross_references"], list):
            result.error(f"{prefix}: cross_references must be array")


def validate_year(data: dict, filename: str) -> ValidationResult:
    year = data.get("year", "UNKNOWN")
    result = ValidationResult(year, filename)

    # Check required top-level keys
    for key in REQUIRED_TOP_KEYS:
        if key not in data:
            result.error(f"missing required top-level key '{key}'")

    # Year
    if "year" in data:
        if not isinstance(data["year"], (int, float)):
            result.error(f"'year' must be integer, got {type(data['year']).__name__}")

    # Year label
    if "year_label" in data:
        if not isinstance(data["year_label"], str):
            result.error(f"'year_label' must be string")
        elif "CE" not in data["year_label"] and "BCE" not in data["year_label"]:
            result.warn(f"'year_label' doesn't contain CE or BCE: '{data['year_label']}'")

    # Documentation level
    if "documentation_level" in data:
        if data["documentation_level"] not in VALID_DOC_LEVELS:
            result.error(f"invalid documentation_level '{data['documentation_level']}'")

    # Era context
    if "era_context" in data:
        if not isinstance(data["era_context"], str) or len(data["era_context"]) < 50:
            result.warn(f"era_context suspiciously short ({len(data.get('era_context', ''))} chars)")

    # Geographic coverage gaps
    if "geographic_coverage_gaps" in data:
        if not isinstance(data["geographic_coverage_gaps"], list):
            result.error(f"geographic_coverage_gaps must be array")
        elif len(data["geographic_coverage_gaps"]) == 0:
            result.warn(f"geographic_coverage_gaps is empty (should declare gaps)")

    # Events
    if "events" in data:
        if not isinstance(data["events"], list):
            result.error(f"events must be array")
        else:
            for idx, event in enumerate(data["events"]):
                if not isinstance(event, dict):
                    result.error(f"events[{idx}] must be object")
                    continue
                validate_event(event, year, idx, result)

    # Disconfirming evidence
    if "disconfirming_evidence" in data:
        if not isinstance(data["disconfirming_evidence"], str):
            result.error(f"disconfirming_evidence must be string")
        elif len(data["disconfirming_evidence"]) < 10:
            result.warn(f"disconfirming_evidence suspiciously short")

    # Historiographic note
    if "historiographic_note" in data:
        if not isinstance(data["historiographic_note"], str):
            result.error(f"historiographic_note must be string")

    # Graph edges
    if "graph_edges" in data:
        if not isinstance(data["graph_edges"], list):
            result.error(f"graph_edges must be array")
        else:
            for ei, edge in enumerate(data["graph_edges"]):
                if not isinstance(edge, dict):
                    result.error(f"graph_edges[{ei}] must be object")
                    continue
                for k in ("from", "to", "relation"):
                    if k not in edge:
                        result.warn(f"graph_edges[{ei}]: missing '{k}'")
                if "relation" in edge and edge["relation"] not in VALID_RELATIONS:
                    result.warn(f"graph_edges[{ei}]: non-standard relation '{edge['relation']}'")

    # Meta (optional but recommended)
    if "_meta" not in data:
        result.warn("missing _meta field (model/cost tracking)")

    return result


def main():
    files = sorted(JSON_DIR.glob("*.json"))
    files = [f for f in files if not f.name.endswith(".tmp")]

    if not files:
        print(f"No JSON files found in {JSON_DIR}")
        sys.exit(1)

    print(f"Validating {len(files)} year files in {JSON_DIR}\n")

    results: list[ValidationResult] = []
    stats = {
        "total": len(files),
        "valid": 0,
        "errors": 0,
        "warnings": 0,
        "categories": Counter(),
        "certainties": Counter(),
        "doc_levels": Counter(),
        "events_per_year": [],
        "models": Counter(),
        "years_with_no_gaps": 0,
        "years_with_no_sources": 0,
    }

    for f in files:
        try:
            with open(f) as fh:
                data = json.load(fh)
        except json.JSONDecodeError as e:
            r = ValidationResult("?", f.name)
            r.error(f"Invalid JSON: {e}")
            results.append(r)
            stats["errors"] += 1
            continue

        result = validate_year(data, f.name)
        results.append(result)

        if result.valid:
            stats["valid"] += 1
        else:
            stats["errors"] += 1

        stats["warnings"] += len(result.warnings)

        # Collect stats
        events = data.get("events", [])
        stats["events_per_year"].append(len(events))
        stats["doc_levels"][data.get("documentation_level", "unknown")] += 1

        for ev in events:
            stats["categories"][ev.get("category", "unknown")] += 1
            stats["certainties"][ev.get("certainty", "unknown")] += 1
            if not ev.get("sources"):
                stats["years_with_no_sources"] += 1

        if not data.get("geographic_coverage_gaps"):
            stats["years_with_no_gaps"] += 1

        meta = data.get("_meta", {})
        stats["models"][meta.get("model", "unknown")] += 1

    # Print results
    error_results = [r for r in results if not r.valid]
    warning_results = [r for r in results if r.warnings and r.valid]

    if error_results:
        print("=" * 70)
        print("ERRORS")
        print("=" * 70)
        for r in error_results[:20]:
            print(f"\n  {r.filename} (year {r.year}):")
            for e in r.errors:
                print(f"    ERROR: {e}")
        if len(error_results) > 20:
            print(f"\n  ... and {len(error_results) - 20} more files with errors")

    if warning_results:
        print(f"\n{'=' * 70}")
        print(f"WARNINGS (showing first 10 of {len(warning_results)})")
        print("=" * 70)
        for r in warning_results[:10]:
            print(f"\n  {r.filename} (year {r.year}):")
            for w in r.warnings[:3]:
                print(f"    WARN: {w}")

    # Summary
    total_events = sum(stats["events_per_year"])
    avg_events = total_events / len(stats["events_per_year"]) if stats["events_per_year"] else 0

    print(f"\n{'=' * 70}")
    print("CORPUS VALIDATION SUMMARY")
    print("=" * 70)
    print(f"Total files:        {stats['total']}")
    print(f"Valid:              {stats['valid']} ({stats['valid']/stats['total']*100:.1f}%)")
    print(f"With errors:        {stats['errors']}")
    print(f"Total warnings:     {stats['warnings']}")
    print(f"\nTotal events:       {total_events:,}")
    print(f"Avg events/year:    {avg_events:.1f}")
    print(f"Min events/year:    {min(stats['events_per_year'])}")
    print(f"Max events/year:    {max(stats['events_per_year'])}")

    print(f"\nDocumentation Levels:")
    for level, count in stats["doc_levels"].most_common():
        print(f"  {level:15s} {count:5d} ({count/stats['total']*100:.1f}%)")

    print(f"\nEvent Categories:")
    for cat, count in stats["categories"].most_common():
        print(f"  {cat:18s} {count:5d} ({count/total_events*100:.1f}%)")

    print(f"\nCertainty Levels:")
    for cert, count in stats["certainties"].most_common():
        print(f"  {cert:15s} {count:5d} ({count/total_events*100:.1f}%)")

    print(f"\nModels Used:")
    for model, count in stats["models"].most_common():
        print(f"  {model:30s} {count:5d}")

    print(f"\nQuality Flags:")
    print(f"  Years with empty coverage gaps: {stats['years_with_no_gaps']}")
    print(f"  Events with no sources:         {stats['years_with_no_sources']}")

    print("=" * 70)

    sys.exit(1 if stats["errors"] > 0 else 0)


if __name__ == "__main__":
    main()
