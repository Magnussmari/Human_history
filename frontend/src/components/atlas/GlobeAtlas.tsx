/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 * @source: Claude Design handoff bundle (Globe_S_tier.html) — ported to Next.js + TS
 */
"use client";

import "./globe-atlas.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import { range } from "d3-array";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection as TopoGeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import type { YearData, EventCategory, CertaintyLevel, HistoryEvent } from "@/types/history";

type Rotation = [number, number, number];

interface FlatEvent {
  id: string;
  y: number;
  lat: number;
  lon: number;
  cat: EventCategory;
  cert: CertaintyLevel;
  title: string;
  region: string;
  description: string;
}

interface Projected {
  ev: FlatEvent;
  x: number;
  y: number;
  z: number;
}

interface Cluster {
  x: number;
  y: number;
  n: number;
  events: FlatEvent[];
  topCat: EventCategory;
}

interface GlobeAtlasProps {
  years: YearData[];
  yearRange: { oldest: number; newest: number };
}

const CATEGORY_ORDER: EventCategory[] = [
  "political", "military", "cultural", "religious", "economic",
  "technological", "scientific", "demographic", "environmental", "exploration", "legal",
];
const CATEGORY_LABEL: Record<EventCategory, string> = {
  political: "Political", military: "Military", cultural: "Cultural", religious: "Religious",
  economic: "Economic", technological: "Technological", scientific: "Scientific",
  demographic: "Demographic", environmental: "Environmental", exploration: "Exploration", legal: "Legal",
};

const CATEGORY_VAR: Record<EventCategory, string> = CATEGORY_ORDER.reduce((acc, c) => {
  acc[c] = `--gs-cat-${c}`;
  return acc;
}, {} as Record<EventCategory, string>);

