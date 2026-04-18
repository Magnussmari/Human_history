#!/usr/bin/env node
/**
 * Aggregates Layer 2 (scholarly eras + education pilots + bibliography)
 * into frontend/public/data/eras/ for client consumption.
 *
 * Run from repo root: node frontend/scripts/aggregate-evidence.mjs
 */

import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { ERA_REGISTRY, FUTURE_BUCKETS } from "./era-registry.mjs";

const REPO_ROOT = path.resolve(process.cwd());
const EVIDENCE_ROOT = path.join(REPO_ROOT, "evidence-layer");
const PHASE3_RESULTS = path.join(EVIDENCE_ROOT, "eras/phase3-eras-14-20/results");
const EDUCATION_MAP = path.join(EVIDENCE_ROOT, "education-layer/timeline-map");
const BIB_PATH = path.join(EVIDENCE_ROOT, "education-layer/bibliography/bibliography.bib");
const VALOR_MAP_PATH = path.join(EVIDENCE_ROOT, "education-layer/cross-references/valor-to-history-eras.md");
const SCHEMA_PATH = path.join(EVIDENCE_ROOT, "methodology/scite-skill-system/reference/schema.json");

const OUT_DIR = path.join(REPO_ROOT, "frontend/public/data/eras");

// ─── Schema validation ──────────────────────────────────────────────────────

const ajv = new Ajv({ strict: false, allErrors: true });
let validateSchema = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function trimAgentPayload(agent) {
  // Drop heavy audit fields from client bundle; keep counts for UI.
  const rest = { ...agent };
  delete rest.search_log;
  delete rest.adaptations_logged;
  return rest;
}

// ─── Education markdown parser ──────────────────────────────────────────────

function parseEducation(mdPath) {
  const raw = fs.readFileSync(mdPath, "utf8");
  const lines = raw.split("\n");

  const frontmatter = parseFrontmatter(lines);
  const sections = splitSections(lines);

  const verdictBlock = findSection(sections, "Verdict");
  const formationBlock = findSection(sections, "Formation Mechanism");
  const canonicalBlock = findSection(sections, "Canonical Texts");
  const stageBlock = findSection(sections, "Educational Stage Mapping");

  return {
    status: "pilot-complete",
    frontmatter,
    coreQuestion: extractProse(findSection(sections, "Core Education Question")),
    capacities: parseCapacityTable(verdictBlock),
    constants: parseConstantsTable(verdictBlock),
    institutions: parseTable(formationBlock).rows,
    pedagogicalForm: extractPedagogicalForm(formationBlock),
    canonicalTexts: parseCanonicalTexts(canonicalBlock),
    stageMapping: parseTable(stageBlock).rows,
    centralDebate: parseCentralDebate(findSection(sections, "The Central Debate")),
    valorFindings: parseNumberedList(findSection(sections, "Key VALOR Findings")),
    aiEraImplication: extractProse(findSection(sections, "AI-Era Implication")),
    crossRefL1: extractProse(findSection(sections, "Cross-Reference to L1")),
    verification: extractProse(findSection(sections, "Verification")),
    phase1Source: extractProse(findSection(sections, "Phase_1 source file")),
  };
}

function parseFrontmatter(lines) {
  const fm = {};
  for (const line of lines.slice(0, 20)) {
    const m = line.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
    if (m) fm[m[1].trim()] = m[2].replace(/^`|`$/g, "").trim();
  }
  return fm;
}

function splitSections(lines) {
  const sections = {};
  let current = "__preamble__";
  const buffers = { __preamble__: [] };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      current = h2[1].trim();
      buffers[current] = [];
      continue;
    }
    if (!buffers[current]) buffers[current] = [];
    buffers[current].push(line);
  }
  for (const [k, v] of Object.entries(buffers)) sections[k] = v.join("\n");
  return sections;
}

function findSection(sections, prefix) {
  const key = Object.keys(sections).find(k => k.startsWith(prefix));
  return key ? sections[key] : "";
}

