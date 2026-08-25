#!/usr/bin/env node
/**
 * Generate Empire Medals & Honors catalog items into packs-src/nom-items/
 * and write reports/medals-honors-id-map.md
 *
 * Usage: node scripts/generate-medals-honors-items.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const JOURNAL = path.join(
  root,
  "packs-src/nom-journals/Nations_of_Mankind___The_Empire_n0mEmpire0000001.json"
);
const ITEMS = path.join(root, "packs-src/nom-items");
const MAP = path.join(root, "reports/medals-honors-id-map.md");
const FOLDER_TRAP = "xUrVvvwtRnbLeVuH";
const FOLDER_TALENT = "DsekJv5UvKUKIUpc";
/** WFRP system default for Talent and Trapping (same path). */
const IMG_TALENT = "systems/wfrp4e/icons/blank.png";
const IMG_TRAPPING = "systems/wfrp4e/icons/blank.png";

/** Stable 16-char ids (must stay fixed once shipped). */
const IDS = {
  "Artillerist's Honors": "n0mMedalArtill01",
  "Black Raven": "n0mMedalBlkRav01",
  "Bronze Stag": "n0mMedalBrzStg01",
  "Golden Eagle": "n0mMedalGldEag01",
  "Iron Comet": "n0mMedalIrnCom01",
  "Magnus Cross": "n0mMedalMagCro01",
  "Martyr's Medal": "n0mMedalMartyr01",
  "Medal of Destiny": "n0mMedalDestiny1",
  "Meteoric Medal": "n0mMedalMeteor01",
  "Platinum Owl": "n0mMedalPlatOwl1",
  "Pure Soul Medal": "n0mMedalPureSoul",
  "Rat Slayer Commendation": "n0mMedalRatSlay1",
  "Sacred Fire Medal": "n0mMedalSacFire",
  "Silver Wolf": "n0mMedalSlvWolf",
  "White Dove": "n0mMedalWhtDove",
  Hunter: "n0mKcHunter00001",
  Killer: "n0mKcKiller00001",
  Reaper: "n0mKcReaper00001"
};

const WAVE1_MEDALS = new Set([
  "Pure Soul Medal",
  "White Dove",
  "Platinum Owl",
  "Artillerist's Honors"
]);
const WAVE2 = new Set(["Sacred Fire Medal", "Medal of Destiny", "Martyr's Medal", "Killer"]);
const WAVE3 = new Set([
  "Black Raven",
  "Bronze Stag",
  "Rat Slayer Commendation",
  "Iron Comet",
  "Silver Wolf",
  "Golden Eagle"
]);
const WAVE4 = new Set(["Reaper", "Meteoric Medal", "Magnus Cross"]);

const MEDAL_NOTES = `<h3>Medal Notes</h3>
<p>Talents granted by medals apply only to the <strong>original recipient</strong>. Non-talent bonuses require the medal to be <strong>worn</strong> by the earner. Non-earners do not gain these benefits — the GM enforces recipient rules (no automatic earner lock). Medals can be identified with Easy (+40) Lore (Empire / Heraldry / History). Fake medals: Evaluate + Numismatics (GM difficulty).</p>`;

function effectId(itemId, salt) {
  return crypto.createHash("sha256").update(`${itemId}:${salt}`).digest("hex").slice(0, 16);
}

function skillDialogEffect(itemId, label, img, script, equipTransfer) {
  const eid = effectId(itemId, label);
  return {
    _id: eid,
    name: label,
    img,
    type: "base",
    disabled: false,
    transfer: true,
    duration: { value: null, units: "seconds", expiry: null, expired: false },
    tint: "#ffffff",
    description: "",
    origin: null,
    statuses: [],
    sort: 0,
    flags: { wfrp4e: { manualEffectKeys: false } },
    system: {
      transferData: {
        type: "document",
        originalType: "document",
        documentType: "Actor",
        avoidTest: { value: "none", opposed: false, prevention: true, reversed: false },
        testIndependent: false,
        equipTransfer: !!equipTransfer,
        selfOnly: false,
        prompt: false,
        area: {
          templateData: { borderColor: null, fillColor: null, texture: null },
          keep: false,
          aura: { transferred: false, render: false },
          duration: "sustained"
        },
        zone: {
          type: "zone",
          transferred: false,
          traits: {},
          skipImmediateOnPlacement: false,
          keep: false
        }
      },
      itemTargetData: { ids: [], allItems: false },
      scriptData: [
        {
          label,
          trigger: "dialog",
          script,
          options: {
            activateScript: "return true",
            targeter: false,
            defending: false,
            runIfDisabled: false,
            deleteEffect: false,
            showDuplicates: false
          },
          async: false
        }
      ],
      zone: { type: "zone", traits: {}, skipImmediateOnPlacement: false },
      sourceData: { test: {} },
      condition: { numbered: false },
      changes: []
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: "14.364",
      systemId: "wfrp4e",
      systemVersion: "9.6.4",
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null
    },
    start: null,
    showIcon: 1,
    folder: null,
    _key: `!items.effects!${itemId}.${eid}`
  };
}

