/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { fetchManifest, fetchAllYears } from "@/lib/data";
import { StratumView } from "@/components/stratum/StratumView";

export default function StratumPage() {
  const { data: manifest } = useQuery({
    queryKey: ["manifest"],
    queryFn: fetchManifest,
  });

  const { data: years, isLoading } = useQuery({
    queryKey: ["years", manifest?.generated_at],
    queryFn: () => fetchAllYears(manifest!),
    enabled: !!manifest,
  });

  const [selectedYear, setSelectedYear] = useState<number>(1066);

  // Ensure variant-b body class while this route is mounted
  useEffect(() => {
    const body = document.body;
    body.classList.remove("variant-a", "variant-c");
    body.classList.add("variant-b");
    return () => {
      body.classList.remove("variant-b");
      body.classList.add("variant-a");
    };
  }, []);

  const activeYear = useMemo(() => {
    return years?.find((y) => y.year === selectedYear) ?? null;
  }, [years, selectedYear]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="stratum-wrap"
    >
      {isLoading || !years ? (
        <div className="stratum-loading">Loading {manifest?.total_years ?? 5226} years…</div>
      ) : (
        <StratumView
          years={years}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          activeYear={activeYear}
        />
      )}
    </motion.div>
  );
}
