# History Timeline — Status Report
**Date**: 2026-04-18
**Commander**: Magnús Smári Smárason
**Repo**: `Magnussmari/Human_history_Acording_to_AI`
**Local path**: `/Users/magnussmari/DevOps/Human_history_Acording_to_AI/`
**Current branch**: `frontend-rebuild` (3 commits ahead of `main`, pushed to origin)

---

## TL;DR

Phase 1 of the project (5,226-year year-level corpus) shipped on **2026-04-13**.
Between **2026-04-14 and 2026-04-17** a second, complementary scholarly-evidence layer
was built using the Scite MCP and migrated into this repo under a single new top-level
directory `evidence-layer/` (76 files, 1.5 MB, still uncommitted on disk).

On **2026-04-18** a third strand shipped: an atlas-grade frontend rebuild on the
`frontend-rebuild` branch. New `/methodology` editorial page, a Layer 2 evidence UI
that lifts the 24 aggregated era JSONs into the live site, and a Scite MCP whitepaper
sub-page. Three commits, pushed to origin as a Vercel preview deployment. `main`
branch and the production deploy at `human-history-acording-to-ai.vercel.app` remain
untouched until the commander promotes the preview.

---

## What Was Migrated (2026-04-14 → 2026-04-17, evidence-layer/)

All evidence-layer material is under a single new top-level folder. The existing repo
structure (docker, frontend, outputs, scripts, state, README, LEDGER, etc.) was NOT
modified by the migration itself.

```
evidence-layer/
├── README.md                                  navigational overview (authored for this repo)
│
├── methodology/
│   ├── scite-skill-system/                    the tool that produced everything
│   │   ├── README.md                          installation guide
│   │   ├── WHITEPAPER.md                      system documentation (37 KB)
│   │   ├── CASE_STUDY.md                      Phase 2 rate-limit incident (23 KB)
│   │   ├── scite-preflight/SKILL.md           planning skill (Glass Box)
│   │   ├── scite-research/SKILL.md            execution skill (parallel workers)
│   │   ├── agents/scite-worker.md             per-angle worker (discipline-aware tiers)
│   │   └── reference/
│   │       ├── schema.json                    JSON Schema draft-07 v1.0.0
│   │       ├── parameters.md                  Scite MCP parameters + dois[] case-fix
│   │       └── workflows.md                   9 research patterns + anti-patterns
│   │
│   └── validation-missions/
│       └── mediterranean-diet-cvd/            god-tier validation (PREDIMED retraction caught)
│           ├── README.md, synthesis.md, agents/, results/
│
├── eras/
│   ├── phase2-eras-01-13/                     April 14 work (pre-god-tier, drifted schema)
│   │   └── outputs/json/                      13 era JSONs + auth-probe.txt
│   │
│   └── phase3-eras-14-20/                     April 16 god-tier work (schema v1.0.0)
│       ├── README.md, agents/ (7), synthesis.md
│       └── results/
│           ├── agent-NN-results.{md,json}  × 7
│           ├── SYNTHESIS.md                   cross-era rollup (5 patterns)
│           ├── references.bib                 Tier 1 bibliography
│           └── validation-report.json         9/9 god-tier upgrades validated
│
└── education-layer/                           April 17 VALOR harvest + pilots
    ├── README.md                              two-layer model (L1 political vs L2 education)
    ├── inventory/MASTER_INVENTORY.md          143 citations catalogued
    ├── bibliography/bibliography.bib          verified from VALOR project (1,617 lines)
    ├── source-links/README.md                 paths to external VALOR corpus
    ├── cross-references/valor-to-history-eras.md
    └── timeline-map/
        ├── era-NN-education-TEMPLATE.md       reusable 11-section template
        ├── PILOT_LESSONS.md                   scaling strategy
        ├── era-16-education.md                Classical Athens / paideia
        ├── era-25-education.md                Islamic Golden Age / madrasah
        └── era-50-education.md                AI Inflection / Cognitive Threshold
```

