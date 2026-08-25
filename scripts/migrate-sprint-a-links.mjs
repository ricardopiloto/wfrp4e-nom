#!/usr/bin/env node
/**
 * Sprint A: migrate legacy @Compendium links in packs-src to @UUID.
 *
 * Usage:
 *   node scripts/migrate-sprint-a-links.mjs --dry-run
 *   node scripts/migrate-sprint-a-links.mjs --write
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const BESTIARY_DIR = path.join(root, "packs-src/nom-bestiary");
const ITEMS_DIR = path.join(root, "packs-src/nom-items");
const JOURNALS_DIR = path.join(root, "packs-src/nom-journals");
const MAP_PATH = path.join(root, "reports/bestiary-nom-id-map.json");

const args = process.argv.slice(2);
const doWrite = args.includes("--write");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`migrate-sprint-a-links.mjs

Options:
  --dry-run   Report changes without writing (default)
  --write     Apply changes to packs-src
`);
  process.exit(0);
}

function norm(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Manual singular/plural / spelling aliases (label → actor name key). */
const BESTIARY_ALIASES = {
  empiregreatswords: "empiregreatsword",
  almuktarsdesertdogs: "almuktarsdesertdog",
  bearmenofurslo: "bearmanofurslo",
  braganzasbesiegers: "braganzasbesieger",
  golgfagsmaneaters: "golgfagsmaneater",
  longdrongslayerpirates: "longdrongsslayerpirate",
  lumpincroopsfightingcocks: "lumpincroopsfightingcock",
  marksmenofmiragliano: "marsmanofmiragliano",
  volandsvenators: "volandsvenator",
  boyar: "marchboyar",
  yeoman: "yeomansergeant",
  witchhuntergeneral: "witchhunter",
};

/** Labels with no actor in nom-bestiary — unlink to plain text. */
const BESTIARY_MISSING = new Set([
  "empirepistolier",
  "empireoutrider",
  "battlepilgrim",
  "birdmenofcatrazza",
  "bronzinosgalloperguns",
]);

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function listJson(dir) {
  const names = await fs.readdir(dir);
  return names.filter((n) => n.endsWith(".json")).map((n) => path.join(dir, n));
}

async function buildBestiaryIndex() {
  const byId = new Map();
  const byNorm = new Map();
  for (const filePath of await listJson(BESTIARY_DIR)) {
    const doc = await loadJson(filePath);
    if (!doc?._id || !doc?.name) continue;
    byId.set(doc._id, doc);
    byNorm.set(norm(doc.name), doc);
  }
  return { byId, byNorm };
}

function resolveBestiary(oldId, label, index) {
  if (index.byId.has(oldId)) {
    const a = index.byId.get(oldId);
    return { status: "id_match", actor: a };
  }
  const key = norm(label);
  if (!key) return { status: "missing", actor: null };
  if (BESTIARY_MISSING.has(key)) return { status: "missing_known", actor: null };
  if (index.byNorm.has(key)) {
    return { status: "name_match", actor: index.byNorm.get(key) };
  }
  const alias = BESTIARY_ALIASES[key];
  if (alias && index.byNorm.has(alias)) {
    return { status: "alias", actor: index.byNorm.get(alias) };
  }
  // Apostrophe / curly-quote tolerant: already handled by norm.
  // Try stripping trailing s for plurals.
  if (key.endsWith("s") && index.byNorm.has(key.slice(0, -1))) {
    return { status: "plural", actor: index.byNorm.get(key.slice(0, -1)) };
  }
  return { status: "missing", actor: null };
}

