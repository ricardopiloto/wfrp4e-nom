/**
 * Mark of the Gods handler
 * When the generic talent "Mark of the Gods" is added to a sheet, the owner picks one of five Chaos marks (ApplicationV2 UI).
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";

const markOfTheGodsProcessing = new Set();

/**
 * @param {string} [name]
 * @returns {boolean}
 */
function isGenericMarkOfTheGodsName(name) {
  return name === "Mark of the Gods";
}

const GOD_MARKS = [
  { id: "hound", name: "The Hound (Khorne)" },
  { id: "crow", name: "The Crow (Nurgle)" },
  { id: "serpent", name: "The Serpent (Slaanesh)" },
  { id: "eagle", name: "The Eagle (Tzeentch)" },
  { id: "undivided", name: "The Eight-Pointed Star (Undivided)" }
];

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Mark of the Gods handler initialized");
});

/**
 * @param {Actor} actor
 * @param {Item} markItem
 * @param {string} markName Exact mark label (sheet item name after choice)
 */
async function replaceMarkOnActor(actor, markItem, markName) {
  try {
    let replacementTalent = game.items.find((i) => i.name === markName && i.type === "talent");
    if (!replacementTalent) {
      for (const pack of game.packs) {
        if (pack.documentName === "Item" && pack.indexed) {
          const entry = pack.index.find((e) => e.name === markName);
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
      const baseData = markItem.toObject();
      baseData.name = markName;
      if (baseData.effects) delete baseData.effects;
      await actor.deleteEmbeddedDocuments("Item", [markItem.id]);
      const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
      if (createdItems.length > 0 && markItem.effects?.size > 0) {
        const createdItem = createdItems[0];
        const effectsToCreate = markItem.effects.map((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          return effectData;
        });
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | Mark of the Gods: error copying effects", e);
        }
      }
      ui.notifications.info(`Mark "${markName}" added.`);
      return;
    }

    await actor.deleteEmbeddedDocuments("Item", [markItem.id]);
    const talentData = replacementTalent.toObject();
    talentData.name = markName;
    if (talentData.effects) delete talentData.effects;
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
      if (markItem.effects?.size > 0) {
        markItem.effects.forEach((effect) => {
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
          console.warn("WFRP4e-NoM | Mark of the Gods: error adding effects", e);
        }
      }
    }
    ui.notifications.info(`Mark "${markName}" added successfully!`);
  } catch (error) {
    console.error("WFRP4e-NoM | Mark of the Gods replacement error:", error);
    ui.notifications.error("Error replacing Mark of the Gods. See console.");
  }
}

/**
 * @param {Actor} actor
 * @param {Item} markItem
 */
async function showMarkOfTheGodsDialog(actor, markItem) {
  await new NomTalentRadioPicker({
    title: "Mark of the Gods",
    intro: "Select a Chaos mark.",
    width: 520,
    windowIcon: "fas fa-moon",
    radioName: "mogMark",
    showManualInput: false,
    descriptors: GOD_MARKS,
    actor,
    item: markItem,
    cancelNotification: "Selection cancelled. Mark of the Gods remains on the sheet.",
    emptySelectionWarning: "Please select a mark.",
    onSubmit: async (markName) => {
      await replaceMarkOnActor(actor, markItem, markName);
    }
  }).render(true);
}

Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  const actor = item.parent;
  const isTalentType = item.type === "talent" || item.type === "skill" || item.type === "trait";
  const isMark = isGenericMarkOfTheGodsName(item.name);
  const itemKey = `${actor.id}-${item.id}`;
  if (markOfTheGodsProcessing.has(itemKey)) return;
  if (isTalentType && isMark && actor.isOwner) {
    markOfTheGodsProcessing.add(itemKey);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await showMarkOfTheGodsDialog(actor, item);
    } finally {
      setTimeout(() => markOfTheGodsProcessing.delete(itemKey), 1000);
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
    const isMark = isGenericMarkOfTheGodsName(doc.name);
    const itemKey = `${actor?.id}-${itemId}`;
    if (markOfTheGodsProcessing.has(itemKey)) continue;
    if (isTalentType && isMark && actor) {
      if (!actor.isOwner) continue;
      const item = actor.items.find((i) => i.id === itemId);
      if (item) {
        markOfTheGodsProcessing.add(itemKey);
        try {
          await showMarkOfTheGodsDialog(actor, item);
        } finally {
          setTimeout(() => markOfTheGodsProcessing.delete(itemKey), 1000);
        }
      } else {
        await new Promise((r) => setTimeout(r, 200));
        const retryItem = actor.items.find((i) => i.id === itemId || isGenericMarkOfTheGodsName(i.name));
        if (retryItem) await showMarkOfTheGodsDialog(actor, retryItem);
      }
      break;
    }
  }
});
