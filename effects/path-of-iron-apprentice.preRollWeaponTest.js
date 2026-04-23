/**
 * Path of Iron (Apprentice) — Chat card damage matches prepared Unarmed strike
 * Trigger: `preRollWeaponTest`
 * Talent: Path of Iron
 * WFRP4e: 9.5.x
 *
 * One +1 to N for the Apprentice tier on Unarmed only (not per Advances / rank).
 * After cloning from `preData.itemData` (Novice qualities), merge damage using **live** `test.item`
 * vs **clone** parsed N:
 * - nLive > nClone → live already includes prepareItem bump → use live string.
 * - nLive < nClone → clone ahead → use clone string.
 * - nLive === nClone === 0 → neither shows bump yet → `SB + 1` (single +1 on card).
 * - nLive === nClone > 0 → aligned → use live (avoid SB+2 double bump).
 *
 * Prefer `test.data.preData.itemData` when already set. Set `itemData` and `item` to the same object.
 * CRITICAL: `const test = args?.test;`
 */

const test = args?.test;
if (!test?.item) return;

const weapon = test.item;
const wg = weapon.system?.weaponGroup?.value;
const isUnarmed =
  wg === "brawling" || (weapon.name ?? "").toLowerCase().includes("unarmed");
if (!isUnarmed) return;

const pd = test.data?.preData;
if (!pd) return;

const parseSbN = (raw) => {
  const m = String(raw ?? "").match(/SB\s*\+\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
};

const src =
  pd.itemData && typeof pd.itemData === "object"
    ? foundry.utils.duplicate(pd.itemData)
    : foundry.utils.duplicate(weapon.toObject());

const liveRaw = String(weapon.system?.damage?.value ?? "");
const nLive = parseSbN(liveRaw);
const cloneRaw = String(foundry.utils.getProperty(src, "system.damage.value") ?? "");
const nClone = parseSbN(cloneRaw);

let outDamage;
if (nLive > nClone) {
  outDamage = /SB\s*\+\s*\d+/i.test(liveRaw) ? liveRaw : `SB + ${nLive}`;
} else if (nLive < nClone) {
  outDamage = /SB\s*\+\s*\d+/i.test(cloneRaw) ? cloneRaw : `SB + ${nClone}`;
} else if (nLive === 0) {
  outDamage = `SB + 1`;
} else {
  outDamage = /SB\s*\+\s*\d+/i.test(liveRaw) ? liveRaw : cloneRaw || `SB + ${nLive}`;
}

foundry.utils.setProperty(src, "system.damage.value", outDamage);
foundry.utils.setProperty(src, "system._properties", null);

pd.itemData = src;
pd.item = src;