function migrateCoreAndNomItemLinks(text) {
  let out = text;
  const corePacks = [
    "skills",
    "talents",
    "traits",
    "psychologies",
    "prayers",
    "careers",
  ];
  for (const pack of corePacks) {
    out = out.replace(
      new RegExp(
        `@Compendium\\[wfrp4e-core\\.${pack}\\.([^[\\]{}]+)\\]\\{([^}]*)\\}`,
        "g"
      ),
      "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
    );
  }
  out = out.replace(
    /@Compendium\[wfrp4e-core\.career-descriptions\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.career-descriptions.JournalEntry.$1]{$2}"
  );
  out = out.replace(
    /@Compendium\[wfrp4e-core\.items\.([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
  );
  // Prefer .Item. on already-UUID core items missing the segment.
  out = out.replace(
    /@UUID\[Compendium\.wfrp4e-core\.items\.(?!Item\.)([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-core.items.Item.$1]{$2}"
  );

  const nomPacks = ["spells-nom", "prayers-nom", "talents-nom", "careers-nom"];
  for (const pack of nomPacks) {
    out = out.replace(
      new RegExp(
        `@Compendium\\[nations-of-mankind-wfrp4e\\.${pack}\\.([^[\\]{}]+)\\]\\{([^}]*)\\}`,
        "g"
      ),
      "@UUID[Compendium.wfrp4e-nom.nom-items.Item.$1]{$2}"
    );
  }
  // Prefer .Item. on nom-items UUIDs missing the segment.
  out = out.replace(
    /@UUID\[Compendium\.wfrp4e-nom\.nom-items\.(?!Item\.)([^[\]{}]+)\]\{([^}]*)\}/g,
    "@UUID[Compendium.wfrp4e-nom.nom-items.Item.$1]{$2}"
  );
  return out;
}

function migrateBestiaryLinks(text, index, stats, mapRows) {
  return text.replace(
    /@Compendium\[nations-of-mankind-wfrp4e\.bestiary-nom\.([^[\]{}]+)\]\{([^}]*)\}/g,
    (_m, oldId, label) => {
      const { status, actor } = resolveBestiary(oldId, label, index);
      mapRows.push({
        oldId,
        label,
        status,
        newId: actor?._id || "",
        newName: actor?.name || "",
      });
      stats[status] = (stats[status] || 0) + 1;
      if (actor) {
        return `@UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.${actor._id}]{${label}}`;
      }
      // Keep readable label without a dead link.
      return label;
    }
  );
}

function walkStrings(obj, fn) {
  if (typeof obj === "string") return fn(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) obj[i] = walkStrings(obj[i], fn);
    return obj;
  }
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) obj[key] = walkStrings(obj[key], fn);
    return obj;
  }
  return obj;
}

function countCompendium(text) {
  return (String(text).match(/@Compendium\[/g) || []).length;
}

async function migrateFile(filePath, transform) {
  const raw = await fs.readFile(filePath, "utf8");
  const before = countCompendium(raw);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { filePath, before, after: before, changed: false, error: "parse" };
  }
  const next = transform(structuredClone(data));
  const out = `${JSON.stringify(next, null, 2)}\n`;
  const after = countCompendium(out);
  const changed = out !== `${JSON.stringify(data, null, 2)}\n` && out !== raw;
  // Compare semantically via stringified normalized form
  const changedReal = JSON.stringify(next) !== JSON.stringify(data);
  if (changedReal && doWrite) await writeJson(filePath, next);
  return { filePath, before, after, changed: changedReal };
}

async function linkSpellActors() {
  const djinnPath = path.join(ITEMS_DIR, "Summon_Djinn_XxmlmN89d5RT012Y.json");
  const frostPath = path.join(
    ITEMS_DIR,
    "Form_of_the_Frostfiend_sSMen3XXCY2jZ2CV.json"
  );
  const results = [];

  const djinn = await loadJson(djinnPath);
  let dDesc = djinn.system.description.value;
  const dBefore = dDesc;
  // "A Djinn immediately manifests" → link base Djinn
  if (!dDesc.includes("nom-bestiary.Actor.pngADezTmQbEm3G9")) {
    dDesc = dDesc.replace(
      /(a mighty ally\.\s*)A Djinn( immediately manifests)/i,
      `$1@UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.pngADezTmQbEm3G9]{Djinn}$2`
    );
  }
  // Element rows: Light / Metal / … / Dhar
  const elementMap = [
    ["Light", "BSmye4uGN8FUsHrX"],
    ["Metal", "dU8b6zCqbXH27QuO"],
    ["Life", "YeTtm6QImWKOqKQl"],
    ["Heavens", "lm1UsTjkTyzcBe70"],
    ["Shadow", "e7xqZt4FMSAa5X5p"],
    ["Death", "UsLgUwPFs1irOOwi"],
    ["Fire", "JOC4NfR16GxRJCFv"],
    ["Beast", "5e9DhxCRsy9WMxx2"],
    ["Ice", "sldvAhi78DJChJ6Q"],
    ["Dhar", "njHNgkDoYwGtj0mz"],
  ];
  for (const [label, id] of elementMap) {
    const re = new RegExp(
      `(>)(${label})(:\\s*Gains)`,
      "g"
    );
    dDesc = dDesc.replace(
      re,
      `$1@UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.${id}]{${label}}$3`
    );
  }
  if (dDesc !== dBefore) {
    djinn.system.description.value = dDesc;
    if (doWrite) await writeJson(djinnPath, djinn);
    results.push({ file: path.basename(djinnPath), changed: true });
  } else {
    results.push({ file: path.basename(djinnPath), changed: false });
  }

  const frost = await loadJson(frostPath);
  let fDesc = frost.system.description.value;
  const fBefore = fDesc;
  if (!fDesc.includes("nom-bestiary.Actor.k6YTlVWIQN4RYTM7")) {
    fDesc = fDesc.replace(
      /\ba Frostfiend\b/,
      "@UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.k6YTlVWIQN4RYTM7]{Frostfiend}"
    );
    fDesc = fDesc.replace(
      /\byour Frostfiend form\b/,
      "your @UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.k6YTlVWIQN4RYTM7]{Frostfiend} form"
    );
  }
  if (fDesc !== fBefore) {
    frost.system.description.value = fDesc;
    if (doWrite) await writeJson(frostPath, frost);
    results.push({ file: path.basename(frostPath), changed: true });
  } else {
    results.push({ file: path.basename(frostPath), changed: false });
  }
  return results;
}

