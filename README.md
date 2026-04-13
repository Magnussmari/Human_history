# Human History According to AI

> 5,226 years. One JSON per year. Every claim sourced. Every gap declared.

**[View the Interactive Timeline](https://human-history-acording-to-ai.vercel.app)** | [GitHub](https://github.com/Magnussmari/Human_history_Acording_to_AI)

---

## ✅ Phase 1 Complete — April 13, 2026

The daemon ran for **57.7 hours** and finished the entire corpus without a single failed year.

| Final Metric | Value |
|---|---|
| **Years researched** | 5,226 / 5,226 (100%) |
| **Events documented** | 17,991 |
| **Graph edges** | 13,130 cross-year connections |
| **Failed years** | 0 |
| **Total runtime** | 57.7 hours (April 10–13, 2026) |
| **Total API cost** | ~$15.68 (est. $0.003/year × 5,226 years, Sonnet 4.6 batch) |
| **Model** | Claude Sonnet 4.6 exclusively |
| **Avg events per year** | 3.4 |

The complete corpus covers **2025 CE to ~3200 BCE** — the entire span of recorded human history. Every year is a structured JSON with events, primary sources, certainty levels, geographic gap declarations, and cause-effect graph edges.

---

## What This Is

**Every year of recorded human civilization. Structured. Sourced. Machine-readable.**

This is not a textbook. It is a **structured knowledge corpus** designed for graph databases, timelines, adversarial review, and further AI reasoning. Every claim names its source. Every confidence level is justified. Every gap is declared, not hidden.

---

## The Numbers

| Metric | Value |
|--------|-------|
| **Total years in corpus** | 5,226 (2025 CE → 3200 BCE) |
| **Total events** | 17,991 |
| **Total graph edges** | 13,130 |
| **Model** | Claude Sonnet 4.6 |
| **Architecture** | 5 parallel async agents, 5 years/batch |
| **Cycle interval** | 60 seconds |
| **Total runtime** | 57.7 hours |
| **Total API cost** | ~$15.68 |
| **Cost per year** | ~$0.003 (batch mode) |
| **Output per year** | 20–50 KB structured JSON |
| **Source types** | Primary text, archaeological, epigraphic, numismatic, chronicle, oral tradition |
| **Certainty levels** | Confirmed, probable, approximate, traditional, legendary |

---

## The Optimization Journey

This project started as a subscription-based CLI daemon and evolved through five distinct phases to complete the corpus 20x faster at 99% lower cost.

### Phase 1: Claude Code CLI (Max Subscription)

The initial daemon used `claude -p` (Claude Code CLI) with a Max subscription:
- **Cost model:** Subscription-based, fair-use quota
- **Problem:** Constant rate limiting during work hours, restricted to off-hours schedule
- **Token overhead:** ~3.5x due to agent tools, system prompts, permission handling
- **Speed:** 5 years per 20-minute cycle
- **Result:** 304 years completed before optimization

### Phase 2: Optimization Analysis

Used **Kimi Agents** to review the repository and spec the optimization — an AI agent analyzing another AI agent's workflow. The Kimi analysis identified:
- The `claude -p` CLI adds ~3.5x token overhead vs. direct API calls
- Tiered model selection could match model cost to year complexity
- Batch processing (5 years per API call) enables massive throughput gains
- Response caching eliminates re-processing on retries

### Phase 3: Claude Code Plan Mode Migration

Fed the Kimi optimization spec into Claude Code, which:
1. Entered **plan mode** to design the migration strategy
2. Identified all files needing modification and the exact changes
3. Built a complete Python implementation (`api_client.py`, `orchestrator_optimized.py`, etc.)
4. Deployed and tested on the remote server via SSH
5. Validated with single-year and parallel batch tests before switching over

### Phase 4: Haiku Experiment (Failed)

Initial API migration used tiered models with Haiku for batch processing. Quality comparison revealed:
- Haiku produced **thinner output** — shorter descriptions, fewer cross-references, empty geographic_coverage_gaps
- Sonnet produced **A+ quality** — rich sourcing, nuanced certainty notes, proper gap declarations
- **Decision:** Haiku outputs archived in `outputs/haiku_experiment/`, those years re-researched with Sonnet

### Phase 5: Sonnet 4.6 for All (Final)

Claude Sonnet 4.6 for every year, direct Anthropic API:
- **Cost per year:** ~$0.003 via batch API (vs. ~$0.22 via CLI)
- **Speed:** 25 years per 60-second cycle (vs. 5 years per 20 minutes)
- **Schedule:** 24/7 — no subscription quota limits
- **Completed:** 5,226 years in 57.7 hours

### Results

| Metric | Before (CLI) | After (API) | Improvement |
|--------|-------------|-------------|-------------|
| Cost per year | $0.22 | $0.003 | 99% cheaper |
| Years per cycle | 5 | 25 | 5× throughput |
| Cycle interval | 20 min | 60 sec | 20× faster |
| Schedule | Off-hours only | 24/7 | No restrictions |
| Total time | ~70 days est. | 57.7 hours actual | 29× faster |
| Total cost | ~$1,150 est. | ~$15.68 actual | 98.6% cheaper |

---

## What Each Year Contains

Every year follows the **ICCRA schema** (see [`RESEARCH_PROMPT.md`](RESEARCH_PROMPT.md)):

```json
{
  "year": 1066,
  "year_label": "1066 CE",
  "era_context": "High medieval period...",
  "documentation_level": "rich",
  "geographic_coverage_gaps": ["Sub-Saharan Africa", "Southeast Asia"],
  "events": [
    {
      "id": "1066-001",
      "title": "Battle of Hastings",
      "region": "England",
      "category": "military",
      "description": "...",
      "key_figures": ["William, Duke of Normandy"],
      "sources": [{"name": "Bayeux Tapestry", "type": "primary_text", "contemporary": true}],
      "certainty": "confirmed",
      "certainty_note": "..."
    }
  ],
  "disconfirming_evidence": "...",
  "historiographic_note": "...",
  "graph_edges": [{"from": "1066-001", "to": "1086-001", "relation": "led_to", "note": "..."}],
  "_meta": {"model": "claude-sonnet-4-6", "processed_at": "2026-04-11T..."}
}
```

**Key design principles:**
- **No fabrication.** Empty events with honest era_context > hallucinated entries
- **Anti-sycophancy protocol.** Every year must surface contradicting evidence
- **No anachronism.** Period-appropriate framing only
- **Global coverage.** Gaps are declared, not hidden
- **Source typing.** Primary text, archaeology, chronicle, or oral tradition — named, not assumed

---

## Interactive Frontend

A Next.js 16 timeline app at [`/frontend`](frontend/) — built with shadcn/ui, TanStack Virtual, and a dark ancient-history aesthetic.

The frontend evolved alongside the corpus through a series of iterative improvements driven by real usability feedback.

### Design Iterations

**v1 — Data dump.** The first frontend rendered every event card fully expanded by default. A year with 8 events produced ~8,000px of wall text. Navigation was a scrolling list of year cards, each showing generic era-period text.

**v2 — Progressive disclosure.** EventCards collapse by default. Click to expand description, key figures, cross-references, and sources. Information hierarchy flipped: title and description lead; metadata (category, certainty, region) moves to a quiet footer strip. Reading a year's events now feels like scanning a newspaper — skim the headlines, open what interests you.

**v3 — Headline-first timeline.** The virtualized timeline now shows each year's most significant event title as the card headline ("Fall of Western Roman Empire", "Battle of Marathon") instead of a generic era summary. Every year in the timeline tells you something immediately.

**v4 — Year navigation.** Typing "476", "776 BCE", or "-3200" into the search box now shows a prominent "Jump to [year]" button as the first result. Direct year navigation without scrolling through 5,226 cards.

### Features

- Virtualized timeline (window-based scroll — no scroll-within-scroll trap)
- Year jump: type any year number directly into search
- Collapsed event cards with progressive disclosure
- Era navigation, category/certainty filters
- Full year detail pages with events, sources, disconfirming evidence, graph edges
- Cross-year links: every cross-reference is a clickable link
- Mobile responsive
- GitHub Actions auto-aggregates data into 100-year chunks on every push

**Data flow:** `outputs/json/` → `scripts/aggregate-data.mjs` chunks into 100-year blocks → frontend loads on demand.

**Deploy:** Import the repo on Vercel, set root directory to `frontend`.

---

## Quality Assurance

```bash
# Full ICCRA schema validation
python3 scripts/validate_corpus.py

# Fix compound categories ("political | military" -> "political")
python3 scripts/fix_categories.py

# Backfill _meta on files missing model/cost tracking
python3 scripts/backfill_meta.py
```

**Final validation pass: 100% valid** — 5,226 files, 17,991 events, 0 errors.

| Check | Result |
|-------|--------|
| JSON structure | All 5,226 files parse cleanly |
| Required fields | All present: year, events, disconfirming_evidence, sources |
| Category values | 11 valid categories; compound categories auto-fixed |
| Certainty distribution | Confirmed 80.6%, probable 15.7%, approximate 3.5%, other 0.2% |
| Source attribution | 99.98% of events have named sources |
| Failed years | 0 |

---

## Run It Yourself

Copy this prompt into any AI agent. Self-contained, no dependencies:

```
You are a historical research agent. Produce structured JSON for a single year.

YEAR TO RESEARCH: [INSERT YEAR, e.g., 1453 or -776]

RULES:
1. Negative years = BCE. Positive = CE.
2. Research significant events across ALL regions.
3. Modern years: 15-25 events. Ancient: 0-5. Zero is acceptable.
4. Every event names its source. "General knowledge" is not acceptable.
5. Every event has a certainty level: confirmed/probable/approximate/traditional/legendary.
6. Include "disconfirming_evidence" — what's disputed about this year?
7. Include "geographic_coverage_gaps" — what regions are you missing?
8. Do NOT fabricate. Empty events with honest context > hallucinated entries.
9. Respond with VALID JSON ONLY.

SCHEMA: {"year": int, "year_label": str, "era_context": str,
"documentation_level": "rich|moderate|sparse|minimal|negligible",
"geographic_coverage_gaps": [str], "events": [{id, title, region,
category, description, key_figures, sources, certainty, certainty_note}],
"disconfirming_evidence": str, "historiographic_note": str,
"graph_edges": [{from, to, relation, note}]}
```

---

## Contributing

The daemon finished Phase 1. Human expertise makes the corpus better.

1. **Adversarial review** — prove the AI wrong. Find fabrications, bad sources, anachronisms
2. **Regional deep dives** — African, East Asian, Indigenous American, Pacific history
3. **Graph edges** — cause-effect chains, parallel developments, trade routes
4. **Phase 2 planning** — see below

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## What's Next (Phase 2)

Phase 1 produced the raw corpus. Phase 2 is about making it trustworthy and useful:

- **Adversarial validation pass** — run a second model (GPT-4.1 or DeepSeek R1) over every year and flag contradictions between models
- **Graph traversal** — build the full cause-effect graph across all 13,130 edges
- **Neo4j import** — the graph edges are ready; needs a Cypher import script
- **Regional equity audit** — systematic review of geographic_coverage_gaps to quantify Western bias
- **API** — expose the corpus as a queryable REST API

---

## Architecture

```
Human_history/
  RESEARCH_PROMPT.md            # ICCRA prompt template (locked)
  LEDGER.md                     # Append-only progress log
  scripts/
    api_client.py               # Direct Anthropic API, tiered models
    orchestrator_optimized.py   # Main daemon loop (async Python)
    batch_processor.py          # 5 years per API call
    validate_corpus.py          # ICCRA schema validator
    fix_categories.py           # Auto-fix compound categories
    health_check.sh             # Quick status
  frontend/                     # Next.js 16 interactive timeline
    src/app/                    # App Router pages
    src/components/             # Timeline, filters, search, event cards
    scripts/aggregate-data.mjs  # Chunk JSON into 100-year blocks
  docker/
    Dockerfile                  # Python 3.11 slim
    docker-compose.yml          # Reboot-persistent
  outputs/json/                 # 5,226 JSON files (2025.json → -3200.json)
  outputs/haiku_experiment/     # Archived Haiku quality test
  outputs/gemini_experiment/    # Archived Gemini Flash quality test
  state/
    progress.json               # Completed / failed / in-progress
    cache/                      # Response cache (SHA256-keyed)
```

---

## Methodology

The ICCRA schema was developed specifically for this project:

- **Intent** — explicit research goals per year type (modern vs. ancient)
- **Context** — era-appropriate framing requirements
- **Constraints** — anti-sycophancy, anti-anachronism, source-naming mandates
- **Reporting** — structured JSON with uncertainty quantification
- **Authority** — source typing: primary, archaeological, epigraphic, numismatic, chronicle, oral tradition

---

*Built by [Magnus Smarason](https://smarason.is) — one daemon, 5,226 years, zero fabrication.*
