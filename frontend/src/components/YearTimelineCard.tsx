"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { YearData } from "@/types/history";
import { DOC_LEVEL_CONFIG, getEraForYear, safeCategoryConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface YearTimelineCardProps {
  year: YearData;
  index: number;
}

const ERA_CLASS_MAP: Record<string, string> = {
  Modern: "era-modern",
  Industrial: "era-industrial",
  Enlightenment: "era-enlightenment",
  Renaissance: "era-renaissance",
  Medieval: "era-medieval",
  "Early Medieval": "era-early-medieval",
  Classical: "era-classical",
  "Iron Age": "era-iron-age",
  "Bronze Age": "era-bronze-age",
  "Early Bronze": "era-early-bronze",
};

const CAT_DOT_MAP: Record<string, string> = {
  political: "cat-dot-political",
  military: "cat-dot-military",
  scientific: "cat-dot-scientific",
  cultural: "cat-dot-cultural",
  economic: "cat-dot-economic",
  demographic: "cat-dot-demographic",
  technological: "cat-dot-technological",
  religious: "cat-dot-religious",
  environmental: "cat-dot-environmental",
  exploration: "cat-dot-exploration",
  legal: "cat-dot-legal",
};

export function YearTimelineCard({ year, index }: YearTimelineCardProps) {
  const era = getEraForYear(year.year);
  const docConfig = DOC_LEVEL_CONFIG[year.documentation_level] ?? { label: year.documentation_level, color: "text-muted-foreground", bars: 1 };
  const topCategories = [...new Set(year.events.map((e) => e.category))].slice(0, 5);
  const topEvents = year.events.slice(0, 3);

  return (
    <Link href={`/year/${year.year}`} className="block group" tabIndex={0}>
      <motion.div
        className="glass-card cursor-pointer"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.5), type: "spring", stiffness: 250, damping: 30 }}
      >
        <div className="flex gap-4">
          {/* Year column */}
          <div className="flex flex-col items-center shrink-0 w-[68px]">
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
            >
              {Math.abs(year.year)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
              {year.year < 0 ? "BCE" : "CE"}
            </span>
            {/* Doc level dots */}
            <div className="flex gap-0.5 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i < docConfig.bars
                      ? "opacity-100"
                      : "opacity-20 bg-muted"
                  )}
                  style={i < docConfig.bars ? { background: "var(--gold)" } : undefined}
                />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground mt-1">{docConfig.label}</span>
          </div>

          {/* Divider */}
          <div
            className="w-px self-stretch rounded-full opacity-20"
            style={{ background: "var(--gold)" }}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top row: era badge + event count */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-[10px] font-semibold rounded-full px-2.5 py-0.5 uppercase tracking-wider",
                  ERA_CLASS_MAP[era.label] ?? "bg-muted text-muted-foreground"
                )}
              >
                {era.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {year.events.length} event{year.events.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Era context (brief) */}
            <p className="text-foreground/85 leading-relaxed line-clamp-1" style={{ fontSize: "15px", lineHeight: 1.6 }}>
              {year.era_context}
            </p>

            {/* Category dots row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {topCategories.map((cat) => (
                <span
                  key={cat}
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    CAT_DOT_MAP[cat]
                  )}
                  title={safeCategoryConfig(cat).label}
                />
              ))}
              {topCategories.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60 ml-1">
                  {topCategories.map(c => safeCategoryConfig(c).label).join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center self-center text-muted-foreground/20 group-hover:text-primary/60 transition-colors ml-2 shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 4l6 6-6 6" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
