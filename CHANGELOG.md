# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Unreleased

- (none)

## [Version 1.1.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.0) (2026-04-24)

- *Changed* **Talent selection refactor (performance)**: centralized Mark of the Gods, Martial Artist, Grail Virtue, Knightly Virtue, and Kenjutsu (Style) “generic talent → picker → sheet replacement” into **`scripts/talent-specialization-handler.js`** (single `createItem` + single `createEmbeddedDocuments` hook) and updated **`module.json`** `esmodules` accordingly (fewer runtime scripts loaded).
- *Changed* **Knightly Virtue**: `scripts/knightly-virtue.js` now contains **mechanics only** (Stoicism / Penitent hooks); the selection/replacement flow is handled by the shared specialization handler.
- *Changed* **Release ZIP contents**: GitHub Actions packaging excludes **`doc/`**, **`docs/`**, and **`effects/`** so players download runtime-only content.
- *Removed* **Path of the Flame runtime automation**: **`scripts/martial-artist-path-flame.js`** is **no longer** in **`module.json`** `esmodules`; tier hooks and prompts are **deferred** (file kept in repo for a possible future change). **`README`** and OpenSpec **`martial-artist-path-of-flame-automation`** updated accordingly.
- *Changed* **`module.json`**: version **1.1.0**; **`download`** URL for **v1.1.0**.

## [Version 1.0.9](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.9) (2026-04-24)

- *Added* New careers.
- *Changed* Updated some images.
- *Added* **docs-only** `effects/` scripts to the repository; **not** loaded at runtime (maintainer reminder).
- *Added* **`scripts/kenjutsu-style.js`**: Kenjutsu (Style) picker/replacement flow (Nippon Samurai).

## [Version 1.0.8](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.8) (2026-04-23)

- *Fixed* **Path of Iron (Apprentice)** **`preRollWeaponTest`**: merge **live** vs **clone** parsed **`N`** (`nLive` / `nClone`) so the weapon test card is neither **`SB + 0`** (when **`test.item`** is still baseline) nor **`SB + 2`** (double **`+1`**). Doc **`doc/wfrp4e/path-of-iron-novice-active-effects.md`** §8.4; **`prepareItem`** header cross-ref. OpenSpec **`repair-path-of-iron-apprentice-unarmed-damage-and-chat`** (supersedes the interim “copy live only” attempt from **`fix-path-of-iron-apprentice-prepareitem-idempotency`**); **`path-of-iron-novice-wfrp4e-effect`** spec.
- *Changed* **Path of Iron (Apprentice)** authoring: spec + doc + **`effects/path-of-iron-apprentice.*.js`** headers clarify damage is **one +1 for the tier** (same at **2/4**, **3/4**, **4/4** Path of Iron); **`Enable`** **`>= 2`** is activation only, not a damage multiplier. OpenSpec **`path-of-iron-novice-wfrp4e-effect`**; change **`clarify-path-of-iron-apprentice-single-plus-one`**.
- *Added* **Path of Iron (WFRP4e effect authoring)**: maintainer doc **`doc/wfrp4e/path-of-iron-novice-active-effects.md`** (Novice + **§8 Apprentice**); reference snippets **`effects/path-of-iron-novice.*.js`** (Enable with aggregate **`talent.Advances`**, Pummel `prepareItem` / `preRollWeaponTest`) and **`effects/path-of-iron-apprentice.*.js`** (unarmed damage +1, **SB+0** parse fallback, **SB+6** ceiling, `preRollWeaponTest` prefers existing `preData.itemData`); not registered in **`module.json`**; **`README`** pointer. OpenSpec **`path-of-iron-novice-wfrp4e-effect`**.
- *Changed* **Mark of the Gods** / **Martial Artist**: after picker replacement, the embedded talent has WFRP4e **Force Advancement** on (`system.advances.force`); helper **`applyForceAdvancementToTalentItemData`** in **`scripts/career-talent-registration.js`**; OpenSpec **`nom-force-advancement-after-picker-replacement`**.
- *Changed* **Martial Artist**: after path selection, the embedded talent **`name`** is the **path text only** (e.g. **Path of the Flame**), not `Martial Artist (…)`; picker does not fire for plain path names or legacy `Martial Artist (<catalog path>)` sheets.
- *Added* **`scripts/career-talent-registration.js`**: after **Mark of the Gods** or **Martial Artist** path replacement, appends the new talent **`name`** to the **current career** item’s **`system.talents`** list when present (same pattern as dropping a talent on the career sheet); **`module.json`** loads it before **`martial-artist.js`** / **`mark-of-the-gods.js`**.
- *Added* **docs-only** `effects/` scripts for **Path of Death**: Unarmed vs **Undead** sets `addDamaging` during **`calculateOpposedDamage`** (working); `preRollWeaponTest` includes a chat-card mutation attempt but the weapon test card still displays **Undamaging** (needs improvement; not fixed here).
- *Changed* **`module.json`**: version **1.0.8**; **`download`** URL for **v1.0.8**.