function waveManualNote(name) {
  if (WAVE1_MEDALS.has(name) || name === "Hunter") return "";
  let wave = "later";
  if (WAVE2.has(name)) wave = "2";
  else if (WAVE3.has(name)) wave = "3";
  else if (WAVE4.has(name)) wave = "4";
  return `<p><em>Automation (Wave ${wave}):</em> Until automated, the GM applies the bonuses above manually when the medal is worn (Imperial Honors) or when the honor applies (Kill Counts).</p>`;
}

function stripHtmlKeepUuid(html) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function parseJournalSections(content) {
  const parts = content.split(/<h3[^>]*>/i).slice(1);
  const out = [];
  for (const part of parts) {
    const titleEnd = part.indexOf("</h3>");
    const rawTitle = part
      .slice(0, titleEnd)
      .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .trim();
    const m = rawTitle.match(/^\d+\.\s+(.+)$/);
    if (!m) continue;
    const name = m[1].trim();
    const body = part.slice(titleEnd + 5);
    const plain = stripHtmlKeepUuid(
      body
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n +/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim()
    );
    const get = (label) => {
      const re = new RegExp(
        `${label}:\\s*([\\s\\S]*?)(?=\\n(?:Requirements|Awarded For|Description|Bonuses):|$)`,
        "i"
      );
      return (plain.match(re) || [])[1]?.trim() || null;
    };
    let bonuses = get("Bonuses");
    if (!bonuses) bonuses = (plain.match(/Bonuses:\s*([\s\S]*)$/i) || [])[1]?.trim() || "";
    // Keep UUID markup from original HTML body for bonuses/award where possible
    const htmlBody = stripHtmlKeepUuid(body);
    const extractHtml = (label) => {
      const re = new RegExp(
        `<p[^>]*>\\s*<strong>\\s*${label}:?\\s*</strong>\\s*([\\s\\S]*?)</p>`,
        "i"
      );
      const hit = body.match(re);
      if (hit) return hit[1].trim();
      // looser: label then content until next strong label
      const re2 = new RegExp(
        `${label}:</strong>\\s*([\\s\\S]*?)(?=<p[^>]*>\\s*<strong>|$)`,
        "i"
      );
      const hit2 = body.match(re2);
      return hit2 ? hit2[1].replace(/<\/?p[^>]*>/gi, "").trim() : null;
    };
    out.push({
      name,
      requirements: get("Requirements"),
      awardedFor: extractHtml("Awarded For") || get("Awarded For"),
      description: extractHtml("Description") || get("Description"),
      bonusesHtml: extractHtml("Bonuses") || bonuses,
      bonusesPlain: bonuses
    });
  }
  return out;
}

