/**
 * Shared handler for "generic talent -> picker -> replace on sheet" flows.
 *
 * Targets:
 * - Mark of the Gods
 * - Martial Artist
 * - Grail Virtue
 * - Knightly Virtue (selection only; auxiliary mechanics remain elsewhere)
 * - Kenjutsu (Style)
 */

import { NomTalentRadioPicker } from "./talent-option-picker-app.js";
import {
  appendTalentNameToCurrentCareer,
  applyForceAdvancementToTalentItemData
} from "./career-talent-registration.js";

const processing = new Set();

const ITEM_TYPES = new Set(["talent", "skill", "trait"]);

const GENERIC_NAMES = {
  markOfTheGods: ["Mark of the Gods"],
  martialArtist: ["Martial Artist", "Martial Artist (Path)"],
  grailVirtue: ["Grail Virtue"],
  knightlyVirtue: ["Knightly Virtue", "Virtue of Knighthood"],
  kenjutsuStyle: ["Kenjutsu (Style)"]
};

const GOD_MARKS = [
  { id: "hound", name: "The Hound (Khorne)" },
  { id: "crow", name: "The Crow (Nurgle)" },
  { id: "serpent", name: "The Serpent (Slaanesh)" },
  { id: "eagle", name: "The Eagle (Tzeentch)" },
  { id: "undivided", name: "The Eight-Pointed Star (Undivided)" }
];

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

const KNIGHTLY_VIRTUES = [
  { id: "audacity", name: "Virtue of Audacity" },
  { id: "confidence", name: "Virtue of Confidence" },
  { id: "discipline", name: "Virtue of Discipline" },
  { id: "duty", name: "Virtue of Duty" },
  { id: "empathy", name: "Virtue of Empathy" },
  { id: "heroism", name: "Virtue of Heroism" },
  { id: "ideal", name: "Virtue of Ideal" },
  { id: "impetuous-knight", name: "Virtue of Impetuous Knight" },
  { id: "joust", name: "Virtue of the Joust" },
  { id: "knight-temper", name: "Virtue of Knight Temper" },
  { id: "noble-disdain", name: "Virtue of Noble Disdain" },
  { id: "penitent", name: "Virtue of the Penitent" },
  { id: "purity", name: "Virtue of Purity" },
  { id: "stoicism", name: "Virtue of Stoicism" }
];

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

const MARTIAL_PATH_NAME_SET = new Set(MARTIAL_PATHS.map((p) => p.name));
const KENJUTSU_WAY_NAME_SET = new Set(KENJUTSU_WAYS.map((w) => w.name));

function isChosenMartialPathSheetName(name) {
  if (typeof name !== "string") return false;
  if (MARTIAL_PATH_NAME_SET.has(name)) return true;
  const prefix = "Martial Artist (";
  if (!name.startsWith(prefix) || !name.endsWith(")")) return false;
  const inner = name.slice(prefix.length, -1);
  return MARTIAL_PATH_NAME_SET.has(inner);
}

function isChosenKenjutsuWaySheetName(name) {
  if (typeof name !== "string") return false;
  if (KENJUTSU_WAY_NAME_SET.has(name)) return true;
  const prefix = "Kenjutsu (Style) (";
  if (!name.startsWith(prefix) || !name.endsWith(")")) return false;
  const inner = name.slice(prefix.length, -1);
  return KENJUTSU_WAY_NAME_SET.has(inner);
}

function shouldIgnoreAsAlreadyChosen(flowId, itemName) {
  if (flowId === "martialArtist") return isChosenMartialPathSheetName(itemName);
  if (flowId === "kenjutsuStyle") return isChosenKenjutsuWaySheetName(itemName);
  return false;
}

async function findTalentByExactName(name) {
  let replacementTalent = game.items.find((i) => i.name === name && i.type === "talent");
  if (replacementTalent) return replacementTalent;

  for (const pack of game.packs) {
    if (pack.documentName === "Item" && pack.indexed) {
      const entry = pack.index.find((e) => e.name === name);
      if (entry) {
        const item = await pack.getDocument(entry._id);
        if (item?.type === "talent") return item;
      }
    }
  }

  return null;
}

function cloneActiveEffectData(effect) {
  const effectData = effect.toObject();
  delete effectData._id;
  if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
  return effectData;
}