function parseTable(block) {
  const tableLines = block.split("\n").filter(l => l.trim().startsWith("|"));
  if (tableLines.length < 2) return { headers: [], rows: [] };
  const headers = splitRow(tableLines[0]);
  const dataStart = tableLines[1].match(/^\|\s*-+/) ? 2 : 1;
  const rows = tableLines.slice(dataStart).map(splitRow);
  return { headers, rows };
}

function splitRow(line) {
  const parts = line.split("|").slice(1, -1).map(c => c.trim());
  return parts;
}

function parseCapacityTable(block) {
  // Capacities sit under "### The 7 capacity categories" — allow any suffix.
  const section = sliceH3(block, "The 7 capacity categories", "The 5 civilisational constants");
  const { rows } = parseTable(section);
  // columns: # | Category | Level/Risk | Evidence/Stake
  return rows
    .filter(r => r.length >= 4 && r[0] && r[1])
    .map(r => ({
      id: Number(r[0]),
      name: stripEmphasis(r[1]),
      level: stripEmphasis(r[2]),
      evidence: r[3],
    }));
}

function parseConstantsTable(block) {
  const section = sliceH3(block, "The 5 civilisational constants", null);
  const { rows } = parseTable(section);
  // columns: # | Constant | State/Evidenced
  return rows
    .filter(r => r.length >= 3 && r[0] && r[1])
    .map(r => ({
      id: Number(r[0]),
      name: stripEmphasis(r[1]),
      state: stripEmphasis(r[2]),
    }));
}

function sliceH3(block, startPrefix, endPrefix) {
  // Find H3 header line whose title starts with the given prefix.
  const lines = block.split("\n");
  let startIdx = -1;
  let endIdx = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^###\s+(.+?)\s*$/);
    if (!m) continue;
    if (startIdx === -1 && m[1].startsWith(startPrefix)) { startIdx = i + 1; continue; }
    if (startIdx !== -1 && endPrefix && m[1].startsWith(endPrefix)) { endIdx = i; break; }
  }
  if (startIdx === -1) return "";
  return lines.slice(startIdx, endIdx).join("\n");
}

function parseCanonicalTexts(block) {
  // Some pilots (era-50) have subsections like "### Peer-reviewed empirical".
  // Collect all tables inside this section.
  const allRows = [];
  const tableLines = block.split("\n");
  let currentTable = [];
  const flush = () => {
    if (currentTable.length >= 2) {
      const { rows } = parseTable(currentTable.join("\n"));
      allRows.push(...rows);
    }
    currentTable = [];
  };
  for (const line of tableLines) {
    if (line.trim().startsWith("|")) {
      currentTable.push(line);
    } else if (currentTable.length) {
      flush();
    }
  }
  flush();
  return allRows;
}

function parseCentralDebate(block) {
  const { rows } = parseTable(block);
  return rows
    .filter(r => r.length >= 3 && r[0])
    .map(r => ({
      position: stripEmphasis(r[0]),
      knowledge: r[1],
      aiQuestion: r[2],
    }));
}

