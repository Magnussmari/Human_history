/**
 * Deterministic key-rename auto-repair.
 *
 * When the model produces the CORRECT value under an INCORRECT key spelling
 * (e.g. {"certain": "confirmed"} instead of {"certainty": "confirmed"}), the
 * error is mechanical — the schema requires the key to be "certainty" and the
 * value "confirmed" is both semantically correct and present at the expected
 * sibling position. Renaming the key back to its schema spelling is restoring
 * the spec, not making a new judgement. We do this ONLY when:
 *   - the source object has the required key K with value V
 *   - the target object is missing K
 *   - the target object has exactly one extra key K' at the same parent with value V
 *   - V is an ICCRA schema enum value (so we're not over-matching arbitrary strings)
 *
 * Every rename is logged. This runs BEFORE the structural diff, so a repair
 * makes the diff clean and the file can be written. If a repair is not
 * possible (e.g. value changed, wrong enum), the diff catches it and we fail
 * loudly as before.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { VALID_CATEGORIES, VALID_CERTAINTIES, VALID_DOC_LEVELS, VALID_SOURCE_TYPES, VALID_RELATIONS } from "./schema.js";

const SCHEMA_ENUM_VALUES = new Set<string>([
  ...VALID_CATEGORIES,
  ...VALID_CERTAINTIES,
  ...VALID_DOC_LEVELS,
  ...VALID_SOURCE_TYPES,
  ...VALID_RELATIONS,
]);

const REPAIRABLE_KEYS = new Set([
  "year", "year_label", "era_context", "documentation_level",
  "geographic_coverage_gaps", "events", "disconfirming_evidence",
  "historiographic_note", "graph_edges",
  "id", "title", "region", "coordinates_approx", "category",
  "description", "key_figures", "sources", "certainty",
  "certainty_note", "cross_references",
  "name", "type", "contemporary",
  "from", "to", "relation", "note",
]);

export interface Repair {
  path: string;
  from: string;
  to: string;
  value: string;
}

export function repairKeys(source: unknown, target: unknown): Repair[] {
  const repairs: Repair[] = [];
  walk(source, target, "", repairs);
  return repairs;
}

function walk(src: unknown, tgt: unknown, path: string, repairs: Repair[]): void {
  if (!isPlainObject(src) || !isPlainObject(tgt)) {
    if (Array.isArray(src) && Array.isArray(tgt) && src.length === tgt.length) {
      for (let i = 0; i < src.length; i++) {
        walk(src[i], tgt[i], `${path}[${i}]`, repairs);
      }
    }
    return;
  }

  const srcObj = src as Record<string, unknown>;
  const tgtObj = tgt as Record<string, unknown>;

  const missingFromTarget: string[] = [];
  for (const k of Object.keys(srcObj)) {
    if (!(k in tgtObj) && REPAIRABLE_KEYS.has(k)) missingFromTarget.push(k);
  }
  const extraInTarget: string[] = [];
  for (const k of Object.keys(tgtObj)) {
    if (!(k in srcObj)) extraInTarget.push(k);
  }

  for (const missingKey of missingFromTarget) {
    const expectedValue = srcObj[missingKey];
    if (typeof expectedValue !== "string") continue;
    if (!SCHEMA_ENUM_VALUES.has(expectedValue)) continue;

    const candidates = extraInTarget.filter((ek) => {
      const v = tgtObj[ek];
      return typeof v === "string" && v === expectedValue;
    });
    if (candidates.length !== 1) continue;

    const wrongKey = candidates[0];
    tgtObj[missingKey] = tgtObj[wrongKey];
    delete tgtObj[wrongKey];
    repairs.push({
      path: joinPath(path, missingKey),
      from: wrongKey,
      to: missingKey,
      value: expectedValue,
    });
    const idx = extraInTarget.indexOf(wrongKey);
    if (idx !== -1) extraInTarget.splice(idx, 1);
  }

  for (const key of Object.keys(srcObj)) {
    if (key in tgtObj) walk(srcObj[key], tgtObj[key], joinPath(path, key), repairs);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}