function getKnightlyVirtueSpecificEffects(virtueName, createdItemUuid) {
  const effects = [];

  if (virtueName === "Virtue of the Joust") {
    effects.push({
      name: "Jousting Bonus",
      label: "Jousting Bonus",
      icon: "icons/svg/upgrade.svg",
      origin: createdItemUuid,
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [
        { key: "system.skills.melee.calvary.modifier", mode: 2, value: "20", priority: 20 }
      ],
      transfer: false,
      flags: { wfrp4e: { description: "Bonus of +20 to Melee (Calvary) when using Lance or Half-Lance" } }
    });
  }

  if (virtueName === "Virtue of Stoicism") {
    effects.push({
      name: "Stoic Resolve",
      label: "Stoic Resolve",
      icon: "icons/svg/shield.svg",
      origin: createdItemUuid,
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [],
      transfer: false,
      flags: {
        wfrp4e: { description: "When failing a Fear test, you may reroll or reverse the result" },
        "wfrp4e-nom": { stoicism: true }
      }
    });
  }

  if (virtueName === "Virtue of the Penitent") {
    effects.push({
      name: "Penitent's Blessing",
      label: "Penitent's Blessing",
      icon: "icons/svg/holy-symbol.svg",
      origin: createdItemUuid,
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [],
      transfer: false,
      flags: {
        wfrp4e: {
          description:
            "All weapons count as magical. Critical hits against this character are reduced by -20. Critical hits with result 0 have no effect."
        },
        "wfrp4e-nom": { penitent: true, weaponsMagical: true }
      }
    });
  }

  return effects;
}

async function replaceGenericWithChosen({
  actor,
  genericItem,
  chosenName,
  applyForceAdvancement = false,
  appendToCareer = false,
  extraEffects = null
}) {
  let replacementTalent = await findTalentByExactName(chosenName);

  // Always remove the generic item first to match current flows.
  await actor.deleteEmbeddedDocuments("Item", [genericItem.id]);

  if (!replacementTalent) {
    const baseData = genericItem.toObject();
    baseData.name = chosenName;
    if (baseData.effects) delete baseData.effects;
    if (applyForceAdvancement) applyForceAdvancementToTalentItemData(baseData);

    const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
    const createdItem = createdItems?.[0] ?? null;
    if (createdItem && genericItem.effects?.size > 0) {
      const effectsToCreate = genericItem.effects.map(cloneActiveEffectData);
      if (effectsToCreate.length > 0) {
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
        } catch (e) {
          console.warn("WFRP4e-NoM | talent specialization: error copying effects", e);
        }
      }
    }

    if (createdItem && typeof extraEffects === "function") {
      const extra = extraEffects(createdItem.uuid);
      if (extra?.length) {
        try {
          await createdItem.createEmbeddedDocuments("ActiveEffect", extra);
        } catch (e) {
          console.warn("WFRP4e-NoM | talent specialization: error adding extra effects", e);
        }
      }
    }

    if (appendToCareer && createdItem) await appendTalentNameToCurrentCareer(actor, createdItem.name);
    ui.notifications.info(`Added "${chosenName}".`);
    return;
  }

  const talentData = replacementTalent.toObject();
  talentData.name = chosenName;
  if (talentData.effects) delete talentData.effects;
  if (applyForceAdvancement) applyForceAdvancementToTalentItemData(talentData);

  const createdItems = await actor.createEmbeddedDocuments("Item", [talentData]);
  const createdItem = createdItems?.[0] ?? null;

  if (createdItem) {
    const effectsToCreate = [];
    if (replacementTalent.effects?.size > 0) replacementTalent.effects.forEach((e) => effectsToCreate.push(cloneActiveEffectData(e)));
    if (genericItem.effects?.size > 0) genericItem.effects.forEach((e) => effectsToCreate.push(cloneActiveEffectData(e)));

    if (typeof extraEffects === "function") {
      const extra = extraEffects(createdItem.uuid);
      if (extra?.length) effectsToCreate.push(...extra);
    }

    if (effectsToCreate.length > 0) {
      try {
        await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
      } catch (e) {
        console.warn("WFRP4e-NoM | talent specialization: error adding effects", e);
      }
    }

    if (appendToCareer) await appendTalentNameToCurrentCareer(actor, createdItem.name);
  }

  ui.notifications.info(`Added "${chosenName}".`);
}

