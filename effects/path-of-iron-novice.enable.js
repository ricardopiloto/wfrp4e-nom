/**
 * Path of Iron (Novice) — Enable / tier activation
 * Talent: Path of Iron
 * WFRP4e: tested with system 9.5.x; uses aggregate talent.Advances (capital A) on owned actors.
 *
 * One Active Effect per tier: adjust `return total >= N` (Novice 1, Apprentice 2, Journeyman 3, Master 4).
 * Copy this body into the Active Effect "Enable condition" / enable script field on the Path of Iron talent.
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

return total >= 1;
