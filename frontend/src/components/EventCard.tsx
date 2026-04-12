"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, BookOpen, Link2 } from "lucide-react";
import type { HistoryEvent } from "@/types/history";
import { safeCategoryConfig, safeCertaintyConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EventCardProps {
  event: HistoryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const catConfig = safeCategoryConfig(event.category);
  const certConfig = safeCertaintyConfig(event.certainty);

  function handleToggle() {
    if (expanded) setSourcesOpen(false);
    setExpanded((e) => !e);
  }

  const certaintyColor =
    event.certainty === "confirmed" ? "#4ade80"
    : event.certainty === "probable" ? "#60a5fa"
    : "#e8c88a";

  return (
    <motion.div
      style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 16 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" as const, stiffness: 250, damping: 28 }}
      whileHover={{ borderColor: "rgba(232,200,138,0.18)" }}
    >
      {/* Clickable header — title first, description second, metadata last */}
      <div
        className="px-6 pt-6 pb-5 cursor-pointer"
        onClick={handleToggle}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3
            className="leading-snug"
            style={{
              fontFamily: "var(--font-heading), serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#f4e9d8",
              letterSpacing: "-0.01em",
            }}
          >
            {event.title}
          </h3>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 mt-1 text-muted-foreground/35"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>

        {/* Description — the actual content, readable */}
        <p
          className={cn(!expanded && "line-clamp-3")}
          style={{
            color: "#c8b99a",
            fontSize: "15px",
            lineHeight: 1.8,
            maxWidth: "68ch",
          }}
        >
          {event.description}
        </p>

        {/* Metadata strip — last, not first */}
        <div
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-4 pt-3"
          style={{ borderTop: "1px solid #1e1e1e" }}
        >
          <span className="text-xs text-muted-foreground/60">{event.region}</span>
          <span className="text-muted-foreground/25 text-xs">·</span>
          <span className="text-xs text-muted-foreground/60">{catConfig.label}</span>
          <span className="text-muted-foreground/25 text-xs">·</span>
          <span className="text-xs font-medium" style={{ color: certaintyColor, opacity: 0.8 }}>
            {certConfig.label}
          </span>
          {event.sources.length > 0 && (
            <>
              <span className="text-muted-foreground/25 text-xs">·</span>
              <span className="text-xs text-muted-foreground/45">
                {event.sources.length} source{event.sources.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {!expanded && event.key_figures.length > 0 && (
            <span className="text-xs text-muted-foreground/35 ml-auto truncate max-w-[180px] hidden sm:block">
              {event.key_figures.slice(0, 3).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-6 pb-6"
              style={{ borderTop: "1px solid #1e1e1e" }}
            >
              <div className="pt-5 space-y-5">

                {/* Key figures */}
                {event.key_figures.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/45 mb-2.5">
                      Key Figures
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {event.key_figures.map((fig) => (
                        <span
                          key={fig}
                          className="rounded-full px-3 py-1 text-sm"
                          style={{ background: "#181818", border: "1px solid #252525", color: "#d1c2a8" }}
                        >
                          {fig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-references */}
                {event.cross_references.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Link2 size={11} className="text-muted-foreground/35 shrink-0" />
                    {event.cross_references.map((ref) => {
                      const refYear = parseInt(ref.split("_")[0], 10);
                      return !isNaN(refYear) ? (
                        <Link
                          key={ref}
                          href={`/year/${refYear}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono rounded px-1.5 py-0.5 hover:opacity-75 transition-opacity"
                          style={{
                            background: "rgba(232,200,138,0.06)",
                            border: "1px solid rgba(232,200,138,0.12)",
                            color: "var(--gold)",
                          }}
                        >
                          {ref}
                        </Link>
                      ) : (
                        <span
                          key={ref}
                          className="text-[10px] font-mono rounded px-1.5 py-0.5"
                          style={{
                            background: "rgba(232,200,138,0.04)",
                            border: "1px solid rgba(232,200,138,0.08)",
                            color: "var(--gold)",
                            opacity: 0.65,
                          }}
                        >
                          {ref}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Certainty note */}
                {event.certainty_note && (
                  <p
                    className="text-xs italic leading-relaxed"
                    style={{
                      color: "#a8998a",
                      borderLeft: "2px solid rgba(232,200,138,0.2)",
                      paddingLeft: 12,
                    }}
                  >
                    {event.certainty_note}
                  </p>
                )}

                {/* Sources */}
                {event.sources.length > 0 && (
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSourcesOpen((s) => !s); }}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <BookOpen size={11} />
                      <span className="font-medium">
                        {event.sources.length} source{event.sources.length !== 1 ? "s" : ""}
                      </span>
                      <motion.span
                        animate={{ rotate: sourcesOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={11} />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {sourcesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            {event.sources.map((src, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span
                                  className={cn(
                                    "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap",
                                    src.contemporary
                                      ? "bg-green-900/20 text-green-400"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {src.type.replace(/_/g, " ")}
                                  {src.contemporary && " •"}
                                </span>
                                <span className="text-foreground/50 leading-relaxed">{src.name}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
