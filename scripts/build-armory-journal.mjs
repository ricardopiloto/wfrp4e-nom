#!/usr/bin/env node
/**
 * Build Nations of Mankind - Armory journal from PDF prose + packs-src items/actors.
 *
 *   node scripts/build-armory-journal.mjs --write
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ITEMS_DIR = path.join(root, "packs-src/nom-items");
const BESTIARY_DIR = path.join(root, "packs-src/nom-bestiary");
const JOURNALS_DIR = path.join(root, "packs-src/nom-journals");
const FOLDER_ID = "CtX3SGpKsZVd1aGx";
const JID = "n0mArmory0000001";

const PAGES = {
  index: "n0mArmoryIndex01",
  empire: "n0mArmoryEmpire1",
  qualities: "n0mArmoryQuali01",
  melee: "n0mArmoryMelee01",
  ranged: "n0mArmoryRange01",
  armour: "n0mArmoryArmor01",
  siege: "n0mArmorySiege01",
  mounts: "n0mArmoryMount01",
};

const SIEGE_NAMES = new Set([
  "Dwarven Ballista",
  "Dwarven Cannon",
  "Empire Grand Cannon",
  "Empire Mortar",
  "Grudge Thrower",
  "Hellblaster Volley Gun",
  "Helstorm Rocket Battery",
  "Organ Gun",
  "Steam-powered Repeater",
  "Trebuchet",
]);

const doWrite = process.argv.includes("--write");

function uuidItem(id, label) {
  return `@UUID[Compendium.wfrp4e-nom.nom-items.Item.${id}]{${label}}`;
}
function uuidActor(id, label) {
  return `@UUID[Compendium.wfrp4e-nom.nom-bestiary.Actor.${id}]{${label}}`;
}
function uuidPage(pageId, label) {
  return `@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${JID}.JournalEntryPage.${pageId}]{${label}}`;
}

function priceStr(price = {}) {
  const gc = Number(price.gc || 0);
  const ss = Number(price.ss || 0);
  const bp = Number(price.bp || 0);
  const parts = [];
  if (gc) parts.push(`${gc} GC`);
  if (ss) parts.push(`${ss}/-`);
  if (bp) parts.push(`${bp} d`);
  return parts.join(" ") || "—";
}

function qfList(sys) {
  const qs = (sys?.qualities?.value || []).map((q) =>
    q.value != null && q.value !== "" ? `${titleCase(q.name)} ${q.value}` : titleCase(q.name)
  );
  const fs_ = (sys?.flaws?.value || []).map((f) =>
    f.value != null && f.value !== "" ? `${titleCase(f.name)} ${f.value}` : titleCase(f.name)
  );
  return [...qs, ...fs_].join(", ") || "—";
}

function titleCase(s) {
  return String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadItems() {
  const names = await fs.readdir(ITEMS_DIR);
  const out = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const doc = JSON.parse(await fs.readFile(path.join(ITEMS_DIR, name), "utf8"));
    if (doc.type === "weapon" || doc.type === "armour" || doc.type === "ammunition") out.push(doc);
  }
  return out;
}

async function loadMounts() {
  const names = await fs.readdir(BESTIARY_DIR);
  const mounts = [];
  const keys = [
    "mount",
    "destrier",
    "pegasus",
    "camel",
    "elephant",
    "mammoth",
    "warhorse",
    "griffon",
    "demigryph",
    "hippogryph",
    "warbear",
  ];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const doc = JSON.parse(await fs.readFile(path.join(BESTIARY_DIR, name), "utf8"));
    const n = doc.name || "";
    if (keys.some((k) => n.toLowerCase().includes(k))) mounts.push(doc);
  }
  return mounts.sort((a, b) => a.name.localeCompare(b.name));
}

function makePage({ id, name, content, sort }) {
  return {
    name,
    type: "text",
    title: { show: false, level: 1 },
    text: { format: 1, content },
    _stats: {
      compendiumSource: `Compendium.wfrp4e-nom.nom-journals.JournalEntry.${JID}.JournalEntryPage.${id}`,
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
    _key: `!journal.pages!${JID}.${id}`,
  };
}

function empireArmoryHtml() {
  const mods = [
    {
      name: "Bandolier",
      body: "A bandolier is a shoulder-belt with loops or pockets for storing ammo. Bandoliers are more often used by gunners as their convenience allows them to more quickly and easily reload readily prepared ammo.",
      applies: "Blackpowder Weapons and Crossbows",
      availability: "Common",
      cost: "9 Silver Shillings",
      effect:
        "Adds 3 Encumbrance for storing ammunition and gives +1 SL to any Extended Test to reload a ranged weapon.",
    },
    {
      name: "Breech-Loader",
      body: "Thanks to recent advances in firearms within the Human Engineering Guilds and less conservative Dwarf Engineers, breech-loading for firearms has entered into the market as a new and expensive way of combating reload times.",
      applies: "Blackpowder Weapons",
      availability: "Exotic",
      cost: "10 GC",
      effect:
        "A ranged weapon with a breech-loader may perform an Extended Test to reload as a Free Action. However, if you do this, you may not attempt another reload this Turn.",
    },
    {
      name: "Bayonet",
      body: "A bayonet is a knife, sword, or spike-shaped weapon designed to fit on the end of the muzzle of a rifle, musket or similar firearm, allowing it to be used as a spear.",
      applies: "Pistols and 2-Handed Crossbows and Blackpowder Weapons",
      availability: "Common",
      cost: "Varies",
      effect:
        "A bayonet removes the Undamaging Flaw for any ranged weapon that is being used as an Improvised Weapon during melee combat with the weapon’s Damage equal to SB + Damage depending on the weapon selected. Its Reach varies depending on the length of the weapon equipped. If the GM wishes, the Melee (Polearm) or Melee (Two-handed) Skill may be required to effectively use a 2-Handed ranged weapon with a bayonet.",
    },
    {
      name: "Dragon’s Breathe Shot",
      body: "Experimentation between the Engineering Guilds and the Alchemists of the Gold Order have created a devastating concoction for firearms.",
      applies: "Blackpowder Weapons",
      availability: "Exotic",
      cost: "1 GC per small shot and powder",
      effect:
        "Adds the Incendiary effect to the standard Small Shot and Powder (WFRP Core Rulebook).",
    },
    {
      name: "Dwarfen Gunpowder",
      body: "Dwarfen gunpowder is the best quality one can find within the Empire and is said to be the key secret behind the Dwarf’s higher reliability with Blackpowder weaponry.",
      applies: "Blackpowder Weapons",
      availability: "Rare",
      cost: "1 GC and 10 Silver Shillings for 12 Shots Worth or 6 GC for one Bomb",
      effect:
        "Weapons using Dwarfen gunpowder ignore the Dangerous Flaw, if they have it, and increase their Damage by +1.",
    },
    {
      name: "Extended Barrel",
      body: "Longer and larger gun barrels further extend the range of firearms across the Empire, at the cost of material and weight.",
      applies: "Blackpowder Weapons",
      availability: "Rare",
      cost: "8 GC",
      effect: "Increases Range by 50% and Encumbrance by 1.",
    },
    {
      name: "Grenade Launcher Modification",
      body: "A permanent modification for the common blunderbuss allowing it to fire explosives from a safe but effective distance.",
      applies: "Blunderbusses",
      availability: "Exotic",
      cost: "20 GC",
      effect:
        "May shoot Bombs as ammunition instead of listed blackpowder/engineering ammunition. Damage and Weapon Qualities are replaced with the Bomb’s; Encumbrance increased by 2.",
    },
    {
      name: "Gromril Coated Bullets",
      body: "Coating common bullets with carefully applied liquid Gromril creates exceptionally deadly munitions.",
      applies: "Blackpowder Weapons",
      availability: "Exotic",
      cost: "2 GC per bullet",
      effect:
        "Adds the Impact Weapon Quality and +3 Damage to the standard Bullet and Powder. Gromril bullets may be recollected for future use.",
    },
    {
      name: "Laurelorn Maple Wood Frame",
      body: "Higher quality materials for lighter and more durable ranged weaponry, hard to obtain under Wood Elf logging regulations.",
      applies: "Ranged Weapons",
      availability: "Exotic",
      cost: "10 GC",
      effect: "Gains the Durable and Lightweight Qualities.",
    },
    {
      name: "Musket Rest",
      body: "Portable forked poles that support the barrel of a blackpowder longarm.",
      applies: "2-Handed Blackpowder Weapons",
      availability: "Scarce",
      cost: "1 GC",
      effect:
        "Makes the weapon easier to aim (+10 to hit) but requires an Action to place the weapon in the rest after reloading. Weighs 1 Encumbrance if carried.",
    },
    {
      name: "Octagon Multi-Barrel",
      body: "A cumbersome but effective overhaul for Repeater Rifle and Pistol that doubles maximum firepower and adds a volley mode.",
      applies: "Repeater Rifle and Pistol",
      availability: "Exotic",
      cost: "10 GC",
      effect:
        "Gains Repeater 8 and Reload 10 Flaw; Encumbrance +1. As an Action, fire all available shots at once on a single target, adding Blast equal to every 2 bullets shot (max Blast 4). Each such shot requires an Average (+20) Endurance Test (1 Wound per Failure level; Astounding Failure = Critical Hit to the shoulder).",
    },
    {
      name: "Powder Horn",
      body: "A long curved container that keeps black powder dry; common among hunters and soldiers.",
      applies: "Blackpowder Weapons",
      availability: "Common",
      cost: "4 Silver Shillings and 6 Brass Pennies",
      effect:
        "+1 SL to any Extended Test to reload a blackpowder ranged weapon. Also protects gunpowder from rain or snow.",
    },
    {
      name: "Pistol Grip",
      body: "Repurposed grips attached underbarrel to increase stability and aiming speed.",
      applies: "2-Handed Crossbows and Blackpowder Weapons",
      availability: "Rare",
      cost: "4 GC",
      effect:
        "Does not inflict the penalty for shooting after moving. You can take the Aim Action as a Free Action, but must still wait until next round before applying the +20 Difficulty Modifier.",
    },
    {
      name: "Pistol Sword",
      body: "A sword with a pistol or repeater attached alongside the blade; both functions usable without switching hands.",
      applies: "Swords and rapiers",
      availability: "Exotic",
      cost: "20 GC",
      effect:
        "Functions as both a melee weapon and a ranged weapon (pistol or repeater pistol sidearm). Either function may be used as if in the same hand; no Free Action required to switch.",
    },
    {
      name: "Rifling",
      body: "Helical grooving machined into a barrel’s bore to spin the projectile and improve accuracy.",
      applies: "Blackpowder Weapons",
      availability: "Rare",
      cost: "4 GC per barrel",
      effect: "Gains the Precise Quality and increases the weapon’s Range by 20%.",
    },
    {
      name: "Reinforced Rifle Frame",
      body: "Heavier metallic components crafted by master gunsmiths for tougher frames.",
      applies: "Blackpowder Weapons",
      availability: "Rare",
      cost: "4 GC",
      effect:
        "Gains the Durable Quality, and has the Undamaging Flaw removed if used as an improvised weapon. If the weapon has a Bayonet, Damage +1.",
    },
    {
      name: "Rune Tipped Bolts",
      body: "Dwarfen crossbow bolts forged under a Runesmith’s hand, etched with powerful runes along their tips.",
      applies: "Crossbows",
      availability: "Exotic",
      cost: "1 GC per bolt",
      effect:
        "Adds Accurate and Penetrating Qualities, +50 Range and +2 Damage to the standard Crossbow Bolt. Attacks count as Magical.",
    },
    {
      name: "Short-Barrel",
      body: "A shortened barrel trade-off used for close-range skirmishing.",
      applies: "2-Handed Blackpowder Weapons",
      availability: "Common",
      cost: "2 GC",
      effect:
        "Decreases Range by 50% and Encumbrance by 1, but you can use this weapon to attack in Close Combat similar to the Pistol Quality.",
    },
    {
      name: "Silvered Weapons &amp; Ammo",
      body: "Silvered arms prized by Witch Hunters and Vampire Hunters since the Vampire Wars.",
      applies: "Melee Weapons and Ranged Weapon Ammo",
      availability: "Rare",
      cost: "3× the value of the weapon or ammo in silver, plus labour as determined by the GM",
      effect:
        "Allows attacks to strike targets with the Ethereal Trait and deals an additional +1 Damage to targets with the Undead Trait.",
    },
    {
      name: "Steam-Powered Gun Crank",
      body: "A crank attachment that rapidly increases the fire rate of repeater weapons.",
      applies: "Repeater Rifle and Pistol",
      availability: "Exotic",
      cost: "20 GC",
      effect:
        "May shoot twice on a single Action once activated. Every round as a Free Action, you must rotate the crank to activate the effect.",
    },
    {
      name: "Telescopic Sight",
      body: "Repurposed telescopes adapted for firearms and crossbows, adding increased accuracy to every shot.",
      applies: "2-Handed Crossbows and Blackpowder Weapons",
      availability: "Rare",
      cost: "5 GC",
      effect: "Gains the Accurate Weapon Quality.",
    },
    {
      name: "Volley Shot Modification",
      body: "A Dwarf-engineered crossbow attachment capable of firing multiple bolts in quick succession or in a single volley.",
      applies: "2-Handed Crossbows",
      availability: "Exotic",
      cost: "4 GC",
      effect:
        "Gains Repeater 3 and Reload 4 Flaw; Encumbrance +1. As an Action, fire all available bolts at once on a single target: on Success, each bolt is a separate hit (TB and armour apply per bolt); roll hit location per bolt.",
    },
  ];

  const blocks = mods
    .map(
      (m) =>
        `<h3>${m.name}</h3><p>${m.body}</p><p><strong>Applies to:</strong> ${m.applies}</p><p><strong>Availability:</strong> ${m.availability}</p><p><strong>Cost:</strong> ${m.cost}</p><p><strong>Effect:</strong> ${m.effect}</p>`
    )
    .join("");

  return `<h1>Armory of the Empire</h1><p>Gunpowder and engineering attachments, munitions, and modifications used across the Empire (Nations of Mankind PDF, pages 78–80). Pair these with Core blackpowder rules and the NoM weapon lists.</p>${blocks}`;
}

function qualitiesHtml() {
  const qs = [
    {
      name: "Concealed",
      body: "Concealed weapons are designed not to be seen, often strapped around various areas of the wielder’s body under their clothing to avoid detection. If you are wielding such a weapon, no one can easily detect it on your person with their passive perception and would have to conduct a thorough investigation in order to discover it. If used on a surprised target, the weapon temporarily gains the Damaging and Impact Qualities.",
    },
    {
      name: "Crushing",
      body: "Crushing weapons are designed with spikes or patterns to smash up, crush and tear into the armour of the wielder’s enemies. If you successfully attack and deal a Critical Hit on an opponent, you Damage a struck piece of armour or shield by 2 points as well as wounding the target. Furthermore, you ignore the Impenetrable Armour Quality for all Critical Hits.",
    },
    {
      name: "Hooked",
      body: "Hooked weapons are strategically designed with small hooks on their ends to pull down infantry or rip cavalry off their mounts. After a successful Melee Attack, instead of dealing Damage, you may attempt to pull down your enemy with an Opposed Strength Test. If you succeed, you force the opponent to go prone. If the opponent is mounted, they are forced off their mount and take falling damage.",
    },
    {
      name: "Multi-shot",
      body: "This weapon is designed to fire multiple missiles at once in a single action, assuming the weapon is fully loaded and capable of holding more than one missile at a time based on the Repeater Quality’s value. On a Success, the Damage is counted as a separate hit by each missile, with Toughness Bonus and armour deducting the Damage of each shot as normal. Roll a d100 for each separate hit location. If you Fumble, you must roll for two results on the Fumble Table and pick the higher result.",
    },
    {
      name: "Ninjutsu",
      body: 'This bomb is a product created from years of martial arts mastery and experimentation. A bomb with this Quality may have one of the effects selected below. Whichever effect is selected replaces the Ninjutsu Quality for the number of bombs crafted or purchased and cannot be replaced:</p><ul><li><p><strong>Distraction:</strong> Any targets within 50 yards of this bomb are immediately alerted to its presence.</p></li><li><p><strong>Smoke:</strong> Anyone caught in the radius is Surprised and gains 1+SL Blinded Conditions.</p></li><li><p><strong>Stun:</strong> Anyone caught in the radius must pass a Hard (−20) Endurance Test or gain 1+SL Stunned Conditions.</p></li><li><p><strong>Poison:</strong> Anyone caught in the radius must pass a Hard (−20) Endurance Test or gain 1+SL Poisoned Conditions.</p></li></ul><p></p>',
    },
    {
      name: "Suppressed",
      body: "This weapon is designed to drastically reduce the noise made from firing it. This weapon can be fired without immediately alerting enemies; however, it loses the Blackpowder and Damaging Qualities.",
    },
    {
      name: "Missile Resistant",
      body: "This armour is designed to protect the wearer from ranged attacks. While wearing a piece of armour with this quality, missile attacks have their Damage reduced by 2. Furthermore, the Damaging Quality of all ranged weapons is ignored when striking this armour with missile attacks, with the exception of ranged weapons with the Blackpowder Quality.",
    },
  ];

  return `<h1>New Qualities</h1><p>Weapon and armour Qualities introduced in Nations of Mankind (PDF pages 82–83).</p>${qs
    .map((q) => `<h2>${q.name}</h2><p>${q.body}</p>`)
    .join("")}`;
}

function weaponTable(rows, headers) {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function classifyWeapons(weapons) {
  const siege = [];
  const ranged = [];
  const melee = [];
  for (const w of weapons) {
    if (SIEGE_NAMES.has(w.name)) {
      siege.push(w);
      continue;
    }
    const range = String(w.system?.range?.value || "").trim();
    const group = String(w.system?.weaponGroup?.value || "").toLowerCase();
    if (
      (range && range !== "0") ||
      [
        "blackpowder",
        "bow",
        "crossbow",
        "engineering",
        "entangling",
        "explosives",
        "sling",
        "throwing",
      ].includes(group)
    ) {
      ranged.push(w);
    } else {
      melee.push(w);
    }
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  return {
    melee: melee.sort(byName),
    ranged: ranged.sort(byName),
    siege: siege.sort(byName),
  };
}

function meleeHtml(weapons) {
  const byGroup = new Map();
  for (const w of weapons) {
    const g = titleCase(w.system?.weaponGroup?.value || "Other");
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(w);
  }
  let html =
    "<h1>Melee Weapons</h1><p>NoM melee weapons from the compendium (linked). Stats reflect <code>nom-items</code>.</p>";
  for (const [group, list] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const rows = list.map((w) => {
      const reach = titleCase(w.system?.reach?.value || "—");
      const dmg = w.system?.damage?.value || "—";
      return [
        uuidItem(w._id, w.name),
        priceStr(w.system?.price),
        String(w.system?.encumbrance?.value ?? "—"),
        titleCase(w.system?.availability?.value || "—"),
        reach,
        dmg,
        qfList(w.system),
      ];
    });
    html += `<h2>${group}</h2>${weaponTable(rows, [
      "Weapon",
      "Price",
      "Enc",
      "Availability",
      "Reach",
      "Damage",
      "Qualities &amp; Flaws",
    ])}`;
  }
  return html;
}

function rangedHtml(weapons, ammo) {
  const rows = weapons.map((w) => [
    uuidItem(w._id, w.name),
    priceStr(w.system?.price),
    String(w.system?.encumbrance?.value ?? "—"),
    titleCase(w.system?.availability?.value || "—"),
    String(w.system?.range?.value || "—"),
    w.system?.damage?.value || "—",
    qfList(w.system),
  ]);
  let html = `<h1>Ranged Weapons</h1><p>NoM ranged weapons from the compendium (linked).</p>${weaponTable(
    rows,
    ["Weapon", "Price", "Enc", "Availability", "Range", "Damage", "Qualities &amp; Flaws"]
  )}`;
  if (ammo?.length) {
    const arows = ammo.map((a) => [
      uuidItem(a._id, a.name),
      priceStr(a.system?.price),
      String(a.system?.encumbrance?.value ?? "—"),
      titleCase(a.system?.availability?.value || "—"),
      titleCase(a.system?.ammunitionType?.value || "—"),
      qfList(a.system),
    ]);
    html += `<h2>Ammunition</h2>${weaponTable(arows, [
      "Ammunition",
      "Price",
      "Enc",
      "Availability",
      "Type",
      "Qualities &amp; Flaws",
    ])}`;
  }
  return html;
}

function armourHtml(armours) {
  const rows = armours
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => {
      const loc = a.system?.location?.value || a.system?.armorType?.value || "—";
      const ap =
        a.system?.AP?.value ??
        a.system?.currentAP?.value ??
        a.system?.APit?.value ??
        a.system?.AP?.head ??
        "—";
      // Prefer printable AP summary
      let apStr = "—";
      const apObj = a.system?.AP;
      if (apObj && typeof apObj === "object") {
        const parts = ["head", "body", "lArm", "rArm", "lLeg", "rLeg"]
          .map((k) => (apObj[k] != null ? `${k}:${apObj[k]}` : null))
          .filter(Boolean);
        if (parts.length) apStr = parts.join(", ");
        else if (apObj.value != null) apStr = String(apObj.value);
      } else if (ap != null && ap !== "—") apStr = String(ap);

      return [
        uuidItem(a._id, a.name),
        priceStr(a.system?.price),
        String(a.system?.encumbrance?.value ?? "—"),
        titleCase(a.system?.availability?.value || "—"),
        String(loc),
        apStr,
        qfList(a.system),
      ];
    });
  return `<h1>Armour</h1><p>NoM armour pieces from the compendium (linked), including Stechzeug, Norse plate, Reiksplate, samurai, lamellar, and auxiliaries.</p>${weaponTable(
    rows,
    ["Armour", "Price", "Enc", "Availability", "Locations / Type", "AP", "Qualities &amp; Flaws"]
  )}<p><em>See also</em> ${uuidPage(PAGES.qualities, "Missile Resistant")} under New Qualities.</p>`;
}

function siegeHtml(weapons) {
  const rows = weapons.map((w) => [
    uuidItem(w._id, w.name),
    priceStr(w.system?.price),
    String(w.system?.encumbrance?.value ?? "—"),
    titleCase(w.system?.availability?.value || "—"),
    String(w.system?.range?.value || "—"),
    w.system?.damage?.value || "—",
    qfList(w.system),
  ]);
  return `<h1>Siege Weapons</h1><p>All siege weapons except the Trebuchet typically have the Blackpowder Quality. Using them effectively requires Ranged (Engineer), or Ranged (Blackpowder) if the weapon has the Blackpowder Quality.</p>${weaponTable(
    rows,
    ["Weapon", "Price", "Enc", "Availability", "Range", "Damage", "Qualities &amp; Flaws"]
  )}`;
}

function mountsHtml(mounts) {
  const lis = mounts
    .map((m) => `<li><p>${uuidActor(m._id, m.name)}</p></li>`)
    .join("");
  return `<h1>Mounts</h1><p>Mounts and war mounts from the Nations of Mankind bestiary (PDF page 84+). Open the Actor for Traits, movement, and trappings.</p><ul>${lis}</ul>`;
}

function indexHtml() {
  const links = [
    [PAGES.empire, "Armory of the Empire"],
    [PAGES.qualities, "New Qualities"],
    [PAGES.melee, "Melee Weapons"],
    [PAGES.ranged, "Ranged Weapons"],
    [PAGES.armour, "Armour"],
    [PAGES.siege, "Siege Weapons"],
    [PAGES.mounts, "Mounts"],
  ];
  return `<h1>Armory</h1><p>Weapons, armour, engineering attachments, new Qualities, siege engines, and mounts from <em>Nations of Mankind</em> (PDF pages 78–85). Tables link to <code>nom-items</code> / <code>nom-bestiary</code> where those documents exist.</p><h2>Contents</h2><ul>${links
    .map(([id, label]) => `<li><p>${uuidPage(id, label)}</p></li>`)
    .join("")}</ul>`;
}

async function main() {
  const items = await loadItems();
  const weapons = items.filter((i) => i.type === "weapon");
  const armours = items.filter((i) => i.type === "armour");
  const ammo = items
    .filter((i) => i.type === "ammunition")
    .sort((a, b) => a.name.localeCompare(b.name));
  const { melee, ranged, siege } = classifyWeapons(weapons);
  const mounts = await loadMounts();

  const pages = [
    makePage({ id: PAGES.index, name: "Armory", content: indexHtml(), sort: 0 }),
    makePage({
      id: PAGES.empire,
      name: "Armory of the Empire",
      content: empireArmoryHtml(),
      sort: 100000,
    }),
    makePage({
      id: PAGES.qualities,
      name: "New Qualities",
      content: qualitiesHtml(),
      sort: 200000,
    }),
    makePage({
      id: PAGES.melee,
      name: "Melee Weapons",
      content: meleeHtml(melee),
      sort: 300000,
    }),
    makePage({
      id: PAGES.ranged,
      name: "Ranged Weapons",
      content: rangedHtml(ranged, ammo),
      sort: 400000,
    }),
    makePage({
      id: PAGES.armour,
      name: "Armour",
      content: armourHtml(armours),
      sort: 500000,
    }),
    makePage({
      id: PAGES.siege,
      name: "Siege Weapons",
      content: siegeHtml(siege),
      sort: 600000,
    }),
    makePage({
      id: PAGES.mounts,
      name: "Mounts",
      content: mountsHtml(mounts),
      sort: 700000,
    }),
  ];

  const journal = {
    folder: FOLDER_ID,
    name: "Nations of Mankind - Armory",
    _id: JID,
    pages,
    categories: [],
    sort: 850000,
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
    _key: `!journal!${JID}`,
  };

  console.log(
    `Armory journal: melee=${melee.length} ranged=${ranged.length} ammo=${ammo.length} armour=${armours.length} siege=${siege.length} mounts=${mounts.length}`
  );

  if (!doWrite) {
    console.log("Dry-run only; pass --write to create journal + hub link.");
    return;
  }

  const outPath = path.join(
    JOURNALS_DIR,
    `Nations_of_Mankind___Armory_${JID}.json`
  );
  await fs.writeFile(outPath, `${JSON.stringify(journal, null, 2)}\n`, "utf8");
  console.log("Wrote", path.relative(root, outPath));

  // Hub link — always refresh Armory UUID (page ids may change)
  const hubPath = path.join(
    JOURNALS_DIR,
    "Nations_of_Mankind___Start_Here_n0mStartHere0001.json"
  );
  const hub = JSON.parse(await fs.readFile(hubPath, "utf8"));
  const page = hub.pages[0];
  const hubLink = `<li><p>@UUID[Compendium.wfrp4e-nom.nom-journals.JournalEntry.${JID}.JournalEntryPage.${PAGES.index}]{Armory}</p></li>`;
  const armoryUuidRe =
    /<li><p>@UUID\[Compendium\.wfrp4e-nom\.nom-journals\.JournalEntry\.n0mArmory0000001\.JournalEntryPage\.[^\]]+\]\{Armory\}<\/p><\/li>/;
  if (armoryUuidRe.test(page.text.content)) {
    page.text.content = page.text.content.replace(armoryUuidRe, hubLink);
    await fs.writeFile(hubPath, `${JSON.stringify(hub, null, 2)}\n`, "utf8");
    console.log("Refreshed Start Here Armory link");
  } else if (!page.text.content.includes(JID)) {
    page.text.content = page.text.content.replace(
      "</ul><p><em>Core reference:</em>",
      `${hubLink}</ul><p><em>Core reference:</em>`
    );
    if (!page.text.content.includes(JID)) {
      page.text.content = page.text.content.replace(
        "{Careers}</p></li></ul>",
        `{Careers}</p></li>${hubLink}</ul>`
      );
    }
    await fs.writeFile(hubPath, `${JSON.stringify(hub, null, 2)}\n`, "utf8");
    console.log("Updated Start Here hub");
  } else {
    console.log("Hub already links Armory (no refresh needed)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