These artefacts remain **uncommitted on disk** as of 2026-04-18. They are referenced
by the frontend rebuild but their raw form is not in the repo. The frontend operates
on aggregated derivatives only (see next section).

---

## What Shipped on 2026-04-18 (frontend-rebuild branch)

Three commits on `origin/frontend-rebuild`. Vercel produces a preview deployment per
push; `main` and the production URL are untouched.

### (a) Atlas methodology page + component library — commit `1452e81`

60 files / +11,084 lines. Everything below is in `frontend/`.

- **Atlas component library** at `src/components/atlas/`:
  `Editorial.tsx` (EditorialPage / Eyebrow / PageTitle / Lede / Section / Reading /
  Rule / Pullquote / DataList), `Monument.tsx` (Monument / MonumentRow),
  `MarginNote.tsx` (block-level aside on desktop, expandable footnote on mobile),
  `ProvenanceStrip.tsx` (transparency receipts).
- **Design system** at `src/design/`: `tokens.css` (4-role palette: parchment / ink /
  oxblood / leaf), `breakpoints.ts`, `motion.ts`, `keyboard.ts`.
- **`/methodology` page** at `src/app/methodology/page.tsx` — long-form thesis
  statement: schema, model choice, failures, cost, honesty protocol, two-layer model,
  ledger, provenance.
- **Layout shell** updated at `src/app/layout.tsx`: loads atlas font variables
  (Fraunces / Instrument Sans / IBM Plex Mono), adds Methodology nav link, sets
  `data-scroll-behavior="smooth"` on `<html>` per Next 16 router contract.
- **Hydration bug found and fixed** during dev: four `MarginNote` instances on
  `/methodology` were placed inside `<p>` tags. `MarginNote` renders block-level
  `<aside>` (desktop) / `<div>` (mobile), which the parser auto-closes the `<p>`
  around — producing four React 19 hydration mismatches. Lifted each `MarginNote`
  out of its parent `<p>` to be a block sibling inside `<Reading>`. Verified by
  rendered HTML inspection: zero `<p>...<aside>` and zero `<p>...<div>` nestings.

### (b) Layer 2 evidence UI integration — same commit `1452e81`

The frontend now surfaces the scholarly evidence layer that previously lived only
in `evidence-layer/`.

- **Aggregation pipeline**: `frontend/scripts/aggregate-evidence.mjs` +
  `frontend/scripts/era-registry.mjs` walk `evidence-layer/` and emit
  `frontend/public/data/eras/` (24 era JSONs + `bibliography.json` +
  `valor-map.json` + `index.json`) with ajv schema validation against the
  scite-skill-system v1.0.0 schema.
- **Era pages**: new dynamic route at `src/app/era/[id]/page.tsx` (+
  `loading.tsx`).
- **Era components** at `src/components/`: `ScholarlyEraPillRow`,
  `ScholarlyEraCard`, `EvidenceTable`, `ContestedClaimsList`,
  `ScholarlyDebatePanel`, `EducationPanel`, `EducationSkeleton`,
  `CapacityGrid` (7 VALOR capacities), `CitationChip`.
- **Home-page integration**: `ScholarlyEraPillRow` now sits below the broad-era
  navigation on the timeline view.
- **Type / config support**: `src/types/evidence.ts`, `src/lib/evidence.ts`, and
  the new VERDICT / CONFIDENCE / TIER / PHASE_STATUS / CAPACITY / LEVEL config
  blocks in `src/lib/constants.ts` with `safe*Config` fallback functions for AI-
  drift tolerance.

### (c) Vercel build fix — commit `368d3b7`

