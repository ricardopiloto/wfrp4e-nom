/**
 * Kenjutsu (Style) handler
 * When the generic talent "Kenjutsu (Style)" is added to a sheet, the owner picks one of eight Ways (same pattern as Martial Artist / Mark of the Gods).
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";
import {
  appendTalentNameToCurrentCareer,
  applyForceAdvancementToTalentItemData
} from "./career-talent-registration.js";

const kenjutsuStyleProcessing = new Set();

const GENERIC_KENJUTSU_STYLE = "Kenjutsu (Style)";

/**
 * @param {string} [name]
 * @returns {boolean}
 */
function isGenericKenjutsuStyleName(name) {
  return name === GENERIC_KENJUTSU_STYLE;
}

const KENJUTSU_WAYS = [
  { id: "tortoise", name: "Way of the Tortoise" },
  { id: "crane", name: "Way of the Crane" },
  { id: "dragon", name: "Way of the Dragon" },
  { id: "tiger", name: "Way of the Tiger" },
  { id: "naga", name: "Way of the Naga" },
  { id: "snake", name: "Way of the Snake" },
  { id: "stag", name: "Way of the Stag" },
  { id: "nio", name: "Way of the Nio" }
];

const KENJUTSU_WAY_NAME_SET = new Set(KENJUTSU_WAYS.map((w) => w.name));

/**
 * Plain Way name on the sheet, or legacy `Kenjutsu (Style) (<Way Name>)`.
 * @param {string} [name]
 * @returns {boolean}
 */
function isChosenKenjutsuWaySheetName(name) {
  if (typeof name !== "string") return false;
  if (KENJUTSU_WAY_NAME_SET.has(name)) return true;
  const prefix = `${GENERIC_KENJUTSU_STYLE} (`;
  if (!name.startsWith(prefix) || !name.endsWith(")")) return false;
  const inner = name.slice(prefix.length, -1);
  return KENJUTSU_WAY_NAME_SET.has(inner);
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Kenjutsu (Style) handler initialized");
});

/**
 * @param {Actor} actor
 * @param {Item} genericItem
 * @param {string} wayName Exact Way label (sheet item name after choice)
 */
async function applyKenjutsuWay(actor, genericItem, wayName) {
  try {
    let replacementTalent = game.items.find((i) => i.name === wayName && i.type === "talent");
    if (!replacementTalent) {
      for (const pack of game.packs) {
        if (pack.documentName === "Item" && pack.indexed) {
          const entry = pack.index.find((e) => e.name === wayName);
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
      const baseData = genericItem.toObject();
      baseData.name = wayName;
      if (baseData.effects) delete baseData.effects;
      applyForceAdvancementToTalentItemData(baseData);
      await actor.deleteEmbeddedDocuments("Item", [genericItem.id]);
      const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
      if (createdItems.length > 0 && genericItem.effects?.size > 0) {
        const createdItem = createdItems[0];
        const effectsToCreate = genericItem.effects.map((effect) => {
          const effectData = effect.toObject();
          delete effectData._id;
          if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
          return effectData;
        });
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | Kenjutsu (Style): error copying effects", e);
        }
      }
      if (createdItems.length > 0) await appendTalentNameToCurrentCareer(actor, createdItems[0].name);
      ui.notifications.info(`Kenjutsu way "${wayName}" added.`);
      return;
    }

    await actor.deleteEmbeddedDocuments("Item", [genericItem.id]);
    const talentData = replacementTalent.toObject();
    talentData.name = wayName;
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
      if (genericItem.effects?.size > 0) {
        genericItem.effects.forEach((effect) => {
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
          console.warn("WFRP4e-NoM | Kenjutsu (Style): error adding effects", e);
        }
      }
      await appendTalentNameToCurrentCareer(actor, createdItems[0].name);
    }
    ui.notifications.info(`Kenjutsu way "${wayName}" added successfully!`);
  } catch (error) {
    console.error("WFRP4e-NoM | Kenjutsu (Style) replacement error:", error);
    ui.notifications.error("Error replacing Kenjutsu (Style). See console.");
  }
}

/**
 * @param {Actor} actor
 * @param {Item} genericItem
 */
async function showKenjutsuStyleDialog(actor, genericItem) {
  await new NomTalentRadioPicker({
    title: "Kenjutsu (Style)",
    intro: "Select a Kenjutsu way.",
    width: 520,
    windowIcon: "fas fa-khanda",
    radioName: "kenjutsuWay",
    showManualInput: false,
    descriptors: KENJUTSU_WAYS,
    actor,
    item: genericItem,
    cancelNotification: "Selection cancelled. Kenjutsu (Style) remains on the sheet.",
    emptySelectionWarning: "Please select a way.",
    onSubmit: async (wayName) => {
      await applyKenjutsuWay(actor, genericItem, wayName);
    }
  }).render(true);
}

Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  const actor = item.parent;
  const isTalentType = item.type === "talent" || item.type === "skill" || item.type === "trait";
  if (isChosenKenjutsuWaySheetName(item.name)) return;
  const isGeneric = isGenericKenjutsuStyleName(item.name);
  const itemKey = `${actor.id}-${item.id}`;
  if (kenjutsuStyleProcessing.has(itemKey)) return;
  if (isTalentType && isGeneric && actor.isOwner) {
    kenjutsuStyleProcessing.add(itemKey);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await showKenjutsuStyleDialog(actor, item);
    } finally {
      setTimeout(() => kenjutsuStyleProcessing.delete(itemKey), 1000);
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
    if (isChosenKenjutsuWaySheetName(doc.name)) continue;
    const isGeneric = isGenericKenjutsuStyleName(doc.name);
    const itemKey = `${actor?.id}-${itemId}`;
    if (kenjutsuStyleProcessing.has(itemKey)) continue;
    if (isTalentType && isGeneric && actor) {
      if (!actor.isOwner) continue;
      const item = actor.items.find((i) => i.id === itemId);
      if (item) {
        kenjutsuStyleProcessing.add(itemKey);
        try {
          await showKenjutsuStyleDialog(actor, item);
        } finally {
          setTimeout(() => kenjutsuStyleProcessing.delete(itemKey), 1000);
        }
      } else {
        await new Promise((r) => setTimeout(r, 200));
        const retryItem = actor.items.find((i) => i.id === itemId || isGenericKenjutsuStyleName(i.name));
        if (retryItem) await showKenjutsuStyleDialog(actor, retryItem);
      }
      break;
    }
  }
});