function fileSlug(name) {
  return name
    .replace(/['']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function medalDescription(sec) {
  const award = sec.awardedFor || sec.requirements || "";
  const desc = sec.description || "";
  const bonuses = sec.bonusesHtml || sec.bonusesPlain || "";
  return [
    award ? `<p><strong>Awarded For:</strong> ${award}</p>` : "",
    desc ? `<p><strong>Description:</strong> ${desc}</p>` : "",
    `<p><strong>Bonuses:</strong> ${bonuses}</p>`,
    waveManualNote(sec.name),
    MEDAL_NOTES
  ]
    .filter(Boolean)
    .join("");
}

function killCountDescription(sec, rank) {
  const req = sec.requirements || sec.awardedFor || "";
  const bonuses = sec.bonusesHtml || sec.bonusesPlain || "";
  return [
    `<p><strong>Kill Count Rank:</strong> ${rank}</p>`,
    `<p><strong>Enemy Type:</strong> Free text. Set <code>flags.wfrp4e-nom.killCountEnemy</code> and/or rename this talent to <em>${rank} (Enemy)</em> when awarding. Suggested examples: Beastmen, Orcs, Undead, Outlaws, Skaven, Chaos. Foe-specific bonuses do not apply while Enemy Type is blank.</p>`,
    `<p><strong>Progression:</strong> For a single Enemy Type only the <strong>highest</strong> rank remains active (Reaper &gt; Killer &gt; Hunter). When awarding a higher rank, remove or supersede the lower rank for that enemy.</p>`,
    req ? `<p><strong>Requirements:</strong> ${req}</p>` : "",
    `<p><strong>Bonuses:</strong> ${bonuses}</p>`,
    waveManualNote(rank),
    `<h3>Medal Notes (Kill Counts)</h3><p>Kill Counts are informal honors (no physical medal required). Recipient rules for talents still apply; the GM enforces awards and superseding ranks.</p>`
  ]
    .filter(Boolean)
    .join("");
}

function makeTrapping(name, id, description, effects) {
  return {
    _id: id,
    name,
    type: "trapping",
    img: IMG_TRAPPING,
    effects,
    folder: FOLDER_TRAP,
    flags: { core: {}, "wfrp4e-nom": { honorKind: "imperialMedal" } },
    _stats: {
      coreVersion: "14.364",
      systemId: "wfrp4e",
      systemVersion: "9.6.4",
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
      exportSource: null,
      compendiumSource: null,
      duplicateSource: null
    },
    ownership: { default: 0 },
    system: {
      description: { type: "String", label: "Description", value: description },
      gmdescription: { type: "String", label: "Description", value: "" },
      quantity: { type: "Number", label: "Quantity", value: 1 },
      encumbrance: { type: "Number", label: "Encumbrance", value: 0 },
      price: { type: "String", label: "Price", gc: 0, ss: 0, bp: 0 },
      availability: { type: "String", label: "Availability", value: "exotic" },
      location: { type: "Number", label: "Location", value: 0 },
      trappingType: { type: "String", label: "Trapping Type", value: "clothingAccessories" },
      worn: true,
      spellIngredient: { type: "String", value: "" },
      qualities: { label: "Qualities", value: [] },
      flaws: { label: "Flaws", value: [] }
    },
    sort: 0,
    _key: `!items!${id}`
  };
}

function makeTalent(name, id, rank, description, effects) {
  return {
    _id: id,
    name,
    type: "talent",
    img: IMG_TALENT,
    effects,
    folder: FOLDER_TALENT,
    flags: {
      "wfrp4e-nom": {
        honorKind: "killCount",
        killCountEnemy: "",
        killCountRank: rank.toLowerCase()
      }
    },
    _stats: {
      coreVersion: "14.364",
      systemId: "wfrp4e",
      systemVersion: "9.6.4",
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
      exportSource: null,
      compendiumSource: null,
      duplicateSource: null
    },
    ownership: { default: 0 },
    system: {
      description: { type: "String", label: "Description", value: description },
      gmdescription: { type: "String", label: "Description", value: "" },
      max: { type: "String", label: "Max Advances", value: "1" },
      advances: { type: "Number", label: "Advances", value: 1, force: false },
      career: { value: "", type: "String", label: "Career" },
      tests: {
        type: "String",
        label: "Tests",
        value: `Kill Count (${name}) — set Enemy Type when awarded`
      }
    },
    sort: 0,
    _key: `!items!${id}`
  };
}

function wave1Effects(name, id) {
  const effects = [];
  const effectImg = name === "Hunter" ? IMG_TALENT : IMG_TRAPPING;
  if (name === "Pure Soul Medal") {
    effects.push(
      skillDialogEffect(
        id,
        "Pure Soul Medal",
        effectImg,
        `try {
  if (args.type == "skill" && args.item?.name?.includes("Pray"))
    args.prefillModifiers.modifier += 10;
} catch (e) { console.warn("Pure Soul Medal effect", e); }`,
        true
      )
    );
  } else if (name === "White Dove") {
    effects.push(
      skillDialogEffect(
        id,
        "White Dove",
        effectImg,
        `try {
  if (args.type == "skill" && args.item?.name?.includes("Heal"))
    args.prefillModifiers.modifier += 10;
} catch (e) { console.warn("White Dove effect", e); }`,
        true
      )
    );
  } else if (name === "Platinum Owl") {
    effects.push(
      skillDialogEffect(
        id,
        "Platinum Owl",
        effectImg,
        `try {
  if (args.type != "skill") return;
  const n = args.item?.name || "";
  if (!n.includes("Lore")) return;
  if (/History|Law|Politics|Theology/i.test(n))
    args.prefillModifiers.modifier += 10;
} catch (e) { console.warn("Platinum Owl effect", e); }`,
        true
      )
    );
  } else if (name === "Artillerist's Honors") {
    effects.push(
      skillDialogEffect(
        id,
        "Artillerist's Honors",
        effectImg,
        `try {
  if (args.type != "skill") return;
  const n = args.item?.name || "";
  if (n.includes("Lore") && /Armoury|Armory|Construction|Engineering|Explosives/i.test(n))
    args.prefillModifiers.modifier += 10;
  if (/Ranged\\s*\\(\\s*Engineering\\s*\\)/i.test(n) || n.includes("Ranged (Engineering)"))
    args.prefillModifiers.modifier += 10;
} catch (e) { console.warn("Artillerist's Honors effect", e); }`,
        true
      )
    );
  } else if (name === "Hunter") {
    effects.push(
      skillDialogEffect(
        id,
        "Hunter (Kill Count)",
        effectImg,
        `try {
  const enemy = (this.item?.flags?.["wfrp4e-nom"]?.killCountEnemy
    || (this.item?.name?.match(/\\(([^)]+)\\)/)?.[1]) || "").trim();
  if (!enemy) return;
  if (args.type != "skill") return;
  const n = args.item?.name || "";
  if (!/Perception|Cool|Psychology|Stealth|Track/i.test(n) && !n.includes("Perception") && !n.includes("Cool"))
    return;
  // Prefer applying when the dialog/context mentions the enemy; otherwise allow GM to use activate
  args.prefillModifiers.modifier += 10;
} catch (e) { console.warn("Hunter Kill Count effect", e); }`,
        false
      )
    );
  }
  return effects;
}

async function main() {
  const journal = JSON.parse(await fs.readFile(JOURNAL, "utf8"));
  const page = journal.pages.find((p) => p._id === "n0mEmpMedals0001" || p.name === "Medals & Honors");
  if (!page) throw new Error("Medals & Honors page not found");
  const sections = parseJournalSections(page.text.content);

  const byName = new Map();
  for (const s of sections) {
    // Normalize curly apostrophe
    const n = s.name.replace(/[’]/g, "'");
    byName.set(n, { ...s, name: n });
  }

  // Map catalog names to journal section names (apostrophe variants)
  const medalNames = Object.keys(IDS).filter((k) => !["Hunter", "Killer", "Reaper"].includes(k));
  const written = [];

  for (const name of medalNames) {
    const id = IDS[name];
    const sec =
      byName.get(name) ||
      byName.get(name.replace("'", "’")) ||
      [...byName.values()].find((s) => s.name.replace(/[’']/g, "'") === name);
    if (!sec) {
      console.warn("Missing journal section for", name);
      continue;
    }
    const desc = medalDescription({ ...sec, name });
    const effects = wave1Effects(name, id);
    const doc = makeTrapping(name, id, desc, effects);
    const file = `${fileSlug(name)}_${id}.json`;
    await fs.writeFile(path.join(ITEMS, file), `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    written.push({ kind: "medal", name, id, file });
  }

  for (const rank of ["Hunter", "Killer", "Reaper"]) {
    const id = IDS[rank];
    const sec = byName.get(rank);
    if (!sec) throw new Error(`Missing Kill Count section ${rank}`);
    const desc = killCountDescription(sec, rank);
    const effects = wave1Effects(rank, id);
    const doc = makeTalent(rank, id, rank, desc, effects);
    const file = `${rank}_${id}.json`;
    await fs.writeFile(path.join(ITEMS, file), `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    written.push({ kind: "killCount", name: rank, id, file });
  }

  const lines = [
    "# Medals & Honors — catalog id map",
    "",
    "Generated by `scripts/generate-medals-honors-items.mjs`. Do not change `_id` after ship.",
    "",
    "| Kind | Name | `_id` | File |",
    "|------|------|-------|------|"
  ];
  for (const w of written) {
    lines.push(`| ${w.kind} | ${w.name} | \`${w.id}\` | \`${w.file}\` |`);
  }
  lines.push("");
  await fs.writeFile(MAP, `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ written: written.length, map: MAP }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
