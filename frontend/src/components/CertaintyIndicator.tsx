import { CERTAINTY_CONFIG } from "@/lib/constants";
import type { CertaintyLevel } from "@/types/history";
import { cn } from "@/lib/utils";

export function CertaintyIndicator({ level }: { level: CertaintyLevel }) {
  const config = CERTAINTY_CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold uppercase tracking-wider",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
