/**
 * Path of Iron (Novice) — Chat card Qualities/Flaws snapshot
 * Trigger: `preRollWeaponTest`
 * Talent: Path of Iron
 * WFRP4e: 9.5.x
 *
 * Ensures Pummel appears on the weapon test card alongside Undamaging. Assigns the same
 * cloned item object to preData.item and preData.itemData so TestWFRP#item does not use only the live id.
 * Copy into the same Active Effect as prepareItem.
 *
 * CRITICAL: first executable line must define `test` from `args` (no global `test`).
 */

const test = args?.test;
if (!test?.item) return;

const weapon = test.item;
const wg = weapon.system?.weaponGroup?.value;
const isUnarmed =
  wg === "brawling" || (weapon.name ?? "").toLowerCase().includes("unarmed");
if (!isUnarmed) return;

const itemData = foundry.utils.duplicate(weapon.toObject());
const qPath = "system.qualities.value";
const fPath = "system.flaws.value";

let qualities = foundry.utils.getProperty(itemData, qPath) ?? [];
let flaws = foundry.utils.getProperty(itemData, fPath) ?? [];

const hasPummel = qualities.some((q) => (q?.name ?? q) === "pummel");
if (!hasPummel) qualities = foundry.utils.duplicate(qualities).concat([{ name: "pummel" }]);

const hasUndamaging = flaws.some((f) => (f?.name ?? f) === "undamaging");
if (!hasUndamaging) flaws = foundry.utils.duplicate(flaws).concat([{ name: "undamaging" }]);

foundry.utils.setProperty(itemData, qPath, qualities);
foundry.utils.setProperty(itemData, fPath, flaws);
foundry.utils.setProperty(itemData, "system._properties", null);

const pd = test.data?.preData;
if (!pd) return;

pd.itemData = itemData;
pd.item = itemData;
