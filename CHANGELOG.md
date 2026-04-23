# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Unreleased

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
