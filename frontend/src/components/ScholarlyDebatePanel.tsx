/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import type { ScholarlyDebate } from "@/types/evidence";

interface ScholarlyDebatePanelProps {
  debate: ScholarlyDebate;
}

export function ScholarlyDebatePanel({ debate }: ScholarlyDebatePanelProps) {
  return (
    <div
      className="notebook-card"
      style={{ padding: "22px 24px" }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--fg-mute)",
          margin: "0 0 12px",
        }}
      >
        Scholarly debate
      </p>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          lineHeight: 1.25,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--fg)",
          margin: "0 0 20px",
        }}
      >
        {debate.question}
      </h3>

      <div
        className="grid sm:grid-cols-2 gap-4 mb-5"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--rule)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--cert-confirmed)",
              margin: "0 0 8px",
              fontWeight: 600,
            }}
          >
            Position A
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {debate.position_a}
          </p>
        </div>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--rule)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--stamp)",
              margin: "0 0 8px",
              fontWeight: 600,
            }}
          >
            Position B
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {debate.position_b}
          </p>
        </div>
      </div>

      <div
        style={{
          paddingTop: 14,
          borderTop: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-mute)",
              margin: "0 0 4px",
              fontWeight: 600,
            }}
          >
            Current consensus
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {debate.current_consensus}
          </p>
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg-mute)",
              margin: "0 0 4px",
              fontWeight: 600,
            }}
          >
            Resolution needed
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--fg-2)",
              margin: 0,
            }}
          >
            {debate.resolution_needed}
          </p>
        </div>
      </div>
    </div>
  );
}
