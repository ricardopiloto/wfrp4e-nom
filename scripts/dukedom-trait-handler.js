/**
 * Dukedom Trait (Any): when the generic talent is embedded on an owned actor,
 * prompt for Bretonnian dukedom → optional OR talent choice → grant Core talent
 * package + optional Human Random Talents roll; set resolved flag.
 *
 * Spec: specs/009-dukedom-trait-selection/ / openspec/changes/add-dukedom-trait-selection/
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";

const GENERIC_NAMES = new Set(["Dukedom Trait (Any)", "Dukedom Trait"]);
const ITEM_TYPES = new Set(["talent", "trait"]);
const RESOLVED_FLAG = "dukedomTraitResolved";
const MODULE_ID = "wfrp4e-nom";

/**
 * @typedef {{ id: string, name: string, fixedTalents: string[], choiceTalents: string[], randomTalents: boolean }} DukedomPackage
 */

/** @type {DukedomPackage[]} */
const DUKEDOMS = [
  {
    id: "l-anguille",
    name: "L'Anguille",
    fixedTalents: [],
    choiceTalents: ["Dealmaker", "Old Salt"],
    randomTalents: true
  },
  {
    id: "aquitaine",
    name: "Aquitaine",
    fixedTalents: ["Coolheaded"],
    choiceTalents: [],
    randomTalents: true
  },
  {
    id: "artois",
    name: "Artois",
    fixedTalents: ["Hatred (Beastmen)"],
    choiceTalents: ["Very Resilient", "Very Strong"],
    randomTalents: false
  },
  {
    id: "bastonne",
    name: "Bastonne",
    fixedTalents: ["Stout-hearted"],
    choiceTalents: [],
    randomTalents: true
  },
  {
    id: "bordeleaux",
    name: "Bordeleaux",
    fixedTalents: [],
    choiceTalents: ["Carouser", "Sea Legs"],
    randomTalents: true
  },
  {
    id: "brionne",
    name: "Brionne",
    fixedTalents: [],
    choiceTalents: ["Artistic", "Perfect Pitch"],
    randomTalents: true
  },
  {
    id: "carcassonne",
    name: "Carcassonne",
    fixedTalents: ["Warrior Born"],
    choiceTalents: [],
    randomTalents: true
  },
  {
    id: "couronne",
    name: "Couronne",
    fixedTalents: [],
    choiceTalents: ["Craftsman (Farrier)", "Trick Riding"],
    randomTalents: true
  },
  {
    id: "gisoreux",
    name: "Gisoreux",
    fixedTalents: [],
    choiceTalents: ["Seasoned Traveller", "Strider (Mountains)"],
    randomTalents: true
  },
  {
    id: "lyonesse",
    name: "Lyonesse",
    fixedTalents: [],
    choiceTalents: ["Cat-tongued", "Schemer"],
    randomTalents: true
  },
  {
    id: "montfort",
    name: "Montfort",
    fixedTalents: ["Hardy"],
    choiceTalents: [],
    randomTalents: true
  },
  {
    id: "mousillon",
    name: "Mousillon",
    fixedTalents: ["Strong-minded"],
    choiceTalents: [],
    randomTalents: true
  },
  {
    id: "parravon",
    name: "Parravon",
    fixedTalents: [],
    choiceTalents: ["Animal Affinity", "Sixth Sense"],
    randomTalents: true
  },
  {
    id: "quenelles",
    name: "Quenelles",
    fixedTalents: ["Hatred (Greenskins)"],
    choiceTalents: [],
    randomTalents: true
  }
];

const DUKEDOM_BY_NAME = Object.fromEntries(DUKEDOMS.map((d) => [d.name, d]));
const DUKEDOM_PICK_OPTIONS = DUKEDOMS.map((d) => ({ id: d.id, name: d.name }));

const processing = new Set();

function isGenericDukedomTraitName(name) {
  return typeof name === "string" && GENERIC_NAMES.has(name);
}

function isDukedomTraitResolved(actor) {
  return Boolean(actor?.getFlag?.(MODULE_ID, RESOLVED_FLAG));
}

async function setDukedomTraitResolved(actor) {
  if (!actor) return;
  await actor.setFlag(MODULE_ID, RESOLVED_FLAG, true);
}

function actorHasTalentName(actor, name) {
  if (!actor || typeof name !== "string") return false;
  return actor.items.some((i) => ITEM_TYPES.has(i.type) && i.name === name);
}

async function findTalentByExactName(name) {
  let talent = game.items.find((i) => i.name === name && i.type === "talent");
  if (talent) return talent;

  for (const pack of game.packs) {
    if (pack.documentName !== "Item" || !pack.indexed) continue;
    const entry = pack.index.find((e) => e.name === name);
    if (!entry) continue;
    const item = await pack.getDocument(entry._id);
    if (item?.type === "talent") return item;
  }
  return null;
}

