"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal } from "lucide-react";
import { fetchManifest, fetchAllYears, filterYears, DEFAULT_FILTERS } from "@/lib/data";
import { fetchEraIndex } from "@/lib/evidence";
import type { FilterState } from "@/lib/data";
import { ERAS } from "@/lib/constants";
import { HeroSection } from "@/components/HeroSection";
import { NotebookTimeline } from "@/components/notebook/NotebookTimeline";
import { SearchCommand } from "@/components/SearchCommand";
import { FilterPanel } from "@/components/FilterPanel";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { ScholarlyEraPillRow } from "@/components/ScholarlyEraPillRow";
import { GlobeAtlas } from "@/components/atlas/GlobeAtlas";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeEra, setActiveEra] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<ViewMode>("timeline");
  const timelineSectionRef = useRef<HTMLDivElement>(null);

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: years, isLoading } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const { data: eraIndex } = useQuery({
    queryKey: ["era-index"],
    queryFn: fetchEraIndex,
  });

  const filteredYears = useMemo(() => {
    if (!years) return [];
    let result = filterYears(years, filters);
    if (activeEra) {
      const era = ERAS.find((e) => e.label === activeEra);
      if (era) {
        result = result.filter((y) => y.year <= era.start && y.year >= era.end);
      }
    }
    return result;
  }, [years, filters, activeEra]);

  const activeFilterCount =
    filters.categories.length + filters.certainties.length + (filters.region ? 1 : 0);

  const handleExplore = useCallback(() => {
    timelineSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <HeroSection onExplore={handleExplore} />

      {/* Timeline section */}
      <section ref={timelineSectionRef} className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-10">
        {/* Section heading */}
        <div className="mb-8 text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
          >
            The Timeline
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredYears.length.toLocaleString()} years displayed
            {activeEra && ` — ${activeEra} era`}
            {filters.search && ` — matching "${filters.search}"`}
          </p>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <SearchCommand years={years ?? []} />

          <motion.button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all relative"
            style={{
              background: "#111111",
              border: "1px solid #222222",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "var(--gold)", color: "var(--background)" }}
              >
                {activeFilterCount}
              </span>
            )}
          </motion.button>

          <div className="ml-auto">
            <ViewToggle active={view} onChange={setView} />
          </div>
        </div>

        {/* Era navigation */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
          <motion.button
            onClick={() => setActiveEra(null)}
            className="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all"
            style={
              activeEra === null
                ? { background: "var(--gold)", color: "var(--background)" }
                : { background: "var(--muted)", color: "var(--muted-foreground)" }
            }
            whileTap={{ scale: 0.95 }}
          >
            All Eras
          </motion.button>
          {ERAS.map((era) => (
            <motion.button
              key={era.label}
              onClick={() => setActiveEra(activeEra === era.label ? null : era.label)}
              className="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all"
              style={
                activeEra === era.label
                  ? { background: "var(--gold)", color: "var(--background)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }
              }
              whileTap={{ scale: 0.95 }}
            >
              {era.label}
              <span className="ml-1.5 opacity-50">
                {era.start > 0 ? era.start : `${Math.abs(era.start)} BCE`}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Scholarly-era drill-down row */}
        {eraIndex && view === "timeline" && (
          <ScholarlyEraPillRow index={eraIndex} activeBroadEra={activeEra} />
        )}

        {/* View content */}
        <AnimatePresence mode="wait">
          {view === "timeline" ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
            >
              <NotebookTimeline years={filteredYears} isLoading={isLoading} />
            </motion.div>
          ) : view === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {manifest ? (
                <GlobeAtlas
                  years={filteredYears}
                  yearRange={{
                    oldest: manifest.year_range.oldest,
                    newest: manifest.year_range.newest,
                  }}
                />
              ) : (
                <div className="py-24 text-center text-muted-foreground text-sm">
                  Loading globe…
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="py-24 text-center text-muted-foreground"
            >
              <p
                className="text-2xl mb-2"
                style={{ fontFamily: "var(--font-heading), serif" }}
              >
                Graph View
              </p>
              <p className="text-sm">Cross-reference graph visualization coming soon.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Filter panel */}
      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
      />
    </motion.div>
  );
}
