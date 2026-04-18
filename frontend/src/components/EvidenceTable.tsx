"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, AlertTriangle } from "lucide-react";
import type { SciteEvidence } from "@/types/evidence";
import { safeTierConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EvidenceTableProps {
  evidence: SciteEvidence[];
}

export function EvidenceTable({ evidence }: EvidenceTableProps) {
  if (!evidence?.length) {
    return <p className="text-sm text-muted-foreground">No evidence records.</p>;
  }

  return (
    <div className="space-y-3">
      {evidence.map((e, i) => (
        <EvidenceRow key={`${e.doi}-${i}`} evidence={e} />
      ))}
    </div>
  );
}

function EvidenceRow({ evidence: e }: { evidence: SciteEvidence }) {
  const [open, setOpen] = useState(false);
  const tier = safeTierConfig(e.tier);
  const hasNotices = e.editorial_notices && e.editorial_notices.length > 0;
  const fmtCount = (n: number | null) => (n == null ? "—" : n.toLocaleString());

  return (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold rounded-full px-2 py-0.5", tier.color)}>
              {tier.label}
            </span>
            {hasNotices && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold rounded-full px-2 py-0.5 bg-rose-900/40 text-rose-200 border border-rose-800/40">
                <AlertTriangle size={9} />
                {e.editorial_notices.map(n => n.type).join(", ")}
              </span>
            )}
            {e.publication_type && (
              <span className="text-sm uppercase tracking-wider text-muted-foreground">
                {e.publication_type}
              </span>
            )}
          </div>
          <h4
            className="text-sm font-semibold leading-snug mb-1"
            style={{ color: "var(--foreground)" }}
          >
            {e.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {e.authors?.join("; ")}
            {e.journal && <> · <em>{e.journal}</em></>}
            {e.year != null && <> · {e.year}</>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {e.access?.url && (
            <a
              href={e.access.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
            >
              {e.access.status} <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
        {e.key_finding}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground">
        <span>supporting: {fmtCount(e.supporting_count)}</span>
        <span>contrasting: {fmtCount(e.contrasting_count)}</span>
        <span>mentioning: {fmtCount(e.mentioning_count)}</span>
        <span>cited by: {fmtCount(e.citing_publications_count)}</span>
        <span className="ml-auto truncate max-w-[24ch]" title={e.doi}>
          {e.doi}
        </span>
      </div>

      {e.excerpt && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="mt-3 inline-flex items-center gap-1 text-sm uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          {open ? "Hide excerpt" : "Show excerpt"}
          <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      )}
      {open && e.excerpt && (
        <blockquote className="mt-2 pl-3 border-l-2 border-primary/30 text-sm italic text-foreground/70 leading-relaxed">
          {e.excerpt}
        </blockquote>
      )}

      {e.tier_rule_applied && (
        <p className="mt-2 text-sm font-mono text-muted-foreground/50 leading-relaxed">
          {e.tier_rule_applied}
        </p>
      )}
    </div>
  );
}
