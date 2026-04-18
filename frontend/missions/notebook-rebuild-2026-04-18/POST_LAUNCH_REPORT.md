# Post-Launch Report — Notebook Rebuild

**Mission:** Replace "ETERNAL CODEX" grimoire aesthetic with Field Notebook (Variant A) as canonical reading experience; Stratum (Variant B) scaffolded as secondary view; Atlas/Globe (Variant C) retained and theme-harmonised.
**Branch:** `frontend-rebuild` · **Completed:** 2026-04-18 (autonomous run)
**Commits:** 14 features + 1 QA fix, atomic, in order; branch has not been merged.

## Feature status

| ID | Feature | Status | Commit |
|---|---|---|---|
| F-01 | Notebook typography (Newsreader / Inter Tight / IBM Plex Mono) | ✅ | `2a1da23` |
| F-02 | Variant token system (Notebook default; Stratum + Atlas via body class) | ✅ | `1c93ea5` |
| F-03 | Shared Chronograph shell — top bar, variant switcher, editorial footer | ✅ | `a4fcdd5` |
| F-04 | Notebook hero (folio masthead) | ✅ | `9be6be8` |
| F-05 | Notebook timeline (virtualised folio rows) | ✅ | `a24faa4` |
| F-06 | Year folio `/year/[id]` (full § layout) | ✅ | `14be359` |
| F-07 | Retokenise reading-shell components | ✅ | `80d6727` |
| F-08 | Globe chrome tokenised | ✅ | `d78c04a` |
| F-09 | Stratum scaffold (`/stratum`) | ✅ | `440568c` |
| F-10 | Methodology pages (atlas-token aliasing) | ✅ | `c2d26d6` |
| F-11 | Era sub-panels retokenised (ScholarlyDebate + Education) | ✅ | `84cc316` |
| F-12 | Loading / error / not-found / icons | ✅ | `a00949f` |
| F-13 | Excision audit — zero gold remnants | ✅ | `95a76f8` |
| F-14 | Build + lint green | ✅ | verified in `95a76f8` |
| QA-01 | Atlas view does not swap entire page dark | ✅ | `9264432` |

`npm run build` → **exit 0** · `npm run lint` → **exit 0** · `npx tsc --noEmit` → **exit 0**

## Deviations from plan

1. **Era sub-panels (ContestedClaimsList / EvidenceTable / CapacityGrid / EducationSkeleton / CertaintyIndicator / CitationChip) were NOT individually retokenised.** They use Tailwind utility classes (`bg-muted/50`, `text-foreground/80`, `border-border`) which now resolve through the remapped `@theme inline` — so visually they already consume Notebook tokens. Only components with hard-coded hex or `var(--gold)` were rewritten (ScholarlyDebatePanel, EducationPanel). Rationale: the Tailwind token indirection was already doing the job; rewriting untouched files would have been churn.

2. **Graph view was deleted, not retokenised.** The mission says "no stubs / 'coming soon' panels". The Graph view was a `"coming soon"` placeholder. Removing it — including the "Graph" button on the ViewToggle — keeps the mission constraint intact. If a graph layer is needed later, it's a new feature.

3. **Stratum was shipped at `/stratum`, not as an in-page variant.** The prototype's three variants rendered the same year on the same page. In this project the three variants have distinct data needs (Notebook = full corpus read, Stratum = single-year instrument, Atlas = spatial). Making Stratum a route keeps each variant's URL addressable and keeps the shell's variant buttons acting as navigation, not just CSS theme swaps. The prototype's `body.variant-b` body class IS bound while `/stratum` is mounted, so the token swap remains the same semantic.

4. **YearCard → NotebookYearRow replacement pulled in era/[id] retokenisation.** The era page's `YearCard` grid broke the moment `YearCard.tsx` was deleted in F-07. Rather than ship half-retokenised era page, F-07 included the full era-page rewrite (which was the original F-11 scope). F-11 itself then only had to address the sub-panels.

