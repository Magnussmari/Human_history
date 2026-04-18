# Mission — Notebook Rebuild (Field Notebook / Variant A)

**Branch:** `frontend-rebuild`
**Started:** 2026-04-18
**Orchestrator:** Magnus Smárason | smarason.is
**Authority:** autonomous; user unavailable during execution.

## Intent

Replace the dark-gold "ETERNAL CODEX" grimoire aesthetic with the **Field Notebook** editorial direction as the canonical reading experience. Notebook is the primary surface; Stratum is a secondary data-dashboard view scaffolded behind the variant switcher; Atlas = the already-shipped S-tier Globe (Map view), chrome retokenized to match. No gold remnants anywhere a user can reach.

## Design tokens (source of truth: prototype `styles.css` + `variants.css`)

Variant A (Notebook) — cream parchment, deep indigo ink, oxblood accent, serif editorial body.
- `--bg` `#f4ede0` / `--bg-2` `#ece3d1` / `--paper-line` `rgba(33,40,65,0.08)`
- `--fg` `#161b2e` / `--fg-2` `#3a4058` / `--fg-mute` `#73788b` / `--rule` `#241c18`
- `--accent` `oklch(0.50 0.14 var(--accent-h))` (h default 20) / `--stamp` `#8a2b22`
- `--card` `#faf5e9`
- `--font-body` Newsreader (serif); `--font-sans` Inter Tight; `--font-mono` IBM Plex Mono / JetBrains Mono

Variant B (Stratum) — near-black instrumented dashboard.
- `--bg` `#0d0f12` / `--fg` `#e9ecef` / `--accent` `oklch(0.82 0.17 var(--accent-h))`

Variant C (Atlas) — teal-ink map ground (already live; retokenize chrome only).

## Features (JSON)

