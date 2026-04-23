/**
 * Path of Iron (Apprentice) — Enable / tier activation
 * Talent: Path of Iron
 * WFRP4e: tested with system 9.5.x; uses aggregate talent.Advances (capital A) on owned actors.
 *
 * One Active Effect per tier: this file is the Apprentice example (`return total >= 2`).
 * Copy into a separate Active Effect from Novice; mechanical scripts use prepareItem + preRollWeaponTest.
 */

const talent =
  this.item?.type === "talent"
    ? this.item
    : this.actor?.items?.find((i) => i.type === "talent" && i.name === "Path of Iron");

if (!talent) return false;

const total = Number(
  talent.Advances ??
    talent?.system?.Advances ??
    foundry.utils.getProperty(talent, "system.advances.value") ??
    0
);

return total >= 2;
