/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import type { ChunkManifest } from "@/types/history";

interface IntroCardProps {
  manifest: ChunkManifest;
  onDismiss: () => void;
}

export function IntroCard({ manifest, onDismiss }: IntroCardProps) {
  const oldest = manifest.year_range.oldest;
  const newest = manifest.year_range.newest;
  const span = newest - oldest;

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        padding: "20px 24px 18px",
        marginBottom: 32,
        background: "var(--card)",
        border: "1px solid var(--rule)",
        borderLeft: "4px solid var(--stamp)",
        borderRadius: 4,
        fontFamily: "var(--font-sans)",
      }}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss intro"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: 4,
          background: "transparent",
          border: "none",
          color: "var(--fg-mute)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--notebook-text-small)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--fg-2)",
        }}
      >
        <span className="notebook-stamp">Folio</span>
        <span>
          Vol. I · {manifest.total_years.toLocaleString()} of {span.toLocaleString()} years filed ·{" "}
          {manifest.total_events.toLocaleString()} events
        </span>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px, 4.5vw, 48px)",
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: "6px 0 10px",
          color: "var(--fg)",
        }}
      >
        Human History <em style={{ color: "var(--fg-2)" }}>according to AI</em>
      </h1>

      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 16,
          lineHeight: 1.65,
          color: "var(--fg)",
          margin: 0,
          maxWidth: "58ch",
        }}
      >
        A year-by-year editorial chronicle of{" "}
        <span style={{ color: "var(--stamp)", fontWeight: 500 }}>
          {span.toLocaleString()}
        </span>{" "}
        years of human civilisation — assembled by Claude Sonnet under the ICCRA
        schema. Every entry carries its sources, its certainty, and the gaps it
        couldn&apos;t fill. Browse the timeline below, or jump to{" "}
        <a href="/atlas" style={{ color: "var(--stamp)" }}>Atlas</a> for the map
        view and <a href="/stratum" style={{ color: "var(--stamp)" }}>Stratum</a>{" "}
        for the per-year instrument.
      </p>
    </motion.aside>
  );
}
