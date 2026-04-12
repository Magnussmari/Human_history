"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, ArrowRight } from "lucide-react";
import type { YearData } from "@/types/history";
import { searchEvents } from "@/lib/data";
import { safeCategoryConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
      <mark className="bg-transparent font-semibold" style={{ color: "var(--gold)" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** Parse a query string as a historical year number. Returns the year integer or null. */
function parseYearQuery(query: string): number | null {
  const q = query.trim();
  // "476 BCE" or "476 BC"
  const bce = q.match(/^(\d{1,4})\s*(bce|bc)$/i);
  if (bce) {
    const n = parseInt(bce[1], 10);
    if (n >= 1 && n <= 3200) return -n;
  }
  // "-776" (raw negative)
  const neg = q.match(/^-(\d{1,4})$/);
  if (neg) {
    const n = parseInt(neg[1], 10);
    if (n >= 1 && n <= 3200) return -n;
  }
  // "476" or "476 CE" or "476 AD"
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

  // Group results by century
  const groupedResults = results.reduce<Record<string, typeof results>>((acc, r) => {
    const century = Math.floor(r.year / 100) * 100;
    const label = century < 0 ? `${Math.abs(century)}s BCE` : `${century}s CE`;
    if (!acc[label]) acc[label] = [];
    acc[label].push(r);
    return acc;
  }, {});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (year: number) => {
      setOpen(false);
      router.push(`/year/${year}`);
    },
    [router]
  );

  const hasResults = yearJump !== null || Object.keys(groupedResults).length > 0;

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all flex-1 sm:flex-none sm:min-w-[220px]"
        style={{ background: "#111111", border: "1px solid #222222" }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Search size={14} className="shrink-0" />
        <span className="hidden sm:inline text-left flex-1">Search or jump to a year…</span>
        <span className="inline sm:hidden">Search</span>
        <kbd
          className="hidden sm:inline ml-auto rounded px-1.5 py-0.5 text-[10px] font-mono shrink-0"
          style={{
            background: "rgba(232,200,138,0.08)",
            border: "1px solid rgba(232,200,138,0.15)",
            color: "var(--gold)",
          }}
        >
          ⌘K
        </kbd>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/65 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              key="search-dialog"
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "#0d0d0d", border: "1px solid #222222" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div
                  className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(232,200,138,0.2)",
                    background: "rgba(232,200,138,0.03)",
                  }}
                >
                  <Search size={16} className="text-muted-foreground/50 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, people, places… or type a year (e.g. 476, 776 BCE)"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border-0"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="text-muted-foreground/40 hover:text-muted-foreground text-xs transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[54vh] overflow-y-auto">
                {query.length < 1 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground/50 mb-2">Search across {years.length.toLocaleString()} years of history</p>
                    <p className="text-xs text-muted-foreground/30">
                      Try "Julius Caesar", "Black Death", or type a year like "1453"
                    </p>
                  </div>
                ) : !hasResults ? (
                  <p className="py-12 text-center text-sm text-muted-foreground/50">
                    No results for <span style={{ color: "var(--gold)" }}>"{query}"</span>
                  </p>
                ) : (
                  <div className="p-2">
                    {/* Year jump — always first when query looks like a year */}
                    {yearJump !== null && (
                      <div className="mb-1">
                        <motion.button
                          onClick={() => handleSelect(yearJump)}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/20"
                          style={{
                            border: "1px solid rgba(232,200,138,0.15)",
                            background: "rgba(232,200,138,0.03)",
                          }}
                          whileHover={{ x: 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                            style={{ background: "rgba(232,200,138,0.1)", color: "var(--gold)" }}
                          >
                            <ArrowRight size={15} />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
                            >
                              Jump to {formatYear(yearJump)}
                            </p>
                            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                              View all events for this year
                            </p>
                          </div>
                        </motion.button>
                      </div>
                    )}

                    {/* Event results grouped by century */}
                    {Object.entries(groupedResults).map(([century, items]) => (
                      <div key={century} className="mb-2">
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
                          {century}
                        </div>
                        {items.map((r) => (
                          <motion.button
                            key={r.event.id}
                            onClick={() => handleSelect(r.year)}
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/25 transition-colors"
                            whileHover={{ x: 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          >
                            <span
                              className="shrink-0 font-mono text-xs tabular-nums mt-0.5 w-16 text-right"
                              style={{ color: "var(--gold)", opacity: 0.7 }}
                            >
                              {r.yearLabel}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground/90 leading-snug">
                                {highlightMatch(r.event.title, query)}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground/50">
                                  {safeCategoryConfig(r.event.category).label}
                                </span>
                                <span className="text-muted-foreground/25 text-[10px]">·</span>
                                <span className="text-[10px] text-muted-foreground/40 truncate max-w-[180px]">
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

              {/* Footer */}
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{ borderTop: "1px solid #1a1a1a" }}
              >
                <span className="text-[10px] text-muted-foreground/35">
                  {results.length > 0 && `${results.length} event${results.length !== 1 ? "s" : ""} found`}
                </span>
                <span className="text-[10px] text-muted-foreground/35">
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
