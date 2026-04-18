/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * /methodology — the first live surface of the atlas rebuild. Locks
 * voice + typography + provenance treatment before the atlas is built.
 *
 * This page is intentionally low-density: long-form reading, Fraunces
 * display, Instrument Sans chrome, Plex Mono figures. It is the thesis
 * statement for the whole project: a transparency instrument dressed
 * as a history atlas.
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

export const metadata: Metadata = {
  title: "Methodology — Human History According to AI",
  description:
    "How 5,226 years of human history were researched by AI. Schema, model choice, failures, cost, honesty protocol.",
};

export default function MethodologyPage() {
  return (
    <>
      <EditorialPage>
        <Eyebrow>Methodology · 2026-04-13</Eyebrow>
        <PageTitle>How this was made, and what to distrust.</PageTitle>
        <Lede>
          This is not a history book. It is a transparency instrument that
          happens to contain 5,226 years of history. The point isn&rsquo;t that
          a language model can summarise the past. The point is whether its
          summary can be audited — line by line, year by year — and whether
          its uncertainty can be seen without being dressed up.
        </Lede>

        <MonumentRow>
          <Monument value="5,226" label="Years" note="2025 CE → 3200 BCE" />
          <Monument value="17,991" label="Events" />
          <Monument value="13,130" label="Graph edges" note="cross-references" />
          <Monument value="$15.68" label="Total API cost" tone="mute" />
        </MonumentRow>

        <Rule />

        <Section id="thesis" eyebrow="01 · Thesis" title="Breadth is the substrate. Transparency is the argument.">
          <Reading>
            <p>
              Large language models will happily write a thousand pages about
              the Peloponnesian War. Whether any of it is true — whether the
              model was guessing, paraphrasing, or fabricating — is usually
              invisible to the reader. The output looks the same either way.
            </p>
            <MarginNote label="Locked prompt" tone="caveat">
              <code style={{ fontFamily: "var(--atlas-font-mono)" }}>
                RESEARCH_PROMPT.md
              </code>{" "}
              is the contract behind all 5,226 JSON files. Any change to it
              invalidates the corpus.
            </MarginNote>
            <p>
              This project inverts that. Every year between 3200 BCE and 2025 CE
              was researched through a single, locked research prompt that
              forces the model to declare its own confidence, cite its own
              sources, and record the evidence that would disconfirm its
              claims. The output is a structured JSON record. Not prose. A
              ledger.
            </p>
            <p>
              The frontend you are currently reading exists to make that ledger
              legible. Every certainty tier is rendered visibly. Every
              disconfirming note is kept adjacent to the claim it qualifies.
              Gaps in the record are drawn as gaps — not smoothed over.
            </p>
          </Reading>
        </Section>

        <Section id="schema" eyebrow="02 · Schema" title="ICCRA — what every year must contain.">
          <Reading>
            <MarginNote label="Why strict">
              A strict schema means the pipeline has a gate: pass or be
              rejected. A loose schema becomes a drift surface where the
              model&rsquo;s taxonomy slowly corrupts the dataset.
            </MarginNote>
            <p>
              Each year JSON is validated against a strict schema called ICCRA.
              If a year fails validation, it is re-researched; nothing is
              hand-patched in the corpus files.
            </p>
          </Reading>
          <DataList
            items={[
              { term: "Year", value: "integer, signed (BCE negative)" },
              {
                term: "Era context",
                value: "prose — the broader period the year belongs to",
              },
              {
                term: "Documentation level",
                value: "rich · moderate · sparse · minimal · negligible",
              },
              {
                term: "Geographic coverage gaps",
                value: "explicit list of regions with no usable record",
              },
              {
                term: "Events",
                value:
                  "array of structured events (category · certainty · sources · cross-refs)",
              },
              {
                term: "Disconfirming evidence",
                value: "non-empty string, even if “none identified”",
              },
              { term: "Historiographic note", value: "editorial caveat on the record itself" },
              { term: "Graph edges", value: "typed cross-year references" },
            ]}
          />
          <Reading>
            <p>
              Categories are restricted to twelve; certainties to five. Any
              drift — a compound like <code style={{ fontFamily: "var(--atlas-font-mono)" }}>political | military</code> — is normalised by a migration
              script, never by the frontend pretending it didn&rsquo;t happen.
            </p>
          </Reading>
        </Section>

        <Section id="model" eyebrow="03 · Model" title="Why Claude Sonnet 4.6, and what failed.">
          <Reading>
            <p>
              The production run uses Claude Sonnet 4.6 against the Anthropic
              API directly. Two alternate models were trialled and archived:
            </p>
          </Reading>
          <DataList
            items={[
              {
                term: "Haiku experiment",
                value:
                  "Cheaper, faster — produced noticeably flatter era_context and weaker disconfirming entries. Archived.",
              },
              {
                term: "Gemini Flash experiment",
                value:
                  "Comparable cost — failed schema compliance at a higher rate; cross-references degraded. Archived.",
              },
              {
                term: "Claude CLI (claude -p)",
                value:
                  "~3.5× token overhead vs. direct API. Retired after Phase 3.",
              },
            ]}
          />
          <Reading>
            <MarginNote label="Anti-pattern" tone="contested">
              Swapping models without an archived quality comparison is a
              failure mode we enforce against in the project rules.
            </MarginNote>
            <p>
              Both archives live in <code style={{ fontFamily: "var(--atlas-font-mono)" }}>outputs/haiku_experiment/</code> and <code style={{ fontFamily: "var(--atlas-font-mono)" }}>outputs/gemini_experiment/</code> — kept, not deleted, so the
              model-choice justification has receipts.
            </p>
          </Reading>
        </Section>

        <Section id="layers" eyebrow="04 · Two layers" title="Year-level corpus and scholarly evidence.">
          <Reading>
            <p>
              <strong>Layer 1</strong> is the 5,226-year year-level corpus.
              Unit: one year. Question: what happened in year N, and how
              confident are we. Shipped 2026-04-13.
            </p>
            <MarginNote label="Retraction">
              PREDIMED 2013 was caught and excluded by two independent
              agents during validation. The 2018 republication was
              substituted in its place.
            </MarginNote>
            <p>
              <strong>Layer 2</strong> is a scholarly-evidence deep-dive per
              era, produced through the Scite MCP against peer-reviewed
              literature with retraction enforcement. Unit: one era
              (10–400 years). Question: what does the peer-reviewed record
              say about the core claims of this period. Currently covers
              eras 01–20 of a planned 50, with zero hallucinated citations
              across 10 agent runs.
            </p>
            <p style={{ marginTop: "var(--atlas-space-5)" }}>
              <Link
                href="/methodology/scite-mcp"
                style={{
                  color: "var(--atlas-leaf)",
                  fontFamily: "var(--atlas-font-sans)",
                  fontSize: "var(--atlas-text-small)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--atlas-tracking-eyebrow)",
                  textDecoration: "none",
                }}
              >
                Read the Scite MCP whitepaper →
              </Link>
            </p>
          </Reading>
        </Section>

        <Section id="honesty" eyebrow="05 · Honesty protocol" title="What the frontend will not do.">
          <Reading>
            <ul style={{ paddingLeft: "var(--atlas-space-5)", margin: 0 }}>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                Fill empty years with plausible-sounding prose. If a year has
                no documented events, the page shows the era context and
                says so.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                Smooth legendary or traditional material into confirmed
                material. Those tiers are labelled in the margin, not
                rendered as body claims.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                Hide disconfirming evidence behind a click. It renders
                adjacent to the claim it qualifies, with an oxblood rule.
              </li>
              <li style={{ marginBottom: "var(--atlas-space-3)" }}>
                Guess at enum values the model produced outside of the
                schema. Unknowns render as unknowns, not as a default.
              </li>
            </ul>
          </Reading>
          <Pullquote attribution="Project rule #7">
            Correctness &gt; honesty-about-uncertainty &gt; clarity &gt;
            maintainability &gt; performance.
          </Pullquote>
        </Section>

        <Section id="ledger" eyebrow="06 · Ledger" title="Production receipts.">
          <DataList
            items={[
              { term: "Years attempted", value: "5,226" },
              { term: "Years completed", value: "5,226 (100%)" },
              { term: "Years failed", value: "0" },
              { term: "Runtime", value: "57.7 hours" },
              { term: "Total API cost", value: "~$15.68 USD" },
              { term: "Average cost / year", value: "$0.0030 USD" },
              { term: "Model", value: "Claude Sonnet 4.6, direct API" },
              { term: "Schema validation", value: "100% pass" },
              { term: "Timezone", value: "Atlantic/Reykjavík (UTC)" },
            ]}
          />
        </Section>

        <Section id="provenance" eyebrow="07 · Provenance strip" title="Every page carries its own receipts.">
          <Reading>
            <p>
              You will see a small strip at the bottom of every page. It
              states how many events are on the page, how many sources back
              them, how many are contested, and when the underlying research
              was produced. It is the transparency argument made ambient.
            </p>
          </Reading>
        </Section>
      </EditorialPage>

      <ProvenanceStrip
        position="inline"
        scope="Methodology"
        events={17991}
        sources={0}
        contested={0}
        researchedAt="2026-04-13"
      />
    </>
  );
}
