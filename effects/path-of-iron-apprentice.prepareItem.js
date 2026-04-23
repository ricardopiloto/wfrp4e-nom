/**
 * Path of Iron (Apprentice) — Unarmed damage +1 (SB+6 cap, SB+0 baseline)
 * Trigger: `prepareItem`
 * Talent: Path of Iron
 * WFRP4e: 9.5.x
 *
 * Exactly one +1 to N for the Apprentice tier (not +1 per talent.Advances / rank: 2/4, 3/4, 4/4 each get the same +1 from this script alone).
 * Parses `system.damage.value` for `SB + N`. If the pattern does not match, N = 0 (WFRP4e default unarmed).
 * If N >= 6, does nothing (SB+6 ceiling). Otherwise sets `SB + ${N + 1}`. Do not use Advances as a damage coefficient.
 * `preRollWeaponTest` merges live vs clone parsed N (see maintainer doc §8.4) so the card is neither SB+0 nor SB+2.
 * Brawling / Unarmed only.
 */

const item = args.item;
if (!item || item.type !== "weapon") return;

const wg = item.system?.weaponGroup?.value;
const lower = (item.name ?? "").toLowerCase();
const isUnarmed = wg === "brawling" || lower.includes("unarmed");
if (!isUnarmed) return;

const raw = String(item.system?.damage?.value ?? "");
const m = raw.match(/SB\s*\+\s*(\d+)/i);
const n = m ? Number(m[1]) : 0;
if (n >= 6) return;

item.system.damage.value = `SB + ${n + 1}`;
item.system._properties = null;