5. **Atlas variant (Variant C) intentionally does NOT own the page body.** The prototype's `body.variant-c` swapped the whole page to teal-ink dark ground. QA flagged this as "dark takeover" — the user is still on the home page when they click Globe, only the view toggle flipped. The shell now distinguishes `bodyVariant` (drives token swaps — stays "a" on `/?view=map`) from `activeVariant` (drives the switcher highlight — reports "c" when the globe is open). The globe's own internal map palette stays dark; the surrounding parchment stays cream. This is a conscious deviation from the prototype that keeps the aesthetic coherent.

6. **`src/design/tokens.css`** — kept as an aliasing layer that points `--atlas-parchment/ink/oxblood/leaf` at the new semantic Notebook tokens, so the Methodology page's Editorial / Monument / MarginNote / ProvenanceStrip primitives needed zero code changes. Simpler than rewriting the methodology pages.

## Observable-behaviour descriptions

### Home (`/`)
- Cream parchment (`#f4ede0`) with faint horizontal ruled lines (31px repeating `rgba(33,40,65,0.08)`).
- Top bar: oxblood square dot + "Chronograph · Human History According to AI"; Methodology link; variant switcher [Notebook · Stratum · Atlas] with Notebook active.
- Hero: slightly rotated oxblood FOLIO stamp, "Vol. I · N of 5,226 entries filed" mono eyebrow, huge Newsreader "Human History" with italic "according to AI" subtitle, dense lede with span figure highlighted in oxblood, italic "Editor's note" sidenote right-hand column, 3-stat DL strip (Entries filed / Events documented / Span) bracketed by double-then-single rule, solid dark-ink "Open the folio" CTA, underline-hover GitHub link.
- Timeline section below: "§ Timeline" oxblood mono eyebrow, serif "The folio, chronologically" display heading, search box + filter button (oxblood count badge) + [Timeline / Globe] pill group (no Graph pill), uppercase mono era pill row ("All Eras / Modern / Industrial / …"), scholarly-era drill-down pill row.
- Entry rows: 78px rail (year num + BCE/CE lockup + oxblood dot + five stacked doc-bars), eyebrow "Modern · 3 events · 5 sources", serif display headline, category swatch list. Hairline border-bottom separator. Group rule above each new era/decade window ("Classical · 300 BCE" in oxblood mono, rule growing left-to-right on scroll).
- Editorial footer: triple-ruled, italic "Chronograph" wordmark, credits + Source/Corpus + Contribute links underlined on hover, right-aligned mono "Vol. I · 5,226 entries" + "Claude Sonnet 4.6 · ICCRA schema · open source" colophon.

### Year folio (`/year/[id]`)
- FOLIO stamp + "Vol. I · Entry NNNN / 5,226" ordinal.
- Oversized italic year number in Newsreader display; "BCE" or "CE" raised as small-caps sans next to it.
- Hero meta row: era label in oxblood caps, event count, doc level, source count.
- "Editor's note" italic sidenote in the right column (collapses under the content at ≤1260px).
- Double-rule + ERA CONTEXT oxblood caps, serif era body, coverage-gap dashed chips.
- ScholarlyEraCard anchored underneath with oxblood "Scholarly era" eyebrow, serif display name, phase-tone dot, verdict pill, "View full evidence →" right-aligned stamp.
- § 01 Events: indexed 56px rail (dossier number + category-tinted dot), serif display headline, contempo/later source bar (oxblood / muted grey), 4-dot certainty stamp, "Unfold ↓" toggle. Expand reveals parchment card with key figures chips + numbered sources (numbered footnote-style + contemporary tag) + certainty note italic.
- § 02 Disconfirming evidence: ¶ pilcrow + italic serif.
- § 03 Historiographic note: same structure.
- § 04 Cross-year connections: mono chips linking to other folios.
- Triple-ruled end-of-entry footer with research metadata in mono.

### Globe (`/?view=map`)
- Page shell stays cream.
- Globe container (12vh tall, min 600px) border + radius + shadow drawn with shared tokens; cream sits around it.
- Sphere surface stays dark teal (intentional — reads as astronomical plate).
- HUD chips pull shared-token vars for font stacks.
- URL in sync; clicking Atlas in the shell sets `?view=map`; Atlas pill shows as active while body stays variant-a.

