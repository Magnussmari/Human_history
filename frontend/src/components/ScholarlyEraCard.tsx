/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowRight } from "lucide-react";
import {
  fetchEraIndex,
  fetchEra,
  findEraForYear,
  formatEraRange,
} from "@/lib/evidence";
import type { SciteAgentResult } from "@/types/evidence";
import { safeVerdictConfig, safePhaseStatusConfig } from "@/lib/constants";

interface ScholarlyEraCardProps {
  year: number;
}

export function ScholarlyEraCard({ year }: ScholarlyEraCardProps) {
  const { data: index } = useQuery({
    queryKey: ["era-index"],
    queryFn: fetchEraIndex,
  });

  const registryEntry = index ? findEraForYear(year, index) : null;

  const { data: era } = useQuery({
    queryKey: ["era", registryEntry?.id],
    queryFn: () =>
      registryEntry ? fetchEra(registryEntry.id) : Promise.resolve(null),
    enabled: !!registryEntry,
  });

  if (!index) return null;

  if (!registryEntry) {
    return (
      <div
        style={{
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
          padding: "16px 0",
          fontFamily: "var(--font-sans)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--fg-mute)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}
        >
          Scholarly era
        </p>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 14,
            fontStyle: "italic",
            color: "var(--fg-2)",
            margin: 0,
          }}
        >
          No scholarly-era deep-dive covers this year yet.
        </p>
      </div>
    );
  }

  const isPhase3 = registryEntry.phaseStatus === "phase3-complete";
  const phase = safePhaseStatusConfig(registryEntry.phaseStatus);
  const scholarly = era?.scholarly as SciteAgentResult | undefined;
  const isAgentResult = scholarly?.schema_version === "1.0.0";
  const verdict = isAgentResult ? safeVerdictConfig(scholarly!.verdict) : null;
  const hasEducationPilot = registryEntry.educationStatus === "pilot-complete";

  const phaseTone =
    registryEntry.phaseStatus === "phase3-complete"
      ? "var(--cert-confirmed)"
      : registryEntry.phaseStatus === "phase2-migration-pending"
        ? "var(--stamp)"
        : "var(--fg-mute)";

  return (
    <Link
      href={`/era/${registryEntry.id}`}
      className="block group notebook-card"
      style={{
        borderColor: "var(--rule)",
        background: "var(--card)",
        textDecoration: "none",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={13} style={{ color: "var(--stamp)" }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--fg-mute)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Scholarly era
        </span>
        <span
          className="ml-auto flex items-center gap-1.5"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--fg-2)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: phaseTone }}
          />
          {phase.label}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: "var(--fg)",
            margin: 0,
          }}
        >
          {registryEntry.label}
        </h3>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--fg-mute)",
            letterSpacing: "0.04em",
          }}
        >
          {formatEraRange(registryEntry)}
        </span>
      </div>

      {isPhase3 && isAgentResult && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 15,
            lineHeight: 1.65,
            color: "var(--fg-2)",
            margin: "0 0 14px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {scholarly!.key_claim}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {verdict && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "3px 10px",
              borderRadius: 99,
              background: "var(--stamp-soft)",
              color: "var(--stamp)",
              border:
                "1px solid color-mix(in oklab, var(--stamp) 30%, transparent)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Verdict: {verdict.label}
          </span>
        )}
        {hasEducationPilot && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "3px 10px",
              borderRadius: 99,
              background:
                "color-mix(in oklab, var(--leaf) 16%, transparent)",
              color: "var(--leaf)",
              border:
                "1px solid color-mix(in oklab, var(--leaf) 35%, transparent)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Education pilot
          </span>
        )}
        <span
          className="ml-auto inline-flex items-center gap-1 transition-colors"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--stamp)",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          View full evidence <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
