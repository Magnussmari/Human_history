"use client";

import Link from "next/link";
import type { YearData } from "@/types/history";
import { DOC_LEVEL_CONFIG, getEraForYear, CATEGORY_CONFIG, safeCategoryConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface YearCardProps {
  year: YearData;
  index: number;
}

export function YearCard({ year, index }: YearCardProps) {
  const era = getEraForYear(year.year);
  const docConfig = DOC_LEVEL_CONFIG[year.documentation_level] ?? { label: year.documentation_level, color: "text-muted-foreground", bars: 1 };
  const topCategories = [...new Set(year.events.map((e) => e.category))].slice(0, 4);

  return (
    <Link href={`/year/${year.year}`} className="block group">
      <div
        className="relative flex gap-4 rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/40 hover:bg-card/80"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex flex-col items-center gap-1 shrink-0 w-20">
          <span className="text-2xl font-bold text-primary tabular-nums">
            {Math.abs(year.year)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {year.year < 0 ? "BCE" : "CE"}
          </span>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-1.5 rounded-full",
                  i < docConfig.bars ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5", era.color, "text-white")}>
              {era.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {year.events.length} events
            </span>
          </div>
          <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
            {year.era_context}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {topCategories.map((cat) => (
              <span
                key={cat}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  safeCategoryConfig(cat).color
                )}
              >
                {safeCategoryConfig(cat).label}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden sm:flex items-center text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 4l6 6-6 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
