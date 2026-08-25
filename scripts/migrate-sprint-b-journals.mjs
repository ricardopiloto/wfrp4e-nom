#!/usr/bin/env node
/**
 * Sprint B: reorganize nom-journals IA (Peoples / Empire / Nation Rules / …).
 * Preserves JournalEntryPage `_id`s when moving; generates new IDs only for splits.
 *
 * Usage:
 *   node scripts/migrate-sprint-b-journals.mjs --dry-run
 *   node scripts/migrate-sprint-b-journals.mjs --write
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const JOURNALS_DIR = path.join(root, "packs-src/nom-journals");
const PACKS_SRC = path.join(root, "packs-src");
const MAP_OUT = path.join(root, "reports/sprint-b-journal-map.json");

const args = process.argv.slice(2);
const doWrite = args.includes("--write");

const FOLDER_NOM = "CtX3SGpKsZVd1aGx";
const OLD_ADDITIONAL = "pGTpU2i5qfDLE38i";
const OLD_CAREERS = "trUWzGkEqCbeCzvo";
const OLD_LORES = "szhETavVooj84NXa";
const OLD_PRAYERS = "gz2BTw1HdqOo2K6P";
const OLD_CLASS = "wczCPcuHT4VQDLpL";

/** Stable new journal IDs (16 chars). */
const J = {
  startHere: "n0mStartHere0001",
  peoples: "n0mPeoples000001",
  empire: "n0mEmpire0000001",
  ror: "n0mRoR0000000001",
  dow: "n0mDoW0000000001",
  nationRules: "n0mNationRules01",
  talents: "n0mTalents000001",
  bestiary: "n0mBestiaryIdx01",
  lores: OLD_LORES,
  careers: OLD_CAREERS,
  classCareers: OLD_CLASS,
};

/** New page IDs for splits (16 chars). */
const P = {
  empMedals: "n0mEmpMedals0001",
  empOrders: "n0mEmpOrders0001",
  empProvinces: "n0mEmpProvinc001",
  empRegiments: "n0mEmpRegiment01",
  bestMounts: "n0mBestMounts001",
  bestEmpire: "n0mBestEmpire001",
  bestBretonnia: "n0mBestBretonn01",
  bestDoW: "n0mBestDoW000001",
  bestKislev: "n0mBestKislev001",
  people: {
    Albion: "n0mPeopleAlbion1",
    Araby: "n0mPeopleAraby01",
    Bretonnia: "n0mPeopleBreton1",
    Cathay: "n0mPeopleCathay1",
    Estalia: "n0mPeopleEstali1",
    Ind: "n0mPeopleInd0001",
    Kislev: "n0mPeopleKislev1",
    Nippon: "n0mPeopleNippon1",
    Norsca: "n0mPeopleNorsca1",
    Southlands: "n0mPeopleSouth01",
    Strigany: "n0mPeopleStriga1",
    Tilea: "n0mPeopleTilea01",
    "Westerland (Wasteland)": "n0mPeopleWastel1",
  },
};

const PAGE_IDS = {
  empire: "WELjIk1hjAdYq95u",
  warhammerNations: "iOTIqPoQo6ppBfSQ",
  dogsOfWar: "p6p90qyALHZkyV17",
  bestiary: "V9eimuunkzsIwCVt",
  regiments: "RXnJC2aYqUA4xXJ4",
  talents: "a6GQRJftkHnSkhsj",
  norsca: "rKOIOO0r2idyiwp8",
  bretonnia: "uPiUhkZe4LmAlgCQ",
  kislev: "dKjEXJmbWXqthxah", // shared id with Divine Lore of Kislev (different journals OK)
  araby: "zqj7P9CbOhzI5NcU",
  cathay: "2INRp30FGOJtKuwP",
  nippon: "aK6SmTu9lh8yiwGD",
  ind: "Y74STIVD6RcPsiDG",
  estalia: "m1gCxRc4zsbGYvpC",
  loreAraby: "xgZQzPeNH0DUUjxP",
  loreInd: "ZItscG16nzetI35V",
  loreKislev: "dKjEXJmbWXqthxah",
  loreNippon: "dB4zBvYtxgGDJSdz",
  loreIce: "ODC1TQBu6uDkDzfx",
  loreDesert: "nJVysCnXzMXGBSMY",
};

