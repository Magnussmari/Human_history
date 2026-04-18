/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { motion } from "motion/react";
import { List, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "timeline" | "map";

interface ViewToggleProps {
  active: ViewMode;
  onChange: (view: ViewMode) => void;
}

const VIEWS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "timeline", label: "Timeline", icon: <List size={13} /> },
  { id: "map", label: "Globe", icon: <Map size={13} /> },
];

export function ViewToggle({ active, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md p-0.5"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--rule)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {VIEWS.map((view) => {
        const isActive = active === view.id;
        return (
          <motion.button
            key={view.id}
            onClick={() => onChange(view.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors",
              isActive ? "" : "hover:opacity-80"
            )}
            style={{
              color: isActive ? "var(--bg)" : "var(--fg-mute)",
              background: isActive ? "var(--fg)" : "transparent",
            }}
            whileTap={{ scale: 0.96 }}
            type="button"
          >
            <span className="relative z-10 inline-flex items-center justify-center">
              {view.icon}
            </span>
            <span className="relative z-10">{view.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
