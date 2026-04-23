/**
 * Append a talent name to the WFRP4e current career's talent list (same idea as dropping a talent on the career sheet).
 */

/**
 * Set WFRP4e **Force Advancement** on plain item data before `createEmbeddedDocuments` (owned talent Details → `system.advances.force`).
 * Preserves other keys under `system.advances` from `toObject()`.
 * @param {object} itemData
 * @returns {object}
 */
export function applyForceAdvancementToTalentItemData(itemData) {
  if (!itemData || typeof itemData !== "object") return itemData;
  if (!itemData.system) itemData.system = {};
  const existing = itemData.system.advances;
  const base =
    existing && typeof existing === "object" ? foundry.utils.deepClone(existing) : {};
  itemData.system.advances = foundry.utils.mergeObject(base, { force: true }, { inplace: false });
  return itemData;
}

/**
 * @param {Actor} actor
 * @returns {Item|null}
 */
function resolveCurrentCareerItem(actor) {
  if (!actor?.items) return null;
  const embedded = actor.items.find((i) => i.type === "career" && i.system?.current?.value);
  if (embedded) return embedded;
  const cc = actor.currentCareer;
  if (cc && typeof cc.update === "function") return cc;
  return null;
}

/**
 * @param {Actor} actor
 * @param {string} talentName Sheet name of the embedded talent to register (must match the item on the actor).
 */
export async function appendTalentNameToCurrentCareer(actor, talentName) {
  if (!actor || typeof talentName !== "string" || !talentName.trim()) return;
  try {
    const career = resolveCurrentCareerItem(actor);
    if (!career) return;
    const talents = career.system?.talents;
    if (!talents || typeof talents.add !== "function") return;
    const list = talents.list;
    if (list && Object.values(list).some((entry) => entry && entry.name === talentName)) return;
    await career.update(talents.add({ name: talentName }));
  } catch (e) {
    console.warn("WFRP4e-NoM | appendTalentNameToCurrentCareer:", e);
  }
}