The first push to `frontend-rebuild` failed in Vercel's prebuild because
`aggregate-evidence.mjs` reads `evidence-layer/methodology/scite-skill-system/reference/schema.json`
— but `evidence-layer/` is intentionally uncommitted. The aggregated outputs in
`frontend/public/data/eras/` are committed, so re-running the aggregator on Vercel
was unnecessary in the first place. Patch: schema load + ajv compile moved inside
`main()`; the script now logs `evidence-layer/ not present — using committed eras/
as-is.` and returns early when the source directory is absent. Local runs (where
`evidence-layer/` exists) behave identically.

### (d) Scite MCP whitepaper sub-page — commit `310388e`

New page at `src/app/methodology/scite-mcp/page.tsx` — eight sections, ~2.2k
web-words, web adaptation of `evidence-layer/methodology/scite-skill-system/WHITEPAPER.md`
(37k). Compresses the whitepaper while preserving every receipt: 250-call rate-limit
incident on 2026-04-14, the budget pre-flight that hardened the pipeline (projected
24 / actual 24, projected 52 / actual 45), the `dois[]` case-sensitivity bug, the
humanities monograph indexing gap, 0 hallucinated citations across 162 papers.
Cross-link wired from `/methodology` Section "Two layers".

---

## Git State

```
$ git branch --show-current
frontend-rebuild

$ git log --oneline -4
310388e feat: scite mcp whitepaper sub-page — glass box, rate-limit budget, findings
368d3b7 fix: aggregate-evidence no-ops when evidence-layer/ absent — unblock vercel build
1452e81 feat: atlas methodology page + scholarly era integration — fix p-nested marginnote hydration
22fccda docs: Phase 1 complete — final stats, runtime, cost, frontend evolution

$ git status (untracked items only)
?? .claude/
?? CLAUDE.md
?? History_timeline_status170426.md
?? evidence-layer/
?? package-lock.json   (orphan root lockfile — turbopack root anchored to frontend/ in next.config.ts)
```

- **Branch**: `frontend-rebuild` (3 commits ahead of `main`, pushed to origin).
- **Push status**: `origin/frontend-rebuild` is current. Vercel preview rebuilding /
  rebuilt against `310388e`.
- **`evidence-layer/`**: still untracked, intentionally — see CLAUDE.md TOP-PRIORITY
  rules; commander review pending.
- **Last upstream commit on `main`**: `22fccda` (2026-04-13 — Phase 1 complete doc).
  Production Vercel still serves `main` unchanged.

---

## What the Two Layers Answer

| Layer | Unit | Question | Source |
|-------|------|----------|--------|
| L1 — year-level corpus | 1 year | What happened in year N? | Existing `outputs/` — 5,226 JSON files from Sonnet 4.6 daemon |
| L2 — scholarly evidence | 1 era (10–400 years) | What does the peer-reviewed scholarly evidence say about the core claims of this period? | New `evidence-layer/` — Scite MCP with retraction enforcement |

Plus L2 has two sub-layers:

- **Political / imperial / material**: what happened, who ruled, what institutions
  (currently covered for eras 01–20; eras 21–50 pending).
- **Education / formation / pedagogy**: how the tradition transmitted essential
  knowledge, which of 7 capacity categories it foregrounded (currently: 3 pilot
  eras + reusable template + 143 citations ready to scale to all 50 eras).

Both sub-layers now have a **frontend surface**: era pages render evidence tables,
contested claims, scholarly debate panels, and the education/capacity grid where
data exists; they degrade gracefully (with explicit "unmapped" / "migration-pending"
states) where data is sparse.

---

## Verification Pedigree

Every `eras/` and `methodology/validation-missions/` file passed:

- **0 hallucinated citations** — every DOI retrieved through `mcp__scite__search_literature`.
- **Retraction enforcement** — PREDIMED 2013 (`10.1056/NEJMoa1200303`) detected by
  two independent agents and excluded; 2018 republication substituted.
- **Schema validation** — 10 agents across 2 missions, 0 validation errors against v1.0.0.
- **Budget discipline** — within ±15% of projection across both missions.

