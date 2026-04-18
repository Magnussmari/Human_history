/**
 * Core per-file translator.
 * Send whole JSON → Gemini → parse → structural diff → schema validate → atomic write.
 * Anything short of ALL those passes → abort, no output written.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { GeminiTranslator } from "./gemini.js";
import { validateYearDoc, type YearDoc } from "./schema.js";
import { diffStructure, type DiffIssue } from "./structural-diff.js";
import { repairKeys, type Repair } from "./key-repair.js";
import { sha256, type Locale } from "./manifest.js";

export interface TranslateFileInput {
  sourcePath: string;
  targetPath: string;
  locale: Locale;
  glossaryText: string;
  translator: GeminiTranslator;
  model: string;
  temperature?: number;
}

export interface TranslateFileResult {
  sourceSha: string;
  targetSha: string;
  bytesIn: number;
  bytesOut: number;
  structuralIssues: DiffIssue[];
  schemaErrors: string[];
  written: boolean;
  skippedReason?: string;
}

export async function translateFile(input: TranslateFileInput): Promise<TranslateFileResult> {
  const sourceRaw = await readFile(input.sourcePath, "utf8");
  const sourceSha = sha256(sourceRaw);
  const source = JSON.parse(sourceRaw) as YearDoc;

  const sourceValidation = validateYearDoc(source);
  if (!sourceValidation.valid) {
    throw new Error(
      `Source file ${input.sourcePath} failed schema validation — refusing to translate. Errors: ${sourceValidation.errors.slice(0, 3).join("; ")}`,
    );
  }

  const userMessage = buildUserMessage(sourceRaw, input.glossaryText);

  const raw = await input.translator.generateJSON({ userMessage, temperature: input.temperature });
  if (!raw || typeof raw !== "object") {
    throw new Error(`Gemini returned non-object JSON for ${input.sourcePath}`);
  }

  const target = raw as YearDoc;

  const repairs = repairKeys(source, target);
  if (repairs.length > 0) {
    for (const r of repairs) {
      console.warn(`[repair] ${input.sourcePath} — key "${r.from}" → "${r.to}" at ${r.path} (value="${r.value}")`);
    }
  }

  const structuralIssues = diffStructure(source, target);
  if (structuralIssues.length > 0) {
    return {
      sourceSha,
      targetSha: "",
      bytesIn: Buffer.byteLength(sourceRaw, "utf8"),
      bytesOut: 0,
      structuralIssues,
      schemaErrors: [],
      written: false,
      skippedReason: `Structural diff: ${structuralIssues.length} issue(s)`,
    };
  }

  const schemaReport = validateYearDoc(target);
  if (!schemaReport.valid) {
    return {
      sourceSha,
      targetSha: "",
      bytesIn: Buffer.byteLength(sourceRaw, "utf8"),
      bytesOut: 0,
      structuralIssues: [],
      schemaErrors: schemaReport.errors,
      written: false,
      skippedReason: `Schema invalid: ${schemaReport.errors.slice(0, 3).join("; ")}`,
    };
  }

  const outText = JSON.stringify(target, null, 2) + "\n";
  const targetSha = sha256(outText);

  await mkdir(dirname(input.targetPath), { recursive: true });
  const tmp = `${input.targetPath}.tmp`;
  await writeFile(tmp, outText, "utf8");
  await rename(tmp, input.targetPath);

  return {
    sourceSha,
    targetSha,
    bytesIn: Buffer.byteLength(sourceRaw, "utf8"),
    bytesOut: Buffer.byteLength(outText, "utf8"),
    structuralIssues: [],
    schemaErrors: [],
    written: true,
  };
}

function buildUserMessage(sourceRaw: string, glossaryText: string): string {
  const source = JSON.parse(sourceRaw);
  const keys = collectAllKeys(source);
  return [
    "ATHUGIÐ — JSON-LYKLAR MEGA EKKI BREYTAST. Eftirfarandi enska heiti eru lyklar (ekki gildi) og verða að standa nákvæmlega eins og þau eru í frumtextanum:",
    keys.map((k) => `  "${k}"`).join("\n"),
    "",
    "Verndaðu einnig eftirfarandi enum-gildi og auðkenni nákvæmlega eins og í frumtexta (EKKI þýða þau, EKKI breyta stafsetningu):",
    glossaryText,
    "",
    "Hér er JSON-skjalið sem á að þýða (skilaðu fullu JSON-skjali á íslensku, sama uppbygging, sömu lyklar, sömu enum-gildi, sömu auðkenni, sömu tölugildi):",
    sourceRaw,
  ].join("\n");
}

function collectAllKeys(value: unknown, acc: Set<string> = new Set()): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectAllKeys(item, acc);
  } else if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      acc.add(k);
      collectAllKeys(v, acc);
    }
  }
  return [...acc].sort();
}
