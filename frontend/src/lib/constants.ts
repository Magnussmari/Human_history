import type { EventCategory, CertaintyLevel, DocumentationLevel } from "@/types/history";

export const ERAS = [
  { label: "Modern", start: 2025, end: 1900, color: "bg-blue-500" },
  { label: "Industrial", start: 1899, end: 1750, color: "bg-indigo-500" },
  { label: "Enlightenment", start: 1749, end: 1500, color: "bg-violet-500" },
  { label: "Renaissance", start: 1499, end: 1300, color: "bg-purple-500" },
  { label: "Medieval", start: 1299, end: 800, color: "bg-fuchsia-500" },
  { label: "Early Medieval", start: 799, end: 400, color: "bg-pink-500" },
  { label: "Classical", start: 399, end: -200, color: "bg-rose-500" },
  { label: "Iron Age", start: -201, end: -800, color: "bg-orange-500" },
  { label: "Bronze Age", start: -801, end: -2000, color: "bg-amber-500" },
  { label: "Early Bronze", start: -2001, end: -3200, color: "bg-yellow-600" },
] as const;

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; icon: string }> = {
  political: { label: "Political", color: "bg-blue-600 text-blue-100", icon: "landmark" },
  military: { label: "Military", color: "bg-red-700 text-red-100", icon: "swords" },
  scientific: { label: "Scientific", color: "bg-cyan-600 text-cyan-100", icon: "flask" },
  cultural: { label: "Cultural", color: "bg-purple-600 text-purple-100", icon: "palette" },
  economic: { label: "Economic", color: "bg-emerald-600 text-emerald-100", icon: "coins" },
  demographic: { label: "Demographic", color: "bg-teal-600 text-teal-100", icon: "users" },
  technological: { label: "Technological", color: "bg-sky-600 text-sky-100", icon: "cog" },
  religious: { label: "Religious", color: "bg-amber-700 text-amber-100", icon: "church" },
  environmental: { label: "Environmental", color: "bg-green-700 text-green-100", icon: "leaf" },
  exploration: { label: "Exploration", color: "bg-indigo-600 text-indigo-100", icon: "compass" },
  legal: { label: "Legal", color: "bg-slate-600 text-slate-100", icon: "scale" },
};

export const CERTAINTY_CONFIG: Record<CertaintyLevel, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-green-600 text-green-100" },
  probable: { label: "Probable", color: "bg-blue-600 text-blue-100" },
  approximate: { label: "Approximate", color: "bg-yellow-600 text-yellow-100" },
  traditional: { label: "Traditional", color: "bg-orange-600 text-orange-100" },
  legendary: { label: "Legendary", color: "bg-purple-600 text-purple-100" },
};

export const DOC_LEVEL_CONFIG: Record<DocumentationLevel, { label: string; color: string; bars: number }> = {
  rich: { label: "Rich", color: "text-green-400", bars: 5 },
  moderate: { label: "Moderate", color: "text-blue-400", bars: 4 },
  sparse: { label: "Sparse", color: "text-yellow-400", bars: 3 },
  minimal: { label: "Minimal", color: "text-orange-400", bars: 2 },
  negligible: { label: "Negligible", color: "text-red-400", bars: 1 },
};

export const DATA_BASE_URL = "/data";
export const TOTAL_YEARS = 5226;

export function getEraForYear(year: number) {
  return ERAS.find(e => year <= e.start && year >= e.end) ?? ERAS[ERAS.length - 1];
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function safeCategoryConfig(cat: string) {
  return (CATEGORY_CONFIG as Record<string, { label: string; color: string; icon: string } | undefined>)[cat]
    ?? { label: cat, color: "bg-muted text-muted-foreground", icon: "help-circle" };
}

export function safeCertaintyConfig(cert: string) {
  return (CERTAINTY_CONFIG as Record<string, { label: string; color: string } | undefined>)[cert]
    ?? { label: cert, color: "bg-muted text-muted-foreground" };
}
