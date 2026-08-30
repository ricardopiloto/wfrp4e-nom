#!/usr/bin/env node
/**
 * Migrate nationality Career RollTables: type text, documentUuid null,
 * description -> @UUID journal link from Core or NoM Careers journal (design.md).
 *
 * NoM resolution order: exact page name; composed {prefix}+{results.name}; then
 * maintainer aliases (nationalityTag + row name → pages[].name, see fix-nom-career-journal-six-rows).
 *
 * Usage:
 *   node scripts/migrate-career-rolltable-links.mjs --dry-run
 *   node scripts/migrate-career-rolltable-links.mjs --write
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const CORE_PATH = path.join(root, "data_sources/data_source_core-wczCPcuHT4VQDLpL.json");
const NOM_CAREERS_PATH = path.join(
  root,
  "packs-src/nom-journals/Nations_of_Mankind___Careers_trUWzGkEqCbeCzvo.json"
);
const TABLES_DIR = path.join(root, "packs-src/nom-tables");
const REPORT_PATH = path.join(root, "reports/career-rolltable-unmatched.txt");

const CORE_JOURNAL_ID = "wczCPcuHT4VQDLpL";
const NOM_JOURNAL_ID = "trUWzGkEqCbeCzvo";

/** Page names excluded from NoM lookups (design.md — non-career). */
const EXCLUDED_NOM_PAGE_NAMES = new Set(["Talents"]);

/** Parsed nationality tag inside RollTable.name parentheses → composed prefix for NoM (design.md). */
const NATIONALITY_TO_PREFIX = new Map([
  ["Albionite", "Albionese"],
  ["Estalian", "Estalian"],
  ["Tilean", "Tilean"],
  ["Nipponese", "Nippon"],
  ["Norscan", "Norscan"],
  ["Bretonnian Noble", "Bretonnian"],
  ["Bretonnian Lowborn", "Bretonnian"],
  ["Arabyan", "Arabyan"],
  ["Cathayan", "Cathayan"],
  ["Indan", "Ind"],
  ["Gospodar", "Kislev"],
  ["Ungol", "Kislev"],
  ["Wastelander/Marienburger", "Westerland"],
  ["Southlander", "Southlander"],
  ["Strigany", "Strigany"]
]);

/** `nationalityTag` (parenthetical)\t trimmed results.name → NoM careers `pages[].name` (openspec fix-nom-career-journal-six-rows). */
const NOM_ROW_ALIAS = new Map([
  ["Nipponese\tVimto Monk", "Nippon Vimto Monks"],
  ["Norscan\tMercenary", "Norscan Freeholder"],
  ["Wastelander/Marienburger\tBlack Cap", "Wastelander Black Cap"],
  ["Norscan\tSeer", "Norscan Seer"],
  ["Norscan\tReaver", "Norscan Reaver"],
  ["Nipponese\tRonin", "Nippon Ronin"],
  ["Estalian\tLuchador", "Lustrian Luchador"],
  ["Tilean\tLuchador", "Lustrian Luchador"],
  ["Norscan\tSkald", "Norscan Skald"],
  ["Norscan\tWhaler", "Norscan Whaler"],
  ["Cathayan\tSwordsaint", "Cathayan Swordsaint"],
]);

function nomAliasTargetPage(nationalityTag, lookupTrimmed) {
  if (!nationalityTag || !lookupTrimmed) return null;
  return NOM_ROW_ALIAS.get(`${nationalityTag}\t${lookupTrimmed}`) ?? null;
}

const args = process.argv.slice(2);
const doWrite = args.includes("--write");

function buildPageNameMap(pages, label) {
  /** @type {Map<string, string[]>} */
  const byName = new Map();
  for (const p of pages) {
    const n = p.name;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(p._id);
  }
  const duplicates = [...byName.entries()].filter(([, ids]) => ids.length > 1);
  if (duplicates.length) {
    console.error(`Duplicate page names in ${label}:`);
    for (const [n, ids] of duplicates) console.error(`  "${n}": ${ids.join(", ")}`);
    process.exit(1);
  }
  return new Map([...byName.entries()].map(([n, [id]]) => [n, id]));
}

function parseNationalityTag(rollTableName) {
  if (typeof rollTableName !== "string") return "";
  const m = rollTableName.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : "";
}

function makeUuid(modulePack, journalId, pageId, label) {
  return `@UUID[Compendium.${modulePack}.JournalEntry.${journalId}.JournalEntryPage.${pageId}]{${label}}`;
}

const CORE_JOURNALS_PACK = "wfrp4e-core.journals";
const NOM_JOURNALS_PACK = "wfrp4e-nom.nom-journals";

/** Career name stored in description when results.name is empty (legacy import). */
function repairInvertedRow(r) {
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (name) return false;

  const desc = typeof r.description === "string" ? r.description.trim() : "";
  if (!desc || desc.startsWith("@UUID[") || desc.startsWith("@Compendium[")) return false;

  r.name = desc;
  return true;
}

