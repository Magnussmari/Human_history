/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Info, GraduationCap } from "lucide-react";
import { fetchEra, formatEraRange } from "@/lib/evidence";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import type {
  EraBundle,
  EraScholarlyPhase3,
  EducationPilotData,
} from "@/types/evidence";
import {
  safeVerdictConfig,
  safeConfidenceConfig,
  safePhaseStatusConfig,
} from "@/lib/constants";
import { ScholarlyDebatePanel } from "@/components/ScholarlyDebatePanel";
import { ContestedClaimsList } from "@/components/ContestedClaimsList";
import { EvidenceTable } from "@/components/EvidenceTable";
import { EducationPanel } from "@/components/EducationPanel";
import { EducationSkeleton } from "@/components/EducationSkeleton";
import { NotebookYearRow } from "@/components/notebook/NotebookYearRow";
import "@/components/notebook/notebook-folio.css";

function isPhase3(
  era: EraBundle,
): era is EraBundle & { scholarly: EraScholarlyPhase3 } {
  return (era.scholarly as { schema_version?: string })?.schema_version === "1.0.0";
}

export default function EraPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const { data: era, isLoading } = useQuery({
    queryKey: ["era", id],
    queryFn: () => fetchEra(id),
    enabled: !!id,
  });

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: allYears } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest && !!era,
  });

  if (isLoading) return null;

  if (!era) {
    return (
      <section className="notebook-folio notebook-folio-missing">
        <span className="notebook-stamp">Unregistered</span>
        <h1 className="notebook-folio-title">Era not found</h1>
        <p className="notebook-folio-era-text">
          No scholarly era is registered under that id. The registry is built
          from the Layer 2 evidence corpus — new eras appear after a Scite
          research mission lands.
        </p>
        <Link href="/" className="notebook-folio-back">
          <ArrowLeft size={12} /> Back to timeline
        </Link>
      </section>
    );
  }

  const phase = safePhaseStatusConfig(era.phaseStatus);
  const phaseTone =
    era.phaseStatus === "phase3-complete"
      ? "var(--cert-confirmed)"
      : era.phaseStatus === "phase2-migration-pending"
        ? "var(--stamp)"
        : "var(--fg-mute)";
  const relatedYears = (allYears ?? [])
    .filter((y) => y.year <= era.start && y.year >= era.end)
    .slice(0, 10);

  const stagger = {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, y: 12 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring" as const,
          stiffness: 250,
          damping: 28,
        },
      },
    },
  };

  const phase3 = isPhase3(era) ? era.scholarly : null;

  return (
    <motion.article
      className="notebook-folio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="notebook-folio-back">
        <ArrowLeft size={12} /> Back to timeline
      </Link>

      <motion.div variants={stagger.container} initial="hidden" animate="show">
        <motion.header variants={stagger.item} className="notebook-folio-hero">
          <div className="notebook-folio-hero-grid">
            <div className="notebook-folio-eyebrow">
              <span className="notebook-stamp">Era</span>
              <span className="notebook-folio-ordinal">
                {era.primaryBroadEra} · {formatEraRange(era)}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(48px, 7vw, 72px)",
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                margin: "0 0 18px",
                color: "var(--fg)",
              }}
            >
              {era.label}
            </h1>

            <div className="notebook-folio-hero-meta">
              <span
                className="inline-flex items-center gap-2"
                style={{ color: "var(--fg-2)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: phaseTone }}
                />
                {phase.label}
              </span>
              {phase3 && (
                <>
                  <span className="notebook-folio-dot">·</span>
                  <span>
                    {phase3.papers_found_total ?? phase3.evidence?.length ?? 0}{" "}
                    papers
                  </span>
                  <span className="notebook-folio-dot">·</span>
                  <span>{phase3.searches_executed ?? 0} searches</span>
                </>
              )}
            </div>
          </div>
        </motion.header>

        {phase3 && (
          <motion.section variants={stagger.item} className="notebook-folio-era">
            <div className="notebook-folio-era-rule" />
            <div className="notebook-folio-era-body">
              <div className="notebook-folio-era-label">Key claim</div>
              <p className="notebook-folio-era-text">{phase3.key_claim}</p>
            </div>
          </motion.section>
        )}

        {phase3 && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ 01</span>
              <h2>Verdict</h2>
              <span className="notebook-folio-section-trail">
                — as assembled from the evidence
              </span>
            </header>
            <div className="flex flex-wrap gap-3">
              <Pill
                label="Verdict"
                value={safeVerdictConfig(phase3.verdict).label}
              />
              <Pill
                label="Confidence"
                value={safeConfidenceConfig(phase3.confidence).label}
              />
              <Pill
                label="Papers"
                value={String(
                  phase3.papers_found_total ?? phase3.evidence?.length ?? 0,
                )}
              />
              <Pill
                label="Searches"
                value={String(phase3.searches_executed ?? 0)}
              />
              <Pill
                label="Retractions"
                value={String(
                  phase3.papers_with_editorial_notices?.count ?? 0,
                )}
                warn={
                  (phase3.papers_with_editorial_notices?.count ?? 0) > 0
                }
              />
            </div>
          </motion.section>
        )}

        {phase3?.scholarly_debate && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ 02</span>
              <h2>Scholarly debate</h2>
              <span className="notebook-folio-section-trail">
                — dissenting lines in the literature
              </span>
            </header>
            <ScholarlyDebatePanel debate={phase3.scholarly_debate} />
          </motion.section>
        )}

        {phase3?.contested_claims && phase3.contested_claims.length > 0 && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ 03</span>
              <h2>Contested claims</h2>
              <span className="notebook-folio-section-trail">
                — where the consensus is fragile
              </span>
            </header>
            <ContestedClaimsList claims={phase3.contested_claims} />
          </motion.section>
        )}

        {phase3?.evidence && phase3.evidence.length > 0 && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ 04</span>
              <h2>Evidence</h2>
              <span className="notebook-folio-section-trail">
                — {phase3.evidence.length} paper
                {phase3.evidence.length === 1 ? "" : "s"} appraised
              </span>
            </header>
            <EvidenceTable evidence={phase3.evidence} />
          </motion.section>
        )}

        {!phase3 && (
          <motion.section
            variants={stagger.item}
            className="notebook-folio-section notebook-folio-dissent-block"
          >
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ 01</span>
              <h2>Evidence pending</h2>
              <span className="notebook-folio-section-trail">
                — no full appraisal yet
              </span>
            </header>
            <div className="notebook-folio-dissent-body">
              <div className="notebook-folio-dissent-mark">¶</div>
              <p>
                {era.phaseStatus === "phase2-migration-pending"
                  ? "Phase 2 outputs exist but use an earlier schema; they will surface here once migrated to schema v1.0.0."
                  : "This era has not been through a Scite research mission yet. Its VALOR source and broad period are registered; evidence will be collected in a future research batch."}
              </p>
            </div>
          </motion.section>
        )}

        <motion.section variants={stagger.item} className="notebook-folio-section">
          <header className="notebook-folio-section-head">
            <span className="notebook-folio-section-num">
              <GraduationCap size={11} style={{ display: "inline", marginRight: 4 }} />
              § Edu
            </span>
            <h2>Education &amp; formation</h2>
            <span className="notebook-folio-section-trail">
              — what this era teaches
            </span>
          </header>
          {era.education.status === "pilot-complete" ? (
            <EducationPanel data={era.education as EducationPilotData} />
          ) : (
            <EducationSkeleton
              valorSource={era.valorSource}
              reason={
                era.education.status === "parse-failed"
                  ? "Education markdown failed to parse; regenerate the aggregator."
                  : undefined
              }
            />
          )}
        </motion.section>

        {relatedYears.length > 0 && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ Years</span>
              <h2>Years in this era</h2>
              <span className="notebook-folio-section-trail">
                — sampled across the range
              </span>
            </header>
            <div className="notebook-timeline">
              {relatedYears.map((y, i) => (
                <NotebookYearRow key={y.year} year={y} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {phase3?.apa_references && phase3.apa_references.length > 0 && (
          <motion.section variants={stagger.item} className="notebook-folio-section">
            <header className="notebook-folio-section-head">
              <span className="notebook-folio-section-num">§ Refs</span>
              <h2>References (APA)</h2>
              <span className="notebook-folio-section-trail">
                — {phase3.apa_references.length} citations
              </span>
            </header>
            <ol
              style={{
                margin: 0,
                paddingLeft: 24,
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--fg-2)",
              }}
            >
              {phase3.apa_references.map((r, i) => (
                <li key={i} style={{ paddingLeft: 4 }}>
                  {r}
                </li>
              ))}
            </ol>
          </motion.section>
        )}

        {phase3 && (
          <motion.footer variants={stagger.item} className="notebook-folio-footer">
            <div className="notebook-folio-footer-rule" />
            <div className="notebook-folio-footer-row">
              <span>End of era dossier</span>
              <span className="notebook-folio-footer-year">
                {formatEraRange(era)}
              </span>
              <span>Chronograph · Scholarly layer</span>
            </div>
            <div className="notebook-folio-meta">
              <span className="notebook-folio-meta-label">
                <Info
                  size={10}
                  style={{
                    display: "inline",
                    marginRight: 4,
                    verticalAlign: "baseline",
                  }}
                />
                Research metadata
              </span>
              <span>
                Mission: {phase3.mission_id} · agent: {phase3.agent_id} ·
                model: {phase3.model}
                {phase3.calls_consumed != null &&
                  ` · calls: ${phase3.calls_consumed}`}
                {" · run "}
                {phase3.research_timestamp}
              </span>
            </div>
          </motion.footer>
        )}

        {!phase3 && (
          <motion.div
            variants={stagger.item}
            className="notebook-folio-section"
          >
            <div
              className="notebook-card"
              style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
            >
              <BookOpen
                size={18}
                style={{ color: "var(--stamp)", marginTop: 2 }}
              />
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 14,
                  color: "var(--fg-2)",
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                Evidence will appear here once the Scite research mission for
                this era completes.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.article>
  );
}

function Pill({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className="notebook-card"
      style={{
        padding: "12px 16px",
        minWidth: 120,
        background: warn ? "var(--stamp-soft)" : "var(--card)",
        borderColor: warn
          ? "color-mix(in oklab, var(--stamp) 40%, transparent)"
          : "var(--rule)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--fg-mute)",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 500,
          color: warn ? "var(--stamp)" : "var(--fg)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
