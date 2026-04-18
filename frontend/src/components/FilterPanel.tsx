/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, SlidersHorizontal } from "lucide-react";
import { CATEGORY_CONFIG, CERTAINTY_CONFIG } from "@/lib/constants";
import type { FilterState } from "@/lib/data";
import type { EventCategory, CertaintyLevel } from "@/types/history";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
}: FilterPanelProps) {
  const toggleCategory = (cat: EventCategory) => {
    const cats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: cats });
  };

  const toggleCertainty = (cert: CertaintyLevel) => {
    const certs = filters.certainties.includes(cert)
      ? filters.certainties.filter((c) => c !== cert)
      : [...filters.certainties, cert];
    onChange({ ...filters, certainties: certs });
  };

  const activeCount =
    filters.categories.length +
    filters.certainties.length +
    (filters.region ? 1 : 0);

  const handleClear = () => {
    onChange({
      categories: [],
      certainties: [],
      search: filters.search,
      region: "",
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{
              background: "color-mix(in oklab, var(--fg) 36%, transparent)",
              backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[340px] overflow-y-auto"
            style={{
              background: "var(--card)",
              borderLeft: "1px solid var(--rule)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{
                borderBottom: "1px solid var(--rule)",
                background: "var(--card)",
              }}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} style={{ color: "var(--stamp)" }} />
                <span
                  className="text-sm font-bold uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.22em",
                    color: "var(--stamp)",
                  }}
                >
                  Filters
                </span>
                {activeCount > 0 && (
                  <span
                    className="inline-flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: "var(--stamp)",
                      color: "var(--bg)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-sm uppercase tracking-[0.14em] transition-colors"
                    style={{
                      color: "var(--fg-mute)",
                      fontFamily: "var(--font-mono)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--stamp)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--fg-mute)")
                    }
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="h-7 w-7 rounded-sm flex items-center justify-center transition-colors"
                  style={{ color: "var(--fg-mute)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--fg)";
                    e.currentTarget.style.background = "var(--bg-2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--fg-mute)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  aria-label="Close filters"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="px-5 py-5 space-y-7">
              <div>
                <h3
                  className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Categories
                </h3>
                <div className="space-y-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map(
                    (cat) => {
                      const active = filters.categories.includes(cat);
                      return (
                        <motion.button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={cn(
                            "w-full flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-all text-left",
                          )}
                          style={{
                            background: active ? "var(--stamp-soft)" : "transparent",
                            border: active
                              ? "1px solid color-mix(in oklab, var(--stamp) 40%, transparent)"
                              : "1px solid transparent",
                            color: active ? "var(--fg)" : "var(--fg-2)",
                            fontFamily: "var(--font-sans)",
                          }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: `var(--cat-${cat}, var(--fg-mute))` }}
                          />
                          <span className="flex-1">
                            {CATEGORY_CONFIG[cat].label}
                          </span>
                          {active && (
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: "var(--stamp)" }}
                            />
                          )}
                        </motion.button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <h3
                  className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Certainty
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CERTAINTY_CONFIG) as CertaintyLevel[]).map(
                    (cert) => {
                      const active = filters.certainties.includes(cert);
                      return (
                        <motion.button
                          key={cert}
                          onClick={() => toggleCertainty(cert)}
                          className="rounded-full px-3 py-1 text-sm font-semibold transition-colors"
                          style={{
                            background: active ? "var(--fg)" : "transparent",
                            color: active ? "var(--bg)" : "var(--fg-2)",
                            border: active
                              ? "1px solid var(--fg)"
                              : "1px solid var(--rule)",
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                        >
                          {CERTAINTY_CONFIG[cert].label}
                        </motion.button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <h3
                  className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
                  style={{
                    color: "var(--fg-mute)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Region
                </h3>
                <Input
                  placeholder="Filter by region…"
                  value={filters.region}
                  onChange={(e) =>
                    onChange({ ...filters, region: e.target.value })
                  }
                  className="h-9 text-sm"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--rule)",
                    color: "var(--fg)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
