/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { YearData } from "@/types/history";
import {
  DOC_LEVEL_CONFIG,
  getEraForYear,
  safeCategoryConfig,
} from "@/lib/constants";

interface NotebookYearRowProps {
  year: YearData;
  index: number;
}

export function NotebookYearRow({ year, index }: NotebookYearRowProps) {
  const era = getEraForYear(year.year);
  const docConfig =
    DOC_LEVEL_CONFIG[year.documentation_level] ??
    { label: year.documentation_level, color: "", bars: 1 };
  const headline = year.events[0];
  const uniqueCats = Array.from(new Set(year.events.map((e) => e.category))).slice(0, 5);
  const sourceCount = year.events.reduce((a, e) => a + e.sources.length, 0);

  return (
    <Link href={`/year/${year.year}`} className="notebook-row-link" tabIndex={0}>
      <motion.article
        className="notebook-row"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: Math.min(index * 0.012, 0.25),
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="notebook-row-rail">
          <span className="notebook-row-year">
            <span className="notebook-row-year-num">{Math.abs(year.year)}</span>
            <span className="notebook-row-year-era">
              {year.year < 0 ? "BCE" : "CE"}
            </span>
          </span>
          <span className="notebook-row-dot" aria-hidden="true" />
          <span className="notebook-row-doc" aria-label={`Documentation: ${docConfig.label}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={"notebook-row-doc-bar" + (i < docConfig.bars ? " on" : "")}
              />
            ))}
          </span>
        </div>

        <div className="notebook-row-body">
          <div className="notebook-row-eyebrow">
            <span className="notebook-row-era">{era.label}</span>
            <span className="notebook-row-dot-sep">·</span>
            <span className="notebook-row-count">
              {year.events.length} event{year.events.length === 1 ? "" : "s"}
            </span>
            <span className="notebook-row-dot-sep">·</span>
            <span className="notebook-row-sources">
              {sourceCount} source{sourceCount === 1 ? "" : "s"}
            </span>
          </div>

          {headline ? (
            <h3 className="notebook-row-title">{headline.title}</h3>
          ) : (
            <p className="notebook-row-era-desc">{year.era_context}</p>
          )}

          {uniqueCats.length > 0 && (
            <ul className="notebook-row-cats" aria-label="Categories">
              {uniqueCats.map((c) => (
                <li key={c} className="notebook-row-cat">
                  <span
                    className="notebook-row-cat-swatch"
                    style={{ background: `var(--cat-${c}, var(--fg-mute))` }}
                  />
                  {safeCategoryConfig(c).label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <span className="notebook-row-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M4 2l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </motion.article>
    </Link>
  );
}