### Stratum (`/stratum`)
- Body class swaps to `variant-b` on mount — near-black `#0d0f12` with an electric orange signal accent.
- Ribbon: mono "Stratum · instrument view" label, year count, 56px bar with dashed ±500yr ticks, 60 sampled pins, selected-year highlighted with glow halo and display-label below, prev/next buttons walking adjacent researched years, free-form jump input ("1492" / "776 BCE") snapping to nearest researched year.
- Year header: "Year" mono label → big display number; "Documentation" mono label → 4-bar docmeter + level word; "Era context" → serif short summary.
- 3-panel stats card in `var(--bg-2)` surround: events count with category chips (OKLCH-tinted by category), certainty distribution bar chart (5 rows, coloured per level), source-mix contemporary-vs-later stacked bar.
- Event grid: auto-fill 340px minimum, category-rail on the left of each card, mono id + category eyebrow, serif title, region mono, 2-line description, dashed separator + certainty 4-bar meter + source 2-colour bar; click to expand key figures + sources.
- Dissent cards (disconfirming evidence + historiographic note) at the bottom.

### Methodology (`/methodology`)
- Cream parchment, Newsreader display H1 "How this was made, and what to distrust.", "01 · Thesis / 02 · …" numbered sections (kept prototype convention rather than "§ NN"), margin notes in right column, oxblood Monument numbers, inline code chips oxblood on bg-2.

### Errata / Unfiled
- `/nothing-here` → "Unfiled" stamp + giant italic "404" in Newsreader + "This page has no entry in the folio." serif line + "Back to timeline" oxblood CTA. All cream.

## Verification checklist (browser-observable)

Run each step at http://localhost:3000 (or any deploy of this branch). Each check is a visible yes/no.