function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString()} BCE`;
  return `${y} CE`;
}

function parseCoordinates(raw: string | null): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((s) => parseFloat(s.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
  const [lat, lon] = parts;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return [lat, lon];
}

function flattenEvents(years: YearData[]): FlatEvent[] {
  const out: FlatEvent[] = [];
  for (const year of years) {
    for (const ev of year.events as HistoryEvent[]) {
      const ll = parseCoordinates(ev.coordinates_approx);
      if (!ll) continue;
      out.push({
        id: ev.id,
        y: year.year,
        lat: ll[0],
        lon: ll[1],
        cat: ev.category,
        cert: ev.certainty,
        title: ev.title,
        region: ev.region,
        description: ev.description,
      });
    }
  }
  return out;
}

function useCssColor(varName: string): (alpha?: number) => string {
  return useCallback(
    (alpha = 1) => {
      if (typeof document === "undefined") return `rgba(240,168,120,${alpha})`;
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      return resolveToRgba(raw, alpha);
    },
    [varName],
  );
}

const colorCtxCache: { ctx: CanvasRenderingContext2D | null } = { ctx: null };

function resolveToRgba(color: string, alpha: number): string {
  const c = (color || "").trim();
  if (!c) return `rgba(240,168,120,${alpha})`;
  if (typeof document === "undefined") return `rgba(240,168,120,${alpha})`;
  if (!colorCtxCache.ctx) {
    colorCtxCache.ctx = document.createElement("canvas").getContext("2d");
  }
  const ctx = colorCtxCache.ctx;
  if (!ctx) return `rgba(240,168,120,${alpha})`;
  try {
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    const resolved = ctx.fillStyle as string;
    if (resolved.startsWith("#")) {
      const h = resolved.slice(1);
      const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    const m = resolved.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(",").map((x) => x.trim());
      return `rgba(${p[0]},${p[1]},${p[2]},${alpha})`;
    }
  } catch {
    /* fall through */
  }
  return `rgba(240,168,120,${alpha})`;
}

// ------------------------------------------------------------------
// Rotation hook — smooth drag + auto-center target
// ------------------------------------------------------------------
function useRotation(
  targetLonLat: [number, number] | null,
  autoSpin: boolean,
  drawRef: React.MutableRefObject<(() => void) | null>,
) {
  // rot state = the "settled" rotation. React only re-renders the SVG
  // overlay + HUD when rotation stops moving, so clusters/pins aren't
  // recomputed 60 times a second. rotRef = the live rotation, read by
  // the imperative canvas draw every RAF frame.
  const [rot, setRot] = useState<Rotation>([20, -15, 0]);
  const rotRef = useRef<Rotation>(rot);
  const targetRef = useRef<Rotation | null>(null);
  const draggingRef = useRef(false);

  const commit = useCallback(() => {
    setRot([rotRef.current[0], rotRef.current[1], rotRef.current[2]]);
  }, []);

  const targetLon = targetLonLat?.[0] ?? null;
  const targetLat = targetLonLat?.[1] ?? null;
  useEffect(() => {
    if (targetLon === null || targetLat === null) {
      targetRef.current = null;
      return;
    }
    targetRef.current = [-targetLon, -targetLat, 0];
  }, [targetLon, targetLat]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(40, t - last);
      last = t;
      if (!draggingRef.current) {
        let l = rotRef.current[0];
        let p = rotRef.current[1];
        const g = rotRef.current[2];
        let moved = false;
        if (targetRef.current) {
          const [tl, tp] = targetRef.current;
          const dl = ((tl - l + 540) % 360) - 180;
          const dp = tp - p;
          const speed = 0.007 * dt;
          if (Math.abs(dl) < 0.04 && Math.abs(dp) < 0.04) {
            targetRef.current = null;
            commit(); // snap SVG overlay to final position
          } else {
            l += dl * speed;
            p += dp * speed;
            rotRef.current = [l, p, g];
            moved = true;
          }
        } else if (autoSpin) {
          l += 0.035 * dt;
          rotRef.current = [l, p, g];
          moved = true;
        }
        if (moved) drawRef.current?.();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, drawRef, commit]);

  const setDragging = useCallback(
    (v: boolean) => {
      draggingRef.current = v;
      if (!v) commit();
    },
    [commit],
  );

  const setAbsolute = useCallback(
    (l: number, p: number) => {
      const np = Math.max(-85, Math.min(85, p));
      rotRef.current = [l, np, 0];
      setRot([l, np, 0]);
      targetRef.current = null;
    },
    [],
  );

  // Used during active drag: update rotation ref and redraw imperatively
  // without triggering React re-render.
  const setImperative = useCallback(
    (l: number, p: number) => {
      const np = Math.max(-85, Math.min(85, p));
      rotRef.current = [l, np, 0];
      targetRef.current = null;
      drawRef.current?.();
    },
    [drawRef],
  );

  const nudge = useCallback(
    (dl: number, dp: number) => {
      const [l, p] = rotRef.current;
      setAbsolute(l + dl, p + dp);
    },
    [setAbsolute],
  );

  return { rot, rotRef, setDragging, setAbsolute, setImperative, nudge };
}

// ------------------------------------------------------------------
// Time brush
// ------------------------------------------------------------------
interface TimeBrushProps {
  events: FlatEvent[];
  timeWindow: [number, number];
  setTimeWindow: (w: [number, number]) => void;
  preset: string | null;
  setPreset: (p: string | null) => void;
  yearMin: number;
  yearMax: number;
}

function TimeBrush({ events, timeWindow, setTimeWindow, preset, setPreset, yearMin, yearMax }: TimeBrushProps) {
  const BUCKETS = 140;
  const BUCKET_SIZE = (yearMax - yearMin) / BUCKETS;
  const histogram = useMemo(() => {
    const hist = new Array<number>(BUCKETS).fill(0);
    for (const e of events) {
      const b = Math.min(BUCKETS - 1, Math.max(0, Math.floor((e.y - yearMin) / BUCKET_SIZE)));
      hist[b]++;
    }
    return hist;
  }, [events, yearMin, BUCKET_SIZE]);
  const maxH = Math.max(1, ...histogram);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ mode: "left" | "right" | "move"; rect: DOMRect; startX: number; initial: [number, number] } | null>(null);

  const yearToPct = (y: number) => ((y - yearMin) / (yearMax - yearMin)) * 100;

  const startDrag = (mode: "left" | "right" | "move") => (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    dragRef.current = { mode, rect, startX: e.clientX, initial: [...timeWindow] };
    setPreset(null);
  };

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const { mode, rect, startX, initial } = dragRef.current;
      const dx = e.clientX - startX;
      const yearSpan = yearMax - yearMin;
      const yearShift = (dx / rect.width) * yearSpan;
      if (mode === "left") {
        const newL = Math.min(initial[1] - 20, Math.max(yearMin, initial[0] + yearShift));
        setTimeWindow([Math.round(newL), initial[1]]);
      } else if (mode === "right") {
        const newR = Math.max(initial[0] + 20, Math.min(yearMax, initial[1] + yearShift));
        setTimeWindow([initial[0], Math.round(newR)]);
      } else {
        let nL = initial[0] + yearShift;
        let nR = initial[1] + yearShift;
        if (nL < yearMin) { nR += yearMin - nL; nL = yearMin; }
        if (nR > yearMax) { nL -= nR - yearMax; nR = yearMax; }
        setTimeWindow([Math.round(nL), Math.round(nR)]);
      }
    }
    function onUp() {
      dragRef.current = null;
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [setTimeWindow, yearMin, yearMax]);

  const PRESETS = useMemo(
    () => [
      { id: "all", label: `All ${(yearMax - yearMin).toLocaleString()} yrs`, window: [yearMin, yearMax] as [number, number] },
      { id: "antiquity", label: "Antiquity", window: [-800, 500] as [number, number] },
      { id: "medieval", label: "Medieval", window: [500, 1500] as [number, number] },
      { id: "early-modern", label: "Early Modern", window: [1500, 1800] as [number, number] },
      { id: "modern", label: "Modern", window: [1800, yearMax] as [number, number] },
      { id: "century", label: "1000–1100 CE", window: [1000, 1100] as [number, number] },
    ],
    [yearMin, yearMax],
  );

  const lPct = yearToPct(timeWindow[0]);
  const rPct = yearToPct(timeWindow[1]);

  return (
    <div className="gs-brush">
      <div className="gs-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={"gs-preset" + (preset === p.id ? " on" : "")}
            onClick={() => {
              setPreset(p.id);
              setTimeWindow(p.window);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="gs-brush-labels">
        <span>{formatYear(yearMin)}</span>
        <span className="gs-brush-window">
          {formatYear(timeWindow[0])} — {formatYear(timeWindow[1])}
          <span style={{ color: "var(--gs-fg-mute)", marginLeft: 10 }}>
            · {(timeWindow[1] - timeWindow[0]).toLocaleString()} yrs
          </span>
        </span>
        <span>{formatYear(yearMax)}</span>
      </div>

      <div className="gs-brush-track" ref={trackRef}>
        <div className="gs-brush-hist">
          {histogram.map((h, i) => {
            const bStart = yearMin + i * BUCKET_SIZE;
            const bEnd = bStart + BUCKET_SIZE;
            const inW = bEnd >= timeWindow[0] && bStart <= timeWindow[1];
            return (
              <div
                key={i}
                className={"gs-brush-bar" + (inW ? " in" : "")}
                style={{ height: `${(h / maxH) * 100}%` }}
              />
            );
          })}
        </div>
        <div
          className="gs-brush-window-fill"
          style={{ left: lPct + "%", width: rPct - lPct + "%" }}
          onPointerDown={startDrag("move")}
        />
        <div
          className="gs-brush-handle"
          style={{ left: `calc(${lPct}% - 4px)` }}
          onPointerDown={startDrag("left")}
        />
        <div
          className="gs-brush-handle"
          style={{ left: `calc(${rPct}% - 4px)` }}
          onPointerDown={startDrag("right")}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Globe stage
// ------------------------------------------------------------------
interface GlobeProps {
  land: FeatureCollection<Geometry> | null;
  filtered: FlatEvent[];
  categories: Partial<Record<EventCategory, boolean>>;
  setCategories: (c: Partial<Record<EventCategory, boolean>>) => void;
  selected: FlatEvent | null;
  setSelected: (e: FlatEvent | null) => void;
  autoSpin: boolean;
  setAutoSpin: (u: (prev: boolean) => boolean) => void;
}

type RenderMode = "heat" | "cluster" | "pin";

function Globe({
  land,
  filtered,
  categories,
  setCategories,
  selected,
  setSelected,
  autoSpin,
  setAutoSpin,
}: GlobeProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ x: number; y: number; target: Cluster } | null>(null);

  const catColor = (cat: EventCategory, alpha = 1) => {
    if (typeof document === "undefined") return `rgba(240,168,120,${alpha})`;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(CATEGORY_VAR[cat])
      .trim();
    return resolveToRgba(raw, alpha);
  };

  const accentColor = useCssColor("--gs-accent");

  // drawRef holds the imperative draw function; useRotation's RAF loop
  // calls it. Populated by a useEffect below (see "imperative draw").
  const drawRef = useRef<(() => void) | null>(null);

  const selectedLL = selected ? ([selected.lon, selected.lat] as [number, number]) : null;
  const { rot, rotRef, setDragging, setAbsolute, setImperative, nudge } = useRotation(
    selectedLL,
    autoSpin,
    drawRef,
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(400, width), h: Math.max(400, height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const R = useMemo(() => {
    const margin = 48;
    const baseR = Math.min(size.w, size.h) / 2 - margin;
    return Math.max(80, baseR * zoom);
  }, [size.w, size.h, zoom]);

  const renderMode: RenderMode = useMemo(() => {
    const n = filtered.length;
    if (zoom >= 2.6) return "pin";
    if (zoom >= 1.7 || n <= 400) return "cluster";
    return "heat";
  }, [filtered.length, zoom]);

  // Project + cluster for the SETTLED rot state — used by SVG overlay +
  // hover hit-test. Regenerated only when rot state changes (= on drag end,
  // target reached, manual nudge), not on every autospin/drag tick.
  const rotLon = rot[0];
  const rotLat = rot[1];
  const projected: Projected[] = useMemo(() => {
    const projection = geoOrthographic()
      .scale(R)
      .translate([size.w / 2, size.h / 2])
      .rotate(rot)
      .clipAngle(90);
    const center: [number, number] = [-rotLon, -rotLat];
    const HALF_PI = Math.PI / 2;
    const out: Projected[] = [];
    for (const e of filtered) {
      const dist = geoDistance([e.lon, e.lat], center);
      if (dist >= HALF_PI - 0.02) continue;
      const p = projection([e.lon, e.lat]);
      if (!p || Number.isNaN(p[0]) || Number.isNaN(p[1])) continue;
      const z = 1 - dist / HALF_PI;
      out.push({ ev: e, x: p[0], y: p[1], z });
    }
    return out;
  }, [filtered, R, size.w, size.h, rotLon, rotLat, rot]);

  const clusters: Cluster[] = useMemo(() => {
    if (renderMode === "pin") {
      return projected.map((p) => ({
        x: p.x,
        y: p.y,
        n: 1,
        events: [p.ev],
        topCat: p.ev.cat,
      }));
    }
    const cellSize = renderMode === "heat" ? 28 : 36;
    const grid = new Map<string, { sumX: number; sumY: number; n: number; events: FlatEvent[]; cats: Partial<Record<EventCategory, number>> }>();
    for (const p of projected) {
      const gx = Math.floor(p.x / cellSize);
      const gy = Math.floor(p.y / cellSize);
      const key = gx + ":" + gy;
      const bucket = grid.get(key);
      if (bucket) {
        bucket.sumX += p.x;
        bucket.sumY += p.y;
        bucket.n++;
        bucket.events.push(p.ev);
        bucket.cats[p.ev.cat] = (bucket.cats[p.ev.cat] ?? 0) + 1;
      } else {
        grid.set(key, { sumX: p.x, sumY: p.y, n: 1, events: [p.ev], cats: { [p.ev.cat]: 1 } });
      }
    }
    return Array.from(grid.values()).map((b) => {
      const entries = Object.entries(b.cats) as [EventCategory, number][];
      const topCat = entries.sort((a, c) => c[1] - a[1])[0][0];
      return {
        x: b.sumX / b.n,
        y: b.sumY / b.n,
        n: b.n,
        events: b.events,
        topCat,
      };
    });
  }, [projected, renderMode]);

  // Imperative draw — reads rotRef each call, re-projects all visible events,
  // paints canvas. Called by the RAF loop (during autospin/target animation)
  // and by the pointerMove drag handler, without touching React state.
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !land) return;

    const currentRot = rotRef.current;
    const projection = geoOrthographic()
      .scale(R)
      .translate([size.w / 2, size.h / 2])
      .rotate(currentRot)
      .clipAngle(90);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to DPR when needed (once per size change, not per frame).
    const dpr = window.devicePixelRatio || 1;
    const neededW = Math.round(size.w * dpr);
    const neededH = Math.round(size.h * dpr);
    if (canvas.width !== neededW || canvas.height !== neededH) {
      canvas.width = neededW;
      canvas.height = neededH;
      canvas.style.width = size.w + "px";
      canvas.style.height = size.h + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const cx = size.w / 2;
    const cy = size.h / 2;

    // atmosphere
    const atmos = ctx.createRadialGradient(cx, cy, R * 0.99, cx, cy, R * 1.08);
    atmos.addColorStop(0, accentColor(0.32));
    atmos.addColorStop(0.4, accentColor(0.08));
    atmos.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = atmos;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.fill();

    // ocean sphere
    const sGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.12, cx, cy, R);
    sGrad.addColorStop(0, "#13262f");
    sGrad.addColorStop(0.55, "#0d1c24");
    sGrad.addColorStop(1, "#050a0d");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = sGrad;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    const path = geoPath(projection, ctx);

    // graticule
    ctx.beginPath();
    path(geoGraticule10());
    ctx.strokeStyle = "rgba(220, 210, 195, 0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // equator
    ctx.beginPath();
    path({ type: "LineString", coordinates: range(-180, 181, 2).map((l) => [l, 0]) });
    ctx.strokeStyle = "rgba(220, 210, 195, 0.14)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // land
    ctx.beginPath();
    path(land);
    ctx.fillStyle = "#4a6470";
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(235, 245, 250, 0.55)";
    ctx.stroke();

    // In all modes, draw small category-tinted dots so the sphere stays
    // populated during drag (without relying on SVG overlay updates).
    const center: [number, number] = [-currentRot[0], -currentRot[1]];
    const HALF_PI = Math.PI / 2;
    for (const e of filtered) {
      const dist = geoDistance([e.lon, e.lat], center);
      if (dist >= HALF_PI - 0.02) continue;
      const pt = projection([e.lon, e.lat]);
      if (!pt || Number.isNaN(pt[0]) || Number.isNaN(pt[1])) continue;
      const z = 1 - dist / HALF_PI;
      const edgeFade = Math.min(1, z * 2.2) ** 2;
      if (edgeFade < 0.06) continue;
      ctx.fillStyle = catColor(e.cat, 0.85 * edgeFade);
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // sphere highlight / shadow
    ctx.globalCompositeOperation = "source-atop";
    const hi = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.15, cx, cy, R);
    hi.addColorStop(0, "rgba(255, 240, 220, 0.1)");
    hi.addColorStop(0.7, "rgba(0,0,0,0)");
    hi.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = hi;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // rim
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor(0.35);
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [land, filtered, R, size.w, size.h, accentColor, rotRef]);

  // Keep drawRef pointing at the latest drawCanvas so the RAF loop inside
  // useRotation always calls the up-to-date projection.
  useEffect(() => {
    drawRef.current = drawCanvas;
    // Paint once whenever dependencies (size, filtered, land, zoom) change.
    drawCanvas();
  }, [drawCanvas]);

  // Pointer interactions
  const dragRef = useRef<{ x: number; y: number; rot: Rotation; moved: number } | null>(null);
  const pointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, rot: [...rot] as Rotation, moved: 0 };
    setDragging(true);
  };
  const hoverRafRef = useRef(0);
  const pointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.moved = Math.hypot(dx, dy);
      const k = 0.35 / zoom;
      // Canonical d3-geo globe drag: rot[0] += dx, rot[1] -= dy. This
      // matches Google Maps / Leaflet / Mapbox: drag in a direction and
      // the sphere follows your cursor as if you grabbed and pulled it.
      setImperative(dragRef.current.rot[0] + dx * k, dragRef.current.rot[1] - dy * k);
      return;
    }
    // Throttle hover scan to ~1 per animation frame. With 1000s of clusters
    // Math.hypot on every mousemove was causing jank.
    if (hoverRafRef.current) return;
    hoverRafRef.current = requestAnimationFrame(() => {
      hoverRafRef.current = 0;
      let best: Cluster | null = null;
      let bestD = 22;
      for (const c of clusters) {
        const d = Math.hypot(c.x - mx, c.y - my);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      setHover(best ? { x: mx, y: my, target: best } : null);
    });
  };
  const pointerUp = () => {
    const wasDragging = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (wasDragging && wasDragging.moved < 3 && hover && hover.target) {
      const t = hover.target;
      if (t.events.length === 1) {
        setSelected(t.events[0]);
      } else {
        setSelected(t.events[0]);
        setZoom((z) => Math.min(5, z * 1.6));
      }
    }
  };

  // wheel zoom — attach non-passive so we can preventDefault
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setZoom((z) => Math.max(1, Math.min(6, z * f)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Rim marker for off-view selected
  const rimForSelected = useMemo(() => {
    if (!selected) return null;
    const center: [number, number] = [-rotLon, -rotLat];
    const dist = geoDistance([selected.lon, selected.lat], center);
    if (dist < Math.PI / 2 - 0.02) return null;
    const unclipped = geoOrthographic()
      .scale(R)
      .translate([size.w / 2, size.h / 2])
      .rotate(rot)
      .clipAngle(180);
    const p = unclipped([selected.lon, selected.lat]);
    const cx = size.w / 2;
    const cy = size.h / 2;
    let ang: number;
    if (p && !Number.isNaN(p[0])) {
      ang = Math.atan2(-(p[1] - cy), p[0] - cx);
    } else {
      ang = 0;
    }
    const rr = R * 1.08;
    return { x: cx + Math.cos(ang) * rr, y: cy - Math.sin(ang) * rr, ang: -ang };
  }, [selected, rot, rotLon, rotLat, R, size.w, size.h]);

  // unused wheel noop satisfies React onWheel prop typing without swallowing events
  const onWheelReact = (e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <div className="gs-stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="gs-canvas"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onPointerLeave={() => setHover(null)}
        onWheel={onWheelReact}
      />

      <svg className="gs-overlay" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
        {/* Selected ring */}
        {selected && clusters.find((c) => c.events.some((ev) => ev.id === selected.id)) && (() => {
          const p = projected.find((q) => q.ev.id === selected.id);
          if (!p) return null;
          return (
            <g transform={`translate(${p.x} ${p.y})`}>
              <circle r="22" fill="none" stroke="var(--gs-accent)" strokeOpacity="0.6" strokeWidth="1">
                <animate attributeName="r" values="18;28;18" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle r="10" fill="none" stroke="var(--gs-accent)" strokeOpacity="0.9" strokeWidth="1.5" />
            </g>
          );
        })()}

        {/* Clusters / pins */}
        {renderMode !== "heat" &&
          clusters.map((c, i) => {
            const col = catColor(c.topCat);
            if (c.n === 1) {
              const active = !!selected && c.events[0].id === selected.id;
              return (
                <g
                  key={i}
                  transform={`translate(${c.x} ${c.y})`}
                  className={"gs-pin-g" + (active ? " active" : "")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(c.events[0]);
                  }}
                >
                  <circle className="gs-pin-dot" r="3" fill={col} stroke="rgba(10,15,18,0.9)" strokeWidth="1" />
                </g>
              );
            }
            const radius = Math.min(26, 7 + Math.log2(c.n) * 3.8);
            return (
              <g
                key={i}
                transform={`translate(${c.x} ${c.y})`}
                className="gs-cluster-g"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(c.events[0]);
                  setZoom((z) => Math.min(5, z * 1.6));
                }}
              >
                <circle r={radius + 8} fill={col} opacity="0.12" className="gs-cluster-glow" />
                <circle
                  className="gs-cluster-circle"
                  r={radius}
                  fill={catColor(c.topCat, 0.18)}
                  stroke={col}
                  strokeWidth="1.5"
                />
                <text
                  y={radius > 14 ? 4 : 3}
                  textAnchor="middle"
                  fontFamily="var(--gs-font-mono)"
                  fontSize={radius > 14 ? 11 : 9}
                  fontWeight="600"
                  fill="var(--gs-fg)"
                >
                  {c.n >= 1000 ? (c.n / 1000).toFixed(1) + "k" : c.n}
                </text>
              </g>
            );
          })}

        {/* Rim indicator for off-view selected */}
        {rimForSelected && (
          <g
            transform={`translate(${rimForSelected.x} ${rimForSelected.y}) rotate(${(rimForSelected.ang * 180) / Math.PI})`}
            className="gs-rim-marker"
            onClick={() => selected && setAbsolute(-selected.lon, -selected.lat)}
            style={{ cursor: "pointer", pointerEvents: "auto" }}
          >
            <polygon points="0,-5 10,0 0,5" fill="var(--gs-accent)" />
            <circle r="3" cx="-2" fill="var(--gs-accent)" />
          </g>
        )}
      </svg>

      <div className="gs-hud-tl">
        <div className="gs-chip mode">
          <span className="k">MODE</span>
          <span className="v">{renderMode === "heat" ? "DOTS" : renderMode.toUpperCase()}</span>
        </div>
        <div className="gs-chip">
          <span className="k">PLOTTED</span>
          <span className="v">{projected.length.toLocaleString()}</span>
        </div>
        <div className="gs-chip">
          <span className="k">λ</span>
          <span className="v">{Math.round(-rot[0])}°</span>
          <span className="k">φ</span>
          <span className="v">{Math.round(-rot[1])}°</span>
        </div>
      </div>

      <div className="gs-hud-tr">
        <div className="gs-ctrls">
          <button type="button" onClick={() => setZoom((z) => Math.min(6, z * 1.3))} title="Zoom in">+</button>
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z / 1.3))} title="Zoom out">−</button>
          <div className="gs-ctrls-sep" />
          <button type="button" onClick={() => nudge(0, -20)} title="Up">▲</button>
          <button type="button" onClick={() => nudge(-20, 0)} title="West">◀</button>
          <button type="button" onClick={() => nudge(20, 0)} title="East">▶</button>
          <button type="button" onClick={() => nudge(0, 20)} title="Down">▼</button>
          <div className="gs-ctrls-sep" />
          <button
            type="button"
            className={autoSpin ? "on" : ""}
            onClick={() => setAutoSpin((s) => !s)}
            title="Auto-rotate"
          >
            {autoSpin ? "■" : "↻"}
          </button>
        </div>
        <div className="gs-zoom-ind">{zoom.toFixed(1)}×</div>
      </div>

      <div className="gs-hud-bl">
        <div className="gs-legend">
          <div className="gs-legend-title">Categories · click to filter</div>
          <div className="gs-legend-grid">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                className={"gs-legend-item" + (categories[c] === false ? " off" : "")}
                onClick={() =>
                  setCategories({ ...categories, [c]: categories[c] === false ? true : false })
                }
              >
                <span className="gs-legend-swatch" style={{ background: `var(${CATEGORY_VAR[c]})` }} />
                <span>{CATEGORY_LABEL[c]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hover && hover.target && (
        <div
          className="gs-tip"
          style={{ left: Math.min(size.w - 280, hover.x + 14), top: Math.max(10, hover.y - 40) }}
        >
          {hover.target.n === 1 ? (
            <>
              <div className="gs-tip-cat" style={{ color: catColor(hover.target.events[0].cat) }}>
                {hover.target.events[0].cat} · {hover.target.events[0].region}
              </div>
              <div className="gs-tip-title">{hover.target.events[0].title}</div>
              <div className="gs-tip-meta">
                <span>{formatYear(hover.target.events[0].y)}</span>
                <span>{hover.target.events[0].cert}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span className="gs-tip-cluster-n">{hover.target.n.toLocaleString()}</span>
                <span className="gs-tip-cluster-lbl">events</span>
              </div>
              <div className="gs-tip-meta" style={{ marginTop: 4 }}>
                <span style={{ color: catColor(hover.target.topCat) }}>
                  {hover.target.topCat} dominant
                </span>
                <span>click to zoom</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Right rail — focus event dossier
// ------------------------------------------------------------------
interface RailProps {
  selected: FlatEvent | null;
  allEvents: FlatEvent[];
  timeWindow: [number, number];
  totalEvents: number;
  yearMin: number;
  yearMax: number;
  setSelected: (e: FlatEvent) => void;
}

function Rail({
  selected,
  allEvents,
  timeWindow,
  totalEvents,
  yearMin,
  yearMax,
  setSelected,
}: RailProps) {
  const contemp = useMemo(() => {
    if (!selected) return [];
    return allEvents
      .filter((e) => e.id !== selected.id && Math.abs(e.y - selected.y) <= 15 && e.region === selected.region)
      .slice(0, 8);
  }, [allEvents, selected]);

  const catColor = (cat: EventCategory) => {
    if (typeof document === "undefined") return "#f0a878";
    return resolveToRgba(
      getComputedStyle(document.documentElement).getPropertyValue(CATEGORY_VAR[cat]).trim(),
      1,
    );
  };

  if (!selected) {
    return (
      <aside className="gs-rail">
        <div className="gs-rail-header">
          <div className="gs-rail-kicker">Focus</div>
          <h2 className="gs-rail-title">Select an event</h2>
        </div>
        <div className="gs-rail-body">
          <p style={{ color: "var(--gs-fg-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Tap any dot or cluster. At low zoom you&apos;ll see density blooms across the sphere;
            zoom in or click a cluster to drill into individual events.
          </p>
          <div style={{ marginTop: 20 }}>
            <div className="gs-rail-row">
              <span className="lbl">Plotted</span>
              <span className="val">{allEvents.length.toLocaleString()} / {totalEvents.toLocaleString()}</span>
            </div>
            <div className="gs-rail-row">
              <span className="lbl">Span</span>
              <span className="val">{formatYear(yearMin)} → {formatYear(yearMax)}</span>
            </div>
            <div className="gs-rail-row">
              <span className="lbl">Window</span>
              <span className="val">{formatYear(timeWindow[0])} → {formatYear(timeWindow[1])}</span>
            </div>
          </div>
        </div>
        <div className="gs-rail-footer">
          Drag the sphere · Scroll to zoom · Drag the time brush
        </div>
      </aside>
    );
  }

  return (
    <aside className="gs-rail">
      <div className="gs-rail-header">
        <div className="gs-rail-kicker" style={{ color: catColor(selected.cat) }}>
          {selected.cat} · {selected.region}
        </div>
        <h2 className="gs-rail-title">{selected.title}</h2>
      </div>
      <div className="gs-rail-body">
        <div className="gs-rail-row">
          <span className="lbl">Year</span>
          <span className="val">{formatYear(selected.y)}</span>
        </div>
        <div className="gs-rail-row">
          <span className="lbl">Coords</span>
          <span className="val" style={{ fontFamily: "var(--gs-font-mono)", fontSize: 12 }}>
            {selected.lat.toFixed(1)}, {selected.lon.toFixed(1)}
          </span>
        </div>
        <div className="gs-rail-row">
          <span className="lbl">Certainty</span>
          <span className="val cat">{selected.cert}</span>
        </div>
        <div className="gs-rail-row">
          <span className="lbl">Category</span>
          <span className="val cat" style={{ color: catColor(selected.cat) }}>{selected.cat}</span>
        </div>

        {selected.description && (
          <p style={{ color: "var(--gs-fg-2)", fontSize: 14, lineHeight: 1.55, marginTop: 14 }}>
            {selected.description}
          </p>
        )}

        {contemp.length > 0 && (
          <>
            <div
              style={{
                marginTop: 18,
                fontFamily: "var(--gs-font-mono)",
                fontSize: 14,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gs-fg-mute)",
              }}
            >
              Contemporaneous in region ({contemp.length})
            </div>
            <div className="gs-cluster-list">
              {contemp.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="gs-cluster-item"
                  onClick={() => setSelected(e)}
                >
                  <span className="gs-cluster-item-year">{formatYear(e.y)}</span>
                  <span className="gs-cluster-item-title">{e.title}</span>
                  <span className="gs-cluster-item-cat" style={{ background: catColor(e.cat) }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="gs-rail-footer">
        Events shown have {"coordinates_approx"} in the ICCRA corpus.<br />
        Drag the sphere · scroll to zoom · drag the time brush below.
      </div>
    </aside>
  );
}

// ------------------------------------------------------------------
// Root
// ------------------------------------------------------------------
export function GlobeAtlas({ years, yearRange }: GlobeAtlasProps) {
  const [land, setLand] = useState<FeatureCollection<Geometry> | null>(null);
  const [landError, setLandError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/data/land-110m.json")
      .then((r) => {
        if (!r.ok) throw new Error(`land-110m.json: HTTP ${r.status}`);
        return r.json();
      })
      .then((topo: Topology) => {
        if (cancel) return;
        const geom = topo.objects.land as TopoGeometryCollection;
        const f = feature(topo, geom) as FeatureCollection<Geometry>;
        setLand(f);
      })
      .catch((err: unknown) => {
        if (!cancel) setLandError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancel = true;
    };
  }, []);

  const allEvents = useMemo(() => flattenEvents(years), [years]);
  const totalCorpusEvents = useMemo(
    () => years.reduce((n, y) => n + (y.events?.length ?? 0), 0),
    [years],
  );

  const yearMin = yearRange.oldest;
  const yearMax = yearRange.newest;

  const [timeWindow, setTimeWindow] = useState<[number, number]>([yearMin, yearMax]);
  const [preset, setPreset] = useState<string | null>("all");
  const [categories, setCategories] = useState<Partial<Record<EventCategory, boolean>>>({});
  const [selected, setSelected] = useState<FlatEvent | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);

  // Clamp window in render so it never exceeds the corpus bounds
  const clampedWindow = useMemo<[number, number]>(
    () => [
      Math.max(yearMin, Math.min(yearMax - 20, timeWindow[0])),
      Math.min(yearMax, Math.max(yearMin + 20, timeWindow[1])),
    ],
    [timeWindow, yearMin, yearMax],
  );

  const filtered = useMemo(
    () =>
      allEvents.filter(
        (e) => e.y >= clampedWindow[0] && e.y <= clampedWindow[1] && categories[e.cat] !== false,
      ),
    [allEvents, clampedWindow, categories],
  );

  if (landError) {
    return (
      <div className="gs-root">
        <div className="gs-empty">Could not load globe topology · {landError}</div>
      </div>
    );
  }

  if (!land || allEvents.length === 0) {
    return (
      <div className="gs-root">
        <div className="gs-empty">
          {allEvents.length === 0
            ? "Loading events with coordinates…"
            : "Loading sphere…"}
        </div>
      </div>
    );
  }

  return (
    <div className="gs-root">
      <header className="gs-chrome">
        <div className="gs-brand">
          <span className="gs-brand-mark" />
          <span className="gs-brand-name">Chronograph · Globe</span>
        </div>
        <div className="gs-spacer" />
        <div className="gs-stat">
          <span className="gs-lbl">Plotted</span>
          <span className="gs-val">
            {filtered.length.toLocaleString()} / {allEvents.length.toLocaleString()}
          </span>
        </div>
        <div className="gs-stat">
          <span className="gs-lbl">Corpus</span>
          <span className="gs-val">{totalCorpusEvents.toLocaleString()} events</span>
        </div>
        <div className="gs-stat">
          <span className="gs-lbl">Span</span>
          <span className="gs-val">{(yearMax - yearMin).toLocaleString()} yrs</span>
        </div>
      </header>

      <div className="gs-main">
        <Globe
          land={land}
          filtered={filtered}
          categories={categories}
          setCategories={setCategories}
          selected={selected}
          setSelected={setSelected}
          autoSpin={autoSpin}
          setAutoSpin={setAutoSpin}
        />
        <Rail
          selected={selected}
          allEvents={allEvents}
          timeWindow={clampedWindow}
          totalEvents={totalCorpusEvents}
          yearMin={yearMin}
          yearMax={yearMax}
          setSelected={setSelected}
        />
      </div>

      <TimeBrush
        events={allEvents}
        timeWindow={clampedWindow}
        setTimeWindow={setTimeWindow}
        preset={preset}
        setPreset={setPreset}
        yearMin={yearMin}
        yearMax={yearMax}
      />
    </div>
  );
}

export default GlobeAtlas;
