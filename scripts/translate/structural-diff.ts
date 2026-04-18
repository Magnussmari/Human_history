/**
 * Structural diff between source and translated JSON.
 * Enforces: identical keys, identical enums, identical IDs, identical numerics.
 * Any deviation fails the translation — we never write partial/corrupt output.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import type { YearDoc } from "./schema.js";

export interface DiffIssue {
  path: string;
  kind: "missing_key" | "extra_key" | "enum_changed" | "id_changed" | "numeric_changed" | "boolean_changed" | "type_changed" | "array_length_changed";
  source: unknown;
  target: unknown;
}

const IMMUTABLE_ENUM_FIELDS = new Set([
  "documentation_level", "category", "certainty", "type", "relation",
]);

const IMMUTABLE_ID_FIELDS = new Set([
  "id", "from", "to",
]);

// coordinates_approx often carries an English parenthetical ("69.4°S, 32.3°E
// (lunar surface)"). Require the numeric prefix to match; allow the
// parenthetical annotation to translate.
const COORDINATE_PREFIX_FIELDS = new Set(["coordinates_approx"]);

function extractCoordPrefix(s: string): string {
  const paren = s.indexOf("(");
  return paren === -1 ? s.trim() : s.slice(0, paren).trim();
}

// cross_references items are "<id>" or "<id> (English parenthetical)".
// The ID prefix is immutable; the parenthetical may be translated.
const ID_PREFIX_ARRAY_FIELDS = new Set(["cross_references"]);

function extractIdPrefix(s: string): string {
  const trimmed = s.trim();
  const spaceIdx = trimmed.search(/[\s(]/);
  return spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
}

export function diffStructure(source: YearDoc, target: unknown, path = ""): DiffIssue[] {
  const issues: DiffIssue[] = [];
  walk(source, target, path, issues);
  return issues;
}

function walk(src: unknown, tgt: unknown, path: string, issues: DiffIssue[]): void {
  if (src === null || tgt === null) {
    if (src !== tgt) issues.push({ path, kind: "type_changed", source: src, target: tgt });
    return;
  }

  if (typeof src !== typeof tgt) {
    issues.push({ path, kind: "type_changed", source: src, target: tgt });
    return;
  }

  if (Array.isArray(src)) {
    if (!Array.isArray(tgt)) {
      issues.push({ path, kind: "type_changed", source: src, target: tgt });
      return;
    }
    if (src.length !== tgt.length) {
      issues.push({ path, kind: "array_length_changed", source: src.length, target: tgt.length });
      return;
    }
    const field = path.split(".").pop()?.replace(/\[\]$/, "") ?? "";
    const idPrefixArray = ID_PREFIX_ARRAY_FIELDS.has(field);
    for (let i = 0; i < src.length; i++) {
      if (idPrefixArray) {
        const s = typeof src[i] === "string" ? (src[i] as string) : "";
        const t = typeof tgt[i] === "string" ? (tgt[i] as string) : "";
        if (extractIdPrefix(s) !== extractIdPrefix(t)) {
          issues.push({ path: `${path}[${i}]`, kind: "id_changed", source: src[i], target: tgt[i] });
        }
      } else {
        walk(src[i], tgt[i], `${path}[${i}]`, issues);
      }
    }
    return;
  }

  if (typeof src === "object") {
    if (typeof tgt !== "object" || tgt === null) {
      issues.push({ path, kind: "type_changed", source: src, target: tgt });
      return;
    }
    const sObj = src as Record<string, unknown>;
    const tObj = tgt as Record<string, unknown>;

    for (const key of Object.keys(sObj)) {
      if (!(key in tObj)) {
        issues.push({ path: joinPath(path, key), kind: "missing_key", source: sObj[key], target: undefined });
        continue;
      }
      walk(sObj[key], tObj[key], joinPath(path, key), issues);
    }
    for (const key of Object.keys(tObj)) {
      if (!(key in sObj)) {
        issues.push({ path: joinPath(path, key), kind: "extra_key", source: undefined, target: tObj[key] });
      }
    }
    return;
  }

  const leafField = path.split(".").pop()?.replace(/\[\d+\]$/, "") ?? "";

  if (typeof src === "number") {
    if (src !== tgt) issues.push({ path, kind: "numeric_changed", source: src, target: tgt });
    return;
  }
  if (typeof src === "boolean") {
    if (src !== tgt) issues.push({ path, kind: "boolean_changed", source: src, target: tgt });
    return;
  }
  if (typeof src === "string") {
    if (IMMUTABLE_ENUM_FIELDS.has(leafField) && src !== tgt) {
      issues.push({ path, kind: "enum_changed", source: src, target: tgt });
      return;
    }
    if (IMMUTABLE_ID_FIELDS.has(leafField) && src !== tgt) {
      issues.push({ path, kind: "id_changed", source: src, target: tgt });
      return;
    }
    if (COORDINATE_PREFIX_FIELDS.has(leafField) && typeof tgt === "string") {
      if (extractCoordPrefix(src as string) !== extractCoordPrefix(tgt)) {
        issues.push({ path, kind: "id_changed", source: src, target: tgt });
      }
      return;
    }
    return;
  }
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}