```json
[
  {
    "id": "F-01",
    "name": "Install Notebook typography",
    "acceptance": "Newsreader, Inter Tight, IBM Plex Mono wired via next/font and exposed as --font-newsreader, --font-inter-tight, --font-plex-mono; old --font-heading / --font-geist-sans / --font-geist-mono still resolve.",
    "depends_on": []
  },
  {
    "id": "F-02",
    "name": "Port variant token system",
    "acceptance": "globals.css rewritten: root defaults to Notebook (variant A). body.variant-b swaps to Stratum; body.variant-c swaps to Atlas. All --gold/--crimson/--cyan-glow tokens deleted. shimmer/glow keyframes deleted. noise-texture body background deleted. Tailwind @theme inline points at new tokens. Build green.",
    "depends_on": ["F-01"]
  },
  {
    "id": "F-03",
    "name": "Shared Shell — Chronograph chrome",
    "acceptance": "Fixed top bar with Chronograph brand / variant switcher (Notebook · Stratum · Atlas) / load meta. Drives body class. Replaces the current page header block in layout.tsx. Rendered on home, year, era, methodology.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-04",
    "name": "Notebook Hero (folio masthead)",
    "acceptance": "Home page hero replaced with VAHero idiom: FOLIO stamp, VOL. I / ENTRY / year-count, oversized display year label, editor's note sidenote. Gold button gone. Cream paper background with ruled lines visible. No dark surfaces.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-05",
    "name": "Notebook Timeline (ol-entries)",
    "acceptance": "TimelineView rendered as ordered list of VAEntry rows with indexed rail + oxblood dot + folio typography. Existing virtualization preserved. CertaintyStamp replaces CertaintyIndicator. Contemporary/later source bar renders. Click → expand inline.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-06",
    "name": "Year folio — /year/[id]",
    "acceptance": "Full folio layout: VAHero + VAEra + VATimeline + VADissent (§ 02/§ 03 disconfirming + historiographic) + VAFooter. Replaces existing year detail page end-to-end. No gold. Graph view (if present) retokenized or removed.",
    "depends_on": ["F-05"]
  },
  {
    "id": "F-07",
    "name": "Retokenize reading-shell components",
    "acceptance": "FilterPanel, SearchCommand, ViewToggle, EraNav, ScholarlyEraPillRow, ScholarlyEraCard, ProgressBanner, ProgressRing, EducationPanel, ScholarlyDebatePanel, EvidenceTable, ContestedClaimsList, CapacityGrid, FontSizeControl, ThemeToggle: all hard-coded hex and var(--gold) removed; only shared tokens used. Visually coherent with Notebook.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-08",
    "name": "Globe chrome retokenize",
    "acceptance": "GlobeAtlas outer shell uses shared tokens; its internal --gs-* map tokens remain (intentional dark starfield). Outer border, chrome rail, and surrounding chrome consistent with Notebook page shell. No gold.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-09",
    "name": "Stratum secondary view scaffold",
    "acceptance": "/stratum route or in-page variant B mounting that renders VB idiom: year ribbon, year header + docbars, stats (category chips + certainty chart), VB event cards. Reads from same data layer. Tokenized — no gold. Reachable from the shell variant switcher.",
    "depends_on": ["F-02", "F-07"]
  },
  {
    "id": "F-10",
    "name": "Methodology pages retokenize",
    "acceptance": "/methodology and /methodology/scite-mcp restyled to Notebook (§ section heads, serif display, paper bg). Data tables preserved. Gold removed.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-11",
    "name": "Era page retokenize",
    "acceptance": "/era/[id] renders in Notebook idiom. Era badge colors remapped to stamp accent or kept only as semantic chips.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-12",
    "name": "Global chrome — layout / error / not-found / loading",
    "acceptance": "layout.tsx footer and any error/404/loading states use shared tokens. No gold. Serif display, paper surfaces.",
    "depends_on": ["F-02"]
  },
  {
    "id": "F-13",
    "name": "Excision audit",
    "acceptance": "grep for '--gold', 'e8c88a', 'c9a66b', 'shimmer-text', 'glow-title', 'glow-border', 'gold-button', 'ETERNAL', 'crimson', 'cyan-glow', 'parchment-card', 'noise-opacity' returns 0 hits in src/**. MISSION_LOG documents excision counts.",
    "depends_on": ["F-03", "F-04", "F-05", "F-06", "F-07", "F-08", "F-10", "F-11", "F-12"]
  },
  {
    "id": "F-14",
    "name": "Build + lint green",
    "acceptance": "npm run build and npm run lint both exit 0 for changed files. Any pre-existing errors in unchanged files documented.",
    "depends_on": ["F-13"]
  }
]
```

## Launch sequence

1. F-01 (fonts)
2. F-02 (tokens + variant swap)
3. F-03 (shell chrome) — unlocks navigation-level coherence
4. F-04, F-05 in parallel (hero + timeline — both read from same filteredYears)
5. F-06 (year folio)
6. F-07 (component retokenization)
7. F-08 (globe chrome)
8. F-09 (Stratum scaffold)
9. F-10, F-11, F-12 (methodology / era / layout shell)
10. F-13 (excision audit)
11. F-14 (build + lint)

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Tailwind v4 @theme inline breaks when we swap token semantics | Keep new var names additive; update @theme inline last; run build after each feature. |
| Legacy components use motion.div with style={{background: "var(--gold)"}} inline — many touch points | Tokenize via single find-replace `var(--gold)` → `var(--stamp)`; visual check on each component. |
| CertaintyIndicator / YearCard have complex conditional styling | Replace wholesale rather than patch; keeps diff auditable. |
| Virtualization (react-virtual) in TimelineView may break with new row heights | Update estimateSize when porting; re-measure. |
| Three-strike rule — one component refuses to cooperate | Revert that file, log, move on. |
| Body class binding (body.variant-a) clashes with Next.js SSR hydration | Attach class in `layout.tsx` root body, flip via client effect with suppressHydrationWarning. |

## Execution rules (per user mission briefing)

- One feature at a time, atomic commit per feature, then next.
- No stubs / TODOs / "coming soon" panels.
- All color, type, spacing through shared tokens. No hardcoded hex in components.
- Do not touch Globe data layer; chrome retokenize only.
- Escalate only on contradictions / data-layer required / globe core changes. Log + continue otherwise.