async function main() {
  const coreJson = JSON.parse(await fs.readFile(CORE_PATH, "utf8"));
  const coreMap = buildPageNameMap(coreJson.pages ?? [], "Core datasource");

  const nomJson = JSON.parse(await fs.readFile(NOM_CAREERS_PATH, "utf8"));
  const nomCareerPages = (nomJson.pages ?? []).filter((p) => !EXCLUDED_NOM_PAGE_NAMES.has(p.name));
  const nomMap = buildPageNameMap(nomCareerPages, "NoM Careers journal (career pages only)");

  const dirents = await fs.readdir(TABLES_DIR);
  const tableFiles = dirents.filter((f) => f.startsWith("Career___Human__") && f.endsWith(".json")).sort();

  let rowCore = 0;
  let rowNomExact = 0;
  let rowNomComposed = 0;
  let rowNomAlias = 0;
  let rowInvertedRepaired = 0;
  let rowPreserved = 0;
  /** @type {Set<string>} */
  const unmatchedLines = new Set();
  /** @type {Set<string>} */
  const unreachableNomPages = new Set(nomMap.keys());

  let filesChanged = 0;

  for (const file of tableFiles) {
    const fpath = path.join(TABLES_DIR, file);
    const raw = await fs.readFile(fpath, "utf8");
    const doc = JSON.parse(raw);

    const nationalityTag = parseNationalityTag(doc.name ?? "");
    const prefix = nationalityTag ? NATIONALITY_TO_PREFIX.get(nationalityTag) ?? null : null;

    for (const r of doc.results ?? []) {
      if (repairInvertedRow(r)) rowInvertedRepaired++;

      const label = typeof r.name === "string" ? r.name : "";
      const oldDesc = r.description ?? "";
      const lookup = label.trim();

      r.type = "text";
      r.documentUuid = null;

      if (lookup && coreMap.has(lookup)) {
        r.description = makeUuid(CORE_JOURNALS_PACK, CORE_JOURNAL_ID, coreMap.get(lookup), label);
        rowCore++;
      } else if (lookup && nomMap.has(lookup)) {
        const pageId = nomMap.get(lookup);
        r.description = makeUuid(NOM_JOURNALS_PACK, NOM_JOURNAL_ID, pageId, label);
        unreachableNomPages.delete(lookup);
        rowNomExact++;
      } else if (lookup && prefix) {
        const composed = `${prefix} ${lookup}`.trim();
        if (nomMap.has(composed)) {
          const pageId = nomMap.get(composed);
          r.description = makeUuid(NOM_JOURNALS_PACK, NOM_JOURNAL_ID, pageId, label);
          unreachableNomPages.delete(composed);
          rowNomComposed++;
        } else {
          const aliasPage = nomAliasTargetPage(nationalityTag, lookup);
          if (aliasPage && nomMap.has(aliasPage)) {
            r.description = makeUuid(NOM_JOURNALS_PACK, NOM_JOURNAL_ID, nomMap.get(aliasPage), label);
            unreachableNomPages.delete(aliasPage);
            rowNomAlias++;
          } else {
            r.description = oldDesc;
            rowPreserved++;
            if (lookup) unmatchedLines.add(`${lookup}\t${file}`);
          }
        }
      } else {
        const aliasPage = lookup ? nomAliasTargetPage(nationalityTag, lookup) : null;
        if (aliasPage && nomMap.has(aliasPage)) {
          r.description = makeUuid(NOM_JOURNALS_PACK, NOM_JOURNAL_ID, nomMap.get(aliasPage), label);
          unreachableNomPages.delete(aliasPage);
          rowNomAlias++;
        } else {
          r.description = oldDesc;
          rowPreserved++;
          if (lookup) unmatchedLines.add(`${lookup}\t${file}`);
        }
      }
    }

    const nextRaw = `${JSON.stringify(doc, null, 2)}\n`;
    if (nextRaw !== raw) {
      filesChanged++;
      if (doWrite) await fs.writeFile(fpath, nextRaw, "utf8");
    }
  }

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  const unusedLines = [...unreachableNomPages].sort();
  const reportBody = [
    "# Unmatched career names (no Core or NoM Careers journal page via exact, composed, or alias match)",
    "# Tab: name<TAB>rolltable-file",
    "",
    ...[...unmatchedLines].sort(),
    "",
    "# NoM career pages not linked from any nationality table row (this run; documentation only)",
    "",
    ...unusedLines.map((n) => `- ${n}`),
    ""
  ].join("\n");
  await fs.writeFile(REPORT_PATH, reportBody, "utf8");

  console.log(
    JSON.stringify(
      {
        mode: doWrite ? "write" : "dry-run",
        tables: tableFiles.length,
        filesWouldChange: filesChanged,
        rowsLinkedCore: rowCore,
        rowsLinkedNoMExact: rowNomExact,
        rowsLinkedNoMComposed: rowNomComposed,
        rowsLinkedNoMAlias: rowNomAlias,
        rowsLinkedNoM: rowNomExact + rowNomComposed + rowNomAlias,
        rowsInvertedRepaired: rowInvertedRepaired,
        rowsPreservedDescription: rowPreserved,
        unmatchedDistinctRows: unmatchedLines.size,
        nomCareerPagesUnlinked: unusedLines.length,
        report: REPORT_PATH
      },
      null,
      2
    )
  );

  if (!doWrite) {
    console.error("\nDry-run only; pass --write to persist JSON + report.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
