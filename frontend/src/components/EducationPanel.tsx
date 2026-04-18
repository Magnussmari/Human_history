"use client";

import type { EducationPilotData } from "@/types/evidence";
import { CapacityGrid } from "./CapacityGrid";

interface EducationPanelProps {
  data: EducationPilotData;
}

export function EducationPanel({ data }: EducationPanelProps) {
  return (
    <div className="space-y-8">
      {data.coreQuestion && (
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Core question
          </p>
          <p
            className="text-base leading-relaxed italic"
            style={{ color: "var(--fg-2)", fontFamily: "var(--font-display)" }}
          >
            {data.coreQuestion}
          </p>
        </div>
      )}

      <CapacityGrid capacities={data.capacities} constants={data.constants} />

      {data.institutions.length > 0 && (
        <Section title="Formation mechanisms">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.institutions.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2.5 align-top text-foreground/80 leading-relaxed">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pedagogicalForm && (
            <p className="mt-3 text-sm text-muted-foreground italic leading-relaxed">
              <span className="font-semibold not-italic">Pedagogical form:</span> {data.pedagogicalForm}
            </p>
          )}
        </Section>
      )}

      {data.stageMapping.length > 0 && (
        <Section title="Educational stage mapping">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.stageMapping.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2.5 align-top text-foreground/80 leading-relaxed">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {data.centralDebate.length > 0 && (
        <Section title="The central debate">
          <div className="space-y-2">
            {data.centralDebate.map((d, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--stamp)" }}>
                  {d.position}
                </p>
                {d.knowledge && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                    <span className="text-foreground/80">Knowledge: </span>{d.knowledge}
                  </p>
                )}
                {d.aiQuestion && (
                  <p className="text-sm italic text-foreground/60 leading-relaxed">
                    {d.aiQuestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.valorFindings.length > 0 && (
        <Section title="Key findings">
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/80 leading-relaxed">
            {data.valorFindings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ol>
        </Section>
      )}

      {data.aiEraImplication && (
        <Section title="AI-era implication">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
            {data.aiEraImplication}
          </p>
        </Section>
      )}

      {data.crossRefL1 && (
        <Section title="Cross-reference to L1">
          <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line">
            {data.crossRefL1}
          </p>
        </Section>
      )}

      {data.canonicalTexts.length > 0 && (
        <Section title="Canonical texts">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.canonicalTexts.map((row, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 align-top text-foreground/75 leading-relaxed text-sm">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="text-base font-semibold mb-3"
        style={{ fontFamily: "var(--font-display)", color: "var(--stamp)" }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
