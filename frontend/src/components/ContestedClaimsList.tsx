"use client";

import type { ContestedClaim } from "@/types/evidence";
import { safeVerdictConfig } from "@/lib/constants";
import { CitationChip } from "./CitationChip";
import { cn } from "@/lib/utils";

interface ContestedClaimsListProps {
  claims: ContestedClaim[];
}

export function ContestedClaimsList({ claims }: ContestedClaimsListProps) {
  if (!claims?.length) return null;
  return (
    <div className="space-y-3">
      {claims.map((c, i) => {
        const status = safeVerdictConfig(c.status);
        return (
          <div
            key={i}
            className="rounded-xl p-4"
            style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className={cn("text-sm font-semibold rounded-full px-2 py-0.5 shrink-0", status.color)}>
                {status.label}
              </span>
              <p className="text-sm font-medium text-foreground/90 leading-snug">{c.claim}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.evidentiary_basis}</p>
            {c.key_citations && c.key_citations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.key_citations.map(doi => (
                  <CitationChip key={doi} doi={doi} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
