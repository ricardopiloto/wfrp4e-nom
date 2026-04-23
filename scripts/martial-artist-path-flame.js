/**
 * Martial Artist — Path of the Flame (reference implementation; not loaded by the module).
 * This file is intentionally omitted from `module.json` `esmodules` — automation deferred.
 * Sheet naming after path pick: **`Path of the Flame`**; legacy **`Martial Artist (Path of the Flame)`** still recognised if this script is ever re-registered.
 */

const FLAG_NS = "wfrp4e-nom";
const MA_FLAME_SYNC = "maFlameSync";
const MA_FLAME_TIER = "maFlameSyncTier";

const FLAME_NAME_CANONICAL = "Path of the Flame";
const FLAME_NAME_LEGACY = "Martial Artist (Path of the Flame)";

const syncingUuids = new Set();

const TIER_EFFECT_DEFS = [
  {
    tier: 1,
    name: "Path of the Flame — Novice",
    description:
      "Novice: after a successful opposed Unarmed attack, resolve the optional Toughness vs Strength opposed test, then you may apply Bleeding. The module can prompt on opposed wins (see README). Bleeding applied via the prompt is flagged for table reference."
  },
  {
    tier: 2,
    name: "Path of the Flame — Apprentice",
    description:
      "Apprentice: on body hits with Unarmed that would apply Bleeding, you may convert bonus Success Levels from damage into extra Bleeding instead. The module shows a reminder when damage is applied under those conditions (automation is limited by the WFRP4e API)."
  },
  {
    tier: 3,
    name: "Path of the Flame — Journeyman",
    description:
      "Journeyman: +2 SL on tests to avoid or remove the Implacable condition (apply manually if your Implacable source is not a numeric bonus the system can mirror)."
  },
  {
    tier: 4,
    name: "Path of the Flame — Master",
    description:
      "Master: after a successful opposed Weapon Skill test with Unarmed, you may spend at least 3 Advantage for the special strike (damage = twice Bleeding rating, ignoring armour and TB). Resolve manually; the module notifies when Advantage may qualify."
  }
];

/**
 * Number of times this talent was taken (WFRP4e: `system.Advances` / `item.Advances`).
 * @param {Item} item
 * @returns {number}
 */
export function getFlameTalentAdvances(item) {
  if (!item || !isFlamePathItemType(item.type)) return 0;
  let v = Number(foundry.utils.getProperty(item, "system.Advances"));
  if (!Number.isFinite(v) && typeof item.Advances !== "undefined")
    v = Number(item.Advances);
  if (!Number.isFinite(v))
    v = Number(foundry.utils.getProperty(item, "system.advances.value"));
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.floor(v));
}

/**
 * Active tier 0–4 from purchase count (0 = none / not taken yet; caps at 4).
 * @param {Item} item
 * @returns {number}
 */
export function getFlamePathTier(item) {
  const adv = getFlameTalentAdvances(item);
  if (adv <= 0) return 0;
  return Math.min(adv, 4);
}

/** @param {string} t */
function isFlamePathItemType(t) {
  return t === "talent" || t === "skill" || t === "trait";
}

/**
 * @param {Item} item
 * @returns {boolean}
 */
function isFlamePathTalent(item) {
  if (!item || !isFlamePathItemType(item.type)) return false;
  return item.name === FLAME_NAME_CANONICAL || item.name === FLAME_NAME_LEGACY;
}

/**
 * @param {Actor} actor
 * @returns {number}
 */
function getActorFlamePathTier(actor) {
  const it = actor?.items?.find((i) => isFlamePathTalent(i));
  return it ? getFlamePathTier(it) : 0;
}

/**
 * @param {Item} weapon
 * @returns {boolean}
 */
function isLikelyUnarmedWeapon(weapon) {
  if (!weapon?.system) return false;
  const localizedUnarmed = game.i18n?.localize?.("NAME.Unarmed");
  if (localizedUnarmed && weapon.name === localizedUnarmed) return true;
  if (typeof weapon.name === "string" && /unarmed/i.test(weapon.name)) return true;
  const wg = weapon.system.weaponGroup?.value ?? weapon.system.WeaponGroup?.value;
  if (wg !== "brawling") return false;
  const flaws = weapon.system.flaws?.value;
  if (!Array.isArray(flaws)) return false;
  const undamagingKey = game.i18n?.localize?.("PROPERTY.Undamaging") ?? "undamaging";
  return flaws.some((f) => f?.name === "undamaging" || f?.name === undamagingKey);
}

/**
 * @param {Actor} attacker
 * @param {Actor} defender
 * @param {number} tier
 */
function showFlamePathOpposedPrompt(attacker, defender, tier) {
  if (!game.user.isGM && !attacker.isOwner) return;

  const adv =
    Number(foundry.utils.getProperty(attacker, "system.status.advantage.value")) || 0;
  let extra = "";
  if (tier >= 4) {
    if (adv >= 3) {
      extra +=
        "<p><strong>Master</strong>: You have enough <strong>Advantage</strong> (≥3) to consider the special strike after a successful opposed <strong>WS</strong> test—resolve damage and spend Advantage at the table.</p>";
    } else {
      extra +=
        "<p><strong>Master</strong>: Not enough <strong>Advantage</strong> for the special strike (need ≥3; current " +
        adv +
        ").</p>";
    }
  }

  new Dialog({
    title: "Path of the Flame",
    content: `<div style="padding:6px 0;">
      <p><strong>${attacker.name}</strong> won an opposed test with <strong>Unarmed</strong> vs <strong>${defender.name}</strong>.</p>
      <p><strong>Novice</strong>: After the opposed <strong>Toughness</strong> vs <strong>Strength</strong> test (if used), you may apply <strong>1 Bleeding</strong> to the defender.</p>
      ${extra}
    </div>`,
    buttons: {
      bleed: {
        label: "Apply 1 Bleeding (NoM)",
        callback: async () => {
          try {
            await defender.addCondition("bleeding", 1, {
              flags: { [FLAG_NS]: { flamePathNoviceBleed: true } }
            });
            ui.notifications.info(`Bleeding applied to ${defender.name} (Path of the Flame).`);
          } catch (e) {
            console.warn("WFRP4e-NoM | Path of the Flame apply bleeding", e);
            ui.notifications.error("Could not apply Bleeding. See console.");
          }
        }
      },
      close: {
        label: "Dismiss",
        callback: () => {}
      }
    },
    default: "close"
  }).render(true);
}