function uuidPage(journalId, pageId, label) {
  return `@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${journalId}.JournalEntryPage.${pageId}]{${label}}`;
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function clonePage(page, journalId, overrides = {}) {
  const next = structuredClone(page);
  Object.assign(next, overrides);
  next._key = `!journal.pages!${journalId}.${next._id}`;
  if (!next._stats) next._stats = {};
  next._stats.compendiumSource = `Compendium.wfrp4e-nom.nom-journals.JournalEntry.${journalId}.JournalEntryPage.${next._id}`;
  return next;
}

function makeTextPage({ id, name, content, journalId, sort = 0 }) {
  return {
    name,
    type: "text",
    title: { show: false, level: 1 },
    text: { format: 1, content },
    _stats: {
      compendiumSource: `Compendium.wfrp4e-nom.nom-journals.JournalEntry.${journalId}.JournalEntryPage.${id}`,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "13.351",
      systemId: "wfrp4e",
      systemVersion: "9.3.2",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "bwuOpMGVHBESXkjP",
    },
    _id: id,
    system: {},
    image: {},
    video: { controls: true, volume: 0.5 },
    src: null,
    category: null,
    sort,
    ownership: { default: -1 },
    flags: {},
    _key: `!journal.pages!${journalId}.${id}`,
  };
}

function makeJournal({ id, name, pages, sort = 0 }) {
  return {
    folder: FOLDER_NOM,
    name,
    _id: id,
    pages,
    categories: [],
    sort,
    ownership: { default: 0, bwuOpMGVHBESXkjP: 3 },
    flags: {},
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "13.351",
      systemId: "wfrp4e",
      systemVersion: "9.3.2",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "bwuOpMGVHBESXkjP",
    },
    _key: `!journal!${id}`,
  };
}

function journalFilename(name, id) {
  // Match foundryvtt-cli extract naming: "A - B" → "A___B_<id>.json"
  const safe = name
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/\s*-\s*/g, "___")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `${safe}_${id}.json`;
}

/** Split HTML on heading tags; returns [{headingHtml, bodyHtml, title}]. */
function splitOnHeading(content, tag) {
  const re = new RegExp(`(<${tag}[^>]*>[\\s\\S]*?</${tag}>)`, "gi");
  const parts = content.split(re);
  const sections = [];
  let intro = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (new RegExp(`^<${tag}\\b`, "i").test(part)) {
      const title = stripHtml(part);
      const body = parts[i + 1] && !new RegExp(`^<${tag}\\b`, "i").test(parts[i + 1]) ? parts[i + 1] : "";
      if (body) i++;
      sections.push({ headingHtml: part, bodyHtml: body, title });
    } else if (!sections.length) {
      intro += part;
    }
  }
  return { intro, sections };
}

function pageById(journal, id) {
  return journal.pages.find((p) => p._id === id);
}

function pageByName(journal, name) {
  return journal.pages.find((p) => p.name === name);
}

