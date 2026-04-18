"use client";

import type { CapacityEntry, ConstantEntry } from "@/types/evidence";
import { safeLevelConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CapacityGridProps {
  capacities: CapacityEntry[];
  constants: ConstantEntry[];
}

export function CapacityGrid({ capacities, constants }: CapacityGridProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
          7 capacity categories
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {capacities.map(c => {
            const level = safeLevelConfig(c.level);
            return (
              <div
                key={c.id}
                className="rounded-lg p-3"
                style={{ background: "#111111", border: "1px solid #222222" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground/90 leading-tight">
                    {c.name}
                  </span>
                  <span className={cn("shrink-0 text-sm font-semibold rounded-full px-2 py-0.5", level.color)}>
                    {c.level || "—"}
                  </span>
                </div>
                {c.evidence && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.evidence}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {constants.length > 0 && (
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
            5 civilisational constants
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {constants.map(k => (
              <div
                key={k.id}
                className="rounded-lg p-3"
                style={{ background: "#111111", border: "1px solid #222222" }}
              >
                <p className="text-sm font-medium text-foreground/90 mb-1">{k.name}</p>
                <p className="text-sm text-muted-foreground">{k.state || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
