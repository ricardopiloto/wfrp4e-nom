/**
 * Martial Artist handler
 * When a generic Martial Artist talent is added to a sheet (`Martial Artist` or `Martial Artist (Path)`), the owner picks one of eight paths.
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";
import {
  appendTalentNameToCurrentCareer,
  applyForceAdvancementToTalentItemData
} from "./career-talent-registration.js";

const martialArtistProcessing = new Set();

/**
 * @param {string} [name]
 * @returns {boolean}
 */
function isGenericMartialArtistName(name) {
  return name === "Martial Artist" || name === "Martial Artist (Path)";
}

const MARTIAL_PATHS = [
  { id: "flame", name: "Path of the Flame" },
  { id: "iron", name: "Path of Iron" },
  { id: "shadows", name: "Path of Shadows" },
  { id: "beast", name: "Path of the Beast" },
  { id: "heavens", name: "Path of the Heavens" },
  { id: "light", name: "Path of Light" },
  { id: "life", name: "Path of Life" },
  { id: "death", name: "Path of Death" }
];

const MARTIAL_PATH_NAME_SET = new Set(MARTIAL_PATHS.map((p) => p.name));

/**
 * Plain path name on the sheet, or legacy `Martial Artist (<path>)` from older sheets.
 * @param {string} [name]
 * @returns {boolean}
 */
function isChosenMartialPathSheetName(name) {
  if (typeof name !== "string") return false;
  if (MARTIAL_PATH_NAME_SET.has(name)) return true;
  const prefix = "Martial Artist (";
  if (!name.startsWith(prefix) || !name.endsWith(")")) return false;
  const inner = name.slice(prefix.length, -1);
  return MARTIAL_PATH_NAME_SET.has(inner);
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Martial Artist handler initialized");
});

/**
 * @param {Actor} actor
 * @param {Item} martialArtistItem
 */
async function applyMartialArtistPath(actor, martialArtistItem, pathName) {
  try {
    let replacementTalent = game.items.find((i) => i.name === pathName && i.type === "talent");
    if (!replacementTalent) {
      for (const pack of game.packs) {
        if (pack.documentName === "Item" && pack.indexed) {
          const entry = pack.index.find((e) => e.name === pathName);
          if (entry) {
            const item = await pack.getDocument(entry._id);
            if (item?.type === "talent") {
              replacementTalent = item;
              break;
            }
          }
        }
      }
    }

    if (!replacementTalent) {
      const baseData = martialArtistItem.toObject();
      baseData.name = pathName;
      if (baseData.effects) delete baseData.effects;
      applyForceAdvancementToTalentItemData(baseData);
      await actor.deleteEmbeddedDocuments("Item", [martialArtistItem.id]);
      const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
      if (createdItems.length > 0 && martialArtistItem.effects?.size > 0) {
        const createdItem = createdItems[0];
        const effectsToCreate = martialArtistItem.effects.map((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          return effectData;
        });
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | Martial Artist: error copying effects", e);
        }
      }
      if (createdItems.length > 0) await appendTalentNameToCurrentCareer(actor, createdItems[0].name);
      ui.notifications.info(`Martial path "${pathName}" added.`);
      return;
    }

    await actor.deleteEmbeddedDocuments("Item", [martialArtistItem.id]);
    const talentData = replacementTalent.toObject();
    talentData.name = pathName;
    if (talentData.effects) delete talentData.effects;
    applyForceAdvancementToTalentItemData(talentData);
    const createdItems = await actor.createEmbeddedDocuments("Item", [talentData]);
    if (createdItems.length > 0) {
      const createdItem = createdItems[0];
      const effectsToCreate = [];
      if (replacementTalent.effects?.size > 0) {
        replacementTalent.effects.forEach((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          effectsToCreate.push(effectData);
        });
      }
      if (martialArtistItem.effects?.size > 0) {
        martialArtistItem.effects.forEach((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          effectsToCreate.push(effectData);
        });
      }
      if (effectsToCreate.length > 0) {
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | Martial Artist: error adding effects", e);
        }
      }
      await appendTalentNameToCurrentCareer(actor, createdItems[0].name);
    }
    ui.notifications.info(`Martial path "${pathName}" added successfully!`);
  } catch (error) {
    console.error("WFRP4e-NoM | Martial Artist replacement error:", error);
    ui.notifications.error("Error replacing Martial Artist. See console.");
  }
}

async function showMartialArtistDialog(actor, martialArtistItem) {
  await new NomTalentRadioPicker({
    title: "Choice of Martial Path",
    intro: "Select a martial path for Martial Artist.",
    width: 520,
    windowIcon: "fas fa-fist-raised",
    radioName: "maPath",
    showManualInput: false,
    descriptors: MARTIAL_PATHS,
    actor,
    item: martialArtistItem,
    cancelNotification: "Selection cancelled. Martial Artist remains on the sheet.",
    emptySelectionWarning: "Please select a martial path.",
    onSubmit: async (pathName) => {
      await applyMartialArtistPath(actor, martialArtistItem, pathName);
    }
  }).render(true);
}


Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  const actor = item.parent;
  const isTalentType = item.type === "talent" || item.type === "skill" || item.type === "trait";
  if (isChosenMartialPathSheetName(item.name)) return;
  const isMartialArtist = isGenericMartialArtistName(item.name);
  const itemKey = `${actor.id}-${item.id}`;
  if (martialArtistProcessing.has(itemKey)) return;
  if (isTalentType && isMartialArtist && actor.isOwner) {
    martialArtistProcessing.add(itemKey);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await showMartialArtistDialog(actor, item);
    } finally {
      setTimeout(() => martialArtistProcessing.delete(itemKey), 1000);
    }
  }
});

Hooks.on("createEmbeddedDocuments", async (documents, result, options, userId) => {
  if (!documents?.length) return;
  const firstDoc = documents[0];
  const isItem =
    firstDoc?.documentName === "Item" ||
    firstDoc?.constructor?.name === "Item" ||
    (firstDoc?.type && firstDoc?.parent);
  if (!isItem) return;

  await new Promise((r) => setTimeout(r, 300));

  for (const doc of documents) {
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
    const isTalentType = doc.type === "talent" || doc.type === "skill" || doc.type === "trait";
    if (isChosenMartialPathSheetName(doc.name)) continue;
    const isMartialArtist = isGenericMartialArtistName(doc.name);
    const itemKey = `${actor?.id}-${itemId}`;
    if (martialArtistProcessing.has(itemKey)) continue;
    if (isTalentType && isMartialArtist && actor) {
      if (!actor.isOwner) continue;
      const item = actor.items.find((i) => i.id === itemId);
      if (item) {
        martialArtistProcessing.add(itemKey);
        try {
          await showMartialArtistDialog(actor, item);
        } finally {
          setTimeout(() => martialArtistProcessing.delete(itemKey), 1000);
        }
      } else {
        await new Promise((r) => setTimeout(r, 200));
        const retryItem = actor.items.find((i) => i.id === itemId || isGenericMartialArtistName(i.name));
        if (retryItem) await showMartialArtistDialog(actor, retryItem);
      }
      break;
    }
  }
});
