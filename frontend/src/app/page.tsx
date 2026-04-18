/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { Suspense, useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  fetchManifest,
  fetchAllYears,
  filterYears,
  DEFAULT_FILTERS,
} from "@/lib/data";
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
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL is the source of truth for the view toggle — avoids state duplication
  // and the matching "sync" effects that used to bridge them.
  const view: ViewMode = searchParams.get("view") === "map" ? "map" : "timeline";

  const setView = useCallback(
    (next: ViewMode) => {
      if (next === "map") {
        router.replace(`${pathname}?view=map`, { scroll: false });
      } else {
        router.replace(pathname, { scroll: false });
      }
    },
    [router, pathname],
  );

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeEra, setActiveEra] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const timelineSectionRef = useRef<HTMLDivElement>(null);

  // Deep-links to /?view=map should not dump the user at the hero.
  // Scrolling into view isn't enough because there's still ~400px of
  // section chrome (view-toggle, filter button, era pills) between the
  // section top and the globe canvas. Just hide the hero in map view.
  const showHero = view !== "map";

  useEffect(() => {
    if (view === "map" && timelineSectionRef.current) {
      timelineSectionRef.current.scrollIntoView({
        behavior: "instant" as ScrollBehavior,
        block: "start",
      });
    }
  }, [view]);

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
        result = result.filter(
          (y) => y.year <= era.start && y.year >= era.end,
        );
      }
    }
    return result;
  }, [years, filters, activeEra]);

  const activeFilterCount =
    filters.categories.length +
    filters.certainties.length +
    (filters.region ? 1 : 0);

  const handleExplore = useCallback(() => {
    timelineSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {showHero && <HeroSection onExplore={handleExplore} />}

      <section
        ref={timelineSectionRef}
        className={
          view === "map"
            ? "mx-auto max-w-6xl px-5 sm:px-8 py-4 sm:py-6"
            : "mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-16"
        }
      >
        {view !== "map" && (
          <header className="notebook-section-head">
            <span
              className="notebook-section-num"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--notebook-text-meta)",
                color: "var(--stamp)",
                letterSpacing: "0.14em",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              § Timeline
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 38px)",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: "var(--fg)",
                margin: "4px 0 6px",
              }}
            >
              The folio, chronologically
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--fg-mute)",
                margin: 0,
                letterSpacing: "0.04em",
              }}
            >
              {filteredYears.length.toLocaleString()} entr
              {filteredYears.length === 1 ? "y" : "ies"} displayed
              {activeEra && ` · ${activeEra} era`}
              {filters.search && ` · matching "${filters.search}"`}
            </p>
            <span
              className="notebook-rule notebook-section-rule"
              style={{
                display: "block",
                height: 1,
                background: "var(--rule)",
                marginTop: 18,
              }}
            />
          </header>
        )}

        <div className={view === "map" ? "flex items-center gap-3 mb-4 flex-wrap" : "flex items-center gap-3 mt-6 mb-6 flex-wrap"}>
          <SearchCommand years={years ?? []} />

          <motion.button
            onClick={() => setShowFilters(true)}
            type="button"
            className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm relative"
            style={{
              background: "var(--card)",
              border: "1px solid var(--rule)",
              color: "var(--fg-mute)",
              fontFamily: "var(--font-sans)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="inline-flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: "var(--stamp)",
                  color: "var(--bg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </motion.button>

          <div className="ml-auto">
            <ViewToggle active={view} onChange={setView} />
          </div>
        </div>

        {view !== "map" && (
        <div className="flex gap-2 flex-wrap pb-3 mb-5">
          <EraPill
            active={activeEra === null}
            onClick={() => setActiveEra(null)}
          >
            All Eras
          </EraPill>
          {ERAS.map((era) => (
            <EraPill
              key={era.label}
              active={activeEra === era.label}
              onClick={() =>
                setActiveEra(activeEra === era.label ? null : era.label)
              }
            >
              {era.label}
              <span className="opacity-60 ml-1.5">
                {era.start > 0 ? era.start : `${Math.abs(era.start)} BCE`}
              </span>
            </EraPill>
          ))}
        </div>
        )}

        {eraIndex && view === "timeline" && (
          <ScholarlyEraPillRow index={eraIndex} activeBroadEra={activeEra} />
        )}

        <AnimatePresence mode="wait">
          {view === "timeline" ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{
                duration: 0.25,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <NotebookTimeline
                years={filteredYears}
                isLoading={isLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-4 sm:px-6 lg:px-10"
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
                <div
                  className="py-24 text-center text-sm"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Loading globe…
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
      />
    </motion.div>
  );
}

interface EraPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function EraPill({ active, onClick, children }: EraPillProps) {
  return (
    <motion.button
      onClick={onClick}
      type="button"
      className="shrink-0 rounded-full px-4 py-2"
      style={{
        background: active ? "var(--fg)" : "var(--bg-2)",
        color: active ? "var(--bg)" : "var(--fg-mute)",
        border: `1px solid ${active ? "var(--fg)" : "var(--rule)"}`,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--notebook-text-meta)",
        letterSpacing: "0.12em",
        fontWeight: 600,
        textTransform: "uppercase",
        cursor: "pointer",
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