/**
 * @param {Actor} actor
 * @param {string} name
 * @returns {Promise<boolean>} true if present or created
 */
async function createTalentOnActorIfMissing(actor, name) {
  if (!actor || typeof name !== "string" || !name.trim()) return false;
  if (actorHasTalentName(actor, name)) return true;

  const source = await findTalentByExactName(name);
  if (!source) {
    ui.notifications.warn(`Could not find talent "${name}" in world/compendia.`);
    console.warn("WFRP4e-NoM | dukedom-trait: missing talent", name);
    return false;
  }

  const data = source.toObject();
  delete data._id;
  data.name = name;
  if (data.effects) delete data.effects;

  try {
    const created = await actor.createEmbeddedDocuments("Item", [data]);
    const item = created?.[0];
    if (item && source.effects?.size > 0) {
      const effects = source.effects.map((e) => {
        const o = e.toObject();
        delete o._id;
        return o;
      });
      try {
        await item.createEmbeddedDocuments("ActiveEffect", effects);
      } catch (err) {
        console.warn("WFRP4e-NoM | dukedom-trait: effect copy failed", err);
      }
    }
    return true;
  } catch (e) {
    console.warn("WFRP4e-NoM | dukedom-trait: create talent failed", name, e);
    return false;
  }
}

function findTalentsRollTable() {
  const keyed = game.tables.filter((t) => t.getFlag("wfrp4e", "key") === "talents");
  if (keyed.length === 1) return keyed[0];
  if (keyed.length > 1) return keyed[0];
  return (
    game.tables.find((t) => t.name?.toLowerCase().includes("talent") && t.getFlag("wfrp4e", "key")) ||
    null
  );
}

function talentNamesOnTable(table) {
  if (!table?.results) return [];
  const names = [];
  for (const r of table.results) {
    const text = (r.text || r.name || "").trim();
    if (text) names.push(text);
  }
  return [...new Set(names)];
}

function parseRollTalentName(rollResult) {
  if (!rollResult || typeof rollResult === "string") return null;
  if (typeof rollResult.text === "string" && rollResult.text.trim()) return rollResult.text.trim();
  if (rollResult.object?.name) return String(rollResult.object.name).trim();
  if (rollResult.result?.text) return String(rollResult.result.text).trim();
  return null;
}

/**
 * @param {Actor} actor
 * @returns {Promise<string|null>} granted talent name, or null if skipped/exhausted/failed
 */
async function grantRandomTalent(actor) {
  if (!game.wfrp4e?.tables?.rollTable) {
    ui.notifications.warn("Random Talents table API unavailable. Apply a random talent manually.");
    return null;
  }

  const table = findTalentsRollTable();
  const tableNames = talentNamesOnTable(table);
  const unused = tableNames.filter((n) => !actorHasTalentName(actor, n));
  if (tableNames.length > 0 && unused.length === 0) {
    ui.notifications.info(
      "No unused Random Talents remain on the table. Dukedom package completed without a random talent."
    );
    return null;
  }

  const maxAttempts = Math.max(tableNames.length * 2, 40);
  for (let i = 0; i < maxAttempts; i++) {
    let rollResult;
    try {
      rollResult = await game.wfrp4e.tables.rollTable("talents", { showRoll: true });
    } catch (e) {
      console.warn("WFRP4e-NoM | dukedom-trait: rollTable failed", e);
      ui.notifications.warn("Could not roll Random Talents. Apply one manually if needed.");
      return null;
    }

    if (rollResult === undefined || rollResult === false) {
      ui.notifications.warn("Could not find Random Talents table 'talents'. Apply one manually if needed.");
      return null;
    }

    const name = parseRollTalentName(rollResult);
    if (!name) {
      ui.notifications.warn("Random Talents roll returned no talent name.");
      return null;
    }

    ui.notifications.info(`Random Talents: ${name}`);

    if (actorHasTalentName(actor, name)) {
      const stillUnused = tableNames.filter((n) => !actorHasTalentName(actor, n));
      if (tableNames.length > 0 && stillUnused.length === 0) {
        ui.notifications.info(
          "No unused Random Talents remain on the table. Dukedom package completed without a random talent."
        );
        return null;
      }
      continue;
    }

    const ok = await createTalentOnActorIfMissing(actor, name);
    return ok ? name : null;
  }

  ui.notifications.info(
    "No unused Random Talents remain on the table. Dukedom package completed without a random talent."
  );
  return null;
}

/**
 * @param {Actor} actor
 * @param {Item} genericItem
 * @param {DukedomPackage} dukedom
 * @param {string|null} chosenTalent
 */
