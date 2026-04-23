/**
 * Grail Virtue handler
 * When the generic talent "Grail Virtue" is added to a sheet, the owner picks one of fourteen Grail virtues (ApplicationV2 UI).
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";

const grailVirtueProcessing = new Set();

/**
 * @param {string} [name]
 * @returns {boolean}
 */
function isGenericGrailVirtueName(name) {
  return name === "Grail Virtue";
}

const GRAIL_VIRTUES = [
  { id: "grail-audacity", name: "Grail Virtue of Audacity" },
  { id: "grail-confidence", name: "Grail Virtue of Confidence" },
  { id: "grail-discipline", name: "Grail Virtue of Discipline" },
  { id: "grail-duty", name: "Grail Virtue of Duty" },
  { id: "grail-empathy", name: "Grail Virtue of Empathy" },
  { id: "grail-heroism", name: "Grail Virtue of Heroism" },
  { id: "grail-ideal", name: "Grail Virtue of Ideal" },
  { id: "grail-impetuous-knight", name: "Grail Virtue of the Impetuous Knight" },
  { id: "grail-joust", name: "Grail Virtue of the Joust" },
  { id: "grail-knightly-temper", name: "Grail Virtue of Knightly Temper" },
  { id: "grail-noble-disdain", name: "Grail Virtue of Noble Disdain" },
  { id: "grail-penitent", name: "Grail Virtue of the Penitent" },
  { id: "grail-purity", name: "Grail Virtue of Purity" },
  { id: "grail-stoicism", name: "Grail Virtue of Stoicism" }
];

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Grail Virtue handler initialized");
});

/**
 * @param {Actor} actor
 * @param {Item} grailItem
 * @param {string} virtueName Exact talent name on the sheet after choice
 */
async function replaceGrailVirtueOnActor(actor, grailItem, virtueName) {
  try {
    let replacementTalent = game.items.find((i) => i.name === virtueName && i.type === "talent");
    if (!replacementTalent) {
      for (const pack of game.packs) {
        if (pack.documentName === "Item" && pack.indexed) {
          const entry = pack.index.find((e) => e.name === virtueName);
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
      const baseData = grailItem.toObject();
      baseData.name = virtueName;
      if (baseData.effects) delete baseData.effects;
      await actor.deleteEmbeddedDocuments("Item", [grailItem.id]);
      const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
      if (createdItems.length > 0 && grailItem.effects?.size > 0) {
        const createdItem = createdItems[0];
        const effectsToCreate = grailItem.effects.map((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          return effectData;
        });
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | Grail Virtue: error copying effects", e);
        }
      }
      ui.notifications.info(`Grail virtue "${virtueName}" added.`);
      return;
    }

    await actor.deleteEmbeddedDocuments("Item", [grailItem.id]);
    const talentData = replacementTalent.toObject();
    talentData.name = virtueName;
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
      if (grailItem.effects?.size > 0) {
        grailItem.effects.forEach((effect) => {
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
          console.warn("WFRP4e-NoM | Grail Virtue: error adding effects", e);
        }
      }
    }
    ui.notifications.info(`Grail virtue "${virtueName}" added successfully!`);
  } catch (error) {
    console.error("WFRP4e-NoM | Grail Virtue replacement error:", error);
    ui.notifications.error("Error replacing Grail Virtue. See console.");
  }
}

/**
 * @param {Actor} actor
 * @param {Item} grailItem
 */
async function showGrailVirtueDialog(actor, grailItem) {
  await new NomTalentRadioPicker({
    title: "Choice of Grail Virtue",
    intro: "Select a Grail virtue, or enter a talent name manually if needed.",
    width: 560,
    windowIcon: "fas fa-church",
    radioName: "grailVirtue",
    showManualInput: true,
    manualLabel: "Or enter manually:",
    manualPlaceholder: "Enter Grail virtue talent name manually...",
    descriptors: GRAIL_VIRTUES,
    actor,
    item: grailItem,
    cancelNotification: "Selection cancelled. Grail Virtue remains on the sheet.",
    emptySelectionWarning: "Please select a Grail virtue or enter one manually.",
    onSubmit: async (virtueName) => {
      await replaceGrailVirtueOnActor(actor, grailItem, virtueName);
    }
  }).render(true);
}

Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  const actor = item.parent;
  const isTalentType = item.type === "talent" || item.type === "skill" || item.type === "trait";
  const isGrail = isGenericGrailVirtueName(item.name);
  const itemKey = `${actor.id}-${item.id}`;
  if (grailVirtueProcessing.has(itemKey)) return;
  if (isTalentType && isGrail && actor.isOwner) {
    grailVirtueProcessing.add(itemKey);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await showGrailVirtueDialog(actor, item);
    } finally {
      setTimeout(() => grailVirtueProcessing.delete(itemKey), 1000);
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
    const isGrail = isGenericGrailVirtueName(doc.name);
    const itemKey = `${actor?.id}-${itemId}`;
    if (grailVirtueProcessing.has(itemKey)) continue;
    if (isTalentType && isGrail && actor) {
      if (!actor.isOwner) continue;
      const item = actor.items.find((i) => i.id === itemId);
      if (item) {
        grailVirtueProcessing.add(itemKey);
        try {
          await showGrailVirtueDialog(actor, item);
        } finally {
          setTimeout(() => grailVirtueProcessing.delete(itemKey), 1000);
        }
      } else {
        await new Promise((r) => setTimeout(r, 200));
        const retryItem = actor.items.find((i) => i.id === itemId || isGenericGrailVirtueName(i.name));
        if (retryItem) await showGrailVirtueDialog(actor, retryItem);
      }
      break;
    }
  }
});
