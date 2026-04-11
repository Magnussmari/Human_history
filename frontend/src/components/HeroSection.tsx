"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChevronDown, BookOpen, ExternalLink } from "lucide-react";
import { fetchManifest, fetchProgress } from "@/lib/data";
import { TOTAL_YEARS } from "@/lib/constants";
import { ProgressRing } from "./ProgressRing";

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 28 } },
  },
};

interface HeroSectionProps {
  onExplore: () => void;
}

export function HeroSection({ onExplore }: HeroSectionProps) {
  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    refetchInterval: 60_000,
  });

  const completed = progress?.completed?.length ?? 0;
  const totalEvents = manifest?.total_events ?? 0;

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background radial glow -- very subtle */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 35%, rgba(232,200,138,0.04) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center max-w-4xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div variants={stagger.item} className="mb-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em]"
            style={{
              borderColor: "rgba(232,200,138,0.3)",
              color: "var(--gold)",
              background: "rgba(232,200,138,0.06)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            AI-Generated Historical Record
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={stagger.item}
          className="glow-title text-4xl sm:text-7xl lg:text-9xl font-bold tracking-[-0.02em] leading-none mb-3"
          style={{
            fontFamily: "var(--font-heading), Georgia, serif",
            color: "var(--gold)",
          }}
        >
          ETERNAL
        </motion.h1>
        <motion.h1
          variants={stagger.item}
          className="text-4xl sm:text-7xl lg:text-9xl font-bold tracking-[-0.02em] leading-none mb-6"
          style={{
            fontFamily: "var(--font-heading), Georgia, serif",
            color: "var(--foreground)",
            opacity: 0.9,
          }}
        >
          CODEX
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={stagger.item}
          className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed"
        >
          Human History According to AI
        </motion.p>

        {/* Description */}
        <motion.p
          variants={stagger.item}
          className="text-sm text-muted-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Every year from 2025 CE to 3200 BCE, researched year-by-year by Claude Sonnet using the
          ICCRA schema. Structured JSON with events, sources, certainty levels, and cross-references.{" "}
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Open source. Contribute.
          </a>
        </motion.p>

        {/* Progress Ring + Stats */}
        <motion.div
          variants={stagger.item}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-10"
        >
          <ProgressRing size={100} strokeWidth={6} />

          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div
                className="text-3xl sm:text-4xl font-bold tabular-nums mb-1"
                style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
              >
                {completed.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Years<br />Researched
              </div>
            </div>
            <div>
              <div
                className="text-3xl sm:text-4xl font-bold tabular-nums mb-1"
                style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
              >
                {totalEvents.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Events<br />Documented
              </div>
            </div>
            <div>
              <div
                className="text-3xl sm:text-4xl font-bold tabular-nums mb-1"
                style={{ fontFamily: "var(--font-heading), serif", color: "var(--gold)" }}
              >
                {TOTAL_YEARS.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Total Years<br />in Scope
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={stagger.item}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <motion.button
            onClick={onExplore}
            className="gold-button rounded-lg px-8 py-3 text-sm font-semibold tracking-wide uppercase flex items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <BookOpen size={15} />
            Explore the Timeline
          </motion.button>
          <motion.a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm text-muted-foreground border border-border/50 hover:border-border hover:text-foreground transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ExternalLink size={15} />
            Contribute on GitHub
          </motion.a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          variants={stagger.item}
          onClick={onExplore}
          className="inline-flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Scroll to timeline"
        >
          <span className="text-[10px] uppercase tracking-[0.25em]">Scroll to explore</span>
          <ChevronDown size={18} className="animate-chevron-bounce" />
        </motion.button>
      </motion.div>
    </section>
  );
}
