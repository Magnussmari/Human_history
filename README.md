```
 ██╗  ██╗██╗   ██╗███╗   ███╗ █████╗ ███╗   ██╗
 ██║  ██║██║   ██║████╗ ████║██╔══██╗████╗  ██║
 ███████║██║   ██║██╔████╔██║███████║██╔██╗ ██║
 ██╔══██║██║   ██║██║╚██╔╝██║██╔══██║██║╚██╗██║
 ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║
 ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
 ██╗  ██╗██╗███████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
 ██║  ██║██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
 ███████║██║███████╗   ██║   ██║   ██║██████╔╝ ╚████╔╝
 ██╔══██║██║╚════██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝
 ██║  ██║██║███████║   ██║   ╚██████╔╝██║  ██║   ██║
 ╚═╝  ╚═╝╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
```

**Every year of recorded human civilization. Structured. Sourced. Machine-readable.**

An autonomous AI research daemon is writing the history of the world — one year at a time, from 2025 CE backward to the dawn of writing (~3200 BCE). Five parallel agents run around the clock, producing structured JSON with events, primary sources, confidence levels, geographic coordinates, anti-sycophancy checks, and graph edges linking cause to consequence across millennia.

This is not a textbook. It is a **structured knowledge corpus** designed for graph databases, timelines, adversarial review, and further AI reasoning. Every claim names its source. Every confidence level is justified. Every gap is declared, not hidden.

> **Live status:** Check [`state/progress.json`](state/progress.json) — the daemon updates it after every year.

---

## The Numbers

| Metric | Value |
|--------|-------|
| **Total years** | 5,226 (2025 CE → ~3200 BCE) |
| **Agents per cycle** | 5 parallel |
| **Cycle interval** | 20 minutes |
| **Estimated runtime** | ~70 days |
| **Output per year** | 20-50KB structured JSON |
| **Projected corpus** | ~200MB, 100K+ events |
| **Source types** | Primary text, archaeological, epigraphic, numismatic, chronicle, oral tradition |
| **Certainty levels** | Confirmed, probable, approximate, traditional, legendary |

---

## What Each Year Contains

Every year produces a single JSON file following the **ICCRA schema** (see [`RESEARCH_PROMPT.md`](RESEARCH_PROMPT.md)):

```json
{
  "year": 1066,
  "year_label": "1066 CE",
  "era_context": "High medieval period. The Norman Conquest reshapes England...",
  "documentation_level": "rich",
  "geographic_coverage_gaps": ["Sub-Saharan Africa", "Southeast Asia"],
  "events": [
    {
      "id": "1066-001",
      "title": "Battle of Hastings",
      "region": "England",
      "coordinates_approx": "50.91, 0.48",
      "category": "military",
      "description": "...",
      "key_figures": ["William, Duke of Normandy", "Harold Godwinson, King of England"],
      "sources": [{"name": "Bayeux Tapestry", "type": "primary_text", "contemporary": true}],
      "certainty": "confirmed",
      "cross_references": ["1065-004", "1067-001"]
    }
  ],
  "disconfirming_evidence": "The traditional narrative of Harold's death by arrow...",
  "historiographic_note": "Primary sources are overwhelmingly Norman-commissioned...",
  "graph_edges": [
    {"from": "1066-001", "to": "1086-001", "relation": "led_to", "note": "Domesday Book survey"}
  ]
}
```

**Key design principles:**
- **No fabrication.** If nothing is known for a year, the events array is empty and the era_context explains why.
- **Anti-sycophancy protocol.** Every year must surface evidence that contradicts its own narrative.
- **No anachronism.** A Bronze Age palace fire is described as a palace fire, not an "economic crisis."
- **Global coverage.** Asia, Africa, the Americas, Oceania — not just Europe. Gaps are declared, not hidden.
- **Source typing.** Every event names whether its evidence is a primary text, archaeology, a later chronicle, or oral tradition.

---

## Run It Yourself

This README is also a prompt. Copy the block below into Claude Code (or any agent with Claude API access) and it will research any year you want.

### Quick Start (One Year)

```bash
# Install Claude Code if you haven't
npm install -g @anthropic-ai/claude-code

# Research a single year (replace 1453 with any year, use negative for BCE)
claude -p "$(cat RESEARCH_PROMPT.md | sed 's/{{YEAR}}/1453/g; s/{{YEAR_LABEL}}/1453 CE/g')" \
  --dangerously-skip-permissions --output-format json | jq -r '.result' | jq '.' > 1453.json
```

