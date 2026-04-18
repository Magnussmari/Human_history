"use client";

import { GraduationCap, FileQuestion } from "lucide-react";

interface EducationSkeletonProps {
  valorSource?: string | null;
  reason?: string;
}

export function EducationSkeleton({ valorSource, reason }: EducationSkeletonProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
    >
      <div className="flex items-start gap-3">
        {valorSource ? (
          <GraduationCap size={20} className="text-muted-foreground mt-1 shrink-0" />
        ) : (
          <FileQuestion size={20} className="text-muted-foreground mt-1 shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold mb-1 text-foreground/85">
            {valorSource ? "Awaiting synthesis" : "Unmapped"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {reason ??
              (valorSource
                ? `A VALOR phase_1 source is identified for this era but the era-specific education layer has not been authored yet.`
                : `No VALOR source mapped to this era. Education layer will be added when the tradition is researched.`)}
          </p>
          {valorSource && (
            <p className="mt-2 text-sm font-mono text-muted-foreground/60">
              Source: research/phase_1/{valorSource}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
