# Path of Iron (Novice) — WFRP4e Active Effect scripts (authoring)

Maintainer reference for the **Martial Artist — Path of Iron** talent when implemented as WFRP4e **ActiveEffect** lines on the talent item. **Novice** is the worked example; higher tiers (Apprentice, Journeyman, Master) use the same pattern with a higher `>= N` threshold in the **Enable** script, usually as **separate** Active Effects on the same talent.

**WFRP4e system version:** validated against **9.5.x** (Foundry 13+). Re-test after system upgrades.

**Official docs (triggers, application):** [WFRP4e Active Effects](https://moo-man.github.io/WFRP4e-FoundryVTT/pages/effects/effects.html), [prepareItem](https://moo-man.github.io/WFRP4e-FoundryVTT/pages/effects/triggers/prepareItem.html) (via actor `prepareItem` and owned item), [prepareOwned](https://moo-man.github.io/WFRP4e-FoundryVTT/pages/effects/triggers/prepareOwned.html), [preRollWeaponTest / scripts](https://moo-man.github.io/WFRP4e-FoundryVTT/pages/effects/scripts.html).

**Repository copies (not loaded by `module.json`):**

- `effects/path-of-iron-novice.enable.js`
- `effects/path-of-iron-novice.prepareItem.js`
- `effects/path-of-iron-novice.preRollWeaponTest.js`
- `effects/path-of-iron-apprentice.enable.js`
- `effects/path-of-iron-apprentice.prepareItem.js`
- `effects/path-of-iron-apprentice.preRollWeaponTest.js`

---

## 1. Talent item and effect application

- **Name on sheet:** `Path of Iron` (as returned by the NoM Martial Artist picker / compendium).
- **Max ranks:** usually **4** in Nations of Mankind; map to tiers:

| Total purchased ranks | Tier        | Enable: `return total >=` |
|----------------------|------------|---------------------------|
| 1+                   | Novice     | `1`                        |
| 2+                   | Apprentice | `2`                        |
| 3+                   | Journeyman | `3`                        |
| 4+                   | Master     | `4`                        |

- On the **ActiveEffect**: **Effect application** = **Owning document** (or equivalent) and **Document type** = **Actor** so the effect runs on the character who owns the talent.

---

## 2. Why use `talent.Advances` (capital A) for Enable

On an **owned** actor, WFRP4e exposes multiple talent items with the **same name** (e.g. two lines of *Path of Iron* each with `system.advances.value === 1`). The UI total (e.g. **2/4**) matches the **aggregate** getter **`Advances`** (capital **A** on the `Item` / `talent.system`), which **sums** `system.advances.value` for every embedded talent of that name.

If the **Enable** script only reads `system.advances.value` from **one** `actor.items.find(...)`, the value can stay **1** while the sheet shows **2** — tier effects that require `>= 2` will never turn on.

**Debug (console, token selected):**

```js
const a = canvas.tokens.controlled[0]?.actor;
a?.items
  ?.filter((i) => i.type === "talent" && i.name === "Path of Iron")
  .map((i) => ({ id: i.id, perItem: i.system?.advances?.value, aggregate: i.Advances }));
```

Use **`Number(talent.Advances ?? talent.system?.Advances ?? talent.system?.advances?.value ?? 0)`** so the first match matches the sheet; keep `advances.value` only as a last resort.

---

## 3. Enable script (Novice: `total >= 1`)

Paste from **`effects/path-of-iron-novice.enable.js`**. For **Apprentice** / **Journeyman** / **Master**, duplicate the Active Effect and change the last line to `return total >= 2`, `>= 3`, or `>= 4`.

---

## 4. Script: `prepareItem` (Pummel on Unarmed, live data)

**Trigger:** `prepareItem` (not `prepareOwned` for effects that live on the **actor** from the talent; `prepareItem` runs with `args.item` for each owned item during preparation).

Adds quality **`pummel`** to **brawling** / *Unarmed* weapons only. Does **not** remove the **undamaging** flaw.

Full body: **`effects/path-of-iron-novice.prepareItem.js`**.

---

## 5. Script: `preRollWeaponTest` (chat card shows Pummel + Undamaging)

**Trigger:** `preRollWeaponTest`.

WFRP4e’s `WeaponTest` `item` getter uses the **embedded weapon id** first; patching only `itemData` is ignored unless **`test.data.preData.item` and `itemData` are set to the same** cloned `Item` payload. That way `weapon-card.hbs` can show both **Qualities** (Pummel) and **Flaws** (Undamaging).

Full body: **`effects/path-of-iron-novice.preRollWeaponTest.js`**.

**Required first lines (do not omit):** the script runs inside `eval`; there is **no** global `test`. You **must** bind the test document from the trigger arguments, e.g. `const test = args?.test;` (or use `args.test` everywhere). If the first line is missing, clicking **Roll** throws `ReferenceError: test is not defined` in `WeaponTest.runPreEffects` / `preRollWeaponTest`.

---

## 6. One Active Effect or three

A single Active Effect on the **Path of Iron** item can hold: **Enable script**, one **`prepareItem`** script, and one **`preRollWeaponTest`** script (WFRP4e `scriptData` with multiple trigger rows). Clone the object for other tiers and adjust **Enable** thresholds only, unless a tier needs different weapon logic (then add scripts).

---

## 7. Rules reminder (table)

- **Novice** adds **Pummel** to unarmed; **Undamaging** remains unless another rule removes it.  
- The internal quality id is **`pummel`** (display is localized, e.g. Pummel).
- **WFRP4e unarmed damage baseline:** on the sheet, unarmed / Brawling strike damage is **`SB + 0`** by default (not `SB + 3` or other editions’ values). Any script that parses `system.damage.value` (or similar) for a pattern like `SB + N` and needs a numeric fallback when the regex does not match must use **`N = 0`** so the cap logic (e.g. Apprentice **SB+6** ceiling) stays aligned with the system.

---

## 8. Path of Iron (Apprentice): unarmed damage +1

Use a **separate** Active Effect from Novice, with its own **Enable** (`**return total >= 2**`) and mechanical scripts below.

### 8.1 Table behaviour (automation)

- **Fixed +1** to the integer **N** in **`SB + N`** on the unarmed weapon — **one +1 for the Apprentice tier**, not +1 for each purchased rank of *Path of Iron*. A character at **2/4**, **3/4**, or **4/4** on the talent gets the **same** extra **+1** from this automation alone (other talents and the **SB+6** ceiling still apply to the final **N**).
- **Ceiling:** if **N ≥ 6** before this talent’s increment, **do not** change damage (do not push to SB+7 via this effect).
- **Baseline:** if the string does not match **`SB + <digits>`**, treat **N = 0** (WFRP4e default unarmed), then apply +1 and ceiling as above.
- **SB vs N (example):** **Strength Bonus** comes from the actor at roll time; **`SB + N`** on the weapon is the formula string. With **SB = 3** and only this Apprentice **+1** on default unarmed (**N** from **0 → 1**), the usual total reading is **3 + 1 = 4**. If you see **5**, **`N`** on the displayed line is **2** — often a **chat-card** double bump (see §8.4), not SB itself.

### 8.2 Enable script (Apprentice: `total >= 2`)

Same resolution pattern as §3; full body: **`effects/path-of-iron-apprentice.enable.js`**. **`return total >= 2`** only **turns the effect on** once the character has reached Apprentice; it is **not** a multiplier for damage (do not add **`total − 1`** or similar to **N**).

### 8.3 Script: `prepareItem` (live weapon damage)

**Trigger:** `prepareItem`. Restricts to **brawling / Unarmed** like §4. Updates **`system.damage.value`**, clears **`system._properties`** when mutating.

Full body: **`effects/path-of-iron-apprentice.prepareItem.js`**.

### 8.4 Script: `preRollWeaponTest` (chat card damage)

**Trigger:** `preRollWeaponTest`. Assigns the **same** cloned object to **`test.data.preData.itemData`** and **`test.data.preData.item`**.

**Composition with Novice:** this script **duplicates `test.data.preData.itemData` when it is already an object** (e.g. after Novice adds **Pummel** / flaws on the snapshot). **Damage on the card** uses a **live vs clone** merge: parse **`N`** from **`test.item.system.damage.value`** (**live**) and from the clone’s **`system.damage.value`**; if **live > clone**, copy **live** ( **`prepareItem`** already bumped the embed); if **live < clone**, keep the **clone** string; if **both `N === 0`**, set **`SB + 1`** ( **`test.item`** can still be baseline at **`preRoll`** time — avoids **`SB + 0`** on the card); if **live === clone** and **`N > 0`**, copy **live** (avoids **`SB + 2`** double bump). **Put the Path of Iron (Novice) Active Effect above Path of Iron (Apprentice)** so Novice **`preRollWeaponTest`** runs first.

Full body: **`effects/path-of-iron-apprentice.preRollWeaponTest.js`**.
