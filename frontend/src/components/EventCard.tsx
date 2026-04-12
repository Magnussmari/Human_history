"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark, Swords, FlaskConical, Palette, Coins, Users, Cog,
  Church, Leaf, Compass, Scale, ChevronDown, Shield, Flame, BookOpen, Link2
} from "lucide-react";
import type { HistoryEvent, EventCategory, CertaintyLevel } from "@/types/history";
import { CATEGORY_CONFIG, CERTAINTY_CONFIG, safeCategoryConfig, safeCertaintyConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  political: <Landmark size={13} />,
  military: <Swords size={13} />,
  scientific: <FlaskConical size={13} />,
  cultural: <Palette size={13} />,
  economic: <Coins size={13} />,
  demographic: <Users size={13} />,
  technological: <Cog size={13} />,
  religious: <Church size={13} />,
  environmental: <Leaf size={13} />,
  exploration: <Compass size={13} />,
  legal: <Scale size={13} />,
};

const CERTAINTY_ICONS: Record<CertaintyLevel, React.ReactNode> = {
  confirmed: <Shield size={11} />,
  probable: <Shield size={11} />,
  approximate: <Flame size={11} />,
  traditional: <Flame size={11} />,
  legendary: <Flame size={11} />,
};

interface EventCardProps {
  event: HistoryEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const catConfig = safeCategoryConfig(event.category);
  const certConfig = safeCertaintyConfig(event.certainty);

  return (
    <motion.div
      className="overflow-hidden transition-all"
      style={{
        background: "#111111",
        border: "1px solid #222222",
        borderRadius: "16px",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" as const, stiffness: 250, damping: 28 }}
      whileHover={{ boxShadow: "0 4px 20px -4px rgba(232,200,138,0.08)" }}
    >
      <div className="p-5 sm:p-7" style={{ paddingLeft: "clamp(20px, 5vw, 32px)", paddingRight: "clamp(20px, 5vw, 32px)" }}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 6,
              background: "#1a1a1a",
              border: "1px solid #222222",
              color: "#d1c2a8",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {CATEGORY_ICONS[event.category]}
            {catConfig.label}
          </span>

          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 999,
              background: event.certainty === "confirmed" ? "rgba(34,197,94,0.1)" : event.certainty === "probable" ? "rgba(59,130,246,0.1)" : "rgba(232,200,138,0.08)",
              border: `1px solid ${event.certainty === "confirmed" ? "rgba(34,197,94,0.25)" : event.certainty === "probable" ? "rgba(59,130,246,0.25)" : "rgba(232,200,138,0.2)"}`,
              color: event.certainty === "confirmed" ? "#4ade80" : event.certainty === "probable" ? "#60a5fa" : "#e8c88a",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {CERTAINTY_ICONS[event.certainty]}
            {certConfig.label}
          </span>

          <span className="text-xs text-muted-foreground ml-auto">{event.region}</span>
        </div>

        {/* Title */}
        <h3
          className="font-semibold mb-3 leading-snug"
          style={{ fontFamily: "var(--font-heading), serif", fontSize: "1.75rem", color: "#f4e9d8", letterSpacing: "-0.02em" }}
        >
          {event.title}
        </h3>

        {/* Description */}
        <p style={{ color: "#d1c2a8", fontSize: "17px", lineHeight: 1.7 }}>{event.description}</p>

        {/* Key figures */}
        {event.key_figures.length > 0 && (
          <div className="mt-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Key Figures
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {event.key_figures.map((fig) => (
                <span
                  key={fig}
                  className="rounded-full border px-3 py-1 font-medium"
                  style={{ background: "#1a1a1a", borderColor: "#222222", fontSize: "0.95rem", color: "#d1c2a8" }}
                >
                  {fig}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cross-references */}
        {event.cross_references.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <Link2 size={11} className="text-muted-foreground/60" />
            {event.cross_references.map((ref) => {
              const refYear = parseInt(ref.split("_")[0], 10);
              if (!isNaN(refYear)) {
                return (
                  <Link
                    key={ref}
                    href={`/year/${refYear}`}
                    className="text-[10px] font-mono rounded px-1.5 py-0.5 transition-colors hover:text-primary"
                    style={{
                      background: "rgba(232,200,138,0.08)",
                      border: "1px solid rgba(232,200,138,0.2)",
                      color: "var(--gold)",
                    }}
                  >
                    {ref}
                  </Link>
                );
              }
              return (
                <span
                  key={ref}
                  className="text-[10px] font-mono rounded px-1.5 py-0.5"
                  style={{
                    background: "rgba(232,200,138,0.06)",
                    border: "1px solid rgba(232,200,138,0.15)",
                    color: "var(--gold)",
                    opacity: 0.8,
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
            className="text-xs text-muted-foreground italic border-l-2 pl-3 mt-4"
            style={{ borderColor: "rgba(232,200,138,0.3)" }}
          >
            {event.certainty_note}
          </p>
        )}

        {/* Sources toggle */}
        {event.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <button
              onClick={() => setSourcesOpen((s) => !s)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen size={11} />
              {event.sources.length} source{event.sources.length !== 1 ? "s" : ""}
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
                  <div className="mt-2 space-y-1.5">
                    {event.sources.map((src, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap",
                            src.contemporary
                              ? "bg-green-900/20 text-green-400 dark:bg-green-900/30"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {src.type.replace(/_/g, " ")}
                          {src.contemporary && " •"}
                        </span>
                        <span className="text-foreground/60 leading-relaxed">{src.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
