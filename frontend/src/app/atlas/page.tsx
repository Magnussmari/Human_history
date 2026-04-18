/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  fetchManifest,
  fetchAllYears,
  filterYears,
  DEFAULT_FILTERS,
} from "@/lib/data";
import { GlobeAtlas } from "@/components/atlas/GlobeAtlas";

export default function AtlasPage() {
  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: years } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const filteredYears = useMemo(
    () => (years ? filterYears(years, DEFAULT_FILTERS) : []),
    [years],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6"
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
          className="py-24 text-center"
          style={{
            color: "var(--fg-mute)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Loading atlas…
        </div>
      )}
    </motion.div>
  );
}