### A. Every surface looks like Notebook, not grimoire
1. Visit `/`. Body background should be cream (#f4ede0 area around 244/237/224). Not black.
2. Top bar should display "Chronograph · Human History According to AI" — NOT "ETERNAL CODEX".
3. Hero headline should read "Human History / *according to AI*" in italic serif — NOT a giant glowing "ETERNAL / CODEX" wordmark.
4. CTA should be a solid dark-ink rectangle labelled "Open the folio". Not a gold-outline glass button.
5. DevTools → Elements → `<body>` → inspect `--bg`: resolves to `#f4ede0`. Search computed styles for `#e8c88a` or `#c9a66b` — zero hits.
6. Scroll through the timeline. Year rows should be hairline-ruled with small oxblood dots. No gold gradient line down the side.

### B. The variant switcher works
1. Click "Stratum" in the top-right nav → URL becomes `/stratum`. Page background turns near-black. Orange accent on the active button. A year ribbon appears.
2. Click "Atlas" → URL becomes `/?view=map`. Page background stays cream. A dark globe appears within the cream parchment (not a full-page dark takeover).
3. Click "Notebook" → URL returns to `/`. Cream, timeline.

### C. Folio structure
1. From timeline, click any row. Navigate to `/year/NNNN`.
2. Top of page: slightly rotated oxblood "FOLIO" stamp + "Vol. I · Entry NNNN / 5,226".
3. Italic year number in serif display, very large.
4. "Editor's note" sidenote on the right (desktop).
5. Event entries with "Unfold ↓" toggles. Click → key figures chips + numbered sources with contemporary/later tags appear.
6. Scroll to bottom: triple-ruled "End of entry NNNN" + mono research metadata.

### D. Stratum instrument
1. At `/stratum`, click prev / next buttons → year changes. Ribbon pin follows.
2. Type "1492" in the jump field → snaps to 1492 CE on Enter. Event grid refreshes.
3. Click a card → key figures + source list expand.
4. Resize narrow — ribbon, stats, and event grid collapse gracefully.

### E. Shell ends
1. Visit `/whatever-nothing-here` → "Unfiled" stamp + giant italic 404 + serif line. No gold.
2. Break something that throws in a client component → "Errata" stamp + Try-again CTA. No gold.
3. Network throttle the home page → cream skeleton with FOLIO stamp + ruled shimmer rows.

### F. Grimoire-excision proof
1. DevTools → Elements → `<head>` → `<style>` blocks — search for literal strings: `"--gold"`, `"e8c88a"`, `"c9a66b"`, `"rgba(232"`, `"glow-title"`, `"shimmer-text"`, `"gold-button"`, `"glass-card"`, `"glass-panel"`, `"parchment-card"`, `"ETERNAL CODEX"`, `"cat-dot-"`, `"era-modern"`, `"crimson"`, `"cyan-glow"`, `"noise-opacity"`, `"timeline-dot"`, `"chevron-bounce"`. **Zero hits for any of them.**
2. View-source any page. No `class="glow-title"` or `class="gold-button"` or `class="glass-card"`.
3. App icon and apple-touch icon render on a cream rectangle with a deep-ink book silhouette and oxblood spine; "CG" monogram, not "EC".

### G. Console
Open DevTools console on `/`, `/stratum`, `/?view=map`, `/year/1066`, `/methodology`, and a random 404. No red errors, no React hydration warnings, no "undefined CSS variable" warnings.

## Grimoire remnants — excision proof

Full `rg` sweep of `src/` for every gold / grimoire token at the end of F-13:

```
var(--gold)          0 hits
--gold:              0 hits
#e8c88a              0 hits
#c9a66b              0 hits
rgba(232,200,138     0 hits
glow-title           0 hits
shimmer-text         0 hits
gold-button          0 hits
glass-card           0 hits
glass-panel          0 hits
parchment-card       0 hits
ETERNAL CODEX        0 hits
Eternal Codex        0 hits
cat-dot-             0 hits
era-modern           0 hits
era-medieval         0 hits
(etc — all era class maps deleted)
crimson              0 hits
cyan-glow            0 hits
noise-opacity        0 hits
timeline-dot         0 hits
chevron-bounce       0 hits
```

(One token use of `rgba(232, 221, 196, 0.1)` in globals.css variant-c `--rule-soft` remains — **that is the Atlas variant's ink colour, not gold.** It's a different channel set: 232/221/196 = parchment, not gold 232/200/138.)

## Known gaps + recommended follow-up mission

1. **Sub-panels in era page visually "acceptable but not pixel-perfect."** ContestedClaimsList / EvidenceTable / CapacityGrid / EducationSkeleton / CertaintyIndicator / CitationChip consume Tailwind utilities which now resolve via remapped `@theme inline` tokens — they don't visually clash, but they don't yet use the Notebook folio typography ladder. Follow-up: write a "notebook-prose" class and hoist these panels onto it.

2. **Methodology page section headings use "01 · Thesis" not "§ 01 Thesis".** Minor copy deviation from the Notebook prototype's § convention. Follow-up (if desired): a one-line string swap in the `Section eyebrow=` props.

3. **Toolbar / SearchCommand / FilterPanel do not yet respect the `variant-b` token swap when reached from `/stratum`**. They *will* render in Stratum's palette (via `@theme inline` remapping) if mounted there, but the home page is the only route that mounts them. This is not a bug so much as an opportunity to let search from anywhere.

4. **Tweaks panel (accent-hue slider, certainty-meter toggle, disconfirming-evidence toggle) was NOT ported.** The prototype had it; this rebuild kept the shell lean by elevating variant switching into the chrome directly. If a user control surface is wanted, the follow-up is to add a `/settings` route or a floating tweaks button.

5. **No e2e Playwright regression suite yet.** QATester ran a live browser audit and all seven major surfaces verified clean; a persisted Playwright suite would guard against regressions going forward.

## Artefacts

- `missions/notebook-rebuild-2026-04-18/MISSION_PLAN.md` — 14-feature plan as JSON + risk register.
- `missions/notebook-rebuild-2026-04-18/MISSION_LOG.md` — append-only execution log (bootstrap entry only — telemetry mostly lived in commit messages).
- `missions/notebook-rebuild-2026-04-18/POST_LAUNCH_REPORT.md` — this file.
- 15 atomic commits on `frontend-rebuild`, each with a clear scope message.
- `npm run build` green, `npm run lint` green, `npx tsc --noEmit` green.
