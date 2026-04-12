"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, AlertTriangle, BookOpen, GitBranch, Info } from "lucide-react";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import { DOC_LEVEL_CONFIG, getEraForYear, formatYear, CATEGORY_CONFIG, safeCategoryConfig } from "@/lib/constants";
import { EventCard } from "@/components/EventCard";
import { cn } from "@/lib/utils";

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

const RELATION_LABELS: Record<string, string> = {
  caused_by: "caused by",
  led_to: "led to",
  contemporary_with: "contemporary with",
  contradicts: "contradicts",
  part_of: "part of",
};

export default function YearPage() {
  const params = useParams();
  const yearId = Number(params.id);

  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: allYears, isLoading } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const year = allYears?.find((y) => y.year === yearId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-6 animate-fade-in">
        <div className="h-5 w-32 rounded bg-muted/50 animate-pulse" />
        <div className="space-y-3 pt-4">
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-muted/50 animate-pulse" />
            <div className="h-6 w-32 rounded-full bg-muted/50 animate-pulse" />
          </div>
          <div className="h-20 w-64 rounded-lg bg-muted/40 animate-pulse" style={{ animationDelay: "100ms" }} />
          <div className="h-5 w-full max-w-xl rounded bg-muted/30 animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="h-5 w-3/4 rounded bg-muted/30 animate-pulse" style={{ animationDelay: "200ms" }} />
        </div>
        <div className="space-y-3 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!year) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <h1
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
          >
            {formatYear(yearId)}
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">This year has not yet been researched.</p>
          <p className="text-sm text-muted-foreground/60 mb-8 max-w-sm mx-auto">
            The Codex is a living document. Each year is researched and verified before it appears.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all gold-button"
          >
            <ArrowLeft size={14} />
            Return to timeline
          </Link>
        </motion.div>
      </div>
    );
  }

  const era = getEraForYear(year.year);
  const docConfig = DOC_LEVEL_CONFIG[year.documentation_level];

  const stagger = {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    },
    item: {
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 250, damping: 28 } },
    },
  };

  return (
    <motion.div
      className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to timeline
      </Link>

      <motion.div variants={stagger.container} initial="hidden" animate="show">
        {/* Year Hero */}
        <motion.div variants={stagger.item} className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={cn(
                "text-[11px] font-semibold rounded-full px-3 py-1 uppercase tracking-wider",
                ERA_CLASS_MAP[era.label] ?? "bg-muted text-muted-foreground"
              )}
            >
              {era.label}
            </span>
            <span className={cn("text-xs font-medium", docConfig.color)}>
              {docConfig.label} documentation
            </span>
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn("h-1.5 w-1.5 rounded-full", i < docConfig.bars ? "opacity-100" : "opacity-15 bg-muted")}
                  style={i < docConfig.bars ? { background: "var(--gold)" } : undefined}
                />
              ))}
            </div>
          </div>

          <h1
            className="glow-title text-5xl sm:text-7xl lg:text-9xl font-bold leading-none mb-4 tabular-nums"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
          >
            {year.year_label}
          </h1>

          <p
            className="text-base sm:text-xl lg:text-2xl leading-relaxed max-w-3xl italic"
            style={{ fontFamily: "var(--font-heading), serif", color: "#d1c2a8", lineHeight: 1.7 }}
          >
            {year.era_context}
          </p>
        </motion.div>

        {/* Geographic Gaps */}
        {year.geographic_coverage_gaps.length > 0 && (
          <motion.div variants={stagger.item} style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 13, color: "#8a7d6b", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Coverage gaps
            </p>
            <p style={{ fontSize: 15, color: "#d1c2a8", lineHeight: 1.8 }}>
              {year.geographic_coverage_gaps.join("  /  ")}
            </p>
          </motion.div>
        )}

        {/* Events */}
        <motion.div variants={stagger.item} className="mb-10">
          <h2
            className="text-2xl font-semibold mb-5 flex items-center gap-2"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            Events
            <span
              className="text-sm rounded-full px-2.5 py-0.5 font-normal tabular-nums"
              style={{
                background: "rgba(232,200,138,0.12)",
                color: "var(--gold)",
                border: "1px solid rgba(232,200,138,0.2)",
              }}
            >
              {year.events.length}
            </span>
          </h2>

          {year.events.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {[...new Set(year.events.map((e) => e.category))].map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "#1a1a1a",
                    border: "1px solid #222222",
                    color: "#d1c2a8",
                    fontWeight: 500,
                  }}
                >
                  {safeCategoryConfig(cat).label}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {year.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </motion.div>

        {/* Disconfirming Evidence */}
        {year.disconfirming_evidence && (
          <motion.div
            variants={stagger.item}
            className="mb-8 rounded-2xl p-7"
            style={{
              background: "#111111",
              border: "1px solid #222222",
            }}
          >
            <h3
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4"
              style={{ color: "#c44b7a" }}
            >
              <AlertTriangle size={13} />
              Disconfirming Evidence
            </h3>
            <p style={{ color: "#f4e9d8", fontSize: "17px", lineHeight: 1.7 }}>
              {year.disconfirming_evidence}
            </p>
          </motion.div>
        )}

        {/* Historiographic Note */}
        {year.historiographic_note && (
          <motion.div
            variants={stagger.item}
            className="mb-8 rounded-2xl p-7"
            style={{
              background: "#111111",
              border: "1px solid #222222",
            }}
          >
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] mb-4 text-muted-foreground">
              <BookOpen size={13} />
              Historiographic Note
            </h3>
            <p className="italic" style={{ color: "#d1c2a8", fontSize: "17px", lineHeight: 1.7 }}>
              {year.historiographic_note}
            </p>
          </motion.div>
        )}

        {/* Graph Edges */}
        {year.graph_edges.length > 0 && (
          <motion.div variants={stagger.item} className="mb-6">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
              <GitBranch size={13} />
              Cross-Year Connections
            </h3>
            <div className="space-y-2">
              {year.graph_edges.map((edge, i) => {
                const fromYear = parseInt(edge.from.split("_")[0], 10);
                const toYear = parseInt(edge.to.split("_")[0], 10);
                return (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm"
                    style={{
                      background: "rgba(232,200,138,0.04)",
                      border: "1px solid rgba(232,200,138,0.1)",
                    }}
                  >
                    {!isNaN(fromYear) ? (
                      <Link
                        href={`/year/${fromYear}`}
                        className="font-mono text-xs hover:text-primary transition-colors"
                        style={{ color: "var(--gold)" }}
                      >
                        {edge.from}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs" style={{ color: "var(--gold)" }}>
                        {edge.from}
                      </span>
                    )}
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: "rgba(232,200,138,0.12)",
                        color: "var(--gold)",
                        border: "1px solid rgba(232,200,138,0.2)",
                      }}
                    >
                      {RELATION_LABELS[edge.relation] ?? edge.relation.replace(/_/g, " ")}
                    </span>
                    {!isNaN(toYear) ? (
                      <Link
                        href={`/year/${toYear}`}
                        className="font-mono text-xs hover:text-primary transition-colors"
                        style={{ color: "rgba(232,200,138,0.7)" }}
                      >
                        {edge.to}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{edge.to}</span>
                    )}
                    {edge.note && (
                      <span className="text-xs text-foreground/45 ml-auto hidden sm:block truncate max-w-xs">
                        {edge.note}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Meta footer */}
        {year._meta && (
          <motion.div
            variants={stagger.item}
            className="mt-10 pt-6 border-t"
            style={{ borderColor: "rgba(232,200,138,0.1)" }}
          >
            <div className="flex items-center gap-1.5 mb-2 text-muted-foreground/50">
              <Info size={11} />
              <span className="text-[10px] uppercase tracking-[0.18em]">Research Metadata</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/40 leading-relaxed">
              Model: {year._meta.model}
              {year._meta.method && ` | Method: ${year._meta.method}`}
              {year._meta.cost_usd != null && ` | Cost: $${year._meta.cost_usd.toFixed(4)}`}
              {year._meta.cached && ` | Cached`}
              {` | Processed: ${year._meta.processed_at}`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
