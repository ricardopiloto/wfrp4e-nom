/**
 * Estalian Inquisidor (career item **Initiate**): when that career is embedded on an actor,
 * prompt for inquisitorial school and append that school's starting talents and skills to the
 * career item (WFRP4e career lists).
 *
 * Spec: openspec/specs/estalian-inquisidor-school-selection/spec.md
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";

/**
 * Career item `name` values that trigger the school picker (must match `nom-items`).
 * **Initiate** is the packaged title; legacy spellings kept for older embedded careers.
 */
const INQUISIDOR_CAREER_NAMES = new Set(["Initiate", "Estalian Inquisidor", "Estalian Inquisitor"]);

const SCHOOLS = {
  "san-ioan": {
    talents: ["Ambidextrous", "Combat Aware", "Strong-minded"],
    skills: ["Melee (Brawling)", "Language (Battle Tongue)"]
  },
  "san-mattheus": {
    talents: ["Lip Reading", "Rover", "Shadow"],
    skills: ["Stealth (Rural)", "Track"]
  },
  "santa-esther": {
    talents: ["Dealmaker", "Gregarious", "Schemer"],
    skills: ["Gossip", "Haggle"]
  }
};

const SCHOOL_PICK_OPTIONS = [
  { id: "san-ioan", name: "San Ioan" },
  { id: "san-mattheus", name: "San Mattheus" },
  { id: "santa-esther", name: "Santa Esther" }
];

const NAME_TO_SCHOOL_ID = Object.fromEntries(SCHOOL_PICK_OPTIONS.map((o) => [o.name, o.id]));

const processing = new Set();

/** @param {unknown} v @returns {string[]} */
function normalizeStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

/** @param {Item} careerItem @param {string} name */
function careerHasSkillName(careerItem, name) {
  const skills = normalizeStringArray(careerItem.system?.skills);
  const added = normalizeStringArray(careerItem.system?.addedSkills);
  return skills.includes(name) || added.includes(name);
}

/** @param {Item} careerItem @param {string} name @returns {Promise<boolean>} */
async function appendTalentArrayEntry(careerItem, name) {
  if (!careerItem || typeof name !== "string" || !name.trim()) return false;
  const cur = normalizeStringArray(careerItem.system?.talents);
  if (cur.includes(name)) return true;
  try {
    await careerItem.update({ "system.talents": [...cur, name] });
    return true;
  } catch (e) {
    console.warn("WFRP4e-NoM | inquisidor-school: talent update failed", e);
    return false;
  }
}

/** School skills go to addedSkills (extras alongside printed career skills). @returns {Promise<boolean>} */
async function appendAddedSkillEntry(careerItem, name) {
  if (!careerItem || typeof name !== "string" || !name.trim()) return false;
  if (careerHasSkillName(careerItem, name)) return true;
  const added = normalizeStringArray(careerItem.system?.addedSkills);
  try {
    await careerItem.update({ "system.addedSkills": [...added, name] });
    return true;
  } catch (e) {
    console.warn("WFRP4e-NoM | inquisidor-school: addedSkills update failed", e);
    return false;
  }
}

/**
 * @param {Actor} actor
 * @param {string} careerItemId
 * @param {keyof typeof SCHOOLS} schoolId
 * @returns {Promise<boolean>}
 */
async function applySchoolToCareer(actor, careerItemId, schoolId) {
  const pack = SCHOOLS[schoolId];
  if (!pack || !actor) return false;

  let ok = true;
  for (const name of pack.talents) {
    const c = actor.items.get(careerItemId);
    if (!c) {
      ok = false;
      break;
    }
    const step = await appendTalentArrayEntry(c, name);
    if (!step) ok = false;
  }
  for (const name of pack.skills) {
    const c = actor.items.get(careerItemId);
    if (!c) {
      ok = false;
      break;
    }
    const step = await appendAddedSkillEntry(c, name);
    if (!step) ok = false;
  }

  if (!ok) {
    ui.notifications.warn("Could not save all school entries on the career. See console (F12).");
    return false;
  }

  const final = actor.items.get(careerItemId);
  if (final) await final.setFlag("wfrp4e-nom", "inquisidorSchool", schoolId);
  return true;
}

function isInquisidorCareer(item) {
  return item?.type === "career" && INQUISIDOR_CAREER_NAMES.has(item.name);
}

async function showSchoolPicker(actor, careerItem) {
  const existing = careerItem.getFlag?.("wfrp4e-nom", "inquisidorSchool");
  if (existing) return;

  await new NomTalentRadioPicker({
    title: "Inquisitorial school",
    intro: "Choose your school. Three talents and two skills are added to this career.",
    width: 520,
    windowIcon: "fas fa-balance-scale",
    radioName: "inquisidorSchool",
    showManualInput: false,
    descriptors: SCHOOL_PICK_OPTIONS,
    actor,
    item: careerItem,
    cancelNotification: "No school chosen yet. Remove and re-add the career to choose again.",
    emptySelectionWarning: "Please select a school.",
    onSubmit: async (selectedName) => {
      const schoolId = NAME_TO_SCHOOL_ID[selectedName];
      if (!schoolId || !SCHOOLS[schoolId]) {
        ui.notifications.warn("Unknown school selection.");
        return;
      }
      const saved = await applySchoolToCareer(actor, careerItem.id, schoolId);
      if (saved) {
        ui.notifications.info(`School: ${selectedName} — starting skills and talents added to the career.`);
      }
    }
  }).render(true);
}

async function handleCreatedCareer(actor, item) {
  if (!actor || !item) return;
  if (!actor.isOwner) return;
  if (!isInquisidorCareer(item)) return;

  const key = `${actor.id}-${item.id}`;
  if (processing.has(key)) return;
  processing.add(key);
  await new Promise((r) => setTimeout(r, 300));
  try {
    const embedded = actor.items.get(item.id);
    if (embedded && isInquisidorCareer(embedded)) await showSchoolPicker(actor, embedded);
  } finally {
    setTimeout(() => processing.delete(key), 1000);
  }
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Inquisidor school handler initialized");
});

Hooks.on("createItem", async (item, _options, _userId) => {
  if (!item?.parent) return;
  if (item.type !== "career") return;
  await handleCreatedCareer(item.parent, item);
});

Hooks.on("createEmbeddedDocuments", async (documents, result, _options, _userId) => {
  if (!documents?.length) return;
  const firstDoc = documents[0];
  const isItem =
    firstDoc?.documentName === "Item" ||
    firstDoc?.constructor?.name === "Item" ||
    (firstDoc?.type && firstDoc?.parent);
  if (!isItem) return;

  await new Promise((r) => setTimeout(r, 300));

  for (const doc of documents) {
    if (doc.type !== "career") continue;
    let actor = doc.parent;
    let itemId = doc.id;
    if (!actor && result?.length > 0) {
      itemId = result[0]?.id || doc.id;
      for (const a of game.actors) {
        if (a.items.find((i) => i.id === itemId)) {
          actor = a;
          break;
        }
      }
    }
    if (!actor || !actor.isOwner) continue;

    const embedded = actor.items.get(itemId);
    if (embedded?.type === "career" && isInquisidorCareer(embedded)) {
      await handleCreatedCareer(actor, embedded);
    }
    break;
  }
});
