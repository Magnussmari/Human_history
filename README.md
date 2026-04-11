# Human History

> 5,226 years. One JSON per year. Every claim sourced. Every gap declared.

<!-- PROGRESS_START -->
## 🌐 Live Progress

```
[=--------------------------------------------------] ?%

1011 / 5226 years completed · 0 failed · 4215 remaining
Currently researching: ~1015 CE
Last updated: 2026-04-11T17:38:48Z
```
<!-- PROGRESS_END -->

**Every year of recorded human civilization. Structured. Sourced. Machine-readable.**

An autonomous AI research daemon is writing the history of the world -- one year at a time, from 2025 CE backward to the dawn of writing (~3200 BCE). Parallel agents run around the clock, producing structured JSON with events, primary sources, confidence levels, geographic coordinates, anti-sycophancy checks, and graph edges linking cause to consequence across millennia.

This is not a textbook. It is a **structured knowledge corpus** designed for graph databases, timelines, adversarial review, and further AI reasoning. Every claim names its source. Every confidence level is justified. Every gap is declared, not hidden.

> **Live status:** Check [`state/progress.json`](state/progress.json) -- the daemon updates it after every cycle.

---

## The Numbers

| Metric | Value |
|--------|-------|
| **Total years** | 5,226 (2025 CE to ~3200 BCE) |
| **Agents per cycle** | 5 parallel batches of 5 years |
| **Cycle interval** | 60 seconds |
| **Schedule** | 24/7 (API-based, no subscription quota) |
| **Estimated runtime** | ~3-4 days |
| **Model** | Claude Sonnet 4.6 (all years) |
| **Actual cost per year** | $0.003 (batch mode) |
| **Projected total cost** | ~$17 (based on actual API spend: $2.97 for 916 years) |
| **Output per year** | 20-50KB structured JSON |
| **Source types** | Primary text, archaeological, epigraphic, numismatic, chronicle, oral tradition |
| **Certainty levels** | Confirmed, probable, approximate, traditional, legendary |

---

## Optimization Case Study

This project went through a significant cost and speed optimization mid-run. Here's the story:

### Phase 1: Claude Code CLI (Max Subscription)

The initial daemon used `claude -p` (Claude Code CLI) with a Max subscription:
- **Cost model:** Subscription-based, fair-use quota
- **Problem:** Constant rate limiting during work hours, restricted to off-hours schedule
- **Token overhead:** ~3.5x due to agent tools, system prompts, permission handling
- **Speed:** 5 years per 20-minute cycle
- **Result:** 304 years completed before optimization

### Phase 2: Optimization Analysis

Used **Kimi Agents** to review the repository and spec the optimization -- an AI agent analyzing another AI agent's workflow. The Kimi analysis identified:
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
- Haiku produced **thinner output** -- shorter descriptions, fewer cross-references, empty geographic_coverage_gaps
- Sonnet (both CLI and API) produced **A+ quality** -- rich sourcing, nuanced certainty notes, proper gap declarations
- **Decision:** Haiku not up to the task for historical research. All Haiku outputs moved to `outputs/haiku_experiment/` and those years queued for Sonnet re-research.

### Phase 5: Sonnet 4.6 for All (Current)

Now running with Claude Sonnet 4.6 for every year, via direct Anthropic API:
- **Model:** Claude Sonnet 4.6 exclusively (quality over cost)
- **Cost per year:** ~$0.20 via direct API
- **Batch processing:** 5 years per API call for throughput
- **Speed:** 25 years per 60-second cycle (vs. 5 years per 20 minutes)
- **Schedule:** Runs 24/7 -- no subscription quota limits
- **Estimated completion:** ~4-5 days (vs. 70 days originally)
- **Every output has `_meta`:** Model, cost, method, and timestamp tracked per year

### The Takeaway

| Metric | Before (CLI) | After (API) | Improvement |
|--------|-------------|-------------|-------------|
| Cost per year | $0.22 | $0.003 (Sonnet batch) | 99% cheaper |
| Years per cycle | 5 | 25 | 5x throughput |
| Cycle interval | 20 min | 60 sec | 20x faster |
| Schedule | Off-hours only | 24/7 | No restrictions |
| Est. total time | 70 days | 3-4 days | 20x faster |
| Est. total cost | ~$1,150 | ~$17 (actual API spend) | 98.5% cheaper |

**Key techniques:** Direct API calls (eliminate CLI overhead), model quality testing, batch processing, response caching, async Python with controlled concurrency.

### Model Experiments

We tested multiple models to find the optimal quality/cost balance:

| Model | Events/year | Cost/year (batch) | Quality | Verdict |
|-------|------------|-------------------|---------|---------|
| **Claude Sonnet 4.6** | 20-25 | $0.003 (actual) | A+ | **Selected** -- rich sourcing, nuanced certainty |
| Claude Haiku 4.5 | 10-15 | $0.009 | B+ | Rejected -- thin descriptions, empty gap declarations |
| Gemini 3 Flash | 6 | ~free | B | Rejected -- valid schema but too sparse |

Haiku outputs are preserved in `outputs/haiku_experiment/` and Gemini in `outputs/gemini_experiment/` for comparison.

**Future candidates worth testing:** GPT-4.1 batch (~$0.016/year, 1M context), DeepSeek R1 (~$0.009/year, reasoning chains), Qwen3-235B (~$0.004/year, strong APAC coverage).

