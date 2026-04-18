# Chronograph — Human History According to AI

> 5,226 years. One JSON per year. Every claim sourced. Every gap declared.
> A year-by-year editorial folio of human civilisation, researched by AI.

**🌐 [human-history-acording-to-ai.vercel.app](https://human-history-acording-to-ai.vercel.app)** · [GitHub](https://github.com/Magnussmari/Human_history_Acording_to_AI) · [MIT License](LICENSE)

![status](https://img.shields.io/badge/Phase_1-shipped-8a2b22?style=flat-square)
![status](https://img.shields.io/badge/Phase_2_evidence-7_eras_validated-3a4a6b?style=flat-square)
![status](https://img.shields.io/badge/Frontend-v0.2_Notebook-2a5237?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-73788b?style=flat-square)

---

## Three layers, one folio

| Layer | What it is | Shipped |
|---|---|---|
| **Layer 1 — Corpus** | 5,226 ICCRA-schema JSON files, one per year, 2025 CE → 3,200 BCE | ✅ 2026-04-13 |
| **Layer 2 — Evidence** | Scholarly deep-dives per scholarly era via the Scite MCP; 7 eras validated, 13 more migration-pending | ✅ 2026-04-17 |
| **Frontend — Chronograph** | Notebook editorial folio (reading), Stratum instrument view (per-year dashboard), Atlas orthographic globe (spatial) — Next.js 16 + React 19 | ✅ 2026-04-18 |
| **Translation layer (EN → IS)** | Production-grade, CI-integrated pipeline localizing the corpus into Icelandic. Locked verbatim Icelandic system prompt, Gemini Flash 3 Preview pinned, six-guard correctness chain, idempotent SHA256 manifest, GitHub Action auto-translates on push | ✅ 2026-04-18 (pipeline), IS backfill running |

---

## Layer 1 — The Corpus (Phase 1 complete)

The daemon ran for **57.7 hours** across 2026-04-10 – 2026-04-13 and finished the entire corpus without a single failed year.

| Final metric | Value |
|---|---|
| **Years researched** | 5,226 / 5,226 (100%) |
| **Events documented** | 17,991 |
| **Graph edges** | 13,130 cross-year connections |
| **Failed years** | 0 |
| **Total runtime** | 57.7 hours |
| **Total API cost** | ~$15.68 (Sonnet 4.6 via batch API, ~$0.003/year) |
| **Model** | Claude Sonnet 4.6, exclusively |
| **Source attribution** | 99.98% of events have named sources |
| **Certainty distribution** | Confirmed 80.6%, probable 15.7%, approximate 3.5%, other 0.2% |

Every year is a structured JSON with events, primary sources, certainty levels, geographic-gap declarations, and cause-effect graph edges. See the **Methodology** page on the site for the full optimisation journey.

---

## Layer 2 — Scholarly Evidence (in progress)

After the year-level corpus shipped, a second complementary layer was built under `evidence-layer/`: scholarly-evidence deep-dives per scholarly era, produced via the Scite MCP with the `scite-preflight` / `scite-research` skill system.

| Phase | Eras | Status |
|---|---|---|
| **Phase 3 (schema v1.0.0, god-tier)** | 7 (Archaic Greece, Persian Achaemenid Empire, Classical Athens, Warring States China, Hellenistic World, Mauryan India, Pax Romana) | ✅ validated |
| **Phase 2 (pre-schema, drifted)** | 13 (pre-agricultural → Iron Age Aegean) | ⚠ awaiting schema-v1 re-migration |
| **Education pilots** | 3 (Classical Athens · paideia, Islamic Golden Age · madrasah, AI Inflection · cognitive threshold) | ✅ VALOR-sourced |
| **Unresearched** | 2 eras | 📋 backlog |

**Highlights:**
- **161 bibliography entries** harvested from Scite and VALOR.
- **9 validation missions** including the Mediterranean-diet / CVD god-tier run that caught the PREDIMED retraction.
- **143 citations** from the VALOR education corpus catalogued for cross-reference.
- Scite MCP whitepaper + case study available under `/methodology/scite-mcp` on the live site.

See `evidence-layer/README.md` for the full layer 2 inventory.

---

## Frontend — Chronograph v0.2 (Notebook)

The original prototype frontend ("Eternal Codex" — dark-gold grimoire aesthetic) was **removed and rebuilt** on 2026-04-18 using the Claude Design handoff bundle.

Three coordinated surfaces, one navigation:

- **📖 Notebook** (`/`) — the default reading experience. Cream parchment with ruled lines, oxblood editorial stamps, Newsreader serif display + Inter Tight chrome + IBM Plex Mono. Virtualised 5,226-row timeline with a bookmark lane for era/decade rules. Every year is a folio entry.
- **🔬 Stratum** (`/stratum`) — dataset-as-instrument. Near-black dashboard, click-anywhere-to-jump year strip, 3-panel stats (event count by category, certainty distribution, source-mix bar), VB-style event grid with category rail, contempo/later source indicators, and full per-year dissent block.
- **🌍 Atlas** (`/atlas`) — orthographic globe with 17,515 plotted events. Imperative RAF-driven canvas draw reads rotation from a ref (no React re-render per frame over 17k items); d3-geo convention for drag so right-drag reveals east. Time-brush histogram across all 5,226 years, category filter, Off-Earth / orbital toggle (Apollo coords don't plot in the Pacific), LOD that switches heat → cluster → pin by zoom.

**Shell:**
- Primary nav (brand · Methodology · GitHub) always visible.
- Secondary nav (Notebook · Stratum · Atlas) only on the three interactive routes.
- Year folio (`/year/[id]`), Era dossier (`/era/[id]`), and Methodology pages render without the view switcher — pure reading.
- Proper Open Graph card rendering a cream folio preview (not the Vercel ▲).

**Tech:** Next.js 16.2, React 19.2, Tailwind v4, TanStack Virtual + Query, motion/react, d3-geo + topojson-client. All visual tokens from a single 3-variant system (`--fg / --stamp / --rule / --accent`) with WCAG AA contrast verified by `scripts/qa-contrast.mjs`.

---

## Translation layer — EN → IS (2026-04-18)

The corpus is being localized into Icelandic via a production-grade, CI-integrated pipeline at [`scripts/translate/`](scripts/translate/). The architecture is generic and supports additional locales; Italian is planned.

**Model:** `gemini-3-flash-preview` (pinned — `-latest` tags are forbidden in production runs so dialect/format doesn't shift mid-backfill).

**Strategy:** The model is prompted *in Icelandic* — the full system prompt is written in Icelandic to lock the model into the Icelandic latent space. Prompt is verbatim at [`scripts/translate/prompts/system.is.md`](scripts/translate/prompts/system.is.md) and content-hash-pinned in the manifest so any edit invalidates the entire locale cache.

**Six-guard correctness chain** (every translated file must pass all six or it's not written):

1. Locked verbatim Icelandic system prompt (rule #1: translate values only, keep keys in English).
2. Glossary preamble in the user message listing every JSON key + every ICCRA enum value that must be preserved.
3. API-level `responseMimeType: "application/json"` forcing strict JSON output.
4. **Structural diff** rejecting any file where keys, enums, IDs, numerics, or array lengths differ from source. `cross_references` and `coordinates_approx` allow English parenthetical annotations to translate but require the ID/numeric prefix to match.
5. **Deterministic key-rename auto-repair** for the mechanical `extra_key + missing_key with same ICCRA-enum value` class of model errors (e.g. model produces `"certain": "confirmed"` instead of `"certainty": "confirmed"` — schema is authoritative, rename is logged, content is untouched).
6. **Ajv schema validator** rejecting any file that breaks ICCRA.

Atomic `.tmp` → `rename` ensures no partial writes ever land on disk. Idempotent via SHA256(source) + SHA256(prompt) per file per locale in `.translation-manifest.json`.

**Fixed Icelandic terms** (from [`scripts/translate/glossary.json`](scripts/translate/glossary.json)): BCE → f.Kr., CE → e.Kr., *Antiquities of the Jews* → *Fornsögur Gyðinga*, *Proleptic Gregorian* → *fyrirframreiknað gregorískt tímatal*. Canonical Icelandic forms for historical names (Ágústus, Heródes mikli, Parþaveldið, Silkivegurinn, Jósefus) handled by the locked prompt.

**Automation:** [`.github/workflows/translate-is.yml`](.github/workflows/translate-is.yml) — on push to `main` touching `outputs/json/**` or `scripts/translate/**`, runs the IS pipeline (manifest-skipped for cached files), re-aggregates frontend chunks, opens a PR via peter-evans/create-pull-request. `workflow_dispatch` supports a `reset_manifest` flag for forced full re-translation. Concurrency group prevents overlapping runs.

**Frontend consumption:** [`frontend/scripts/aggregate-data.mjs`](frontend/scripts/aggregate-data.mjs) emits per-locale chunk trees at `frontend/public/data/<locale>/{chunks,manifest.json}`. Missing-locale years fall back to English with a `_locale_fallback: "en"` marker so the UI never sees a hole in the timeline. [`frontend/src/i18n/`](frontend/src/i18n/) provides a `hasLocale()` typeguard, dictionary loader, and native-speaker-authored EN / IS dictionaries for chrome, category labels, certainty labels, and era names. The `app/[lang]/` route restructure is scheduled as a follow-up session.

Run locally:

```bash
cd scripts/translate
npm install
echo "GOOGLE_AI_API_KEY=..." >> ../../.env
npm run dry-run:is            # 3-file smoke
npm run run:is                # full 5,226-year backfill (resumable)
```

---

## What each year contains

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
      "certainty_note": "Extensively documented..."
    }
  ],
  "disconfirming_evidence": "...",
  "historiographic_note": "...",
  "graph_edges": [{"from": "1066-001", "to": "1086-001", "relation": "led_to", "note": "..."}],
  "_meta": {"model": "claude-sonnet-4-6", "processed_at": "2026-04-11T..."}
}
```

**Design principles:** no fabrication · anti-sycophancy (disconfirming evidence mandatory) · no anachronism · global coverage (gaps declared, not hidden) · named source typing (primary text, archaeological, epigraphic, numismatic, chronicle, oral tradition).

---

## The optimisation journey (Phase 1)

Started as a subscription-based CLI daemon; evolved through five phases to complete the corpus 29× faster at 98.6% lower cost.

| Metric | Phase 1 (CLI) | Phase 5 (API) | Improvement |
|---|---|---|---|
| Cost per year | $0.22 | $0.003 | 99% cheaper |
| Years per cycle | 5 | 25 | 5× throughput |
| Cycle interval | 20 min | 60 sec | 20× faster |
| Schedule | Off-hours only | 24/7 | Unrestricted |
| Total time | ~70 days (est.) | 57.7 hours (actual) | 29× faster |
| Total cost | ~$1,150 (est.) | ~$15.68 (actual) | 98.6% cheaper |

Full breakdown of each phase, including the failed Haiku experiment and the Kimi-analysed plan-mode migration, lives on [/methodology](https://human-history-acording-to-ai.vercel.app/methodology).

---

## Run it yourself

Self-contained prompt, no dependencies — drop into any capable AI:

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

## Quality assurance

```bash
# Full ICCRA schema validation
python3 scripts/validate_corpus.py

# Auto-fix compound categories ("political | military" -> "political")
python3 scripts/fix_categories.py

# Backfill _meta on files missing model/cost tracking
python3 scripts/backfill_meta.py
```

Final validation pass: **100% valid** — 5,226 files, 17,991 events, 0 errors.

---

## Architecture

```
Human_history/
├── LICENSE                        MIT
├── README.md                      this file
├── RESEARCH_PROMPT.md             ICCRA prompt template (locked)
├── LEDGER.md                      append-only progress log
├── CONTRIBUTING.md                how to do adversarial review
│
├── scripts/                       Python 3.11 async daemon (Phase 1) + TS translate
│   ├── api_client.py              direct Anthropic API, tiered models
│   ├── orchestrator_optimized.py  main daemon loop
│   ├── batch_processor.py         5 years per API call
│   ├── validate_corpus.py         ICCRA schema validator
│   ├── fix_categories.py          auto-fix compound categories
│   ├── health_check.sh            quick status
│   └── translate/                 EN → IS translation pipeline (2026-04-18)
│       ├── gemini.ts              @google/genai client, pinned flash-3-preview
│       ├── schema.ts              Ajv ICCRA validator (mirrors Python)
│       ├── structural-diff.ts     post-translation keys/enums/IDs guard
│       ├── key-repair.ts          deterministic schema-key auto-repair
│       ├── translate.ts           per-file orchestration
│       ├── manifest.ts            SHA256 idempotency
│       ├── run.ts                 CLI entrypoint
│       ├── prompts/system.is.md   locked verbatim Icelandic prompt
│       └── glossary.json          DO_NOT_TRANSLATE + fixed IS terms
│
├── docker/                        reboot-persistent daemon container
│
├── outputs/
│   ├── json/                      5,226 ICCRA JSON files (Layer 1)
│   ├── haiku_experiment/          archived quality comparison
│   └── gemini_experiment/         archived quality comparison
│
├── evidence-layer/                Layer 2 — Scite/VALOR deep-dives
│   ├── methodology/               scite-skill-system + validation missions
│   ├── eras/                      phase2-eras-01-13, phase3-eras-14-20
│   └── education-layer/           VALOR-sourced education pilots
│
├── frontend/                      Chronograph v0.2 (Notebook)
│   ├── src/app/                   Next.js 16 App Router
│   │   ├── page.tsx               / (Notebook timeline)
│   │   ├── atlas/page.tsx         /atlas (orthographic globe)
│   │   ├── stratum/page.tsx       /stratum (instrument dashboard)
│   │   ├── year/[id]/             per-year folio
│   │   ├── era/[id]/              per-era scholarly brief
│   │   ├── methodology/           editorial methodology page
│   │   └── opengraph-image.tsx    OG card (cream folio, 1200×630)
│   ├── src/components/
│   │   ├── shell/                 two-layer nav (primary + secondary)
│   │   ├── notebook/              folio timeline + year layout
│   │   ├── stratum/               instrument dashboard
│   │   └── atlas/                 globe + imperative draw loop
│   ├── scripts/
│   │   ├── aggregate-data.mjs     Layer 1: chunk JSON (+ per-locale trees)
│   │   ├── aggregate-evidence.mjs Layer 2: flatten evidence to per-era JSON
│   │   ├── qa-tour.mjs            Playwright screenshot sweep
│   │   ├── qa-font-audit.mjs      DOM sweep for <14px text
│   │   └── qa-contrast.mjs        WCAG AA computed-contrast checker
│   ├── src/i18n/                  locale loader + en/is dictionaries
│   └── public/data/               aggregated chunks + era bundles + locale trees
│
└── state/
    ├── progress.json              daemon progress (completed/failed/in_progress)
    └── cache/                     SHA256-keyed response cache
```

---

## License

MIT License for all code (see [`LICENSE`](LICENSE)).
Corpus data (JSON under `outputs/json/`, aggregated chunks, evidence layer) released under CC BY 4.0 — attribution required.

---

## Contributing

Layer 1 is complete. Layer 2 and the frontend are living work.

1. **Adversarial review** — prove the AI wrong. Find fabrications, bad sources, anachronisms
2. **Regional deep dives** — African, East Asian, Indigenous American, Pacific
3. **Graph edges** — cause/effect chains, parallel developments, trade routes
4. **Evidence layer** — re-research the 13 Phase-2 eras under schema v1.0.0
5. **Frontend** — file issues for broken UX or missing affordances

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

*Built by [Magnús Smári Smárason](https://smarason.is) — one daemon, 5,226 years, zero fabrication. Frontend design by Claude Design (claude.ai/design), implementation by Claude Code.*