function parseNumberedList(block) {
  const items = [];
  let current = null;
  for (const raw of block.split("\n")) {
    const line = raw.trimEnd();
    const m = line.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      if (current) items.push(current);
      current = m[2].trim();
    } else if (current && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      current += " " + line.trim();
    } else if (current && !line.trim()) {
      // paragraph break ends the item
      items.push(current);
      current = null;
    }
  }
  if (current) items.push(current);
  return items.map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function extractProse(block) {
  if (!block) return "";
  return block
    .split("\n")
    .filter(l => !l.trim().startsWith("#") && !l.trim().startsWith("---"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPedagogicalForm(block) {
  const m = block.match(/\*\*Pedagogical form\*\*:\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/);
  return m ? m[1].trim() : "";
}

function stripEmphasis(s) {
  return (s ?? "").replace(/^\*+|\*+$/g, "").replace(/\*\*/g, "").trim();
}

// ─── BibTeX parser (minimal, brace-balanced values) ─────────────────────────

function parseBibtex(raw) {
  const entries = {};
  let i = 0;
  while (i < raw.length) {
    const at = raw.indexOf("@", i);
    if (at === -1) break;
    const braceOpen = raw.indexOf("{", at);
    if (braceOpen === -1) break;
    const type = raw.slice(at + 1, braceOpen).trim().toLowerCase();
    if (type.startsWith("comment") || type.startsWith("preamble") || type.startsWith("string")) {
      i = skipBalanced(raw, braceOpen);
      continue;
    }
    const close = skipBalanced(raw, braceOpen);
    if (close === -1) break;
    const body = raw.slice(braceOpen + 1, close);
    const firstComma = body.indexOf(",");
    if (firstComma === -1) { i = close + 1; continue; }
    const key = body.slice(0, firstComma).trim();
    const fieldsBlock = body.slice(firstComma + 1);
    const fields = parseBibFields(fieldsBlock);
    entries[key] = { type, key, ...fields };
    i = close + 1;
  }
  return entries;
}

function skipBalanced(raw, openIdx) {
  let depth = 0;
  for (let j = openIdx; j < raw.length; j++) {
    const c = raw[j];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return j; }
  }
  return -1;
}

function parseBibFields(block) {
  const out = {};
  let i = 0;
  while (i < block.length) {
    while (i < block.length && /[\s,]/.test(block[i])) i++;
    const eq = block.indexOf("=", i);
    if (eq === -1) break;
    const name = block.slice(i, eq).trim().toLowerCase();
    let j = eq + 1;
    while (j < block.length && /\s/.test(block[j])) j++;
    let value = "";
    if (block[j] === "{") {
      const end = skipBalanced(block, j);
      if (end === -1) break;
      value = block.slice(j + 1, end).replace(/\s+/g, " ").trim();
      i = end + 1;
    } else if (block[j] === '"') {
      const end = block.indexOf('"', j + 1);
      if (end === -1) break;
      value = block.slice(j + 1, end).trim();
      i = end + 1;
    } else {
      const comma = block.indexOf(",", j);
      const end = comma === -1 ? block.length : comma;
      value = block.slice(j, end).trim();
      i = end;
    }
    if (name) out[name] = value;
  }
  return out;
}

// ─── VALOR map → era-range mapping JSON ─────────────────────────────────────

function parseValorMap(raw) {
  const rows = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
    if (!m) continue;
    rows.push({
      file: m[1].trim(),
      eraRange: m[2].trim(),
      calendarSpan: m[3].trim(),
      themes: m[4].trim(),
    });
  }
  return rows;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Source data lives in evidence-layer/ at the repo root. On Vercel the
  // directory is absent (it's awaiting commander review), but the aggregated
  // outputs in frontend/public/data/eras/ are committed. No-op gracefully so
  // the production build can use the committed JSON as-is.
  if (!fs.existsSync(EVIDENCE_ROOT)) {
    console.log("evidence-layer/ not present — using committed eras/ as-is.");
    return;
  }

  ensureDir(OUT_DIR);

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  validateSchema = ajv.compile(schema);

  // Load shared assets
  const bibliography = fs.existsSync(BIB_PATH) ? parseBibtex(fs.readFileSync(BIB_PATH, "utf8")) : {};
  const valorMap = fs.existsSync(VALOR_MAP_PATH) ? parseValorMap(fs.readFileSync(VALOR_MAP_PATH, "utf8")) : [];

  let phase3Count = 0;
  let phase2Count = 0;
  let pilotCount = 0;
  let unresearchedCount = 0;
  const errors = [];
  const warnings = [];

  for (const era of ERA_REGISTRY) {
    const eraOut = {
      id: era.id,
      number: era.number,
      label: era.label,
      start: era.start,
      end: era.end,
      primaryBroadEra: era.primaryBroadEra,
      phaseStatus: era.phaseStatus,
      valorSource: era.valorSource,
      educationStatus: era.educationStatus,
    };

    // Layer 2A — scholarly evidence
    if (era.phaseStatus === "phase3-complete" && era.agentFile) {
      const agentPath = path.join(PHASE3_RESULTS, era.agentFile);
      if (!fs.existsSync(agentPath)) {
        errors.push(`${era.id}: missing phase3 result ${era.agentFile}`);
      } else {
        const agent = readJson(agentPath);
        const valid = validateSchema(agent);
        if (!valid) {
          const fatal = (validateSchema.errors ?? []).filter(e => e.keyword !== "additionalProperties");
          if (fatal.length) {
            errors.push(`${era.id}: schema v1.0.0 fatal errors — ${JSON.stringify(fatal.slice(0, 3))}`);
          } else {
            warnings.push(`${era.id}: extra fields beyond schema v1.0.0 (non-fatal)`);
          }
        }
        eraOut.scholarly = trimAgentPayload(agent);
        phase3Count++;
      }
    } else if (era.phaseStatus === "phase2-migration-pending") {
      eraOut.scholarly = {
        status: "migration-pending",
        sourcePath: `evidence-layer/eras/phase2-eras-01-13/outputs/json/${inferPhase2Filename(era)}`,
        note: "Phase 2 output exists but schema drifted; migration to v1.0.0 pending.",
      };
      phase2Count++;
    } else {
      eraOut.scholarly = { status: "unresearched" };
      unresearchedCount++;
    }

    // Layer 2B — education
    if (era.educationStatus === "pilot-complete" && era.educationFile) {
      const eduPath = path.join(EDUCATION_MAP, era.educationFile);
      if (!fs.existsSync(eduPath)) {
        errors.push(`${era.id}: missing education pilot ${era.educationFile}`);
        eraOut.education = { status: "unmapped" };
      } else {
        try {
          eraOut.education = parseEducation(eduPath);
          pilotCount++;
        } catch (e) {
          errors.push(`${era.id}: education parse failed — ${e.message}`);
          eraOut.education = { status: "parse-failed", error: e.message };
        }
      }
    } else if (era.educationStatus === "valor-mapped") {
      eraOut.education = {
        status: "valor-mapped",
        valorSource: era.valorSource,
        note: "VALOR source identified; era-specific synthesis awaiting authoring.",
      };
    } else {
      eraOut.education = { status: "unmapped" };
    }

    writeJson(path.join(OUT_DIR, `${era.id}.json`), eraOut);
  }

  // Registry index (lightweight — no nested scholarly/education)
  const index = {
    generated_at: new Date().toISOString(),
    totals: {
      registered: ERA_REGISTRY.length,
      phase3Complete: phase3Count,
      phase2Pending: phase2Count,
      unresearched: unresearchedCount,
      educationPilots: pilotCount,
    },
    registry: ERA_REGISTRY.map(e => ({
      id: e.id,
      number: e.number,
      label: e.label,
      start: e.start,
      end: e.end,
      primaryBroadEra: e.primaryBroadEra,
      phaseStatus: e.phaseStatus,
      educationStatus: e.educationStatus,
    })),
    futureBuckets: FUTURE_BUCKETS,
  };
  writeJson(path.join(OUT_DIR, "index.json"), index);

  // Bibliography + VALOR map
  writeJson(path.join(OUT_DIR, "bibliography.json"), bibliography);
  writeJson(path.join(OUT_DIR, "valor-map.json"), { sources: valorMap, generated_at: new Date().toISOString() });

  // Report
  console.log(`\nLayer 2 aggregation complete.`);
  console.log(`  Eras registered:       ${ERA_REGISTRY.length}`);
  console.log(`  Phase 3 (validated):   ${phase3Count}`);
  console.log(`  Phase 2 (pending):     ${phase2Count}`);
  console.log(`  Unresearched:          ${unresearchedCount}`);
  console.log(`  Education pilots:      ${pilotCount}`);
  console.log(`  Bibliography entries:  ${Object.keys(bibliography).length}`);
  console.log(`  VALOR map entries:     ${valorMap.length}`);
  console.log(`  Future buckets:        ${FUTURE_BUCKETS.length}`);
  console.log(`  Output:                ${path.relative(REPO_ROOT, OUT_DIR)}\n`);

  if (warnings.length) {
    console.warn(`  ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`    ${w}`);
  }
  if (errors.length) {
    console.error(`  ${errors.length} error(s):`);
    for (const e of errors) console.error(`    ${e}`);
    process.exit(1);
  }
}

function inferPhase2Filename(era) {
  const padded = String(era.number).padStart(2, "0");
  return `era-${padded}.json`;
}

main();