/**
 * @param {object} args
 */
function onApplyDamage(args) {
  try {
    const attacker = args?.attacker;
    const victim = args?.actor;
    const opposedTest = args?.opposedTest;
    if (!attacker || !victim || !opposedTest) return;

    const tier = getActorFlamePathTier(attacker);
    if (tier < 2) return;

    const weapon = opposedTest.attackerTest?.weapon;
    if (!isLikelyUnarmedWeapon(weapon)) return;

    const loc = args.loc;
    if (loc !== "body") return;

    if (!game.user.isGM && !attacker.isOwner) return;

    ui.notifications.info(
      `Path of the Flame (Apprentice): ${attacker.name} — body Unarmed hit on ${victim.name}. If Bleeding applies, you may trade extra wound SL for additional Bleeding instead (NoM rule; apply manually).`
    );
  } catch (e) {
    console.warn("WFRP4e-NoM | Path of the Flame applyDamage hook", e);
  }
}

/**
 * Ensure one managed ActiveEffect per tier; set disabled from current purchases.
 * @param {Item} item
 */
export async function syncFlamePathEffects(item) {
  if (!item || !isFlamePathTalent(item) || !item.parent) return;

  const uuid = item.uuid;
  if (syncingUuids.has(uuid)) return;
  syncingUuids.add(uuid);
  try {
    for (const def of TIER_EFFECT_DEFS) {
      const matches = Array.from(item.effects).filter(
        (e) => e.getFlag(FLAG_NS, MA_FLAME_TIER) === def.tier
      );
      if (matches.length > 1)
        await item.deleteEmbeddedDocuments(
          "ActiveEffect",
          matches.slice(1).map((e) => e.id)
        );
    }

    const tier = getFlamePathTier(item);
    const toCreate = [];
    for (const def of TIER_EFFECT_DEFS) {
      const exists = Array.from(item.effects).find(
        (e) => e.getFlag(FLAG_NS, MA_FLAME_TIER) === def.tier
      );
      if (!exists) {
        toCreate.push({
          name: def.name,
          img: item.img || "icons/svg/explosion.svg",
          disabled: tier < def.tier,
          origin: item.uuid,
          description: def.description,
          changes: [],
          transfer: false,
          flags: {
            [FLAG_NS]: {
              [MA_FLAME_SYNC]: true,
              [MA_FLAME_TIER]: def.tier
            }
          }
        });
      }
    }
    if (toCreate.length) await item.createEmbeddedDocuments("ActiveEffect", toCreate);

    const updates = [];
    for (const def of TIER_EFFECT_DEFS) {
      const eff = Array.from(item.effects).find(
        (e) => e.getFlag(FLAG_NS, MA_FLAME_TIER) === def.tier
      );
      if (!eff) continue;
      const disabled = tier < def.tier;
      if (eff.disabled !== disabled) updates.push({ _id: eff.id, disabled });
    }
    if (updates.length) await item.updateEmbeddedDocuments("ActiveEffect", updates);
  } finally {
    syncingUuids.delete(uuid);
  }
}

/**
 * @param {Item} item
 * @param {object|null} diff
 */
async function maybeSyncFlamePathItem(item, diff) {
  if (!item?.parent || item.parent.documentName !== "Actor") return;
  if (!isFlamePathTalent(item)) return;
  if (diff && !flameItemDiffMayChangeTier(item, diff)) return;
  await syncFlamePathEffects(item);
}

/**
 * @param {Item} item
 * @param {object} diff
 */
function flameItemDiffMayChangeTier(_item, diff) {
  if (foundry.utils.isEmpty(diff)) return true;
  if ("name" in diff) return true;
  if (foundry.utils.hasProperty(diff, "system.Advances")) return true;
  if (foundry.utils.hasProperty(diff, "system.advances")) return true;
  const sys = diff.system;
  if (sys && typeof sys === "object") {
    if ("Advances" in sys) return true;
    if (foundry.utils.hasProperty(sys, "advances")) return true;
  }
  return false;
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Path of the Flame automation initialized");
});

Hooks.on("createItem", (item) => {
  void maybeSyncFlamePathItem(item, null);
});

Hooks.on("updateItem", (item, diff) => {
  void maybeSyncFlamePathItem(item, diff);
});

Hooks.on("wfrp4e:opposedTestResult", (opposedTest, attackerTest, defenderTest) => {
  try {
    if (opposedTest?.opposeResult?.winner !== "attacker") return;
    const attacker = attackerTest?.actor;
    const defender = defenderTest?.actor;
    if (!attacker || !defender) return;

    const tier = getActorFlamePathTier(attacker);
    if (tier < 1) return;

    const weapon = attackerTest?.weapon;
    if (!isLikelyUnarmedWeapon(weapon)) return;

    showFlamePathOpposedPrompt(attacker, defender, tier);
  } catch (e) {
    console.warn("WFRP4e-NoM | Path of the Flame opposedTestResult hook", e);
  }
});

Hooks.on("wfrp4e:applyDamage", (args) => {
  onApplyDamage(args);
});
