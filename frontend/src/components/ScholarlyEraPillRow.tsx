/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";
import type { EraIndex, EraRegistryEntry } from "@/types/evidence";
import { findErasForBroadEra } from "@/lib/evidence";

interface ScholarlyEraPillRowProps {
  index: EraIndex;
  activeBroadEra: string | null;
}

export function ScholarlyEraPillRow({
  index,
  activeBroadEra,
}: ScholarlyEraPillRowProps) {
  const router = useRouter();
  const visible: EraRegistryEntry[] = activeBroadEra
    ? findErasForBroadEra(activeBroadEra, index)
    : index.registry.filter(
        (e) =>
          e.phaseStatus === "phase3-complete" ||
          e.educationStatus === "pilot-complete",
      );

  if (visible.length === 0) return null;

  return (
    <div className="mb-6">
      <p
        style={{
          fontSize: "var(--notebook-text-small)",
          color: "var(--fg-mute)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Scholarly eras
        {activeBroadEra && (
          <span style={{ color: "var(--fg-2)", marginLeft: 6 }}>
            · {activeBroadEra}
          </span>
        )}
      </p>
      <div className="flex gap-2 flex-wrap pb-2">
        {visible.map((era) => {
          const rangeLabel =
            era.start < 0 ? `${Math.abs(era.start)} BCE` : `${era.start} CE`;
          const phaseTone =
            era.phaseStatus === "phase3-complete"
              ? "var(--cert-confirmed)"
              : era.phaseStatus === "phase2-migration-pending"
                ? "var(--stamp)"
                : "var(--fg-mute)";
          return (
            <motion.button
              key={era.id}
              onClick={() => router.push(`/era/${era.id}`)}
              type="button"
              className="shrink-0 rounded-full flex items-center gap-2"
              style={{
                padding: "7px 16px",
                background: "var(--card)",
                border: "1px solid var(--rule)",
                color: "var(--fg)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: phaseTone }}
              />
              {era.label}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  color: "var(--fg-mute)",
                  letterSpacing: "0.06em",
                }}
              >
                {rangeLabel}
              </span>
              {era.educationStatus === "pilot-complete" && (
                <span
                  title="Education pilot complete — teaching materials available"
                  aria-label="Education pilot complete"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    color: "var(--leaf)",
                    marginLeft: 2,
                  }}
                >
                  <GraduationCap size={14} aria-hidden="true" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