Frontend (added 2026-04-18):

- **Hydration**: 0 React 19 hydration errors on `/methodology` and
  `/methodology/scite-mcp`. Verified by rendered HTML inspection — zero
  `<p>...<aside>` and zero `<p>...<div>` nestings.
- **Build**: Vercel preview build green against `310388e` (after the
  `aggregate-evidence` no-op patch in `368d3b7`).
- **Aggregated era JSONs**: schema-validated by ajv during local aggregation;
  identical bytes (modulo `generated_at` timestamps) committed to the repo.

Education-layer bibliography inherits verification from the external VALOR project
5-phase Academic Claim Verification Pipeline (2026-03-2x): 130/144 confirmed,
0 fabricated.

---

## Key Metrics Snapshot

| Metric | Phase 1 (existing) | Phase 2/3 + harvest (evidence-layer) | Frontend rebuild (2026-04-18) |
|--------|-------------------|--------------------------------------|-------------------------------|
| Unit | Year | Era + education-layer-per-era | Page / component |
| Count | 5,226 years | 20 eras (01–20) + 3 pilot education files | `/methodology`, `/methodology/scite-mcp`, `/era/[id]`, atlas component lib |
| Status | Complete | Ongoing | Preview-deployed; awaiting promote-to-main |
| Runtime | 57.7 hours | ~50 minutes across 3 missions | — |
| API cost | ~$15.68 (Anthropic direct) | ~$0 (69/250 Scite MCP monthly quota; 181 headroom) | — |
| Model | Sonnet 4.6 | Sonnet 4.6 workers + Opus 4.7 synthesis | Opus 4.7 (1M context) for build |
| Citations | Internal only | 143 verified BibTeX + 78 locally-held sources | Surfaced via `EvidenceTable` + `CitationChip` |
| Fabrications | — | 0 | — |
| Retractions cited | — | 0 (PREDIMED 2013 caught and substituted) | — |
| Hydration errors | — | — | 0 (4 found and fixed during build) |

---

## What Was NOT Migrated / Touched (intentional)

- **VALOR source corpus** — PDFs, HTML, text extractions under
  `/Users/magnussmari/Documents/VALOR/`. Referenced by absolute path in the
  education-layer harvest; remains external as a separate project.
- **`~/.scite-quota.json`** — personal user-level state file (quota cache).
- **PROMPTS originals** — still in `/Users/magnussmari/Documents/PROMPTS/` (commander
  will clean up later).
- **`evidence-layer/` raw artefacts** — still untracked. Aggregated derivatives
  shipped in the frontend; raw sources remain on disk pending commander review.
- **`main` branch and production Vercel** — untouched. Preview deploy on
  `frontend-rebuild` is the staging environment.

---

## What's Next (Pending Work)

### Immediate (for commander)

1. **Review the Vercel preview** of `frontend-rebuild` — exercise `/`,
   `/methodology`, `/methodology/scite-mcp`, an `/era/[id]` page, a `/year/[id]`
   page. Confirm no console errors, no broken routes, the era pill row behaves on
   mobile.
2. **Decide when to promote frontend-rebuild → main** — opens a PR via
   `gh pr create --base main --head frontend-rebuild`, or fast-forward merge once
   the preview review is clean. Triggers production Vercel deploy.
3. **Decide whether to commit `evidence-layer/` raw artefacts** — currently
   uncommitted. The frontend operates without them (aggregated derivatives are
   sufficient), so this is a separate decision about source-trail visibility in the
   public repo.
4. **Decide whether to commit the four other untracked top-level items**:
   `CLAUDE.md` (project rules — useful in repo), `History_timeline_status170426.md`
   (this doc — possibly), `.claude/` (per-project Claude settings), and the orphan
   root `package-lock.json` (probably remove rather than commit; the new
   `next.config.ts` anchors turbopack root to `frontend/`).

### Medium-term (research)