const FLOWS = {
  markOfTheGods: {
    title: "Mark of the Gods",
    intro: "Select a Chaos mark.",
    width: 520,
    windowIcon: "fas fa-moon",
    radioName: "mogMark",
    showManualInput: false,
    descriptors: GOD_MARKS,
    cancelNotification: "Selection cancelled. Mark of the Gods remains on the sheet.",
    emptySelectionWarning: "Please select a mark.",
    applyForceAdvancement: true,
    appendToCareer: true
  },
  martialArtist: {
    title: "Choice of Martial Path",
    intro: "Select a martial path for Martial Artist.",
    width: 520,
    windowIcon: "fas fa-fist-raised",
    radioName: "maPath",
    showManualInput: false,
    descriptors: MARTIAL_PATHS,
    cancelNotification: "Selection cancelled. Martial Artist remains on the sheet.",
    emptySelectionWarning: "Please select a martial path.",
    applyForceAdvancement: true,
    appendToCareer: true
  },
  grailVirtue: {
    title: "Choice of Grail Virtue",
    intro: "Select a Grail virtue, or enter a talent name manually if needed.",
    width: 560,
    windowIcon: "fas fa-church",
    radioName: "grailVirtue",
    showManualInput: true,
    manualLabel: "Or enter manually:",
    manualPlaceholder: "Enter Grail virtue talent name manually...",
    descriptors: GRAIL_VIRTUES,
    cancelNotification: "Selection cancelled. Grail Virtue remains on the sheet.",
    emptySelectionWarning: "Please select a Grail virtue or enter one manually.",
    applyForceAdvancement: false,
    appendToCareer: false
  },
  knightlyVirtue: {
    title: "Choice of Virtue",
    intro: "Select Virtue, if no selection is made, enter one manually.",
    width: 550,
    windowIcon: "fas fa-horse-head",
    radioName: "virtue",
    showManualInput: true,
    manualLabel: "Or enter manually:",
    manualPlaceholder: "Enter virtue name manually...",
    descriptors: KNIGHTLY_VIRTUES,
    cancelNotification: "Selection cancelled. The Knightly Virtue talent remains on the sheet.",
    emptySelectionWarning: "Please select a virtue or enter one manually.",
    applyForceAdvancement: false,
    appendToCareer: false,
    extraEffects: (virtueName) => (uuid) => getKnightlyVirtueSpecificEffects(virtueName, uuid)
  },
  kenjutsuStyle: {
    title: "Kenjutsu (Style)",
    intro: "Select a Kenjutsu way.",
    width: 520,
    windowIcon: "fas fa-khanda",
    radioName: "kenjutsuWay",
    showManualInput: false,
    descriptors: KENJUTSU_WAYS,
    cancelNotification: "Selection cancelled. Kenjutsu (Style) remains on the sheet.",
    emptySelectionWarning: "Please select a way.",
    applyForceAdvancement: true,
    appendToCareer: true
  }
};

function resolveFlowForItemName(itemName) {
  for (const [flowId, names] of Object.entries(GENERIC_NAMES)) {
    if (names.includes(itemName)) return flowId;
  }
  return null;
}

async function showPickerAndReplace(flowId, actor, item) {
  const flow = FLOWS[flowId];
  if (!flow) return;

  await new NomTalentRadioPicker({
    title: flow.title,
    intro: flow.intro,
    width: flow.width,
    windowIcon: flow.windowIcon,
    radioName: flow.radioName,
    showManualInput: flow.showManualInput,
    manualLabel: flow.manualLabel,
    manualPlaceholder: flow.manualPlaceholder,
    descriptors: flow.descriptors,
    actor,
    item,
    cancelNotification: flow.cancelNotification,
    emptySelectionWarning: flow.emptySelectionWarning,
    onSubmit: async (chosenName) => {
      const extraEffects =
        flowId === "knightlyVirtue" && typeof flow.extraEffects === "function"
          ? flow.extraEffects(chosenName)
          : null;
      await replaceGenericWithChosen({
        actor,
        genericItem: item,
        chosenName,
        applyForceAdvancement: flow.applyForceAdvancement,
        appendToCareer: flow.appendToCareer,
        extraEffects
      });
    }
  }).render(true);
}

async function handleCreatedItem(actor, item) {
  if (!actor || !item) return;
  if (!actor.isOwner) return;
  if (!ITEM_TYPES.has(item.type)) return;

  const flowId = resolveFlowForItemName(item.name);
  if (!flowId) return;
  if (shouldIgnoreAsAlreadyChosen(flowId, item.name)) return;

  const key = `${actor.id}-${item.id}`;
  if (processing.has(key)) return;
  processing.add(key);
  await new Promise((r) => setTimeout(r, 300));
  try {
    await showPickerAndReplace(flowId, actor, item);
  } finally {
    setTimeout(() => processing.delete(key), 1000);
  }
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Talent specialization handler initialized");
});

Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  await handleCreatedItem(item.parent, item);
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
    if (!actor) continue;
    if (!ITEM_TYPES.has(doc.type)) continue;

    const flowId = resolveFlowForItemName(doc.name);
    if (!flowId) continue;
    if (shouldIgnoreAsAlreadyChosen(flowId, doc.name)) continue;

    const key = `${actor.id}-${itemId}`;
    if (processing.has(key)) continue;
    if (!actor.isOwner) continue;

    const embedded = actor.items.find((i) => i.id === itemId);
    if (embedded) {
      processing.add(key);
      try {
        await showPickerAndReplace(flowId, actor, embedded);
      } finally {
        setTimeout(() => processing.delete(key), 1000);
      }
    } else {
      await new Promise((r) => setTimeout(r, 200));
      const retry = actor.items.find((i) => i.id === itemId || resolveFlowForItemName(i.name) === flowId);
      if (retry) await showPickerAndReplace(flowId, actor, retry);
    }

    break;
  }
});

