/**
 * Path of Death — Unarmed vs Undead (chat card attempt)
 *
 * WFRP4e 9.5.4
 * Trigger: `preRollWeaponTest`
 *
 * Goal:
 * - When rolling an Unarmed (weaponGroup: brawling) attack against an Undead target,
 *   show the attack as having Quality: Damaging and remove Flaw: Undamaging on the
 *   weapon test chat card (`weapon-card.hbs`).
 *
 * How targets are identified:
 * - Prefer Foundry API: `game.user.targets` (Set<Token>)
 * - Fallback to WFRP4e Test API: `args.test.targets` (Actors resolved from speaker objects)
 *
 * Current status (documentation):
 * - The Undead detection works.
 * - The attempted card mutation still results in the chat card showing "Flaws: Undamaging"
 *   in practice, even when `test.preData.itemData` is patched.
 * - We are NOT fixing this now; see CHANGELOG + daily (2026-04-23).
 */

const test = args?.test;
if (!test?.item) return;

const weapon = test.item;
const wg = weapon.system?.weaponGroup?.value;
const isUnarmed = wg === "brawling" || (weapon.name ?? "").toLowerCase().includes("unarmed");

console.log("[NOM][PathOfDeath][preRollWeaponTest] start", {
  attacker: test.actor?.name,
  weaponName: weapon.name,
  weaponGroup: wg,
  isUnarmed,
  foundryTargetsCount: game.user.targets?.size ?? 0,
  wfrpTargetsCount: test.targets?.length ?? 0,
});

if (!isUnarmed) return;

const isUndeadActor = (actor) => {
  if (!actor) return false;

  try {
    if (typeof actor.has === "function" && actor.has("Undead") !== undefined) return true;
  } catch (_) {}

  const species = (actor.system?.details?.species?.value ?? "").toLowerCase();
  if (species === "undead") return true;

  const traits = (actor.itemTypes?.trait ?? []).map((tr) => (tr.name ?? "").toLowerCase());
  return traits.includes("undead");
};

let targetActors = Array.from(game.user.targets ?? [])
  .map((t) => t?.actor)
  .filter(Boolean);
let source = "game.user.targets";

if (!targetActors.length) {
  targetActors = (test.targets ?? []).filter(Boolean);
  source = "args.test.targets (WFRP4e)";
}

const anyUndead = targetActors.some(isUndeadActor);
console.log("[NOM][PathOfDeath][preRollWeaponTest] targets", {
  source,
  targetInfo: targetActors.map((a) => ({
    actorName: a.name,
    species: a.system?.details?.species?.value,
    hasUndeadTrait: (a.itemTypes?.trait ?? []).some((t) => (t.name ?? "").toLowerCase() === "undead"),
    isUndead: isUndeadActor(a),
  })),
  anyUndead,
});

if (!anyUndead) return;

// Attempt: patch the test's itemData (so we don't mutate the owned item on the sheet).
// weapon-card.hbs displays `test.item.Qualities` / `test.item.Flaws`, which are derived from
// the underlying `system.qualities.value` / `system.flaws.value`.
const itemData = foundry.utils.duplicate(weapon.toObject());

const qPath = "system.qualities.value";
const fPath = "system.flaws.value";

const qualities = foundry.utils.getProperty(itemData, qPath) ?? [];
const flaws = foundry.utils.getProperty(itemData, fPath) ?? [];

const before = { qualities: [...qualities], flaws: [...flaws] };

if (!qualities.includes("damaging")) qualities.push("damaging");
const newFlaws = flaws.filter((f) => f !== "undamaging");

foundry.utils.setProperty(itemData, qPath, qualities);
foundry.utils.setProperty(itemData, fPath, newFlaws);
foundry.utils.setProperty(itemData, "system._properties", null);

test.preData.itemData = itemData;
test.data.preData.itemData = itemData;

console.log("[NOM][PathOfDeath][preRollWeaponTest] patched itemData", {
  before,
  after: {
    qualities: foundry.utils.getProperty(itemData, qPath),
    flaws: foundry.utils.getProperty(itemData, fPath),
  },
});