/** Replace Nation Rules pages that fully duplicate Lores with stubs + keep unique rules. */
function dedupeNationPage(page, kind) {
  const p = structuredClone(page);
  if (kind === "kislev") {
    p.text.content = `<p>Divine and arcane traditions for Kislev live in <strong>Lores &amp; Faith</strong>:</p><ul><li><p>${uuidPage(J.lores, PAGE_IDS.loreIce, "Lore of Ice")}</p></li><li><p>${uuidPage(J.lores, PAGE_IDS.loreKislev, "Divine Lore of Kislev")}</p></li></ul>`;
    p.name = "Kislev";
  } else if (kind === "ind") {
    p.text.content = `<p>Faith and miracles of Ind are documented in ${uuidPage(J.lores, PAGE_IDS.loreInd, "Divine Lore of Ind")}.</p>`;
    p.name = "Ind";
  } else if (kind === "araby") {
    // Keep Great Prophet blessings block if present; point lore elsewhere.
    const content = p.text.content;
    const great = content.match(/<h2[^>]*>\s*The Great Prophet[\s\S]*?(?=<h2\b|$)/i)?.[0] || "";
    p.text.content = `${great}<h2>Arcane &amp; Divine Lores</h2><ul><li><p>${uuidPage(J.lores, PAGE_IDS.loreDesert, "Lore of the Desert")}</p></li><li><p>${uuidPage(J.lores, PAGE_IDS.loreAraby, "Divine Lore of Araby")}</p></li></ul>`;
  } else if (kind === "nippon") {
    const content = p.text.content;
    const talents = content.match(/<h2[^>]*>\s*Talents[\s\S]*$/i)?.[0] || "";
    p.text.content = `<h2>Divine Lore</h2><p>See ${uuidPage(J.lores, PAGE_IDS.loreNippon, "Divine Lore of Nippon")}.</p>${talents}`;
  }
  return p;
}

function buildHubContent(entries) {
  const items = entries
    .map(
      ([jid, pid, label]) =>
        `<li><p>${uuidPage(jid, pid, label)}</p></li>`
    )
    .join("");
  return `<h1>Nations of Mankind</h1><p>Start here for peoples, nation rules, careers, lores, and the bestiary index.</p><h2>Contents</h2><ul>${items}</ul><p><em>Core reference:</em> ${uuidPage(J.classCareers, "84Aj04uEEBh3yTS3", "Class and Careers")} (WFRP Core careers journal).</p>`;
}

async function walkJsonFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walkJsonFiles(p, acc);
    else if (e.name.endsWith(".json")) acc.push(p);
  }
  return acc;
}

function rewriteUuids(text, pageToJournal) {
  return text.replace(
    /@UUID\[Compendium\.wfrp4e-nom\.nom-journals\.JournalEntry\.([A-Za-z0-9]+)\.JournalEntryPage\.([A-Za-z0-9]+)([^\]]*)\]/g,
    (m, jid, pid, rest) => {
      const mapped = pageToJournal.get(pid);
      if (!mapped || mapped === jid) return m;
      return `@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${mapped}.JournalEntryPage.${pid}${rest}]`;
    }
  );
}

function rewriteCompendiumSources(text, pageToJournal) {
  return text.replace(
    /Compendium\.wfrp4e-nom\.nom-journals\.JournalEntry\.([A-Za-z0-9]+)\.JournalEntryPage\.([A-Za-z0-9]+)/g,
    (m, jid, pid) => {
      const mapped = pageToJournal.get(pid);
      if (!mapped || mapped === jid) return m;
      return `Compendium.wfrp4e-nom.nom-journals.JournalEntry.${mapped}.JournalEntryPage.${pid}`;
    }
  );
}