async function applyDukedomPackage(actor, genericItem, dukedom, chosenTalent) {
  if (!actor || !dukedom) return;

  const toGrant = [...dukedom.fixedTalents];
  if (chosenTalent) toGrant.push(chosenTalent);

  const genericId = genericItem?.id;
  if (genericId && actor.items.has(genericId)) {
    try {
      await actor.deleteEmbeddedDocuments("Item", [genericId]);
    } catch (e) {
      console.warn("WFRP4e-NoM | dukedom-trait: failed to delete generic", e);
    }
  }

  for (const name of toGrant) {
    await createTalentOnActorIfMissing(actor, name);
  }

  if (dukedom.randomTalents) {
    await grantRandomTalent(actor);
  }

  await setDukedomTraitResolved(actor);
  ui.notifications.info(`Dukedom Trait applied (${dukedom.name}).`);
}

/**
 * @param {Actor} actor
 * @param {Item} genericItem
 * @param {DukedomPackage} dukedom
 */
async function showOrPickerThenApply(actor, genericItem, dukedom) {
  const choiceDescriptors = dukedom.choiceTalents.map((name, idx) => ({
    id: `choice-${idx}`,
    name
  }));

  await new NomTalentRadioPicker({
    title: `Dukedom Trait — ${dukedom.name}`,
    intro: `Choose one talent for ${dukedom.name}.`,
    width: 520,
    windowIcon: "fas fa-map-marked-alt",
    radioName: "dukedomOrTalent",
    showManualInput: false,
    descriptors: choiceDescriptors,
    actor,
    item: genericItem,
    cancelNotification: "Selection cancelled. Dukedom Trait (Any) remains on the sheet.",
    emptySelectionWarning: "Please select a talent.",
    onSubmit: async (selectedName) => {
      if (!dukedom.choiceTalents.includes(selectedName)) {
        ui.notifications.warn("Unknown talent selection.");
        return;
      }
      await applyDukedomPackage(actor, genericItem, dukedom, selectedName);
    }
  }).render(true);
}

/**
 * @param {Actor} actor
 * @param {Item} genericItem
 */
async function showDukedomPicker(actor, genericItem) {
  await new NomTalentRadioPicker({
    title: "Dukedom Trait",
    intro: "Select the Bretonnian dukedom your character belongs to.",
    width: 560,
    windowIcon: "fas fa-map",
    radioName: "dukedomRegion",
    showManualInput: false,
    descriptors: DUKEDOM_PICK_OPTIONS,
    actor,
    item: genericItem,
    cancelNotification: "Selection cancelled. Dukedom Trait (Any) remains on the sheet.",
    emptySelectionWarning: "Please select a dukedom.",
    onSubmit: async (selectedName) => {
      const dukedom = DUKEDOM_BY_NAME[selectedName];
      if (!dukedom) {
        ui.notifications.warn("Unknown dukedom selection.");
        return;
      }
      if (dukedom.choiceTalents.length === 2) {
        await showOrPickerThenApply(actor, genericItem, dukedom);
        return;
      }
      await applyDukedomPackage(actor, genericItem, dukedom, null);
    }
  }).render(true);
}

/**
 * @param {Actor} actor
 * @param {Item} item
 */
async function handleCreatedItem(actor, item) {
  if (!actor || !item) return;
  if (!actor.isOwner) return;
  if (!ITEM_TYPES.has(item.type)) return;
  if (!isGenericDukedomTraitName(item.name)) return;

  const key = `${actor.id}-${item.id}`;
  if (processing.has(key)) return;
  processing.add(key);
  await new Promise((r) => setTimeout(r, 300));

  try {
    const embedded = actor.items.get(item.id);
    if (!embedded || !isGenericDukedomTraitName(embedded.name)) return;

    if (isDukedomTraitResolved(actor)) {
      ui.notifications.info("Dukedom Trait was already resolved for this character.");
      try {
        await actor.deleteEmbeddedDocuments("Item", [embedded.id]);
      } catch (e) {
        console.warn("WFRP4e-NoM | dukedom-trait: failed to delete duplicate generic", e);
      }
      return;
    }

    await showDukedomPicker(actor, embedded);
  } finally {
    setTimeout(() => processing.delete(key), 1000);
  }
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Dukedom Trait handler initialized");
});

Hooks.on("createItem", async (item, _options, _userId) => {
  if (!item?.parent) return;
  if (!ITEM_TYPES.has(item.type)) return;
  await handleCreatedItem(item.parent, item);
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
    if (!ITEM_TYPES.has(doc.type)) continue;
    if (!isGenericDukedomTraitName(doc.name)) continue;

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
    if (embedded) await handleCreatedItem(actor, embedded);
  }
});
