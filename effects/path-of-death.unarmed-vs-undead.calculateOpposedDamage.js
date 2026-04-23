/**
 * Path of Death — Unarmed vs Undead (damage calculation)
 *
 * WFRP4e 9.5.4
 * Trigger: `calculateOpposedDamage`
 *
 * Goal:
 * - When the Opposed Test damage is computed for an Unarmed (weaponGroup: brawling) attack
 *   against an Undead defender, force Damaging to be applied mechanically.
 *
 * Mechanic:
 * - WFRP4e computes opposed damage with `effectArgs.addDamaging`.
 * - Setting `args.addDamaging = true` makes `OpposedTest.computeResult` treat the attack as Damaging.
 *
 * Status:
 * - This portion is confirmed working (damage uses Damaging vs Undead).
 */

const opposed = args?.opposedTest || args;
const defender = opposed?.defender;
const weapon = opposed?.attackerTest?.item;

console.log("[NOM][PathOfDeath][calculateOpposedDamage] start", {
  attacker: opposed?.attacker?.name,
  defender: defender?.name,
  weapon: weapon?.name,
  weaponGroup: weapon?.system?.weaponGroup?.value,
  existingAddDamaging: args?.addDamaging,
});

if (!defender || !weapon) return;

const wg = weapon.system?.weaponGroup?.value;
const isUnarmed = wg === "brawling" || (weapon.name ?? "").toLowerCase().includes("unarmed");
if (!isUnarmed) return;

let hasUndead = false;
try {
  hasUndead = typeof defender.has === "function" && defender.has("Undead") !== undefined;
} catch (_) {}

const species = defender.system?.details?.species?.value;
const traits = (defender.itemTypes?.trait ?? []).map((t) => t.name);
const isUndead =
  (species ?? "").toLowerCase() === "undead" ||
  traits.map((t) => (t ?? "").toLowerCase()).includes("undead") ||
  hasUndead;

console.log("[NOM][PathOfDeath][calculateOpposedDamage] undead check", {
  species,
  traits,
  hasUndeadHelper: hasUndead,
  isUndead,
});

if (!isUndead) return;

args.addDamaging = true;

console.log("[NOM][PathOfDeath][calculateOpposedDamage] applied", {
  addDamagingNow: args.addDamaging,
});

