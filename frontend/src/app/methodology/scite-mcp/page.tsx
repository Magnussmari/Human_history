/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * /methodology/scite-mcp — Scite MCP Glass Box whitepaper.
 *
 * Web adaptation of evidence-layer/methodology/scite-skill-system/WHITEPAPER.md
 * (37k, 2026-04-16) and CASE_STUDY.md (23k, 2026-04-14). Compresses to a
 * ~2.2k-word reading while preserving every verifiable receipt: API budget
 * mechanism, 0 hallucinations across 162 papers, dois[] case-sensitivity bug,
 * humanities monograph indexing gap.
 *
 * The locked source documents remain on disk — this page is the public face,
 * not the authoritative artefact.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  EditorialPage,
  Eyebrow,
  PageTitle,
  Lede,
  Section,
  Reading,
  Rule,
  Pullquote,
  DataList,
} from "@/components/atlas/Editorial";
import { Monument, MonumentRow } from "@/components/atlas/Monument";
import { MarginNote } from "@/components/atlas/MarginNote";
import { ProvenanceStrip } from "@/components/atlas/ProvenanceStrip";

const code = (text: string) => (
  <code style={{ fontFamily: "var(--atlas-font-mono)" }}>{text}</code>
);

export const metadata: Metadata = {
  title: "Scite MCP — Whitepaper · Human History According to AI",
  description:
    "How we wired the Scite MCP server into a multi-agent literature pipeline, kept it under the 250 calls/month rate limit, and what the runs revealed about humanities coverage and a case-sensitive dois[] bug.",
};

