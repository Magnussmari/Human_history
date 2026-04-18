"use client";

import { CATEGORY_CONFIG, CERTAINTY_CONFIG } from "@/lib/constants";
import type { FilterState } from "@/lib/data";
import type { EventCategory, CertaintyLevel } from "@/types/history";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
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

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.certainties.length > 0 ||
    filters.region.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={() =>
              onChange({ categories: [], certainties: [], search: filters.search, region: "" })
            }
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={cn(
              "rounded-full px-2.5 py-1 text-sm font-medium transition-all",
              filters.categories.includes(cat)
                ? CATEGORY_CONFIG[cat].color
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CERTAINTY_CONFIG) as CertaintyLevel[]).map((cert) => (
          <button
            key={cert}
            onClick={() => toggleCertainty(cert)}
            className={cn(
              "rounded-full px-2.5 py-1 text-sm font-medium transition-all",
              filters.certainties.includes(cert)
                ? CERTAINTY_CONFIG[cert].color
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {CERTAINTY_CONFIG[cert].label}
          </button>
        ))}
      </div>

      <Input
        placeholder="Filter by region..."
        value={filters.region}
        onChange={(e) => onChange({ ...filters, region: e.target.value })}
        className="h-8 text-sm"
      />
    </div>
  );
}