5. **Eras 21–30** Scite mission — Batch 3: Late Antiquity through Medieval.
   Budget remaining this cycle: 181 Scite MCP calls (250 monthly limit − 69 used).
   A 10-agent batch ≈ 73 calls; still fits before the 2026-05-01 reset.
6. **Schema-normalise Phase 2 JSONs** — the 13 era-01…era-13 outputs have drifted
   schemas (pre-god-tier). The frontend currently shows them as
   "migration-pending"; a small migration script would lift them to v1.0.0 and
   light up their evidence panels.
7. **Scale education-layer pilots** — the template is validated. Options in
   `evidence-layer/education-layer/timeline-map/PILOT_LESSONS.md` for scaling to
   all 50 eras.

### Long-term

8. **Cross-era thematic missions** — for patterns that cut across eras (e.g. the
   administrative-convergence pattern identified in Phase 3 synthesis: Achaemenid,
   Qin-Han, and Maurya all independently developing document-intensive
   bureaucracies between ~550 BCE and ~200 BCE).
9. **Monograph citation-proxy provision** — extend the worker's humanities tier
   rules so landmark pre-2000 works (Hansen 1991, Thapar 1961, etc.) that appear
   only in citations count toward Tier 1.
10. **Year ↔ era reciprocal links** — wire each `/year/[id]` page to its
    containing era's `/era/[id]` page and vice versa, so L1 and L2 are
    one click apart.

---

## Commits Already Made (frontend-rebuild)

```
310388e  feat: scite mcp whitepaper sub-page — glass box, rate-limit budget, findings
368d3b7  fix: aggregate-evidence no-ops when evidence-layer/ absent — unblock vercel build
1452e81  feat: atlas methodology page + scholarly era integration — fix p-nested marginnote hydration
```

Pushed to `origin/frontend-rebuild`. Three commits ahead of `main` (`22fccda`).

---

## Hand-off Checklist for Commander

- [x] Inspect repo state (`cd /Users/magnussmari/DevOps/Human_history_Acording_to_AI`)
- [x] Read `evidence-layer/README.md` — voice / framing reviewed
- [x] Read `evidence-layer/methodology/scite-skill-system/WHITEPAPER.md` — and ship
      a public-facing reading of it at `/methodology/scite-mcp`
- [x] Commit strategy decided — three commits on `frontend-rebuild`
- [x] Push strategy decided — pushed to `origin/frontend-rebuild` for Vercel preview
- [ ] **Review the Vercel preview deployment** of `frontend-rebuild`
- [ ] **Decide when to merge `frontend-rebuild` → `main`** (production deploy)
- [ ] Decide whether to commit `evidence-layer/` raw artefacts
- [ ] (Separately, on own schedule) clean up `/Users/magnussmari/Documents/PROMPTS/`
      to remove source duplicates

---

*Status file updated 2026-04-18. The frontend rebuild is live as a Vercel preview;
the evidence layer is ready for commander review and can be shipped whenever
desired.*

---

## 2026-04-18 Evening — Translation Layer (EN → IS)

A fourth strand shipped the same day: a production-grade, CI-integrated
translation pipeline that localizes the year-level corpus into Icelandic.
PR #2 (`feat/translation-pipeline-is`) merged to `main` at 19:53 UTC. Full
5,226-year IS backfill is running on GitHub Actions runners as of 19:54 UTC
(run `24612626420`, not local).

### What shipped

