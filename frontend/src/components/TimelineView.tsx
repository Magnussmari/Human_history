"use client";

import { useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { YearData } from "@/types/history";
import { getEraForYear } from "@/lib/constants";
import { YearTimelineCard } from "./YearTimelineCard";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineViewProps {
  years: YearData[];
  isLoading: boolean;
}

function getGroupLabel(year: number): string {
  const era = getEraForYear(year);
  // Group by 50-year intervals
  const chunk = Math.floor(year / 50) * 50;
  const sign = chunk < 0 ? "BCE" : "CE";
  const abs = Math.abs(chunk);
  return `${era.label} — ${abs} ${sign}`;
}

export function TimelineView({ years, isLoading }: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: years.length,
    estimateSize: () => 160,
    overscan: 8,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-24 w-full rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <p className="text-xl mb-2" style={{ fontFamily: "var(--font-heading), serif" }}>
          No years match your filters.
        </p>
        <p className="text-sm">Try broadening your search or clearing filters.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Gold vertical timeline line */}
      <div
        className="absolute left-[18px] top-0 bottom-0 w-px z-0"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(232,200,138,0.3) 5%, rgba(232,200,138,0.3) 95%, transparent)" }}
      />

      <div ref={containerRef}>
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const year = years[virtualRow.index];
            const prevYear = years[virtualRow.index - 1];

            // Check if this starts a new 50-year group
            const currentGroup = Math.floor(year.year / 50) * 50;
            const prevGroup = prevYear ? Math.floor(prevYear.year / 50) * 50 : null;
            const isGroupStart = prevGroup === null || currentGroup !== prevGroup;

            return (
              <div
                key={year.year}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                }}
                className="pb-2"
              >
                {isGroupStart && virtualRow.index > 0 && (
                  <div className="pl-10 pb-1 pt-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium"
                    >
                      {getGroupLabel(year.year)}
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3 relative">
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-5 shrink-0">
                    <div className="timeline-dot" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <YearTimelineCard year={year} index={virtualRow.index} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
