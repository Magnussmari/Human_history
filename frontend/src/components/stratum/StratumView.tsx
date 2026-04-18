/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { YearData, HistoryEvent, EventCategory, CertaintyLevel } from "@/types/history";
import { safeCategoryConfig } from "@/lib/constants";
import "@/components/stratum/stratum.css";

interface StratumViewProps {
  years: YearData[];
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  activeYear: YearData | null;
}

const CERTAINTY_ORDER: CertaintyLevel[] = ["legendary", "traditional", "approximate", "probable", "confirmed"];

const RANK: Record<string, number> = {
  legendary: 1, traditional: 2, approximate: 2, probable: 3, confirmed: 4,
};

function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString()} BCE`;
  return `${y} CE`;
}

export function StratumView({ years, selectedYear, setSelectedYear, activeYear }: StratumViewProps) {
  const allKnownYears = useMemo(() => years.map((y) => y.year).sort((a, b) => a - b), [years]);
  const yearMin = allKnownYears[0] ?? -3200;
  const yearMax = allKnownYears[allKnownYears.length - 1] ?? 2025;

  const sortedEvents = useMemo(() => activeYear?.events ?? [], [activeYear]);

  return (
    <>
      <StratumRibbon
        years={allKnownYears}
        selected={selectedYear}
        onSelect={setSelectedYear}
        yearMin={yearMin}
        yearMax={yearMax}
      />

      {activeYear ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeYear.year}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="stratum-container"
          >
            <StratumHeader year={activeYear} />
            <StratumStats year={activeYear} />
            <StratumEvents events={sortedEvents} />
            {(activeYear.disconfirming_evidence || activeYear.historiographic_note) && (
              <StratumDissent year={activeYear} />
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="stratum-empty">
          <p>No record on file for {formatYear(selectedYear)}.</p>
          <p className="stratum-empty-hint">
            Use the ribbon above to jump to a researched year.
          </p>
        </div>
      )}
    </>
  );
}

interface StratumRibbonProps {
  years: number[];
  selected: number;
  onSelect: (y: number) => void;
  yearMin: number;
  yearMax: number;
}

function StratumRibbon({ years, selected, onSelect, yearMin, yearMax }: StratumRibbonProps) {
  const span = yearMax - yearMin;
  const ticks = useMemo(() => {
    const step = 500;
    const out: number[] = [];
    for (let y = Math.ceil(yearMin / step) * step; y <= yearMax; y += step) {
      out.push(y);
    }
    return out;
  }, [yearMin, yearMax]);

  const selectedPct = ((selected - yearMin) / span) * 100;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const target = Math.round(yearMin + pct * span);
    if (years.length === 0) return;
    const nearest = years.reduce((best, y) =>
      Math.abs(y - target) < Math.abs(best - target) ? y : best,
    years[0]);
    onSelect(nearest);
  };

  const idx = years.indexOf(selected);
  const prev = idx > 0 ? years[idx - 1] : null;
  const next = idx >= 0 && idx < years.length - 1 ? years[idx + 1] : null;

  const [jumpValue, setJumpValue] = useState("");

  const handleJump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = jumpValue.trim();
    if (!q) return;
    const bce = q.match(/^(\d{1,4})\s*(bce|bc)$/i);
    const neg = q.match(/^-(\d{1,4})$/);
    const ce = q.match(/^(\d{1,4})\s*(ce|ad)?$/i);
    let target: number | null = null;
    if (bce) target = -parseInt(bce[1], 10);
    else if (neg) target = -parseInt(neg[1], 10);
    else if (ce) target = parseInt(ce[1], 10);

    if (target !== null) {
      // Snap to nearest researched year
      const nearest = years.reduce((best, y) =>
        Math.abs(y - target!) < Math.abs(best - target!) ? y : best,
      years[0]);
      onSelect(nearest);
      setJumpValue("");
    }
  };

  return (
    <section className="stratum-ribbon">
      <div className="stratum-ribbon-meta">
        <span className="stratum-ribbon-label">Stratum · instrument view</span>
        <span className="stratum-ribbon-count">
          {years.length.toLocaleString()} entries on file
        </span>
      </div>
      <div
        className="stratum-ribbon-bar"
        onClick={handleBarClick}
        title="Click anywhere on the strip to jump to that year"
      >
        <div className="stratum-ribbon-ticks">
          {ticks.map((t) => (
            <div
              key={t}
              className="stratum-ribbon-tick"
              style={{ left: `${((t - yearMin) / span) * 100}%` }}
            >
              <span>{t < 0 ? `${Math.abs(t)} BCE` : `${t} CE`}</span>
            </div>
          ))}
        </div>
        <div
          className="stratum-ribbon-marker"
          style={{ left: `${selectedPct}%` }}
          aria-hidden="true"
        >
          <span className="stratum-ribbon-marker-label">
            {formatYear(selected)}
          </span>
        </div>
      </div>
      <div className="stratum-ribbon-nav">
        <button
          type="button"
          className="stratum-nav-btn"
          onClick={() => prev && onSelect(prev)}
          disabled={!prev}
        >
          ← {prev ? formatYear(prev) : "—"}
        </button>
        <form onSubmit={handleJump} className="stratum-jump">
          <label htmlFor="stratum-jump-input" className="sr-only">
            Jump to year
          </label>
          <input
            id="stratum-jump-input"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder="Jump — e.g. 1492 or 776 BCE"
            className="stratum-jump-input"
          />
          <button type="submit" className="stratum-jump-btn">
            Jump
          </button>
        </form>
        <button
          type="button"
          className="stratum-nav-btn"
          onClick={() => next && onSelect(next)}
          disabled={!next}
        >
          {next ? formatYear(next) : "—"} →
        </button>
      </div>
    </section>
  );
}

function StratumHeader({ year }: { year: YearData }) {
  const docLevels: Record<string, number> = {
    rich: 4, moderate: 3, sparse: 2, minimal: 1, negligible: 0,
  };
  const doc = docLevels[year.documentation_level] ?? 0;
  return (
    <section className="stratum-head">
      <div className="stratum-head-col">
        <div className="stratum-label">Year</div>
        <h1 className="stratum-year">{formatYear(year.year)}</h1>
      </div>
      <div className="stratum-head-col">
        <div className="stratum-label">Documentation</div>
        <div className="flex items-center gap-[10px]">
          <div className="stratum-docbars">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className={i < doc ? "on" : ""} />
            ))}
          </div>
          <span className="stratum-doc-text">{year.documentation_level}</span>
        </div>
      </div>
      <div className="stratum-head-col stratum-head-era">
        <div className="stratum-label">Era context</div>
        <p className="stratum-era">{year.era_context}</p>
      </div>
    </section>
  );
}

function StratumStats({ year }: { year: YearData }) {
  const stats = useMemo(() => {
    const byCat: Partial<Record<EventCategory, number>> = {};
    const byCert: Partial<Record<CertaintyLevel, number>> = {};
    let contemp = 0;
    let later = 0;
    year.events.forEach((ev) => {
      byCat[ev.category] = (byCat[ev.category] ?? 0) + 1;
      byCert[ev.certainty] = (byCert[ev.certainty] ?? 0) + 1;
      ev.sources.forEach((s) => (s.contemporary ? contemp++ : later++));
    });
    return { byCat, byCert, contemp, later, srcTotal: contemp + later };
  }, [year]);

  const maxEvents = Math.max(1, year.events.length);

  return (
    <section className="stratum-stats">
      <div className="stratum-stat">
        <div className="stratum-label">Events</div>
        <div className="stratum-num">
          {year.events.length.toString().padStart(2, "0")}
        </div>
        <div className="stratum-cats">
          {(Object.entries(stats.byCat) as [EventCategory, number][]).map(
            ([c, n]) => (
              <span
                key={c}
                className="stratum-cat-chip"
                style={{ background: `color-mix(in oklab, var(--cat-${c}, var(--fg-2)) 14%, transparent)`, color: `var(--cat-${c}, var(--fg))`, borderColor: `color-mix(in oklab, var(--cat-${c}, var(--fg-2)) 35%, transparent)` }}
              >
                <span className="stratum-cat-dot" style={{ background: `var(--cat-${c}, var(--fg-2))` }} />
                {safeCategoryConfig(c).label}
                <b>{n}</b>
              </span>
            ),
          )}
        </div>
      </div>

      <div className="stratum-stat">
        <div className="stratum-label">Certainty distribution</div>
        <div className="stratum-cert-chart">
          {CERTAINTY_ORDER.map((c) => (
            <div key={c} className="stratum-cert-row">
              <span className="stratum-cert-name">{c}</span>
              <span className="stratum-cert-bar">
                <span
                  className={"stratum-cert-fill stratum-cert-" + c}
                  style={{
                    width: `${((stats.byCert[c] ?? 0) / maxEvents) * 100}%`,
                  }}
                />
              </span>
              <span className="stratum-cert-num">{stats.byCert[c] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stratum-stat">
        <div className="stratum-label">Source mix</div>
        <div className="flex items-baseline gap-[6px]">
          <div className="stratum-num">{stats.srcTotal}</div>
          <div className="stratum-stat-unit">citations</div>
        </div>
        <div className="stratum-source-bar">
          <span
            style={{
              flex: stats.contemp || 0.01,
              background: "var(--accent)",
            }}
          />
          <span
            style={{
              flex: stats.later || 0.01,
              background: "var(--rule)",
            }}
          />
        </div>
        <div className="stratum-source-legend">
          <span>{stats.contemp} contemporary</span>
          <span>{stats.later} later</span>
        </div>
      </div>
    </section>
  );
}

function StratumEvents({ events }: { events: HistoryEvent[] }) {
  type SortMode = "certainty" | "sources" | "order";
  const [sort, setSort] = useState<SortMode>("certainty");

  const sorted = useMemo(() => {
    const copy = [...events];
    if (sort === "certainty")
      copy.sort((a, b) => (RANK[b.certainty] ?? 0) - (RANK[a.certainty] ?? 0));
    else if (sort === "sources")
      copy.sort((a, b) => b.sources.length - a.sources.length);
    return copy;
  }, [events, sort]);

  if (events.length === 0) {
    return (
      <section className="stratum-events">
        <header className="stratum-events-head">
          <h2>
            Events <span className="stratum-events-count">· 0</span>
          </h2>
        </header>
        <p className="stratum-empty-hint" style={{ marginTop: 16 }}>
          No events filed for this year. The ICCRA schema allows empty
          event lists when the record cannot be reconstructed.
        </p>
      </section>
    );
  }

  return (
    <section className="stratum-events">
      <header className="stratum-events-head">
        <h2>
          Events{" "}
          <span className="stratum-events-count">· {events.length}</span>
        </h2>
        <div className="stratum-sort">
          <span className="stratum-label" style={{ marginRight: 8 }}>
            sort
          </span>
          {(
            [
              ["certainty", "certainty"],
              ["sources", "sources"],
              ["order", "original"],
            ] as [SortMode, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={sort === k ? "on" : ""}
              onClick={() => setSort(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </header>
      <div className="stratum-grid">
        {sorted.map((ev) => (
          <StratumCard key={ev.id} ev={ev} />
        ))}
      </div>
    </section>
  );
}

function StratumCard({ ev }: { ev: HistoryEvent }) {
  const [open, setOpen] = useState(false);
  const contemp = ev.sources.filter((s) => s.contemporary).length;
  const later = ev.sources.length - contemp;
  const rank = RANK[ev.certainty] ?? 0;

  return (
    <article
      className="stratum-card"
      style={{ ["--hue" as string]: `var(--cat-${ev.category}, var(--accent))` }}
    >
      <button
        type="button"
        className="stratum-card-open"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="stratum-card-rail"
          style={{ background: `var(--cat-${ev.category}, var(--accent))` }}
        />
        <div className="stratum-card-head">
          <span className="stratum-card-id">{ev.id}</span>
          <span
            className="stratum-card-cat"
            style={{ color: `var(--cat-${ev.category}, var(--fg-2))` }}
          >
            {ev.category}
          </span>
        </div>
        <h3 className="stratum-card-title">{ev.title}</h3>
        <div className="stratum-card-region">{ev.region}</div>
        <p
          className="stratum-card-desc"
          style={{
            WebkitLineClamp: open ? "unset" : 2,
            display: open ? "block" : "-webkit-box",
          }}
        >
          {ev.description}
        </p>
        <div className="stratum-card-foot">
          <div className="stratum-measure">
            <div className="stratum-measure-label">certainty</div>
            <div className="stratum-measure-bars">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={i < rank ? "on" : ""} />
              ))}
            </div>
            <div className="stratum-measure-val">{ev.certainty}</div>
          </div>
          <div className="stratum-measure">
            <div className="stratum-measure-label">sources</div>
            <div className="stratum-source-bar">
              <span style={{ flex: contemp || 0.01, background: "var(--accent)" }} />
              <span style={{ flex: later || 0.01, background: "var(--rule)" }} />
            </div>
            <div className="stratum-measure-val">{ev.sources.length}</div>
          </div>
        </div>
      </button>

      {open && (
        <div className="stratum-card-expand" onClick={(e) => e.stopPropagation()}>
          {ev.key_figures.length > 0 && (
            <>
              <div className="stratum-label">Key figures</div>
              <div className="stratum-kf-list">
                {ev.key_figures.map((k, i) => (
                  <span key={i} className="stratum-kf">
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
          <div className="stratum-label" style={{ marginTop: 12 }}>
            Sources
          </div>
          <ul className="stratum-src-list">
            {ev.sources.map((s, j) => (
              <li key={j}>
                <span
                  className={"stratum-src-type " + (s.contemporary ? "c" : "l")}
                >
                  {s.type.replace(/_/g, " ")}
                </span>
                <span className="stratum-src-name">{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function StratumDissent({ year }: { year: YearData }) {
  return (
    <section className="stratum-dissent">
      {year.disconfirming_evidence && (
        <div className="stratum-dissent-card">
          <div className="stratum-label">Disconfirming evidence</div>
          <p>{year.disconfirming_evidence}</p>
        </div>
      )}
      {year.historiographic_note && (
        <div className="stratum-dissent-card">
          <div className="stratum-label">Historiographic note</div>
          <p>{year.historiographic_note}</p>
        </div>
      )}
    </section>
  );
}