## [Version 1.0.7](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.7) (2026-04-22)

- *Added* **`scripts/grail-virtue.js`**: when generic **Grail Virtue** is added to an owned sheet, **ApplicationV2** picker (**14** Grail virtues + optional manual name); replacement uses exact chosen **`name`** and Mark-of-the-Gods-style effect merge; registered in **`module.json`** after **`talent-option-picker-app.js`**.
- *Changed* **Knightly Virtue**: after virtue selection, the sheet talent **`name`** is the virtue text only (e.g. **Virtue of Stoicism**), not `Knightly Virtue (…)`; **Stoicism** / **Penitent** detection still supports legacy compound names.
- *Changed* **README**: **Grail Virtue** section and cross-references; **OpenSpec** canonical specs **`grail-virtue-selection`**, **`knightly-virtue-selection`**, and **`nom-shared-talent-picker`** (four picker consumers).
- *Changed* **`module.json`**: version **1.0.7**; **`download`** URL for **v1.0.7**.

## [Version 1.0.6](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.6) (2026-04-09)

- *Added* **`scripts/talent-option-picker-app.js`** and **`templates/nom-talent-radio-options.hbs`**: shared **ApplicationV2** radio picker (enrichment by talent name, optional manual field, submit/cancel).
- *Changed* **Knightly Virtue**, **Martial Artist**, and **Mark of the Gods**: virtue/path/mark selection uses the shared picker (no legacy `Dialog` for those flows); **Stoicism** fear prompt remains a separate **`Dialog`**.
- *Changed* **`module.json`**: register **`scripts/talent-option-picker-app.js`** first in **`esmodules`**; version bump to **1.0.6**; `download` URL for **v1.0.6**.
- *Removed* **`templates/mark-of-the-gods-marks.hbs`** (replaced by the shared template).
- *Changed* **README**: documents the shared picker for the three talents above.
- *Fixed* **Knightly Virtue**: virtue-specific **`ActiveEffect`** data in **`getVirtueSpecificEffects`** sets required **`name`** for **WFRP4e** validation (Virtue of Stoicism, Virtue of the Joust, Virtue of the Penitent).
- *Fixed* **Winged Lancer** career, it was mapped to Kossar.
- *Added* **Corruption table** for Chosen of the Hound (Mark of the Gods).

## [Version 1.0.5](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.5) (2026-04-21)

- *Added* **GitHub Actions** workflow (`.github/workflows/release.yml`): on `release: published`, builds `{id}.zip` from `module.json` and attaches **`{id}.zip`** and **`module.json`** to the release ([`softprops/action-gh-release`](https://github.com/softprops/action-gh-release)).
- *Changed* **README**: documents **Martial Artist** path selection (eight paths).
- *Added* **`scripts/martial-artist.js`**: when a generic **Martial Artist** talent (`Martial Artist` or **`Martial Artist (Path)`**) is added to an owned actor sheet, a dialog offers **eight** martial paths; submit replaces the item with **Martial Artist (*Path name*)** (compendium/world talent by path name, or clone + effects); cancel leaves the generic talent. Registered in **`module.json`** `esmodules`.
- *Changed* **`module.json`**: version bump to **1.0.5**; `download` URL for **v1.0.5**.

## [Version 1.0.4.1](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.4.1) (2026-04-21)

- *Fixed* **`.gitignore`** and pack content so missing pack assets are tracked correctly.
- *Changed* **`module.json`**: version bump to **1.0.4.1**.

## [Version 1.0.4](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.4) (2026-04-21)

- *Added* **Cathayan Dragon Monk** career content; fixes to icons and journal pages.
- *Changed* **`module.json`**: version bump to **1.0.4**.

## [Version 1.0.3](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.3) (2026-04-19)

- *Fixed* **`module.json`** manifest / version fields.
- *Changed* **Foundry compatibility** toward **v14** and manifest / download URLs in `module.json`.
- *Changed* **`.gitignore`** updates.

## [Version 1.0.2](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.2) (2026-01-04)

- *Changed* **Dependencies**: removed **WFRP4e Up in Arms** as a required module; documentation and related updates.
- *Changed* **`module.json`**: version bump to **1.0.2**.

## [Version 1.0.1](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.1) (2025-12-25)

- *Fixed* **`module.json`** (manifest / metadata corrections).

## [Version 1.0.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.0.0) (2025-12-23)

- *Added* Initial **WFRP4e - Nations of Mankind** module: items and journals packs, **Knightly Virtue** handler, assets, and **README**.
