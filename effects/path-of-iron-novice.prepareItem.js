/**
 * Path of Iron (Novice) — Pummel on Unarmed
 * Trigger: `prepareItem`
 * Talent: Path of Iron
 * WFRP4e: 9.5.x
 *
 * Adds quality `pummel` to brawling / Unarmed; does not remove flaw `undamaging`.
 * Copy into an Active Effect script (same effect as Enable + preRollWeaponTest), Owning document → Actor.
 */

const item = args.item;
if (!item || item.type !== "weapon") return;

const wg = item.system?.weaponGroup?.value;
const lower = (item.name ?? "").toLowerCase();
const isUnarmed = wg === "brawling" || lower.includes("unarmed");
if (!isUnarmed) return;

const q = item.system?.properties?.qualities;
if (q?.pummel) return;

const list = item.system.qualities.value;
if (!Array.isArray(list) || list.some((x) => (x?.name ?? x) === "pummel")) return;

list.push({ name: "pummel" });
item.system._properties = null;
