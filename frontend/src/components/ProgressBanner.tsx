"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProgress } from "@/lib/data";
import { TOTAL_YEARS, formatYear } from "@/lib/constants";

export function ProgressBanner() {
  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    refetchInterval: 60_000,
  });

  const completed = progress?.completed?.length ?? 0;
  const pct = ((completed / TOTAL_YEARS) * 100).toFixed(1);
  const oldest = progress?.completed?.length
    ? Math.min(...progress.completed)
    : 2025;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-primary font-medium">
          Research Progress
        </span>
        <span className="font-mono text-muted-foreground">
          {completed.toLocaleString()} / {TOTAL_YEARS.toLocaleString()} years
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
        <span>{pct}% complete</span>
        <span>Currently researching ~{formatYear(oldest)}</span>
      </div>
    </div>
  );
}