- **`scripts/translate/`** — isolated TypeScript pipeline (Node 20, `tsx` runner):
  - `gemini.ts` — Gemini Flash 3 Preview client (`gemini-3-flash-preview` pinned),
    `responseMimeType: application/json`, exponential-backoff retry on 429/5xx/fetch
    errors/JSON-parse errors, `maxOutputTokens: 65536` for large year files.
  - `schema.ts` — ICCRA Ajv validator mirroring `scripts/validate_corpus.py` enum
    sets exactly.
  - `structural-diff.ts` — post-translation guard: keys must be identical,
    enums/IDs/numerics/booleans/array-lengths preserved, `cross_references` ID
    prefix immutable but parenthetical annotations translatable.
  - `translate.ts` — per-file: validate source → call Gemini → structural diff →
    Ajv schema validate → atomic `.tmp` → `rename`. Refuses to write on any drift.
  - `manifest.ts` — SHA256(source) + SHA256(prompt) per file per locale. Re-runs
    with unchanged inputs produce zero API calls.
  - `run.ts` — CLI: 5 structural retries with temperature ramp (0.2 → 0.65) to
    handle stubborn key-rename hallucinations.

- **`scripts/translate/prompts/system.is.md`** — locked verbatim Icelandic system
  prompt from the mission brief (four strict rules: JSON integrity, academic
  register with `f.Kr.` / `e.Kr.`, canonical Icelandic names and toponyms, no
  Markdown fencing). Pinned by content-hash in the manifest so any edit
  invalidates the entire locale cache.

- **`scripts/translate/glossary.json`** — `DO_NOT_TRANSLATE` + fixed Icelandic
  translations (`Antiquities of the Jews` → `Fornsögur Gyðinga`, `BCE` → `f.Kr.`,
  etc.). Surfaced to the model in the user message, never modifies the locked
  system prompt.

- **`frontend/scripts/aggregate-data.mjs`** — extended to scan
  `outputs/translations/<locale>/` and emit per-locale chunk trees at
  `frontend/public/data/<locale>/{chunks,manifest.json}`. Missing-locale years
  fall back to English with a `_locale_fallback: "en"` marker so the UI never
  sees a hole in the timeline. English path `/data/` remains byte-compatible.

- **`frontend/src/i18n/`** — scaffold:
  - `index.ts` — `Locale` type, `hasLocale()` typeguard, `getDictionary()` loader,
    `localeDataPath()` helper.
  - `dictionaries/en.json` and `dictionaries/is.json` — user-facing labels
    (categories, certainties, doc levels, era names, chrome, year-page chrome).
    Native-speaker-authored, not machine-translated, for standard chrome strings.

- **`frontend/src/lib/data.ts`** — additive `fetchManifestForLocale` /
  `fetchChunkForLocale` / `fetchAllYearsForLocale`. Existing call sites untouched.

- **`.github/workflows/translate-is.yml`** — on push to `main` touching
  `outputs/json/**` or `scripts/translate/**`, runs the IS pipeline (manifest
  skips cached files), re-aggregates frontend chunks, opens a PR via
  peter-evans/create-pull-request@v7. `workflow_dispatch` supports a
  `reset_manifest` flag for forced full re-translation. Concurrency group
  prevents overlapping runs.

### Correctness guards (belt-and-suspenders-and-belt)

Every translated file must pass **all six** before being written:

1. Locked verbatim Icelandic prompt (rule #1: translate values only, keep keys
   in English).
2. Glossary preamble in user message listing every JSON key + every enum value.
3. API-level `responseMimeType: "application/json"` forcing strict JSON output.
4. Structural diff rejecting any file where keys, enums, IDs, numerics, or
   array lengths differ from source.
5. Ajv schema validator rejecting any file that breaks ICCRA.
6. Atomic `.tmp` → `rename` ensuring no partial writes ever land on disk.

If any guard trips, the file is **not written** and the failure is logged. The
manifest only records successful writes, so failures are retried on next run.

### Sample quality (commander-approved)

Three files committed to `outputs/translations/is/` on the feature branch as
dry-run proof: `-1.json` (2 BCE), `0.json` (1 BCE / 1 CE boundary),
`2022.json`, `2024.json`, `2025.json`. Highlights:

