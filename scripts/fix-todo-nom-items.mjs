#!/usr/bin/env node
/**
 * Apply fixable gaps from reports/TODO-nom-items.md:
 * - Dedupe Tiger Claws / Poleaxe (keep PDF-correct)
 * - Add missing Armory gear from PDF pp. 81–83
 *
 *   node scripts/fix-todo-nom-items.mjs --write
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ITEMS = path.join(root, "packs-src/nom-items");
const JOURNALS = path.join(root, "packs-src/nom-journals");
const FOLDER = "xUrVvvwtRnbLeVuH";
const doWrite = process.argv.includes("--write");

const KEEP_TIGER = "PQDxXhPeCdKGm5GB";
const DROP_TIGER = "cX7EF6N8m48Gx6td";
const KEEP_POLEAXE = "9bdF80FcX8cFcJvN";
const DROP_POLEAXE = "LEH3osVtN1es1HMf";

function baseWeapon({
  id,
  name,
  img,
  enc,
  price,
  availability,
  damage,
  reach = "",
  range = "",
  twohanded = false,
  group,
  qualities = [],
  flaws = [],
  ammunitionGroup = "",
  consumesAmmo = true,
  special = "",
  sort = 9000000,
}) {
  return {
    _id: id,
    name,
    type: "weapon",
    img,
    effects: [],
    folder: FOLDER,
    flags: { core: {} },
    _stats: {
      coreVersion: "13.351",
      systemId: "wfrp4e",
      systemVersion: "9.3.2",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "bwuOpMGVHBESXkjP",
      exportSource: null,
      compendiumSource: null,
      duplicateSource: null,
    },
    ownership: { default: 0, bwuOpMGVHBESXkjP: 3 },
    system: {
      description: { type: "String", label: "Description", value: "" },
      gmdescription: { type: "String", label: "Description", value: "" },
      quantity: { type: "Number", label: "Quantity", value: 1 },
      encumbrance: { type: "Number", label: "Encumbrance", value: enc },
      price: { type: "String", label: "Price", ...price },
      availability: { type: "String", label: "Availability", value: availability },
      location: { type: "Number", label: "Location", value: "" },
      damageToItem: { type: "Number", value: 0, shield: 0 },
      damage: { type: "String", label: "Damage", dice: "", value: damage },
      reach: { type: "String", label: "Reach", value: reach },
      range: { type: "String", label: "Range", value: range },
      skill: { type: "String", label: "Skill Override", value: "" },
      modeOverride: { type: "String", label: "Mode Override", value: "" },
      twohanded: { type: "Boolean", label: "Two-Handed", value: twohanded },
      ammunitionGroup: { type: "String", label: "Ammunition Group", value: ammunitionGroup },
      currentAmmo: { value: "0" },
      consumesAmmo: { value: consumesAmmo },
      weaponGroup: { type: "String", label: "Weapon Group", value: group },
      qualities: { label: "Qualities", value: qualities },
      flaws: { label: "Flaws", value: flaws },
      special: { type: "String", label: "Special", value: special },
      equipped: { value: false },
      loaded: { value: false, repeater: false, amt: 0 },
      offhand: { value: false },
    },
    sort,
    _key: `!items!${id}`,
  };
}

function baseArmour({
  id,
  name,
  img,
  enc,
  price,
  availability,
  armorType,
  ap,
  qualities = [],
  flaws = [],
  penalty = "",
  special = "",
  sort = 9100000,
}) {
  return {
    _id: id,
    name,
    type: "armour",
    img,
    effects: [],
    folder: FOLDER,
    flags: { core: {} },
    _stats: {
      coreVersion: "13.351",
      systemId: "wfrp4e",
      systemVersion: "9.3.2",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "bwuOpMGVHBESXkjP",
      exportSource: null,
      compendiumSource: null,
      duplicateSource: null,
    },
    ownership: { default: 0, bwuOpMGVHBESXkjP: 3 },
    system: {
      description: { type: "String", label: "Description", value: "" },
      gmdescription: { type: "String", label: "Description", value: "" },
      quantity: { type: "Number", label: "Quantity", value: 1 },
      encumbrance: { type: "Number", label: "Encumbrance", value: enc },
      price: { type: "String", label: "Price", ...price },
      availability: { type: "String", label: "Availability", value: availability },
      location: { type: "Number", label: "Location", value: "" },
      damageToItem: { type: "Number", value: 0, shield: 0 },
      worn: { type: "Boolean", label: "Worn", value: false },
      armorType: { type: "String", label: "Armour Type", value: armorType },
      penalty: { type: "String", label: "Penalty", value: penalty },
      qualities: { type: "String", label: "Qualities", value: qualities },
      flaws: { type: "String", label: "Flaws", value: flaws },
      special: { type: "String", label: "Special", value: special },
      AP: { head: 0, lArm: 0, rArm: 0, lLeg: 0, rLeg: 0, body: 0, ...ap },
      APdamage: { head: 0, lArm: 0, rArm: 0, lLeg: 0, rLeg: 0, body: 0, ...ap },
      equipped: { value: false },
    },
    sort,
    _key: `!items!${id}`,
  };
}

function baseAmmo({
  id,
  name,
  img,
  enc,
  price,
  availability,
  ammunitionType,
  qualities = [],
  flaws = [],
  special = "",
  quantity = 1,
  sort = 9200000,
}) {
  return {
    _id: id,
    name,
    type: "ammunition",
    img,
    effects: [],
    folder: FOLDER,
    flags: { core: {} },
    _stats: {
      coreVersion: "13.351",
      systemId: "wfrp4e",
      systemVersion: "9.3.2",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "bwuOpMGVHBESXkjP",
      exportSource: null,
      compendiumSource: null,
      duplicateSource: null,
    },
    ownership: { default: 0, bwuOpMGVHBESXkjP: 3 },
    system: {
      description: { type: "String", label: "Description", value: "" },
      gmdescription: { type: "String", label: "Description", value: "" },
      quantity: { type: "Number", label: "Quantity", value: quantity },
      encumbrance: { type: "Number", label: "Encumbrance", value: enc },
      price: { type: "String", label: "Price", ...price },
      availability: { type: "String", label: "Availability", value: availability },
      location: { type: "Number", label: "Location", value: "" },
      ammunitionType: { type: "String", label: "Ammunition Type", value: ammunitionType },
      range: { type: "String", label: "Range", value: "" },
      damage: { type: "String", label: "Damage", dice: "", value: "" },
      qualities: { type: "String", label: "Qualities", value: qualities },
      flaws: { type: "String", label: "Flaws", value: flaws },
      special: { type: "String", label: "Special", value: special },
    },
    sort,
    _key: `!items!${id}`,
  };
}

function q(...names) {
  return names.map((n) =>
    typeof n === "string" ? { name: n, value: null } : { name: n.name, value: n.value }
  );
}

const NEW_ITEMS = [
  baseWeapon({
    id: "aCyDvbZwh1MiuZSQ",
    name: "Tonfa",
    img: "modules/wfrp4e-nom/icons/trappings/weapons/nunchuks.webp",
    enc: 0,
    price: { gc: 4, ss: 0, bp: 0 },
    availability: "exotic",
    damage: "SB+3",
    reach: "vShort",
    group: "basic",
    qualities: q("defensive", "pummel"),
  }),
  baseWeapon({
    id: "dowm6TP5k3z3Ik6k",
    name: "Glaive",
    img: "modules/wfrp4e-nom/icons/trappings/weapons/glaive.webp",
    enc: 3,
    price: { gc: 4, ss: 0, bp: 0 },
    availability: "scarce",
    damage: "SB+5",
    reach: "vLong",
    twohanded: true,
    group: "polearm",
    qualities: q("hack", "hooked"),
  }),
  baseWeapon({
    id: "Sjhyj6N7FEcP1v5b",
    name: "Air Rifle",
    img: "modules/wfrp4e-core/icons/equipment/weapons/handgun.png",
    enc: 3,
    price: { gc: 100, ss: 0, bp: 0 },
    availability: "exotic",
    damage: "+9",
    range: "50",
    twohanded: true,
    group: "engineering",
    ammunitionGroup: "BPandEng",
    qualities: q("accurate", "damaging", "suppressed"),
    flaws: q({ name: "reload", value: 3 }),
  }),
  baseWeapon({
    id: "zmFef6d88OU7JP4E",
    name: "Triple-Barrel Repeater Pistol",
    img: "modules/wfrp4e-core/icons/equipment/weapons/pistol.png",
    enc: 1,
    price: { gc: 20, ss: 0, bp: 0 },
    availability: "exotic",
    damage: "+7",
    range: "10",
    group: "blackpowder",
    ammunitionGroup: "BPandEng",
    qualities: q("blackpowder", "damaging", "pistol", "multi-shot", { name: "repeater", value: 3 }),
    flaws: q("dangerous", { name: "reload", value: 3 }),
  }),
  baseWeapon({
    id: "ld58Nf5hauJjvZM8",
    name: "Chakram",
    img: "modules/wfrp4e-core/icons/equipment/weapons/throwing-axe.png",
    enc: 1,
    price: { gc: 2, ss: 0, bp: 0 },
    availability: "exotic",
    damage: "SB+3",
    range: "SBx3",
    group: "throwing",
    ammunitionGroup: "throwing",
    qualities: q(),
  }),
  baseWeapon({
    id: "wVInyn5CB3kGGrtj",
    name: "Kunai",
    img: "modules/wfrp4e-core/icons/equipment/weapons/throwing-knife.png",
    enc: 0,
    price: { gc: 1, ss: 0, bp: 0 },
    availability: "exotic",
    damage: "SB+2",
    range: "SBx3",
    group: "throwing",
    ammunitionGroup: "throwing",
    qualities: q("impale"),
  }),
  baseWeapon({
    id: "Xl7KGqNzmZqbRKUK",
    name: "Shuriken",
    img: "modules/wfrp4e-core/icons/equipment/weapons/dart.png",
    enc: 0,
    price: { gc: 0, ss: 5, bp: 0 },
    availability: "exotic",
    damage: "SB+1",
    range: "SBx4",
    group: "throwing",
    ammunitionGroup: "throwing",
    flaws: q("undamaging"),
  }),
  baseWeapon({
    id: "Rdqi7fBp8CqVaLI5",
    name: "Throwing Hammer",
    img: "modules/wfrp4e-core/icons/equipment/weapons/throwing-axe.png",
    enc: 1,
    price: { gc: 1, ss: 0, bp: 0 },
    availability: "common",
    damage: "SB+3",
    range: "SBx2",
    group: "throwing",
    ammunitionGroup: "throwing",
    qualities: q("pummel"),
  }),
  baseAmmo({
    id: "yNoYLzjh91V7vPbo",
    name: "Arrow (Armor Piercing)",
    img: "modules/wfrp4e-core/icons/equipment/ammunition/arrow.png",
    enc: 0,
    price: { gc: 0, ss: 2, bp: 0 },
    availability: "scarce",
    ammunitionType: "bow",
    qualities: q("impale", "penetrating"),
  }),
  baseAmmo({
    id: "s1uhM8kAMGt9qkNm",
    name: "Arrow (Incendiary)",
    img: "modules/wfrp4e-core/icons/equipment/ammunition/arrow.png",
    enc: 0,
    price: { gc: 0, ss: 2, bp: 0 },
    availability: "scarce",
    ammunitionType: "bow",
    special: "Incendiary (see Nations of Mankind PDF).",
  }),
  baseAmmo({
    id: "IZ6qkLPbG8yqST7Y",
    name: "Arrow (Screamer)",
    img: "modules/wfrp4e-core/icons/equipment/ammunition/arrow.png",
    enc: 0,
    price: { gc: 0, ss: 2, bp: 0 },
    availability: "scarce",
    ammunitionType: "bow",
    flaws: q("undamaging"),
    special:
      "When fired, air passes through the head, creating a screeching noise that can be used to signal allies or distract enemies or game.",
  }),
  baseAmmo({
    id: "aDfZBs6onvwEhNLa",
    name: "Pellets (12)",
    img: "modules/wfrp4e-core/icons/equipment/ammunition/lead-bullet.png",
    enc: 0,
    price: { gc: 0, ss: 1, bp: 0 },
    availability: "common",
    ammunitionType: "BPandEng",
    qualities: q("impale"),
    quantity: 12,
  }),
  baseArmour({
    id: "Mg8shSyJwu72rwLU",
    name: "Reiksplate Bracers",
    img: "modules/wfrp4e-core/icons/equipment/armour/plate-bracers.png",
    enc: 2,
    price: { gc: 60, ss: 0, bp: 0 },
    availability: "exotic",
    armorType: "plate",
    ap: { lArm: 2, rArm: 2 },
    qualities: q("durable", "fine", "impenetrable", "lightweight", "practical"),
    flaws: q("weakpoints"),
  }),
  baseArmour({
    id: "gTyaKN52UCLjw9Ne",
    name: "Horo Cloak",
    img: "modules/wfrp4e-core/icons/equipment/clothing_and_accessories/cloak.png",
    enc: 0,
    price: { gc: 15, ss: 0, bp: 0 },
    availability: "exotic",
    armorType: "other",
    ap: { lArm: 0, rArm: 0, body: 0 },
    qualities: q("missile-resistant"),
  }),
  baseArmour({
    id: "UIO4VS1txJLI4TAz",
    name: "Skull Trophies",
    img: "modules/wfrp4e-core/icons/spells/screaming-skull.png",
    enc: 0,
    price: { gc: 0, ss: 0, bp: 0 },
    availability: "",
    armorType: "other",
    ap: {},
    flaws: q("ugly"),
    special: "Fear 1 while worn (any location). See Nations of Mankind PDF.",
  }),
];

async function exists(id) {
  const names = await fs.readdir(ITEMS);
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const doc = JSON.parse(await fs.readFile(path.join(ITEMS, n), "utf8"));
    if (doc._id === id) return n;
  }
  return null;
}

async function main() {
  const actions = [];

  // Fix Tiger Claws reach on keeper
  const tigerFile = (await exists(KEEP_TIGER)) || "Tiger_Claws_PQDxXhPeCdKGm5GB.json";
  const tiger = JSON.parse(await fs.readFile(path.join(ITEMS, tigerFile), "utf8"));
  if (tiger.system.reach.value !== "vShort") {
    actions.push(`Tiger Claws ${KEEP_TIGER}: set reach vShort`);
    tiger.system.reach.value = "vShort";
    if (doWrite) await fs.writeFile(path.join(ITEMS, tigerFile), `${JSON.stringify(tiger, null, 2)}\n`);
  }

  // Drop bad duplicates
  for (const [id, label] of [
    [DROP_TIGER, "Tiger Claws (wrong stats)"],
    [DROP_POLEAXE, "Poleaxe (wrong stats)"],
  ]) {
    const file = await exists(id);
    if (file) {
      actions.push(`Delete duplicate ${label} ${id} (${file})`);
      if (doWrite) await fs.unlink(path.join(ITEMS, file));
    }
  }

  // Retarget Nation Rules Cathay trappings
  const rulesPath = path.join(JOURNALS, "Nations_of_Mankind___Nation_Rules_n0mNationRules01.json");
  const rules = JSON.parse(await fs.readFile(rulesPath, "utf8"));
  let rulesChanged = false;
  for (const page of rules.pages) {
    if (page.text?.content?.includes(DROP_TIGER)) {
      page.text.content = page.text.content.replaceAll(DROP_TIGER, KEEP_TIGER);
      rulesChanged = true;
    }
  }
  if (rulesChanged) {
    actions.push(`Nation Rules: Tiger Claws UUID ${DROP_TIGER} → ${KEEP_TIGER}`);
    if (doWrite) await fs.writeFile(rulesPath, `${JSON.stringify(rules, null, 2)}\n`);
  }

  // Create missing items
  for (const item of NEW_ITEMS) {
    const existing = await exists(item._id);
    const byName = [];
    for (const n of await fs.readdir(ITEMS)) {
      if (!n.endsWith(".json")) continue;
      const d = JSON.parse(await fs.readFile(path.join(ITEMS, n), "utf8"));
      if (d.name === item.name) byName.push(d._id);
    }
    if (existing || byName.length) {
      actions.push(`Skip ${item.name} (already present: ${existing || byName.join(",")})`);
      continue;
    }
    const safe = item.name.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const out = path.join(ITEMS, `${safe}_${item._id}.json`);
    actions.push(`Create ${item.type} ${item.name} → ${path.basename(out)}`);
    if (doWrite) await fs.writeFile(out, `${JSON.stringify(item, null, 2)}\n`);
  }

  console.log(actions.map((a) => `- ${a}`).join("\n") || "(no actions)");
  if (!doWrite) console.log("\nDry-run only; pass --write to apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
