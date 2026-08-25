#!/usr/bin/env node
/**
 * Normalize NoM career content across the full careers journal, nom-items tiers,
 * and nationality roll tables. See .cursor/skills/nom-career-content/SKILL.md.
 *
 * Usage:
 *   node scripts/normalize-career-content.mjs --dry-run
 *   node scripts/normalize-career-content.mjs --write
 *   node scripts/normalize-career-content.mjs --write --career "Artillerist"
 *   node scripts/normalize-career-content.mjs --write --from-career "Artillerist"
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const JOURNAL_PATH = path.join(
  root,
  "packs-src/nom-journals/Nations_of_Mankind___Careers_trUWzGkEqCbeCzvo.json"
);
const NOM_ITEMS_DIR = path.join(root, "packs-src/nom-items");
const TABLES_DIR = path.join(root, "packs-src/nom-tables");
const ICONS_DIR = path.join(root, "icons/careers");
const MISSING_TALENTS_PATH = path.join(root, "reports/nom-career-missing-talents.txt");

const JOURNAL_ID = "trUWzGkEqCbeCzvo";
const EXCLUDED_PAGE_NAMES = new Set(["Talents"]);

const TIER_ROMAN = ["I", "II", "III", "IV"];
const TIER_SYMBOL = { I: "✠", II: "♟", III: "♜", IV: "♛" };

const args = process.argv.slice(2);
const doWrite = args.includes("--write");
const careerFilter = (() => {
  const i = args.indexOf("--career");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const fromCareerFilter = (() => {
  const i = args.indexOf("--from-career");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

if (args.includes("--help") || args.includes("-h")) {
  console.log(`normalize-career-content.mjs

Options:
  --dry-run       Report changes without writing (default)
  --write         Apply changes to packs-src
  --career NAME       Limit to one career journal page + its tiers/tables
  --from-career NAME  Process this page and all later career pages (journal order)
  --help              Show this help
`);
  process.exit(0);
}

function normalizeKey(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function migrateJournalLinks(content) {
  let out = content;
  out = out.replace(
    /@Compendium\[nations-of-mankind-wfrp4e\.careers-nom\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-nom.nom-items.$1]{$2}"
  );
  out = out.replace(
    /@Compendium\[wfrp4e-core\.skills\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
  );
  out = out.replace(
    /@Compendium\[wfrp4e-core\.talents\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
  );
  out = out.replace(
    /@Compendium\[nations-of-mankind-wfrp4e\.talents-nom\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-nom.nom-items.$1]{$2}"
  );
  out = out.replace(
    /@UUID\[Compendium\.wfrp4e-core\.journals\.JournalEntry\.trUWzGkEqCbeCzvo\.JournalEntryPage\.([^[\]{}]+)\]\{([^}]*)\}/g,
    `@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${JOURNAL_ID}.JournalEntryPage.$1]{$2}`
  );
  return out;
}

/** Prefer Foundry Item UUID segment for core skills/talents. */
function preferCoreItemUuids(content) {
  return content.replace(
    /@UUID\[Compendium\.wfrp4e-core\.items\.(?!Item\.)([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
  );
}

/** ✠@UUID → ✠ @UUID (space after tier chess symbol in h3). */
function fixChessSymbolSpacing(content) {
  return content.replace(/([✠♟♜♛])(@UUID\[)/g, "$1 $2");
}

/** Module icon srcs: kebab-case + .webp only. */
function fixModuleIconSrcs(content) {
  return content.replace(
    /(src="modules\/(?:wfrp4e-nom|nations-of-mankind-wfrp4e)\/icons\/)([^"]+)(")/g,
    (_m, prefix, rest, suffix) => {
      const parts = rest.split("/");
      let file = parts[parts.length - 1].replace(/_/g, "-");
      file = file.replace(/\.(png|jpe?g)$/i, ".webp");
      if (file === "Kislev.webp") file = "kislev.webp";
      parts[parts.length - 1] = file;
      return prefix + parts.join("/") + suffix;
    }
  );
}

function fixTierH3Headers(content) {
  return content.replace(
    /<strong>\s*(I|II|III|IV)\.\s*(?=@)/g,
    (_, tier) => `<strong>${TIER_SYMBOL[tier]} `
  );
}

function fixAdvanceSchemeSecondRow(content) {
  const marker = /Advance Scheme<\/h3>/i;
  const m = content.match(marker);
  if (!m) return content;

  const start = m.index + m[0].length;
  const tableStart = content.indexOf("<table", start);
  if (tableStart < 0) return content;

  const tableEnd = content.indexOf("</table>", tableStart);
  if (tableEnd < 0) return content;

  const tableHtml = content.slice(tableStart, tableEnd + "</table>".length);
  const rows = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  if (rows.length < 2) return content;

  const headerRow = rows[0][0];
  const dataRow = rows[1][0];
  const fixedDataRow = dataRow.replace(
    /<p>\s*(?:<strong>)?\s*(I|II|III|IV)\s*(?:<\/strong>)?\s*<\/p>/gi,
    (_, tier) => `<p>${TIER_SYMBOL[tier]}</p>`
  );

  if (fixedDataRow === dataRow) return content;

  const fixedTable = tableHtml.replace(dataRow, fixedDataRow);
  return content.slice(0, tableStart) + fixedTable + content.slice(tableEnd + "</table>".length);
}

function pageUsesItemSegment(content) {
  return /Compendium\.wfrp4e-nom\.nom-items\.Item\./.test(content);
}

function normalizeNomItemSegment(content) {
  if (pageUsesItemSegment(content)) return content;
  return content.replace(
    /Compendium\.wfrp4e-nom\.nom-items\.Item\./g,
    "Compendium.wfrp4e-nom.nom-items."
  );
}

/** careergroup.value → journal pages[].name when they differ */
const CAREER_GROUP_PAGE_ALIAS = new Map([
  ["Albionese Highlander", "Albinonese Highlander"],
  ["Norscan Mercenary", "Norscan Freeholder"],
  ["Cathayan Dragon Monk", "Celestial Dragon Monk"],
  ["Man At Arms", "Bretonnian Man-At-Arms"],
  ["Reaver", "Norscan Reaver"],
  ["Ronin", "Nippon Ronin"]
]);

function resolveCareerPageName(careerGroup, pageByName) {
  if (CAREER_GROUP_PAGE_ALIAS.has(careerGroup)) {
    return CAREER_GROUP_PAGE_ALIAS.get(careerGroup);
  }
  if (pageByName.has(careerGroup)) return careerGroup;

  const pages = [...pageByName.keys()];
  const bySuffix = pages.filter(
    (p) => p.endsWith(` ${careerGroup}`) || p.endsWith(careerGroup)
  );
  if (bySuffix.length === 1) return bySuffix[0];

  const byInclude = pages.filter((p) => p.includes(careerGroup));
  if (byInclude.length === 1) return byInclude[0];

  return null;
}

function makeJournalBackLink(pageId, pageName) {
  return `@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${JOURNAL_ID}.JournalEntryPage.${pageId}]{${pageName}}`;
}

function wrapDescriptionLink(link) {
  return `<p>${link}</p>`;
}

function fixNomItemDescription(desc, pageId, pageName) {
  const canonical = makeJournalBackLink(pageId, pageName);
  const legacy =
    /@Compendium\[nations-of-mankind-wfrp4e\.(?:careerentries-nom|careers-nom)\.[^[\]{}]+\]\{[^}]*\}/;
  const needsCanonical = legacy.test(desc) || !desc.includes(canonical);
  if (!needsCanonical) return desc;
  return wrapDescriptionLink(canonical);
}

function extractTalentsBlocks(content) {
  const blocks = [];
  const re =
    /<strong>Talents:?<\/strong>:([\s\S]*?)(?=<strong>|<h3|<\/p>\s*<h3|$)/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

function extractNomItemRefs(text) {
  const refs = [];
  const re =
    /@UUID\[Compendium\.wfrp4e-nom\.nom-items(?:\.Item)?\.([^[\]{}]+)\]\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    refs.push({ id: m[1], label: m[2] });
  }
  return refs;
}

function prependIcon(content, iconPath) {
  if (/<img\s/i.test(content)) return content;
  const tag = `<img src="modules/wfrp4e-nom/icons/careers/${iconPath}" /><p></p>`;
  return tag + content;
}

async function loadNomItemsIndex() {
  /** @type {Map<string, { type: string, name: string, file: string }>} */
  const byId = new Map();
  /** @type {Map<string, string[]>} careergroup -> item files */
  const byCareerGroup = new Map();

  const files = (await fs.readdir(NOM_ITEMS_DIR)).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const doc = JSON.parse(await fs.readFile(path.join(NOM_ITEMS_DIR, file), "utf8"));
    const id = doc._id;
    if (!id) continue;
    byId.set(id, { type: doc.type ?? "", name: doc.name ?? "", file });

    if (doc.type === "career" && doc.system?.careergroup?.value) {
      const cg = doc.system.careergroup.value;
      if (!byCareerGroup.has(cg)) byCareerGroup.set(cg, []);
      byCareerGroup.get(cg).push(file);
    }
  }
  return { byId, byCareerGroup };
}

async function loadIconMap() {
  /** @type {Map<string, string>} normalized page name -> filename */
  const map = new Map();
  let files = [];
  try {
    files = await fs.readdir(ICONS_DIR);
  } catch {
    return map;
  }
  const iconFiles = files.filter((x) => /\.webp$/i.test(x));
  for (const f of iconFiles) {
    const base = f.replace(/\.webp$/i, "");
    const key = normalizeKey(base);
    const keySpaced = normalizeKey(base.replace(/-/g, " "));
    if (!map.has(key)) map.set(key, f);
    if (!map.has(keySpaced)) map.set(keySpaced, f);
    if (base === "cader" && !map.has(normalizeKey("cadet"))) {
      map.set(normalizeKey("cadet"), f);
    }
  }
  return map;
}

function resolveIcon(pageName, iconMap) {
  const key = normalizeKey(pageName);
  if (iconMap.has(key)) return iconMap.get(key);

  const parts = pageName.split(/\s+/);
  for (let n = parts.length; n >= 1; n--) {
    const sub = normalizeKey(parts.slice(-n).join(" "));
    if (iconMap.has(sub)) return iconMap.get(sub);
  }
  return null;
}

function fixRollTableDescriptions(content) {
  return content.replace(
    /Compendium\.wfrp4e-core\.journals\.JournalEntry\.trUWzGkEqCbeCzvo/g,
    "Compendium.wfrp4e-nom.nom-journals.JournalEntry.trUWzGkEqCbeCzvo"
  );
}

async function main() {
  const journalRaw = await fs.readFile(JOURNAL_PATH, "utf8");
  const journal = JSON.parse(journalRaw);
  const { byId: nomIndex, byCareerGroup } = await loadNomItemsIndex();
  const iconMap = await loadIconMap();

  /** @type {Map<string, string>} page name -> page id */
  const pageByName = new Map();
  for (const p of journal.pages ?? []) {
    if (!EXCLUDED_PAGE_NAMES.has(p.name)) pageByName.set(p.name, p._id);
  }

  /** @type {Map<string, { missing: Set<string>, journal: boolean, nomItems: number, icon: boolean }>} */
  const perCareer = new Map();

  /** @type {Map<string, { label: string, id: string, careerPageName: string }>} */
  const missingTalents = new Map();

  let journalPagesChanged = 0;
  let nomItemsChanged = 0;
  let tablesChanged = 0;

  const careerPages = (journal.pages ?? []).filter((p) => !EXCLUDED_PAGE_NAMES.has(p.name));
  const fromCareerIndex =
    fromCareerFilter != null
      ? careerPages.findIndex((p) => p.name === fromCareerFilter)
      : -1;
  if (fromCareerFilter && fromCareerIndex < 0) {
    console.error(`Unknown --from-career page: ${fromCareerFilter}`);
    process.exit(1);
  }

  function pageInScope(pageName) {
    if (careerFilter) return pageName === careerFilter;
    if (fromCareerFilter) {
      const idx = careerPages.findIndex((p) => p.name === pageName);
      return idx >= fromCareerIndex;
    }
    return true;
  }

  for (const page of journal.pages ?? []) {
    if (EXCLUDED_PAGE_NAMES.has(page.name)) continue;
    if (!pageInScope(page.name)) continue;

    perCareer.set(page.name, { missing: new Set(), journal: false, nomItems: 0, icon: false });

    let content = page.text?.content ?? "";
    const before = content;

    content = migrateJournalLinks(content);
    content = preferCoreItemUuids(content);
    content = fixModuleIconSrcs(content);
    content = fixChessSymbolSpacing(content);
    content = fixTierH3Headers(content);
    content = fixAdvanceSchemeSecondRow(content);
    content = normalizeNomItemSegment(content);

    const iconFile = resolveIcon(page.name, iconMap);
    if (iconFile) {
      const withIcon = prependIcon(content, iconFile);
      if (withIcon !== content) {
        content = withIcon;
        perCareer.get(page.name).icon = true;
      }
    }

    for (const block of extractTalentsBlocks(content)) {
      for (const ref of extractNomItemRefs(block)) {
        const item = nomIndex.get(ref.id);
        if (!item || item.type !== "talent") {
          const key = `${ref.id}\t${page.name}`;
          missingTalents.set(key, {
            label: ref.label,
            id: ref.id,
            careerPageName: page.name
          });
          perCareer.get(page.name).missing.add(ref.label || ref.id);
        }
      }
    }

    if (content !== before) {
      page.text.content = content;
      journalPagesChanged++;
      perCareer.get(page.name).journal = true;
    }
  }

  const nomFiles = (await fs.readdir(NOM_ITEMS_DIR)).filter((f) => f.endsWith(".json"));
  for (const file of nomFiles) {
    const fpath = path.join(NOM_ITEMS_DIR, file);
    const raw = await fs.readFile(fpath, "utf8");
    const doc = JSON.parse(raw);
    if (doc.type !== "career") continue;

    const cg = doc.system?.careergroup?.value;
    if (!cg) continue;
    if (careerFilter || fromCareerFilter) {
      const resolved = resolveCareerPageName(cg, pageByName) ?? cg;
      if (!pageInScope(resolved)) continue;
    }

    const pageName = resolveCareerPageName(cg, pageByName);
    if (!pageName) continue;
    const pageId = pageByName.get(pageName);
    if (!pageId) continue;

    const desc = doc.system?.description?.value ?? "";
    const nextDesc = fixNomItemDescription(desc, pageId, pageName);
    if (nextDesc !== desc) {
      doc.system.description.value = nextDesc;
      const out = `${JSON.stringify(doc, null, 2)}\n`;
      if (doWrite) await fs.writeFile(fpath, out, "utf8");
      nomItemsChanged++;
      const stat = perCareer.get(pageName) ?? perCareer.get(cg);
      if (stat) stat.nomItems++;
    }
  }

  const tableFiles = (await fs.readdir(TABLES_DIR))
    .filter((f) => f.startsWith("Career___Human__") && f.endsWith(".json"))
    .sort();

  for (const file of tableFiles) {
    const fpath = path.join(TABLES_DIR, file);
    const raw = await fs.readFile(fpath, "utf8");
    const nextRaw = fixRollTableDescriptions(raw);
    if (nextRaw !== raw) {
      if (doWrite) await fs.writeFile(fpath, nextRaw, "utf8");
      tablesChanged++;
    }
  }

  if (journalPagesChanged > 0) {
    const out = `${JSON.stringify(journal, null, 2)}\n`;
    if (doWrite) await fs.writeFile(JOURNAL_PATH, out, "utf8");
  }

  await fs.mkdir(path.dirname(MISSING_TALENTS_PATH), { recursive: true });
  const missingLines = [...missingTalents.values()].sort((a, b) =>
    a.careerPageName.localeCompare(b.careerPageName)
  );
  const reportBody = [
    "# Missing NoM talents referenced in careers journal (nom-items)",
    "# Tab: label<TAB>itemId<TAB>careerPageName<TAB>sourceFile",
    "",
    ...missingLines.map(
      (r) =>
        `${r.label}\t${r.id}\t${r.careerPageName}\tNations_of_Mankind___Careers_trUWzGkEqCbeCzvo.json`
    ),
    ""
  ].join("\n");
  if (doWrite || missingLines.length > 0) {
    await fs.writeFile(MISSING_TALENTS_PATH, reportBody, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        mode: doWrite ? "write" : "dry-run",
        careerFilter: careerFilter ?? fromCareerFilter,
        journalPagesChanged,
        nomItemsChanged,
        rollTablesPathFixed: tablesChanged,
        missingNomTalents: missingLines.length,
        missingTalentsReport: MISSING_TALENTS_PATH,
        careers: Object.fromEntries(
          [...perCareer.entries()].map(([name, s]) => [
            name,
            {
              journal: s.journal,
              iconAdded: s.icon,
              nomItemsTiersFixed: s.nomItems,
              missingTalents: [...s.missing]
            }
          ])
        )
      },
      null,
      2
    )
  );

  if (!doWrite) {
    console.error("\nDry-run only; pass --write to persist changes.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