**Update (April 2026):** OpenAI released GPT-5.4 with 1M context, reasoning effort controls (`none` through `xhigh`), and CFG grammar constraints for structured output enforcement. At $2.50/$10.00 per 1M tokens (batch: $1.25/$5.00), its batch output pricing ($5.00/M) undercuts Sonnet's ($7.50/M). Planned for adversarial validation pass after the Sonnet corpus is complete -- two models cross-referencing the same years is stronger than one.

---

## What Each Year Contains

Every year produces a single JSON file following the **ICCRA schema** (see [`RESEARCH_PROMPT.md`](RESEARCH_PROMPT.md)):

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
      "certainty": "confirmed"
    }
  ],
  "disconfirming_evidence": "...",
  "historiographic_note": "...",
  "graph_edges": [{"from": "1066-001", "to": "1086-001", "relation": "led_to"}],
  "_meta": {
    "model": "claude-sonnet-4-6",
    "cost_usd": 0.22,
    "duration_seconds": 260
  }
}
```

**Key design principles:**
- **No fabrication.** Empty events with honest era_context > hallucinated entries.
- **Anti-sycophancy protocol.** Every year must surface contradicting evidence.
- **No anachronism.** Period-appropriate framing only.
- **Global coverage.** Gaps are declared, not hidden.
- **Source typing.** Primary text, archaeology, chronicle, or oral tradition -- named, not assumed.

---

## Run It Yourself

### The Meta-Prompt

Copy this into any AI agent. Self-contained, no dependencies:

~~~
You are a historical research agent. Produce structured JSON for a single year.

YEAR TO RESEARCH: [INSERT YEAR, e.g., 1453 or -3200]

RULES:
1. Negative years = BCE (e.g., -3200 = "3200 BCE"). Positive = CE.
2. Research significant events across ALL regions.
3. Modern years: 15-25 events. Ancient: 0-5. Zero is acceptable.
4. Every event names its source. "General knowledge" is not acceptable.
5. Every event has a certainty level: confirmed/probable/approximate/traditional/legendary.
6. Include "disconfirming_evidence" -- what's disputed about this year?
7. Include "geographic_coverage_gaps" -- what regions are you missing?
8. Do NOT fabricate. Empty events with honest context > hallucinated entries.
9. Respond with VALID JSON ONLY.

SCHEMA: {"year": int, "year_label": str, "era_context": str,
"documentation_level": "rich|moderate|sparse|minimal|negligible",
"geographic_coverage_gaps": [str], "events": [{id, title, region,
category, description, key_figures, sources, certainty, certainty_note}],
"disconfirming_evidence": str, "historiographic_note": str,
"graph_edges": [{from, to, relation, note}]}
~~~

### Quick Start (API)

```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d "{\"model\":\"claude-haiku-4-5-20251001\",\"max_tokens\":16384,
       \"messages\":[{\"role\":\"user\",\"content\":\"$(cat RESEARCH_PROMPT.md | sed 's/{{YEAR}}/1453/g; s/{{YEAR_LABEL}}/1453 CE/g' | jq -Rs .)\"}]}" \
  | jq -r '.content[0].text' > 1453.json
```

---

## Contributing

The daemon handles bulk work. Human expertise makes it correct.

1. **Research unclaimed years** -- leapfrog the daemon, claim a range via Issue
2. **Deep dives** -- specialized prompts for specific eras/regions/themes
3. **Validate and correct** -- check sources, find errors, submit corrections
4. **Regional expertise** -- African, East Asian, Indigenous American, Pacific history
5. **Graph edges** -- cause-effect chains, parallel developments, trade routes
6. **Adversarial review** -- prove us wrong

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## Architecture

```
Human_history/
  RESEARCH_PROMPT.md          # ICCRA prompt template (locked)
  LEDGER.md                   # Append-only progress log
  scripts/
    api_client.py             # Direct Anthropic API with tiered models
    orchestrator_optimized.py # Main daemon loop (async Python)
    run_optimized.py          # Single-year runner
    batch_processor.py        # 5 years per API call
    token_monitor.py          # Real-time cost dashboard
    git_sync.sh               # Auto-push to GitHub
    health_check.sh           # Quick status
  docker/
    Dockerfile                # Python 3.11 slim
    docker-compose.yml        # Reboot-persistent
  outputs/json/               # One file per year
  state/
    progress.json             # Completed / failed / in-progress
    token_usage.json          # Per-request cost tracking
    cache/                    # Response cache (SHA256-keyed)
```

**Crash-safe and idempotent:** Progress persists on host volume. Docker restarts on reboot. Locks prevent double-processing. Cache prevents re-spending on retries.

---

## Methodology

A custom research workflow developed by Magnus, built on the ICCRA schema:

- **ICCRA schema** -- Intent, Context, Constraints, Reporting, Authority
- **Anti-sycophancy protocol** -- Mandatory disconfirming evidence
- **Source typing** -- Primary, archaeological, epigraphic, numismatic, chronicle, oral tradition
- **Certainty calibration** -- Five-level confidence with justification
- **Geographic equity** -- Explicit gap declaration for underrepresented regions
- **Graph-native** -- Every event has edges connecting causes and consequences

---

*Built by [Magnus Smarason](https://smarason.is) -- one daemon, 5,226 years, zero fabrication.*