### The Meta-Prompt

Copy this entire block into any AI agent. It is self-contained — no dependencies, no setup.

~~~
You are a historical research agent. Your task is to produce a structured JSON
document for a single year of human history. Follow these rules exactly:

YEAR TO RESEARCH: [INSERT YEAR HERE, e.g., 1453 or -3200]

INSTRUCTIONS:
1. If the year is negative, format as BCE (e.g., -3200 → "3200 BCE"). Otherwise CE.
2. Research the most significant events for this year across ALL regions of the world.
3. For well-documented years (modern era): 15-25 events.
   For poorly documented years (ancient): 0-5 events. Zero is acceptable.
4. Every event MUST name its source — "general knowledge" is not acceptable.
5. Every event MUST have a certainty level: confirmed, probable, approximate, traditional, or legendary.
6. You MUST include a "disconfirming_evidence" section — what commonly held beliefs
   about this year are disputed? If none, state that explicitly.
7. You MUST include "geographic_coverage_gaps" — which regions are you likely missing?
8. Do NOT fabricate. An empty events array with honest era_context is infinitely
   more valuable than hallucinated entries.
9. Do NOT project modern categories onto pre-modern events.
10. Respond with VALID JSON ONLY. No preamble, no markdown, no commentary.

OUTPUT SCHEMA:
{
  "year": <integer>,
  "year_label": "<YYYY CE or YYYY BCE>",
  "era_context": "<2-4 sentences: what defines this period?>",
  "documentation_level": "rich | moderate | sparse | minimal | negligible",
  "geographic_coverage_gaps": ["<regions likely underrepresented>"],
  "events": [
    {
      "id": "<year>-<NNN>",
      "title": "<short title>",
      "region": "<geographic region or polity>",
      "coordinates_approx": "<lat, lon or null>",
      "category": "political|military|scientific|cultural|economic|demographic|technological|religious|environmental|exploration|legal",
      "description": "<3-5 sentences: what happened, why it mattered, what it led to>",
      "key_figures": ["<Name (role)>"],
      "sources": [{"name": "<source>", "type": "primary_text|archaeological|epigraphic|numismatic|chronicle|historiographic_consensus|oral_tradition|later_compilation", "contemporary": <boolean>}],
      "certainty": "confirmed|probable|approximate|traditional|legendary",
      "certainty_note": "<why this confidence level?>",
      "cross_references": ["<related event IDs from other years>"]
    }
  ],
  "disconfirming_evidence": "<mandatory: disputes, contested claims, alternative interpretations>",
  "historiographic_note": "<how reliable is the record? what biases shape it?>",
  "graph_edges": [
    {"from": "<event_id>", "to": "<target_year-event_id or concept>", "relation": "caused_by|led_to|contemporary_with|contradicts|part_of", "note": "<explanation>"}
  ]
}
~~~

### Run a Batch (Parallel)

```bash
# Research 5 years in parallel
for year in 1453 1492 1776 1945 -500; do
  label=$( [ $year -lt 0 ] && echo "$(echo $year | tr -d '-') BCE" || echo "$year CE" )
  claude -p "$(cat RESEARCH_PROMPT.md | sed "s/{{YEAR}}/${year}/g; s/{{YEAR_LABEL}}/${label}/g")" \
    --dangerously-skip-permissions --output-format json | jq -r '.result' | jq '.' > "outputs/json/${year}.json" &
  sleep 2
done
wait
echo "Done. Check outputs/json/"
```

---

## Contributing

This is a living corpus. The daemon handles the bulk work, but human expertise makes it *correct*. Here's how to contribute:

### 1. Research unclaimed years

The daemon works chronologically from 2025 backward. You can leapfrog it:

```bash
# Fork the repo, pick a year the daemon hasn't reached
git checkout -b contrib/year-1453
# Run the prompt (see Quick Start above)
# Validate your output
jq -e '.year and .events and .disconfirming_evidence' outputs/json/1453.json
# Submit a PR
```

**Claim your range** by opening an Issue with the `claim` label: "Claiming years 1200-1250 CE".

### 2. Deep dives

The daemon produces broad coverage. You can go deep:

