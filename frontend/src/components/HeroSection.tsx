/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { fetchManifest, fetchProgress } from "@/lib/data";
import { TOTAL_YEARS } from "@/lib/constants";

import "./hero-section.css";

interface HeroSectionProps {
  onExplore: () => void;
}

export function HeroSection({ onExplore }: HeroSectionProps) {
  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    refetchInterval: 60_000,
  });

  const completed = progress?.completed?.length ?? 0;
  const totalEvents = manifest?.total_events ?? 0;
  const range = manifest?.year_range;
  const span = range ? range.newest - range.oldest : TOTAL_YEARS;

  return (
    <section className="notebook-hero" aria-labelledby="notebook-hero-title">
      <motion.div
        className="notebook-hero-inner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="notebook-hero-eyebrow">
          <span className="notebook-stamp">Folio</span>
          <span className="notebook-hero-meta">
            Vol. I · {completed.toLocaleString()} of{" "}
            {TOTAL_YEARS.toLocaleString()} entries filed
          </span>
        </div>

        <h1 id="notebook-hero-title" className="notebook-hero-title">
          Human History
          <em>according to AI</em>
        </h1>

        <p className="notebook-hero-lede">
          A year-by-year editorial chronicle of{" "}
          <span className="notebook-hero-figure">{span.toLocaleString()}</span>{" "}
          years of human civilisation — from{" "}
          {range ? yearLabel(range.oldest) : "3200 BCE"} to{" "}
          {range ? yearLabel(range.newest) : "2025 CE"} — assembled by Claude
          Sonnet under the ICCRA schema. Every entry carries its sources, its
          certainty, and the gaps it couldn&apos;t fill.
        </p>

        <aside className="notebook-hero-sidenote">
          <div className="notebook-hero-sidenote-label">Editor&apos;s note</div>
          <p>
            Read with the same scepticism you would bring to any secondary
            source. The record is structured, sourced, and machine-readable —
            it is not infallible.
          </p>
        </aside>

        <dl className="notebook-hero-stats">
          <div className="notebook-hero-stat">
            <dt>Entries filed</dt>
            <dd>
              <span className="notebook-hero-stat-num">
                {completed.toLocaleString()}
              </span>
              <span className="notebook-hero-stat-unit">
                of {TOTAL_YEARS.toLocaleString()}
              </span>
            </dd>
          </div>
          <div className="notebook-hero-stat">
            <dt>Events documented</dt>
            <dd>
              <span className="notebook-hero-stat-num">
                {totalEvents.toLocaleString()}
              </span>
            </dd>
          </div>
          <div className="notebook-hero-stat">
            <dt>Span</dt>
            <dd>
              <span className="notebook-hero-stat-num">
                {span.toLocaleString()}
              </span>
              <span className="notebook-hero-stat-unit">years</span>
            </dd>
          </div>
        </dl>

        <div className="notebook-hero-actions">
          <button
            type="button"
            onClick={onExplore}
            className="notebook-hero-cta"
          >
            Open the folio
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="notebook-hero-link"
          >
            Source &amp; corpus on GitHub ↗
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function yearLabel(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString()} BCE`;
  return `${y} CE`;
}