async function main() {
  const index = await buildBestiaryIndex();
  const bestiaryStats = {};
  const mapRows = [];
  const fileStats = [];

  // 1) Bestiary actors — core.items @Compendium → UUID
  for (const filePath of await listJson(BESTIARY_DIR)) {
    const res = await migrateFile(filePath, (doc) => {
      walkStrings(doc, (s) => migrateCoreAndNomItemLinks(s));
      return doc;
    });
    if (res.changed || res.before !== res.after) fileStats.push(res);
  }

  // 2) Journals — full transform including bestiary-nom
  for (const filePath of await listJson(JOURNALS_DIR)) {
    const res = await migrateFile(filePath, (doc) => {
      walkStrings(doc, (s) => {
        let t = migrateCoreAndNomItemLinks(s);
        t = migrateBestiaryLinks(t, index, bestiaryStats, mapRows);
        return t;
      });
      return doc;
    });
    if (res.changed || res.before !== res.after) fileStats.push(res);
  }

  // 3) Items — core/nom leftover + spell actor links
  for (const filePath of await listJson(ITEMS_DIR)) {
    const res = await migrateFile(filePath, (doc) => {
      walkStrings(doc, (s) => migrateCoreAndNomItemLinks(s));
      return doc;
    });
    if (res.changed || res.before !== res.after) fileStats.push(res);
  }

  const spellResults = await linkSpellActors();

  // Deduplicate map by oldId (first wins)
  const seen = new Set();
  const uniqueMap = [];
  for (const row of mapRows) {
    if (seen.has(row.oldId)) continue;
    seen.add(row.oldId);
    uniqueMap.push(row);
  }
  uniqueMap.sort((a, b) => a.label.localeCompare(b.label));

  if (doWrite) {
    await writeJson(MAP_PATH, {
      generated: new Date().toISOString().slice(0, 10),
      stats: bestiaryStats,
      missingKnown: [...BESTIARY_MISSING],
      mappings: uniqueMap,
    });
  }

  const changedFiles = fileStats.filter((f) => f.changed);
  console.log(`Mode: ${doWrite ? "WRITE" : "DRY-RUN"}`);
  console.log(`Files changed: ${changedFiles.length}`);
  for (const f of changedFiles.slice(0, 30)) {
    console.log(
      `  ${path.relative(root, f.filePath)}  @Compendium ${f.before} → ${f.after}`
    );
  }
  if (changedFiles.length > 30) console.log(`  … +${changedFiles.length - 30} more`);
  console.log("Bestiary link resolve:", bestiaryStats);
  console.log("Spell actor links:", spellResults);

  // Residual scan
  let residual = 0;
  for (const dir of [BESTIARY_DIR, JOURNALS_DIR, ITEMS_DIR]) {
    for (const filePath of await listJson(dir)) {
      const text = await fs.readFile(filePath, "utf8");
      // After write, count remaining; on dry-run approximate from transform of journals only
      residual += countCompendium(text);
    }
  }
  if (!doWrite) {
    console.log(
      `(dry-run) on-disk @Compendium still ${residual}; re-run with --write to apply`
    );
  } else {
    console.log(`Remaining @Compendium in packs-src items/journals/bestiary: ${residual}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