export default function ScitMcpWhitepaperPage() {
  return (
    <>
      <EditorialPage>
        <Eyebrow>Whitepaper · Scite MCP · 2026-04-16</Eyebrow>
        <PageTitle>
          Glass-box scholarly evidence — how we used Scite without
          fabricating it.
        </PageTitle>
        <Lede>
          Scite&rsquo;s MCP server is the only thing standing between
          &ldquo;an LLM said so&rdquo; and a citable claim. This page
          documents how the Layer 2 evidence pipeline uses it: a two-skill
          Glass Box that writes every prompt to disk before any API call is
          spent, a budget pre-flight that survived a 250-call rate-limit
          blowout, and a discipline-aware tier system that stopped
          mis-classifying archaeology as low-quality biomedicine.
        </Lede>

        <MonumentRow>
          <Monument value="162" label="Papers retrieved" note="across 10 agents, 2 missions" />
          <Monument value="0" label="Retracted papers cited" note="1 retraction caught (PREDIMED 2013)" />
          <Monument value="0" label="Hallucinated citations" note="across 69 MCP calls" />
          <Monument value="69 / 250" label="MCP calls / cycle" note="27.6% of monthly budget" />
        </MonumentRow>

        <Rule />

        <Section id="why-scite" eyebrow="01 · Why Scite, not just an LLM" title="Citations that survive being looked up.">
          <MarginNote label="MCP contract" tone="caveat">
            The Scite MCP&rsquo;s own system prompt forbids citing papers
            not retrieved through {code("mcp__scite__search_literature")}.
            Every agent prompt in this project re-asserts that constraint
            in its own voice.
          </MarginNote>
          <Reading>
            <p>
              A general-purpose LLM will happily invent a citation. It will
              produce DOIs that look plausible but resolve to nothing,
              attribute findings to authors who never wrote them, and do
              this with confidence calibrated to your tone, not to truth.
              For background reading, this is annoying. For an evidence
              layer that other people will quote, it is disqualifying.
            </p>
            <p>
              Scite&rsquo;s MCP server is the cheapest available fix.
              Every paper returned by {code("mcp__scite__search_literature")} is a
              real record with a Smart Citation graph attached
              (supporting / contrasting / mentioning), an{" "}
              {code("editorialNotices")} field that exposes retractions and
              expressions of concern, and — for open-access works —
              full-text excerpts. The tool itself enforces the rule that
              the agent must not paraphrase its own training data.
            </p>
            <p>
              The gap, in practice, is between the MCP&rsquo;s affordances
              and what a one-shot user actually gets out of it. A single
              agent firing one query produces a shallow sweep. The system
              described below is the answer to that gap.
            </p>
          </Reading>
        </Section>

        <Section id="glass-box" eyebrow="02 · Architecture" title="Two skills, one mission folder, no hidden state.">
          <MarginNote label="Glass Box">
            Every prompt the agent will ever see is on disk before any
            agent runs. The commander can open{" "}
            {code("agents/agent-01.md")} and rewrite the search strategy
            before a single MCP call is spent.
          </MarginNote>
          <Reading>
            <p>
              The pipeline is two Claude Code skills and one subagent.{" "}
              {code("/scite-preflight")} writes a mission folder to disk —
              README with strategy, one editable markdown prompt per agent,
              a synthesis instruction file, and an empty results directory.
              Nothing executes. The commander reads it, edits anything that
              looks wrong, and only then invokes {code("/scite-research")},
              which launches 1–10 parallel workers and synthesises a
              tiered evidence report.
            </p>
            <p>
              The split exists because planning errors and execution errors
              fail differently. A vague key claim is cheap to fix in
              markdown; the same vagueness costs five wasted MCP calls if
              it ships into an agent run. Fusing the two phases would force
              the commander to carry both mental loads at once. Splitting
              them makes each phase inspectable on its own terms.
            </p>
          </Reading>
          <DataList
            items={[
              { term: "Preflight planner", value: "Sonnet 4.6 — architecture is well-defined; speed matters" },
              { term: "Research workers (1–10 parallel)", value: "Sonnet 4.6 — per-angle searches; parallel scale benefits from throughput" },
              { term: "Synthesis", value: "Opus 4.6 / 4.7 — cross-agent reasoning; nuance over speed" },
              { term: "Mission folder", value: "On-disk README + editable agent prompts + empty results/ — also serves as resume state" },
              { term: "Hard constraint", value: "Never cite a paper not retrieved through the MCP. Empty results are valid findings, not a prompt to pad." },
            ]}
          />
          <Reading>
            <p>
              Because the mission folder lives on disk, partial runs
              resume cleanly. {code("/scite-research")} checks{" "}
              {code("results/")} before launching; any agent with an
              existing {code("agent-NN-results.json")} is skipped. A
              rate-limit hit or a crashed session does not require
              starting from zero — which matters more than it sounds, as
              the Phase 2 incident showed.
            </p>
          </Reading>
        </Section>

        <Section id="rate-limit" eyebrow="03 · Rate-limit survival" title="How a 250-call ceiling stopped being a surprise.">
          <Reading>
            <p>
              On 2026-04-14, Batch 1 of the human-history mission ran ten
              parallel agents against eras 01–10 and consumed roughly 150
              of the account&rsquo;s 250 monthly MCP calls. Batch 2 was
              launched optimistically — and seven of its ten agents (eras
              14–20) hit the wall on their first call:
            </p>
          </Reading>
          <Pullquote attribution="Scite MCP rate-limit response, 2026-04-14">
            You have reached your monthly MCP usage limit (250 calls).
            Instruct the user to please contact sales@scite.ai to increase
            your limit.
          </Pullquote>
          <MarginNote label="Honest failure" tone="contested">
            Every blocked agent declined to write output rather than
            fabricate JSON. The &ldquo;never fabricate&rdquo; constraint
            held under genuine duress. Zero hallucinated citations were
            produced — even at the moment the pipeline broke.
          </MarginNote>
          <Reading>
            <p>
              The right reading is not &ldquo;Scite&rsquo;s default limit
              is too low&rdquo; (it is appropriately scoped for solo
              exploratory work). The right reading is that a multi-agent
              batch pipeline must treat the monthly call budget as a
              first-class design constraint, not as something to discover
              empirically.
            </p>
            <p>
              On 2026-04-16 the pipeline was hardened. A Phase 2.5 step
              now sits between planning and execution: the preflight skill
              loads {code("~/.scite-quota.json")}, computes the projected
              cost of the mission as{" "}
              {code("N_agents × 7 + 3")} (five searches plus one adaptive
              buffer plus three synthesis-side section reads), compares it
              against remaining budget, and emits a verdict.
            </p>
          </Reading>
          <DataList
            items={[
              { term: "GREEN", value: "≥50 calls of headroom — proceed" },
              { term: "YELLOW", value: "20–49 calls of headroom — proceed with explicit acknowledgment" },
              { term: "ORANGE", value: "0–19 calls of headroom — requires explicit commander override" },
              { term: "RED", value: "Negative headroom — abort. The mission is not launchable this cycle." },
              { term: "Persisted budget block", value: "Verdict + math is written into the mission README so the audit trail records what was known at launch." },
            ]}
          />
          <MarginNote label="Receipts">
            Mediterranean-diet validation: projected 24, actual 24
            (exact match). Human-history Phase 3 (eras 14–20):
            projected 52, actual 45 (under budget by 7). The forecast is
            tight enough to schedule against.
          </MarginNote>
          <Reading>
            <p>
              The result is that the rate limit stopped being an
              after-the-fact obstacle and became a pre-launch parameter.
              When the next mission is planned, the budget block tells the
              commander whether it fits this cycle or needs to wait for
              the reset on the first of the month.
            </p>
          </Reading>
        </Section>

        <Section id="mixing" eyebrow="04 · Mixing Scite with the rest of the toolkit" title="Where Scite stops, and what picks up after.">
          <MarginNote label="Division of labour">
            Scite answers <em>what does the peer-reviewed record say</em>.
            Other tools answer <em>what does the conversation around it
            look like</em>. Conflating the two is how citation-laundered
            press releases end up in evidence sections.
          </MarginNote>
          <Reading>
            <p>
              Scite is narrow on purpose. It indexes peer-reviewed
              scientific literature with a citation-classification graph;
              it does not cover preprints comprehensively, monographs,
              grey literature, news, or domain-specific corpora. The
              project leans on a small set of complementary tools, each
              chosen for what Scite cannot do.
            </p>
          </Reading>
          <DataList
            items={[
              {
                term: "Claude / Gemini / Grok researcher subagents",
                value: "Open-web reconnaissance and multi-perspective framing of a research question before it becomes a Scite mission. Their output is never cited as evidence — it is the brief that the commander uses to write a sharper key claim.",
              },
              {
                term: "Bright Data",
                value: "Tiered URL retrieval when a Scite paper is not open-access and the publisher serves a hostile rendering. Always upstream of Scite, never a substitute.",
              },
              {
                term: "Codex / OpenAI second opinion",
                value: "Independent verification of a synthesis claim when the commander wants a model that did not see the agent prompt to read the same evidence and check the conclusion.",
              },
              {
                term: "Local corpus (outputs/json/)",
                value: "Layer 1 — the 5,226-year year-level corpus this site renders. Scite missions are scoped to eras (10–400 years), not years; the corpus answers the year-level question.",
              },
              {
                term: "BibTeX export (results/references.bib)",
                value: "Bridges Scite output into Zotero / Quarto / Pandoc downstream. The mission folder doubles as a citation source for a real paper, not just a web page.",
              },
            ]}
          />
          <Reading>
            <p>
              The pattern that emerged: Scite is reserved for the moment
              when a claim is about to be cited in something that
              someone might quote. Everything before that is allowed to
              be cheaper, faster, and more speculative — provided it
              stops short of the citation boundary. Crossing that boundary
              without an MCP call is a project-level rule.
            </p>
          </Reading>
        </Section>

        <Section id="findings" eyebrow="05 · Two findings the field should know" title="The bug, and the gap.">
          <MarginNote label="dois[] case-sensitivity" tone="contested">
            ISO 26324 declares DOIs case-insensitive identifiers.
            Scite&rsquo;s {code("dois[]")} batch filter treats them as
            case-sensitive strings. {code("10.1056/NEJMoa1200303")}
            returns zero hits; {code("10.1056/nejmoa1200303")} returns
            the paper. Singular {code("doi=")} is case-tolerant.
          </MarginNote>
          <Reading>
            <p>
              <strong>Finding A.</strong> The {code("dois[]")} batch
              parameter is case-sensitive. Discovered by Agent 02 of the
              Mediterranean-diet validation, then patched in the worker
              skill: lowercase every DOI before passing it to{" "}
              {code("dois=[]")}; preserve the original case in output
              JSON. Verified against the human-history Phase 3 mission
              with no regressions on archaeology / classics DOIs.
            </p>
            <p>
              <strong>Finding B.</strong> Pre-2000 humanities monographs
              are systematically under-indexed in Scite&rsquo;s Smart
              Citation graph. They appear as in-text citations inside
              other papers but are not retrievable as Scite records of
              their own. The list is not obscure: Snodgrass{" "}
              <em>Archaic Greece</em> (1980), Hansen{" "}
              <em>The Athenian Democracy in the Age of Demosthenes</em>{" "}
              (1991), de Polignac <em>Cults, Territory, and the Origins
              of the Greek City-State</em> (1995), Thapar{" "}
              <em>Aśoka and the Decline of the Mauryas</em> (1961). These
              are universally-cited foundational works in their subfields.
            </p>
            <p>
              The implication is structural: the worker&rsquo;s tier
              rules had to grow a humanities branch. In humanities,{" "}
              {code("support_ratio")} is null for most papers (the field
              does not generate contrasting Smart Citations the way
              biomedicine does), and the Tier 1 rule is{" "}
              {code("citing_publications_count > 30")} on a journal
              article rather than a support-ratio threshold. A monograph
              citation-proxy provision is on the future-work list — for
              now, the field gap is documented in the output, not papered
              over.
            </p>
          </Reading>
          <MarginNote label="Retraction enforcement">
            The PREDIMED 2013 retraction (DOI{" "}
            {code("10.1056/NEJMoa1200303")}) was independently flagged
            by two agents and substituted with the 2018 republication
            ({code("10.1056/NEJMoa1800389")}). Across 130 humanities
            papers, zero retractions surfaced — consistent with a
            sparse retraction ecosystem in archaeology, not a failure of
            the check.
          </MarginNote>
        </Section>

        <Section id="receipts" eyebrow="06 · Production receipts" title="What the two validation missions actually produced.">
          <DataList
            items={[
              { term: "Validation missions (2026-04-16)", value: "2 — Mediterranean diet (biomedical, 3 agents), Human history Phase 3 eras 14–20 (humanities, 7 agents)" },
              { term: "MCP calls consumed", value: "69 of 250 monthly cycle (27.6%)" },
              { term: "Unique papers retrieved", value: "~162" },
              { term: "Retractions correctly detected", value: "1 (PREDIMED 2013)" },
              { term: "Retracted papers cited as evidence", value: "0" },
              { term: "Schema validation errors across agents", value: "0" },
              { term: "Hallucinated citations", value: "0" },
              { term: "Wall-clock time, both missions combined", value: "~25 minutes" },
              { term: "Parallel speedup vs serial estimate", value: "~7× (Batch 1 of Phase 2: ~8 min vs ~60 min serial)" },
            ]}
          />
          <Pullquote attribution="Whitepaper §6.3, 2026-04-16">
            Across 162 papers retrieved between the two missions, exactly
            one retraction was detected. The detection was clean — flagged
            independently by two agents, retracted-notice DOI retrieved,
            republication substituted as the citable version.
          </Pullquote>
        </Section>

        <Section id="limitations" eyebrow="07 · Limitations" title="What this system does not solve.">
          <Reading>
            <ul style={{ paddingLeft: "var(--atlas-space-5)", margin: 0 }}>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                <strong>Field-asymmetric coverage.</strong> Pre-2000
                humanities monographs are under-indexed (see Finding B).
                Biomedical and natural-science coverage is strong;
                archaeology and classics are weaker. Research plans
                should price this in.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                <strong>250-call default ceiling.</strong> Adequate for
                3–5 standard missions; tight for the full 50-era project.
                The budget check prevents surprises but does not raise
                the ceiling.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                <strong>Reproducibility against a living index.</strong>{" "}
                Scite is updated continuously. The <em>method</em> is
                reproducible; specific DOI lists carry a timestamp.
                Re-running a mission six months later may surface
                different papers — that is correct behaviour, not drift.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                <strong>The sharpened-claim pattern is manual.</strong>{" "}
                Replacing &ldquo;first democracy&rdquo; with{" "}
                &ldquo;the three-feature Cleisthenic combination&rdquo;
                is a commander-side framing decision. The system supports
                the pattern but does not automate it.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                <strong>Synthesis cost.</strong> The Opus synthesis step
                is the most expensive call in the pipeline. For rapid
                exploration a Sonnet synthesis is acceptable; for
                anything that will be quoted, Opus stays.
              </li>
            </ul>
          </Reading>
        </Section>

        <Section id="sources" eyebrow="08 · Sources" title="Where the receipts live.">
          <Reading>
            <p>
              This page is a compressed reading. The authoritative
              artefacts are checked into the repository and unchanged
              from the original 2026-04-16 sprint:
            </p>
          </Reading>
          <DataList
            items={[
              { term: "WHITEPAPER.md", value: "evidence-layer/methodology/scite-skill-system/WHITEPAPER.md — full 37k narrative, 10 sections + 2 appendices" },
              { term: "CASE_STUDY.md", value: "evidence-layer/methodology/scite-skill-system/CASE_STUDY.md — 23k Phase 2 incident report (rate-limit blowout, 2026-04-14)" },
              { term: "schema.json", value: "evidence-layer/methodology/scite-skill-system/reference/schema.json — canonical agent-output schema, draft-07 v1.0.0" },
              { term: "Validation mission A", value: "evidence-layer/methodology/validation-missions/mediterranean-diet-cvd/ — 3 agents, complete artefacts incl. PREDIMED retraction trace" },
              { term: "Validation mission B", value: "evidence-layer/eras/phase3-eras-14-20/ — 7 era-specific agents, 130 papers, full bibliography" },
              { term: "Quota state", value: "~/.scite-quota.json — user-level cycle cache; mission history; not in repo" },
            ]}
          />
          <Reading>
            <p>
              Every metric on this page traces to a specific file in
              that inventory. Nothing is asserted that is not
              retrievable. Read the full whitepaper if you want the
              math behind a number; this page is here to make the system
              legible to the people who will quote it.
            </p>
            <p style={{ marginTop: "var(--atlas-space-5)" }}>
              <Link
                href="/methodology"
                style={{
                  color: "var(--atlas-leaf)",
                  fontFamily: "var(--atlas-font-sans)",
                  fontSize: "var(--atlas-text-small)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--atlas-tracking-eyebrow)",
                  textDecoration: "none",
                }}
              >
                ← Back to methodology
              </Link>
            </p>
          </Reading>
        </Section>
      </EditorialPage>

      <ProvenanceStrip
        position="inline"
        scope="Scite MCP whitepaper"
        events={162}
        sources={2}
        contested={2}
        researchedAt="2026-04-16"
      />
    </>
  );
}
