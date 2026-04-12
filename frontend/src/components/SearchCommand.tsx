"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search } from "lucide-react";
import type { YearData } from "@/types/history";
import { searchEvents } from "@/lib/data";
import { CATEGORY_CONFIG, safeCategoryConfig } from "@/lib/constants";
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

export function SearchCommand({ years }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = searchEvents(years, query);

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

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-all"
        style={{
          background: "#111111",
          border: "1px solid #222222",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search the Codex...</span>
        <span className="inline sm:hidden">Search</span>
        <kbd
          className="hidden sm:inline ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono"
          style={{
            background: "rgba(232,200,138,0.1)",
            border: "1px solid rgba(232,200,138,0.2)",
            color: "var(--gold)",
          }}
        >
          Cmd K
        </kbd>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              key="search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              key="search-dialog"
              initial={{ opacity: 0, scale: 0.95, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "#111111",
                border: "1px solid #222222",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-5 pt-5 pb-2 border-b"
                style={{ borderColor: "#222222" }}
              >
                <h2
                  className="text-lg font-semibold mb-3"
                  style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
                >
                  Search the Codex
                </h2>
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: "rgba(232,200,138,0.25)",
                    background: "rgba(232,200,138,0.04)",
                  }}
                >
                  <Search size={15} className="text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, figures, years..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-0"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="text-muted-foreground/50 hover:text-muted-foreground text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[52vh] overflow-y-auto p-2">
                {query.length < 2 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search across all {years.length.toLocaleString()} years...
                  </p>
                ) : Object.keys(groupedResults).length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No results found for <span style={{ color: "var(--gold)" }}>"{query}"</span>
                  </p>
                ) : (
                  Object.entries(groupedResults).map(([century, items]) => (
                    <div key={century} className="mb-3">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                        {century}
                      </div>
                      {items.map((r) => (
                        <motion.button
                          key={r.event.id}
                          onClick={() => handleSelect(r.year)}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                          whileHover={{ x: 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                          <span
                            className="shrink-0 font-mono text-xs tabular-nums mt-0.5"
                            style={{ color: "var(--gold)" }}
                          >
                            {r.yearLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {highlightMatch(r.event.title, query)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0 text-[10px] font-medium",
                                  safeCategoryConfig(r.event.category).color
                                )}
                              >
                                {safeCategoryConfig(r.event.category).label}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {r.event.region}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2 border-t flex items-center justify-between"
                style={{ borderColor: "#222222" }}
              >
                <span className="text-[10px] text-muted-foreground/50">
                  {results.length > 0 && `${results.length} result${results.length !== 1 ? "s" : ""}`}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  Press <kbd className="font-mono">Esc</kbd> to close
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
