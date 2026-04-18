/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import "@/components/notebook/notebook-folio.css";
import "@/components/hero-section.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <motion.section
      className="notebook-folio notebook-folio-missing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <span className="notebook-stamp">Errata</span>
      <h1 className="notebook-folio-title">An entry misfiled.</h1>
      <p className="notebook-folio-era-text">
        {error.message ||
          "Something went wrong while reading the folio. The corpus is unchanged; this is a render-time fault."}
      </p>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          color: "var(--fg-mute)",
          margin: "12px auto 28px",
          maxWidth: "48ch",
        }}
      >
        Even meticulous archivists drop a page. Try reloading the entry, or
        return to the timeline.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <motion.button
          onClick={reset}
          type="button"
          className="notebook-hero-cta"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{ alignItems: "center", gap: 8 }}
        >
          <RefreshCw size={13} /> Try again
        </motion.button>
        <Link href="/" className="notebook-hero-link">
          ← Back to timeline
        </Link>
      </div>

      {error.digest && (
        <p
          style={{
            marginTop: 32,
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--fg-mute)",
            letterSpacing: "0.12em",
          }}
        >
          digest · {error.digest}
        </p>
      )}
    </motion.section>
  );
}
