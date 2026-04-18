"use client";

import { ERAS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EraNavProps {
  activeEra: string | null;
  onSelect: (era: string | null) => void;
}

export function EraNav({ activeEra, onSelect }: EraNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
          activeEra === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All Eras
      </button>
      {ERAS.map((era) => (
        <button
          key={era.label}
          onClick={() => onSelect(era.label)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            activeEra === era.label
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {era.label}
          <span className="ml-1.5 opacity-50">
            {era.start > 0 ? era.start : `${Math.abs(era.start)} BCE`}
          </span>
        </button>
      ))}
    </div>
  );
}
