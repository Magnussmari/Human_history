/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowRight, BookOpen } from "lucide-react";
import type { YearData } from "@/types/history";
import { searchEvents } from "@/lib/data";
import { fetchEraIndex, formatEraRange } from "@/lib/evidence";
import { safeCategoryConfig, safePhaseStatusConfig } from "@/lib/constants";

interface SearchCommandProps {
  years: YearData[];
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        className="bg-transparent font-semibold"
        style={{ color: "var(--stamp)" }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function parseYearQuery(query: string): number | null {
  const q = query.trim();
  const bce = q.match(/^(\d{1,4})\s*(bce|bc)$/i);
  if (bce) {
    const n = parseInt(bce[1], 10);
    if (n >= 1 && n <= 3200) return -n;
  }
  const neg = q.match(/^-(\d{1,4})$/);
  if (neg) {
    const n = parseInt(neg[1], 10);
    if (n >= 1 && n <= 3200) return -n;
  }
  const ce = q.match(/^(\d{1,4})\s*(ce|ad)?$/i);
  if (ce) {
    const n = parseInt(ce[1], 10);
    if (n >= 1 && n <= 2025) return n;
  }
  return null;
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export function SearchCommand({ years }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = searchEvents(years, query);
  const yearJump = parseYearQuery(query);

  const { data: eraIndex } = useQuery({
    queryKey: ["era-index"],
    queryFn: fetchEraIndex,
  });

  const eraResults = (() => {
    if (!eraIndex || query.length < 2) return [];
    const q = query.toLowerCase();
    return eraIndex.registry
      .filter((e) => e.label.toLowerCase().includes(q))
      .slice(0, 6);
  })();

  const groupedResults = results.reduce<Record<string, typeof results>>(
    (acc, r) => {
      const century = Math.floor(r.year / 100) * 100;
      const label = century < 0 ? `${Math.abs(century)}s BCE` : `${century}s CE`;
      if (!acc[label]) acc[label] = [];
      acc[label].push(r);
      return acc;
    },
    {},
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const handleSelect = useCallback(
    (year: number) => {
      setOpen(false);
      setQuery("");
      router.push(`/year/${year}`);
    },
    [router],
  );

  const hasResults =
    yearJump !== null ||
    eraResults.length > 0 ||
    Object.keys(groupedResults).length > 0;

  const handleEraSelect = useCallback(
    (eraId: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/era/${eraId}`);
    },
    [router],
  );

  return (
    <>
      <motion.button
        onClick={openDialog}
        type="button"
        className="flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm flex-1 sm:flex-none sm:min-w-[240px]"
        style={{
          background: "var(--card)",
          border: "1px solid var(--rule)",
          color: "var(--fg-mute)",
          fontFamily: "var(--font-sans)",
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search size={13} className="shrink-0" />
        <span className="hidden sm:inline text-left flex-1">
          Search events, people, places…
        </span>
        <span className="inline sm:hidden">Search</span>
        <kbd
          className="hidden sm:inline ml-auto rounded px-1.5 py-0.5 text-sm shrink-0"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--rule)",
            color: "var(--fg-mute)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ⌘K
        </kbd>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0"
              style={{
                background: "color-mix(in oklab, var(--fg) 55%, transparent)",
                backdropFilter: "blur(6px)",
              }}
              onClick={closeDialog}
            />

            <motion.div
              key="search-dialog"
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative w-full max-w-xl rounded-md overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--rule)",
                boxShadow: "0 24px 60px -20px rgba(0,0,0,0.35)",
                fontFamily: "var(--font-sans)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-5 pt-5 pb-3"
                style={{ borderBottom: "1px solid var(--rule)" }}
              >
                <div
                  className="flex items-center gap-3 rounded-sm px-4 py-3"
                  style={{
                    border: "1px solid var(--rule)",
                    background: "var(--bg-2)",
                  }}
                >
                  <Search
                    size={14}
                    style={{ color: "var(--fg-mute)" }}
                    className="shrink-0"
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search — or type a year (e.g. 476, 776 BCE)"
                    className="flex-1 bg-transparent text-[14px] outline-none border-0"
                    style={{
                      color: "var(--fg)",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="text-sm transition-colors"
                      style={{
                        color: "var(--fg-mute)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[54vh] overflow-y-auto">
                {query.length < 1 ? (
                  <div className="py-12 text-center">
                    <p
                      className="text-sm mb-2"
                      style={{ color: "var(--fg-mute)" }}
                    >
                      Search across {years.length.toLocaleString()} years of
                      history.
                    </p>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--fg-mute)",
                        fontStyle: "italic",
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      Try &ldquo;Julius Caesar&rdquo;, &ldquo;Black
                      Death&rdquo;, or a year like &ldquo;1453&rdquo;.
                    </p>
                  </div>
                ) : !hasResults ? (
                  <p
                    className="py-12 text-center text-sm"
                    style={{ color: "var(--fg-mute)" }}
                  >
                    No results for{" "}
                    <span style={{ color: "var(--stamp)" }}>
                      &ldquo;{query}&rdquo;
                    </span>
                  </p>
                ) : (
                  <div className="p-2">
                    {yearJump !== null && (
                      <div className="mb-1">
                        <motion.button
                          onClick={() => handleSelect(yearJump)}
                          type="button"
                          className="flex w-full items-center gap-3 rounded-sm px-4 py-3 text-left transition-colors"
                          style={{
                            border:
                              "1px solid color-mix(in oklab, var(--stamp) 30%, transparent)",
                            background: "var(--stamp-soft)",
                          }}
                          whileHover={{ x: 2 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-sm shrink-0"
                            style={{
                              background: "var(--stamp-soft)",
                              color: "var(--stamp)",
                            }}
                          >
                            <ArrowRight size={14} />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{
                                fontFamily: "var(--font-display)",
                                color: "var(--stamp)",
                              }}
                            >
                              Open folio for {formatYear(yearJump)}
                            </p>
                            <p
                              className="text-sm mt-0.5"
                              style={{ color: "var(--fg-mute)" }}
                            >
                              View all events for this year
                            </p>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {eraResults.length > 0 && (
                      <div className="mb-2">
                        <div
                          className="px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.2em]"
                          style={{
                            color: "var(--fg-mute)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          Scholarly eras
                        </div>
                        {eraResults.map((era) => {
                          const phase = safePhaseStatusConfig(era.phaseStatus);
                          return (
                            <motion.button
                              key={era.id}
                              onClick={() => handleEraSelect(era.id)}
                              type="button"
                              className="flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left transition-colors"
                              whileHover={{ x: 2 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--bg-2)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-sm shrink-0"
                                style={{
                                  background:
                                    "color-mix(in oklab, var(--leaf) 24%, transparent)",
                                  color: "var(--leaf)",
                                }}
                              >
                                <BookOpen size={13} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium leading-snug"
                                  style={{ color: "var(--fg)" }}
                                >
                                  {highlightMatch(era.label, query)}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="inline-flex items-center gap-1 text-sm"
                                    style={{ color: "var(--fg-mute)" }}
                                  >
                                    <span
                                      className="h-1 w-1 rounded-full"
                                      style={{ background: "var(--stamp)" }}
                                    />
                                    {phase.label}
                                  </span>
                                  <span
                                    className="text-sm"
                                    style={{ color: "var(--fg-mute)" }}
                                  >
                                    ·
                                  </span>
                                  <span
                                    className="text-sm"
                                    style={{ color: "var(--fg-mute)" }}
                                  >
                                    {formatEraRange(era)}
                                  </span>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {Object.entries(groupedResults).map(([century, items]) => (
                      <div key={century} className="mb-2">
                        <div
                          className="px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.2em]"
                          style={{
                            color: "var(--fg-mute)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {century}
                        </div>
                        {items.map((r) => (
                          <motion.button
                            key={r.event.id}
                            onClick={() => handleSelect(r.year)}
                            type="button"
                            className="flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left transition-colors"
                            whileHover={{ x: 2 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--bg-2)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <span
                              className="shrink-0 text-sm tabular-nums mt-0.5 w-16 text-right"
                              style={{
                                color: "var(--stamp)",
                                fontFamily: "var(--font-mono)",
                                letterSpacing: "0.04em",
                              }}
                            >
                              {r.yearLabel}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium leading-snug"
                                style={{ color: "var(--fg)" }}
                              >
                                {highlightMatch(r.event.title, query)}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className="text-sm"
                                  style={{
                                    color: "var(--fg-mute)",
                                    fontFamily: "var(--font-mono)",
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {safeCategoryConfig(r.event.category).label}
                                </span>
                                <span
                                  className="text-sm"
                                  style={{ color: "var(--fg-mute)" }}
                                >
                                  ·
                                </span>
                                <span
                                  className="text-sm truncate max-w-[180px]"
                                  style={{ color: "var(--fg-mute)" }}
                                >
                                  {r.event.region}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  borderTop: "1px solid var(--rule)",
                  background: "var(--bg-2)",
                }}
              >
                <span
                  className="text-sm"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {results.length > 0 &&
                    `${results.length} event${results.length !== 1 ? "s" : ""} found`}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <kbd className="font-mono">Esc</kbd> to close
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