- `"Augustus"` → `"Ágústus"`, `"Herod the Great"` → `"Heródes mikli"`,
  `"Parthian Empire"` → `"Parþaveldið"`, `"Silk Road"` → `"Silkivegurinn"` —
  canonical Icelandic forms.
- `"Res Gestae Divi Augusti"` preserved verbatim (Latin work title).
- `"Han Shu"` → `"Han Shu (Bók Han-veldisins)"` — descriptive parenthetical
  translated, original title preserved.
- Every ICCRA enum (`political`, `confirmed`, `archaeological`,
  `contemporary_with`, …) preserved byte-identical.
- `„Pax Romana"` rendered with correct Icelandic typographic quotes.

### Anti-patterns caught and fixed in flight

- **Model misspelled an enum** (`archaeological` → `archological`): structural
  diff caught it, refused to write, retry with temperature bump succeeded.
- **Model translated the KEY `certainty` → `certain`** (Icelandic adjective): 5
  structural retries with temperature ramp resolved the loop; reinforced by
  adding an explicit all-keys list to the user-message preamble.
- **`cross_references` carrying English parentheticals** (e.g.
  `"2014-001 (Russian annexation of Crimea)"`): initial diff guard was too
  strict and flagged valid translations. Relaxed to ID-prefix match, allowing
  the descriptive annotation to localize.
- **Model hitting output-token limits on 35 KB year files**: bumped
  `maxOutputTokens` to 65 536 and added JSON-truncation error patterns
  (`Unterminated string`, `Expected ',' or '}'`) to the retry matcher.
- **`.env` not gitignored** (live exposure at repo root): added `.env` +
  `.env.local` to `.gitignore` before first run; verified never committed via
  `git log --all -- .env`.

### Git state (translation strand)

```
$ git log --oneline origin/main -5
ff7c4b4  feat(translate): IS pipeline + 3-file dry-run + i18n scaffold + GH Action (#2 squash)
ed3c4f7  docs: MIT license + README rewrite — frontend v0.2 Notebook + Layer 2 evidence
0138c07  feat(og): proper Open Graph + Twitter card matching Notebook folio
a8670a6  refactor(shell): two-layer nav + /atlas route + home lands on timeline
9202381  fix(globe): 'blue on blue' — heading color was inheriting Notebook indigo
```

- **Branch**: merged; `feat/translation-pipeline-is` preserved for reference.
- **Workflow run**: https://github.com/Magnussmari/Human_history_Acording_to_AI/actions/runs/24612626420
- **Repo secret `GOOGLE_AI_API_KEY`**: set via `gh secret set`.

### What's next for the translation strand

- **F11b (follow-up session required)** — `app/[lang]/` route restructure using
  Next 16's native `[lang]` pattern + `hasLocale()` typeguard + dictionary
  loader. UI testing in a browser is prerequisite; deferred from this session.
- **F12b** — swap hardcoded English strings in `src/app/` and `src/components/`
  with `getDictionary(locale).chrome.*` lookups after the `[lang]` restructure.
- **Locale switcher** — header component reading / writing the `[lang]` segment,
  honoring `Accept-Language` as first-visit default.
- **Italian (IT) locale** — intentionally skipped this session per commander
  direction; architecture already supports it (`localeDataPath('it')`,
  aggregator auto-discovers `outputs/translations/it/`, same pipeline with a
  fresh Italian-composed system prompt).

### Outstanding for commander

- Rotate the `GOOGLE_AI_API_KEY` after the full backfill completes (local `.env`
  exposure earlier in session; not committed, only shown in bash output).
- Eyeball the committed IS samples in `outputs/translations/is/` (`-1.json`
  already reviewed and approved).
- Review the bot-opened PR once the GH Action finishes the 5,226-file backfill.
- Schedule a dedicated session for the `app/[lang]/` route restructure with
  browser-based UI verification.

---

*Status updated 2026-04-18 evening. Translation layer pipeline shipped;
full IS backfill running on GitHub Actions.*