function rewritePageKeys(text, pageToJournal) {
  return text.replace(
    /!journal\.pages!([A-Za-z0-9]+)\.([A-Za-z0-9]+)/g,
    (m, jid, pid) => {
      const mapped = pageToJournal.get(pid);
      if (!mapped || mapped === jid) return m;
      return `!journal.pages!${mapped}.${pid}`;
    }
  );
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("migrate-sprint-b-journals.mjs [--dry-run|--write]");
    process.exit(0);
  }

  const additional = await loadJson(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Additional_Rules_pGTpU2i5qfDLE38i.json")
  );
  const careers = await loadJson(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Careers_trUWzGkEqCbeCzvo.json")
  );
  const lores = await loadJson(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Lores_szhETavVooj84NXa.json")
  );
  // Official Class and Careers lives in wfrp4e-core — never ship a copy in nom-journals.
  const classCareersPath = path.join(JOURNALS_DIR, "Class_and_Careers_wczCPcuHT4VQDLpL.json");
  let classCareers = null;
  try {
    classCareers = await loadJson(classCareersPath);
  } catch {
    classCareers = null;
  }
  const folder = await loadJson(path.join(JOURNALS_DIR, "NoM___Journals_CtX3SGpKsZVd1aGx.json"));

  const pageToJournal = new Map();
  /** @type {Record<string, object>} */
  const newJournals = {};

  // --- Peoples ---
  const wn = pageById(additional, PAGE_IDS.warhammerNations);
  const { intro: wnIntro, sections: wnSections } = splitOnHeading(wn.text.content, "h2");
  const peoplePages = [];
  const tocPeople = [];
  let sort = 100000;
  for (const sec of wnSections) {
    const title = sec.title.replace(/^\d+\.\s*/, "").trim();
    const id = P.people[title];
    if (!id) {
      console.warn("Unknown people section:", title);
      continue;
    }
    const content = `${sec.headingHtml}${sec.bodyHtml}`;
    peoplePages.push(makeTextPage({ id, name: title, content, journalId: J.peoples, sort }));
    pageToJournal.set(id, J.peoples);
    tocPeople.push(`<li><p>${uuidPage(J.peoples, id, title)}</p></li>`);
    sort += 100000;
  }
  const peoplesIndex = makeTextPage({
    id: PAGE_IDS.warhammerNations,
    name: "Warhammer Nations",
    content: `${wnIntro || "<h1>Warhammer Nations</h1>"}<h2>Peoples</h2><ul>${tocPeople.join("")}</ul>`,
    journalId: J.peoples,
    sort: 0,
  });
  pageToJournal.set(PAGE_IDS.warhammerNations, J.peoples);
  newJournals[J.peoples] = makeJournal({
    id: J.peoples,
    name: "Nations of Mankind - Peoples",
    pages: [peoplesIndex, ...peoplePages],
    sort: 200000,
  });

  // --- Empire ---
  const empire = pageById(additional, PAGE_IDS.empire);
  const { intro: empIntro, sections: empSections } = splitOnHeading(empire.text.content, "h1");
  const empireMap = [
    ["Medals & Honors of the Empire", P.empMedals, "Medals & Honors"],
    ["Knightly Orders of the Empire", P.empOrders, "Knightly Orders"],
    ["Provinces of the Empire", P.empProvinces, "Provinces"],
    ["Regiments of the Empire", P.empRegiments, "Regiments"],
  ];
  const empirePages = [];
  const tocEmpire = [];
  sort = 100000;
  for (const [titleMatch, id, shortName] of empireMap) {
    const sec = empSections.find((s) => stripHtml(s.title).includes(titleMatch.replace(" & ", " ")) || stripHtml(s.title) === titleMatch || stripHtml(s.title).replace(/&/g, "&") === titleMatch);
    // fuzzy: normalize
    const found =
      empSections.find((s) => {
        const t = stripHtml(s.title).toLowerCase();
        return t.includes(shortName.toLowerCase().split(" ")[0].toLowerCase()) && (
          (shortName === "Medals & Honors" && t.includes("medal")) ||
          (shortName === "Knightly Orders" && t.includes("knightly")) ||
          (shortName === "Provinces" && t.includes("province")) ||
          (shortName === "Regiments" && t.includes("regiment") && !t.includes("renown"))
        );
      }) || empSections.find((s) => stripHtml(s.title).toLowerCase().includes(shortName.split(" ")[0].toLowerCase()));
    if (!found) {
      console.warn("Missing Empire section for", shortName, "available:", empSections.map((s) => stripHtml(s.title)));
      continue;
    }
    const content = `${found.headingHtml}${found.bodyHtml}`;
    empirePages.push(
      makeTextPage({ id, name: shortName, content, journalId: J.empire, sort })
    );
    pageToJournal.set(id, J.empire);
    tocEmpire.push(`<li><p>${uuidPage(J.empire, id, shortName)}</p></li>`);
    sort += 100000;
  }
  const empireIndex = makeTextPage({
    id: PAGE_IDS.empire,
    name: "The Empire",
    content: `${empIntro || ""}<h1>The Empire</h1><ul>${tocEmpire.join("")}</ul>`,
    journalId: J.empire,
    sort: 0,
  });
  pageToJournal.set(PAGE_IDS.empire, J.empire);
  newJournals[J.empire] = makeJournal({
    id: J.empire,
    name: "Nations of Mankind - The Empire",
    pages: [empireIndex, ...empirePages],
    sort: 300000,
  });

  // --- Regiments of Renown ---
  const ror = clonePage(pageById(additional, PAGE_IDS.regiments), J.ror);
  pageToJournal.set(PAGE_IDS.regiments, J.ror);
  newJournals[J.ror] = makeJournal({
    id: J.ror,
    name: "Nations of Mankind - Regiments of Renown",
    pages: [ror],
    sort: 400000,
  });

  // --- Dogs of War ---
  const dow = clonePage(pageById(additional, PAGE_IDS.dogsOfWar), J.dow);
  pageToJournal.set(PAGE_IDS.dogsOfWar, J.dow);
  newJournals[J.dow] = makeJournal({
    id: J.dow,
    name: "Nations of Mankind - Dogs of War",
    pages: [dow],
    sort: 500000,
  });

  // --- Nation Rules ---
  const nationSpecs = [
    ["norsca", PAGE_IDS.norsca, null],
    ["bretonnia", PAGE_IDS.bretonnia, null],
    ["kislev", PAGE_IDS.kislev, "kislev"],
    ["araby", PAGE_IDS.araby, "araby"],
    ["cathay", PAGE_IDS.cathay, null],
    ["nippon", PAGE_IDS.nippon, "nippon"],
    ["ind", PAGE_IDS.ind, "ind"],
    ["estalia", PAGE_IDS.estalia, null],
  ];
  const nationPages = [];
  sort = 0;
  for (const [, pid, dedupe] of nationSpecs) {
    let page = pageById(additional, pid);
    if (!page) throw new Error(`Missing nation page ${pid}`);
    if (dedupe) page = dedupeNationPage(page, dedupe);
    const moved = clonePage(page, J.nationRules, { sort });
    nationPages.push(moved);
    pageToJournal.set(pid, J.nationRules);
    sort += 100000;
  }
  // Note: Kislev nation rules page id collides with Divine Lore of Kislev page id.
  // pageToJournal last write wins — force lore Kislev to stay on lores journal.
  pageToJournal.set(PAGE_IDS.loreKislev, J.lores);
  // Re-set nation kislev AFTER would break lore links. Use different approach:
  // Nation Rules Kislev page MUST get a new id because of collision.
  const kislevIdx = nationPages.findIndex((p) => p.name === "Kislev");
  if (kislevIdx >= 0) {
    const old = nationPages[kislevIdx];
    const newId = "n0mRulesKislev01";
    nationPages[kislevIdx] = makeTextPage({
      id: newId,
      name: "Kislev",
      content: old.text.content,
      journalId: J.nationRules,
      sort: old.sort,
    });
    pageToJournal.set(newId, J.nationRules);
    pageToJournal.set(PAGE_IDS.loreKislev, J.lores);
    // Old Additional Rules Kislev id no longer exists as nation page; links to it for "Kislev rules" should point to new id.
    pageToJournal.set(PAGE_IDS.kislev, J.lores); // existing links to that page id were lore OR rules — prefer lore (canonical shared id was lore in Lores pack)
  }
  newJournals[J.nationRules] = makeJournal({
    id: J.nationRules,
    name: "Nations of Mankind - Nation Rules",
    pages: nationPages,
    sort: 600000,
  });

  // --- Talents ---
  const talentsPage = pageByName(careers, "Talents");
  const talentsMoved = clonePage(talentsPage, J.talents, { sort: 0 });
  pageToJournal.set(PAGE_IDS.talents, J.talents);
  newJournals[J.talents] = makeJournal({
    id: J.talents,
    name: "Nations of Mankind - Talents",
    pages: [talentsMoved],
    sort: 700000,
  });

  // --- Bestiary Index ---
  const best = pageById(additional, PAGE_IDS.bestiary);
  const { intro: bestIntro, sections: bestSections } = splitOnHeading(best.text.content, "h2");
  const bestMap = [
    ["Mounts", P.bestMounts],
    ["Empire Bestiary", P.bestEmpire],
    ["Bretonnia Bestiary", P.bestBretonnia],
    ["Dog of War Bestiary", P.bestDoW],
    ["Kislev Bestiary", P.bestKislev],
  ];
  const bestPages = [];
  const tocBest = [];
  sort = 100000;
  for (const [title, id] of bestMap) {
    const found = bestSections.find((s) => stripHtml(s.title).toLowerCase() === title.toLowerCase());
    if (!found) {
      console.warn("Missing bestiary section", title);
      continue;
    }
    bestPages.push(
      makeTextPage({
        id,
        name: title.replace(/ Bestiary$/, ""),
        content: `${found.headingHtml}${found.bodyHtml}`,
        journalId: J.bestiary,
        sort,
      })
    );
    pageToJournal.set(id, J.bestiary);
    tocBest.push(`<li><p>${uuidPage(J.bestiary, id, title)}</p></li>`);
    sort += 100000;
  }
  const bestIndex = makeTextPage({
    id: PAGE_IDS.bestiary,
    name: "Bestiary Index",
    content: `${bestIntro || "<h1>Nations of Mankind Bestiary</h1>"}<ul>${tocBest.join("")}</ul>`,
    journalId: J.bestiary,
    sort: 0,
  });
  pageToJournal.set(PAGE_IDS.bestiary, J.bestiary);
  newJournals[J.bestiary] = makeJournal({
    id: J.bestiary,
    name: "Nations of Mankind - Bestiary Index",
    pages: [bestIndex, ...bestPages],
    sort: 800000,
  });

  // --- Start Here hub ---
  const hubPageId = "n0mHubPage000001";
  const hubLinks = [
    [J.peoples, PAGE_IDS.warhammerNations, "Peoples (Warhammer Nations)"],
    [J.empire, PAGE_IDS.empire, "The Empire"],
    [J.ror, PAGE_IDS.regiments, "Regiments of Renown"],
    [J.dow, PAGE_IDS.dogsOfWar, "Dogs of War"],
    [J.nationRules, PAGE_IDS.norsca, "Nation Rules"],
    [J.talents, PAGE_IDS.talents, "Talents"],
    [J.bestiary, PAGE_IDS.bestiary, "Bestiary Index"],
    [J.lores, PAGE_IDS.loreIce, "Lores & Faith"],
    [J.careers, careers.pages.find((p) => p.name !== "Talents")._id, "Careers"],
  ];
  const hubPage = makeTextPage({
    id: hubPageId,
    name: "Start Here",
    content: buildHubContent(hubLinks),
    journalId: J.startHere,
    sort: 0,
  });
  pageToJournal.set(hubPageId, J.startHere);
  newJournals[J.startHere] = makeJournal({
    id: J.startHere,
    name: "Nations of Mankind - Start Here",
    pages: [hubPage],
    sort: 100000,
  });

  // --- Lores rename ---
  const loresNext = structuredClone(lores);
  loresNext.name = "Nations of Mankind - Lores & Faith";
  for (const p of loresNext.pages) {
    pageToJournal.set(p._id, J.lores);
    p._key = `!journal.pages!${J.lores}.${p._id}`;
  }

  // --- Careers without Talents ---
  const careersNext = structuredClone(careers);
  careersNext.pages = careersNext.pages.filter((p) => p._id !== PAGE_IDS.talents);
  for (const p of careersNext.pages) {
    pageToJournal.set(p._id, J.careers);
  }

  // --- Class and Careers: do not package; point to Core ---
  const classNext = null;

  // --- Folder rename ---
  const folderNext = structuredClone(folder);
  folderNext.name = "Nations of Mankind";

  // Map report
  const mapReport = {
    generated: new Date().toISOString().slice(0, 10),
    journals: Object.fromEntries(
      Object.entries(J).map(([k, id]) => [
        k,
        {
          id,
          name:
            newJournals[id]?.name ||
            (id === J.lores
              ? loresNext.name
              : id === J.careers
                ? careersNext.name
                : id === J.classCareers
                  ? "Core Class and Careers (wfrp4e-core.journals — not packaged)"
                  : id),
        },
      ])
    ),
    pageToJournal: Object.fromEntries(pageToJournal),
    deleted: [OLD_ADDITIONAL, OLD_PRAYERS, ...(classCareers ? [OLD_CLASS] : [])],
    notes: [
      "Kislev Nation Rules page uses new id n0mRulesKislev01 (collision with Divine Lore of Kislev page id).",
      "Links to old Additional Rules Kislev page id resolve to Lores (shared historical id).",
      "Class and Careers journal is not shipped; use Compendium.wfrp4e-core.journals.JournalEntry.wczCPcuHT4VQDLpL.",
    ],
  };

  console.log(`Mode: ${doWrite ? "WRITE" : "DRY-RUN"}`);
  console.log("New journals:", Object.keys(newJournals).length);
  for (const [id, doc] of Object.entries(newJournals)) {
    console.log(`  ${doc.name} (${id}) pages=${doc.pages.length}`);
  }
  console.log("Empire pages:", newJournals[J.empire].pages.map((p) => p.name).join(", "));
  console.log("Peoples pages:", newJournals[J.peoples].pages.length);
  console.log("Bestiary pages:", newJournals[J.bestiary].pages.map((p) => p.name).join(", "));

  if (!doWrite) {
    await writeJson(MAP_OUT.replace(".json", ".dry-run.json"), mapReport);
    console.log("Dry-run map written; re-run with --write to apply.");
    return;
  }

  // Write new journals
  for (const doc of Object.values(newJournals)) {
    const fp = path.join(JOURNALS_DIR, journalFilename(doc.name, doc._id));
    await writeJson(fp, doc);
  }
  await writeJson(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Lores_szhETavVooj84NXa.json"),
    loresNext
  );
  await writeJson(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Careers_trUWzGkEqCbeCzvo.json"),
    careersNext
  );
  try {
    await fs.unlink(classCareersPath);
    console.log("Removed Class_and_Careers copy (use wfrp4e-core.journals)");
  } catch {
    /* already absent */
  }
  await writeJson(path.join(JOURNALS_DIR, "NoM___Journals_CtX3SGpKsZVd1aGx.json"), folderNext);

  // Delete old Additional Rules + Prayers
  await fs.unlink(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Additional_Rules_pGTpU2i5qfDLE38i.json")
  );
  await fs.unlink(
    path.join(JOURNALS_DIR, "Nations_of_Mankind___Prayers_gz2BTw1HdqOo2K6P.json")
  );

  // Global UUID / key rewrite across packs-src
  let filesTouched = 0;
  for (const filePath of await walkJsonFiles(PACKS_SRC)) {
    let text = await fs.readFile(filePath, "utf8");
    const before = text;
    text = rewriteUuids(text, pageToJournal);
    text = rewriteCompendiumSources(text, pageToJournal);
    text = rewritePageKeys(text, pageToJournal);
    // Also remap any leftover JournalEntry.OLD_ADDITIONAL references (journal-level, no page)
    text = text.replaceAll(
      `JournalEntry.${OLD_ADDITIONAL}`,
      `JournalEntry.${J.startHere}`
    );
    text = text.replaceAll(
      "Compendium.wfrp4e-nom.nom-journals.JournalEntry.wczCPcuHT4VQDLpL",
      "Compendium.wfrp4e-core.journals.JournalEntry.wczCPcuHT4VQDLpL"
    );
    if (text !== before) {
      await fs.writeFile(filePath, text, "utf8");
      filesTouched++;
    }
  }

  await writeJson(MAP_OUT, mapReport);
  console.log(`Wrote journals; rewrote UUIDs in ${filesTouched} files.`);
  console.log(`Map: ${path.relative(root, MAP_OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
