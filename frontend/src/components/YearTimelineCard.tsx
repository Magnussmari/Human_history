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
  const headlineEvent = year.events[0];
  const topCategories = [...new Set(year.events.map((e) => e.category))].slice(0, 5);

  return (
    <Link href={`/year/${year.year}`} className="block group" tabIndex={0}>
      <motion.div
        className="glass-card cursor-pointer"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          delay: Math.min(index * 0.015, 0.3),
          type: "spring",
          stiffness: 280,
          damping: 30,
        }}
      >
        <div className="flex gap-4">
          {/* Year column */}
          <div className="flex flex-col items-center shrink-0 w-[60px]">
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
            >
              {Math.abs(year.year)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
              {year.year < 0 ? "BCE" : "CE"}
            </span>
            {/* Doc level dots */}
            <div className="flex gap-0.5 mt-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn("h-1.5 w-1.5 rounded-full transition-colors", i < docConfig.bars ? "opacity-100" : "opacity-15 bg-muted")}
                  style={i < docConfig.bars ? { background: "var(--gold)" } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-px self-stretch rounded-full opacity-15"
            style={{ background: "var(--gold)" }}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Headline event title — the actual hook */}
            {headlineEvent ? (
              <h3
                className="leading-snug text-foreground/90 line-clamp-2 group-hover:text-foreground transition-colors"
                style={{
                  fontFamily: "var(--font-heading), serif",
                  fontSize: "0.975rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {headlineEvent.title}
              </h3>
            ) : (
              <p className="text-sm text-muted-foreground italic line-clamp-1">{year.era_context}</p>
            )}

            {/* Era + event count row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "text-[9px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wider",
                  ERA_CLASS_MAP[era.label] ?? "bg-muted text-muted-foreground"
                )}
              >
                {era.label}
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                {year.events.length} event{year.events.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Category dots */}
            {topCategories.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {topCategories.map((cat) => (
                  <span
                    key={cat}
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", CAT_DOT_MAP[cat] ?? "bg-muted")}
                    title={safeCategoryConfig(cat).label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center self-center text-muted-foreground/15 group-hover:text-primary/50 transition-colors ml-1 shrink-0">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 4l6 6-6 6" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