- Run a specialized prompt for a specific era, region, or theme
- Add extra fields: trade routes, artifact catalogs, demographic estimates
- Place in `deep-dives/<era>/<year>.json`

### 3. Validate and correct

Pick any completed year. Check the sources. Find errors. Submit corrections:

```bash
# Run a validation pass
claude -p "Review this historical JSON for factual errors, missing events, \
Western-centric bias, and source reliability issues. Be adversarial. \
$(cat outputs/json/2024.json)" --dangerously-skip-permissions
```

Open an Issue tagged `correction` with the year number and what's wrong.

### 4. Regional expertise

Are you a specialist in African, East Asian, Indigenous American, or Pacific history? The daemon's training data has gaps. Your knowledge fills them:

- Review years in your area of expertise
- Add events the daemon missed
- Correct cultural framing and anachronisms
- Submit as PRs to the relevant year files

### 5. Graph edges

The daemon generates some cross-year links. You can add more:

- Cause-and-effect chains across centuries
- Parallel developments in disconnected civilizations
- Trade route evolution
- Technology diffusion patterns

### 6. Adversarial review

The most valuable contribution: **prove us wrong.**

- What's missing from a century?
- What narrative bias shapes the coverage?
- Where did the AI hallucinate?
- What would a specialist in [field] object to?

Open an Issue tagged `adversarial` or submit a review document.

### Contribution Rules

- All JSON must validate against the ICCRA schema (see `RESEARCH_PROMPT.md`)
- Every event must have named sources — no "general knowledge"
- PRs to `outputs/json/` require at least one review
- Don't modify `RESEARCH_PROMPT.md` (the canonical prompt is locked)
- Be honest about uncertainty — empty events with good era_context > fabricated events

---

## Architecture

```
Human_history/
├── RESEARCH_PROMPT.md        # The ICCRA prompt template (DO NOT MODIFY)
├── LEDGER.md                 # Append-only daemon progress log
├── scripts/
│   ├── orchestrator.sh       # Main daemon loop (5 agents, 20-min cycles)
│   ├── run_year.sh           # Single-year agent runner
│   ├── generate_prompt.sh    # {{YEAR}} / {{YEAR_LABEL}} substitution
│   ├── git_sync.sh           # Auto-push to GitHub every 20 years
│   └── health_check.sh       # Quick status check
├── docker/
│   ├── Dockerfile            # Ubuntu 24.04 + Claude Code
│   ├── docker-compose.yml    # Reboot-persistent container
│   └── entrypoint.sh         # Init + launch orchestrator
├── outputs/
│   ├── json/                 # One file per year: 2025.json → -3200.json
│   ├── failed/               # Failed attempts with error context
│   └── logs/                 # Per-year agent logs
├── state/
│   └── progress.json         # Completed / failed / in-progress tracking
└── synthesis/                # Post-completion: merged corpus, graph edges
```

The daemon is **crash-safe and idempotent**:
- Progress persists in `state/progress.json` on the host volume
- Docker `restart: unless-stopped` survives reboots
- Lock files prevent double-processing
- Failed years are logged and retryable
- Already-completed years are skipped automatically

---

## Post-Completion Vision

When the daemon finishes all 5,226 years:

1. **Validate** — Schema check every JSON file
2. **Merge** — Single unified timeline (`synthesis/human_history_complete.json`)
3. **Graph** — Extract all edges into Neo4j for relationship traversal
4. **Adversarial review** — AI red-team pass for bias, gaps, and hallucination
5. **Interactive timeline** — Web visualization of the full corpus
6. **Academic review** — Open for domain expert correction and enrichment

The end state is a **structured, sourced, machine-readable history of human civilization** — not a replacement for scholarship, but a scaffold for it.

---

## The Smarason Method

This project uses Tier C research methodology:

- **ICCRA schema** — Intent, Context, Constraints, Reporting, Authority
- **Anti-sycophancy protocol** — Mandatory disconfirming evidence
- **Source typing** — Primary, archaeological, epigraphic, numismatic, chronicle, oral tradition
- **Certainty calibration** — Five-level confidence with justification
- **Geographic equity** — Explicit gap declaration for underrepresented regions
- **Graph-native** — Every event has edges connecting it to causes and consequences

---

*Built by [Magnus Smárason](https://smarason.is) — one daemon, 5,226 years, zero fabrication.*
