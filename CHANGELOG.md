# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Unreleased

## [Version 1.3.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.3.0) (2026-08-24)

### Packaging and dependencies

- *Changed* **GitHub Release workflow** (`.github/workflows/release.yml`): aligns with [wfrp4e-homebrew-qol](https://github.com/ricardopiloto/wfrp4e-homebrew-qol) — checkout release tag, substitute **`module.json`** placeholders at CI time, **`gh release upload --clobber`**; retains **`npm run packs:build`** before zip (**`speckit`** **`001-github-release-workflow`**).
- *Changed* **`module.json`** on the default branch uses **`${version}`**, **`${url}`**, **`${manifest}`**, **`${download}`** placeholders filled when publishing a release (no manual URL bumps per version).
- *Breaking (install)* **`module.json`** no longer requires **`wfrp4e-more-subspecies`**. Worlds that still want fan Imperials/Kislev homebrew tiers from that module should enable **`wfrp4e-more-subspecies`** in addition to **NoM** (`*`‑prefixed subspecies remain that module’s responsibility).

### Human nationalities (chargen)

- *Changed* **`module.json`** registers **Human** nationalities bundled with NoM (**skills / talents / random talents**) via **`scripts/nom-subspecies-registry.js`** (`Hooks.once("init")`, **`foundry.utils.mergeObject`** → **`game.wfrp4e.config.subspecies.human`**); random career nationality tables resolve like core chargen (**`human-<nationality>-nom`** ↔ RollTable **`flags.wfrp4e.column`**).
- *Added* **`packs-src/nom-tables/Career___Human__Wastelander_Marienburger__8F482NzQN2KbnwZ5.json`**: **`Career - Human (Wastelander/Marienburger)`** (**`flags.wfrp4e.column` `human-westerlander-nom`**) with rows normalised by **`npm run career-tables:migrate:write`** like other nationality tables.
- *Changed* **`scripts/migrate-career-rolltable-links.mjs`**: composed NoM prefix for parenthetical **`Wastelander/Marienburger`** → **`Westerland`** for journal row matching; Albionite prefix **Albionese**; maintainer aliases (**Norscan Mercenary** → **Freeholder**, **Wastelander Black Cap**, **Vimto Monk**, …).

### Career nationality tables

- *Added* **`scripts/remap-nom-career-rows-to-core.mjs`** and npm **`career-tables:remap-core-names`** (**`openspec`** **`remap-nom-career-rows-core-catalog`**): rewrites **`results.name`** on **`Career___Human__*.json`** from supplement-style labels to **Core Rulebook** titles (maintainer map in archived change **`design.md`**; **Skald** → **Entertainer** because Core journal has no **Bard** page). Run before **`npm run career-tables:migrate:write`** when ingesting exports with non-Core names.
- *Changed* **`packs-src/nom-tables/Career___Human__*.json`**: nationality random-career rows that previously referenced names outside the packaged Core careers journal (e.g. **Artillerist**, **Marine**, **Vampire Hunter**) now use Core career names (**Engineer**, **Seaman**, **Witch Hunter**, …) so Character Creation resolves **Tier 1** careers and **`reports/career-rolltable-unmatched.txt`** lists **no** unmatched nationality-row labels after migrate (Core-only Arabyan rows **Marine** / **Paymaster** / **Sartosan Pirate** remain plain text where no NoM journal page exists).
- *Changed* Nationality tables: patched missing NoM journal **`@UUID`** rows so nearly all NoM career pages resolve from at least one **`Career___Human__*`** table (**Lustrian Luchador** still has no Lustrian nationality table — tracked in **`reports/TODO-nom-items.md`**).

### Chosen of the Hound

- *Added* Ten **`type: talent`** **`Item`** documents for **Chosen of the Hound** (**`RollTable`** **`tI1syOkdXB0Y5UOV`**) mutations — names from the text before **`": "`** on each row (**Iron Skin**, **Spiked Skin/Armor**, **Wings**, …), full row string in **`system.description`**, folder **NoM - Talents** (**`DsekJv5UvKUKIUpc`**) (**`openspec`** **`add-chosen-hound-mark-talent-items`**).
- *Changed* **Chosen of the Hound** mark talents (**`packs-src/nom-items/*`**) now embed **actor `ActiveEffect`s**: **`APCalc`** + **`addArmour`** for natural AP; **Iron Skin** **`ag.modifier`** **−10**; **Multiple Legs** **`prePrepareData`** on **`system.details.move.value`** (+**0.5** per run, **+1** effective); **Fear (2)**, **Flight 60**, **Horns (SB+4)**, **Acute Sense (Vision)** via **`addItems`** from **`wfrp4e-core`** (Multiple Arms / Spiked charge rider left as on-effect description; **`openspec`** **`add-chosen-hound-mark-talent-effects`**).
- *Changed* **`packs-src/nom-tables/Chosen_of_the_Hound_tI1syOkdXB0Y5UOV.json`**: each **`results[]`** row is **`type: document`** linked to **`nom-items`** (**`wire-chosen-hound-rolltable-talent-links`**); **`results[].name`** is the short **talent** title (matching **`Item.name`**, **`shorten-chosen-hound-table-result-names`**); **`results[].text`** is the full mutation line for chat/previews (**`restore-chosen-hound-rolltable-result-text`**); authoritative rules also remain on the **Item**.

### Career content tooling

- *Added* **`scripts/normalize-career-content.mjs`** and npm **`careers:normalize`** / **`careers:normalize:write`**: batch-normalises the Careers journal (`Nations_of_Mankind___Careers`), **`nom-items`** career tier back-links, nationality table journal paths, tier symbols (✠♟♜♛), icons when present, and reports missing NoM talent IDs to **`reports/nom-career-missing-talents.txt`**. Supports **`--career`** and **`--from-career`** filters.
- *Added* Maintainer skills **`.cursor/skills/nom-career-content`** and **`.cursor/skills/nom-career-tiers`** for journal/item sync workflows.
- *Added* **`reports/TODO-nom-items.md`**: backlog for missing talents, career icons, and table gaps.

### Careers and talents (compendium)

- *Changed* Career tiers synced from PDF / author specs (journal + **`nom-items`**): **Bretonnian Knight of the Realm**, **Celestial Dragon Monk** (characteristic scheme), **Nippon Ninja**, **Nippon Samurai** (**Elite Soldier** → **Kenin**), **Tilean Condottieri**, and related advance schemes / income skills.
- *Changed* Batch journal / item link cleanup from **Artillerist** onward (~20 careers): legacy **`@Compendium`** → **`@UUID`**, tier headers, icons where assets exist; **Mamluk** page rewritten from legacy entity-links to canonical **`@UUID`**.
- *Added* Restored missing **Highwayman** career tier items (**Bandit**, **Highwayman**, **Gang Leader**, **Road Lord**) with journal back-links; fixed **Gunner** talent UUID on that page to **`wfrp4e-up-in-arms`**.
- *Added* **Dog of War** talent item (**`1Y6Fu7uAsItBBYsl`**) in **`nom-items`**; journal links updated (**Estalian Almogavar**, **Estalian Conquistador**, **Tilean Condottieri**).
- *Changed* Career icons refreshed for several careers (e.g. Highlander, Condottieri, Cathayan Dragon Monk); new career art assets added under **`icons/careers/`** where available.

## [Version 1.2.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.2.0) (2026-05-08)

- *Changed* **`scripts/migrate-career-rolltable-links.mjs`** / **`Career___Human__*.json`**: Added **Alias NoM** after composed matching — maintainer map **`(nationalityTag, row name)` → `pages[].name`** (initially **Nipponese** + **Vimto Monk** → **`Nippon Vimto Monks`**, **`openspec`** **`fix-nom-career-journal-six-rows`**). Repaired **Arabyan** table row with empty **`results.name`** where **Janissary** had been stored only in **`description`**, so **`Arabyan Janissary`** links via composed match.
- *Changed* **`scripts/migrate-career-rolltable-links.mjs`** / **`Career___Human__*.json`**: NoM Careers links try **composed** titles after Core and NoM **exact** match — **`{prefix} {results.name}`** where **`prefix`** comes from **`RollTable.name`**’s parenthetical nationality tag (**`openspec`** archived **`add-nom-career-table-journal-aliases`**). **`reports/career-rolltable-unmatched.txt`** lists NoM career pages not hit by any nationality row (documentation).
- *Changed* **`packs-src/nom-tables/Career___Human__*.json`**: nationality career random tables use **`results.type: text`**, **`documentUuid: null`**, and **`results.description`** **`@UUID`** links into **`Compendium.wfrp4e-nom.nom-journals`** (**`JournalEntry.wczCPcuHT4VQDLpL`** Core text, **`trUWzGkEqCbeCzvo`** when NoM resolves **exact**, **composed**, or **alias**). Unmatched names keep prior **`description`** and appear in **`reports/career-rolltable-unmatched.txt`** after **`npm run career-tables:migrate:write`**.
- *Added* **`packs-src/nom-journals/Class_and_Careers_wczCPcuHT4VQDLpL.json`** (Core Rulebook “Class and Careers” journal export) so table links resolve inside the module **`nom-journals`** compendium. **Licensing** for redistributing Core text remains the author’s responsibility when publishing the module.
- *Added* **`scripts/migrate-career-rolltable-links.mjs`** and npm scripts **`career-tables:migrate`** / **`career-tables:migrate:write`**.
- *Changed* **Release zip** excludes **`reports/`**, **`data_sources/`**, and **`scripts/migrate-career-rolltable-links.mjs`**.
- *Changed* Compendiums: source of truth is **`packs-src/`** (JSON); LevelDB **`packs/`** is rebuilt with **`npm run packs:build`** and by **GitHub Release** workflows before packaging (no committed LevelDB blobs). Removed orphaned **`nom-bestiary`** database folder that was never listed in **`module.json`**.
- *Added* **`packFolders`** in **`module.json`** (sidebar folder “Nations of Mankind”) and tooling **`@foundryvtt/foundryvtt-cli`** + **`scripts/packs-tool.mjs`** for extract/pack (`align-foundry-compendium-packs`).

## [Version 1.1.6](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.6) (2026-05-05)

- *Changed* **README**: full rewrite in English — clearer goals, what is automated vs manual/deferred, easier reading order; requirements aligned with `module.json` relationships.
- *Removed* **Inquisidor school actor skill embed**: the module no longer creates owned **skill** items for the school package; career list updates only (`remove-inquisidor-actor-school-skill-embed`; supersedes `grant-inquisidor-school-skills-on-actor`).
- *Fixed* **Inquisidor school skills** not appearing on the career item: the WFRP4e career sheet lists **Skills** from `system.skills` only; school picks are appended there (`fix-inquisidor-school-skills-display`).

## [Version 1.1.5](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.5) (2026-05-04)

- *Fixed* **Inquisidor school choices** not appearing on the career: WFRP4e `CareerModel` stores `system.talents` / `system.addedSkills` as **string arrays** (no `system.*.add` on career items). The handler now appends via `Item#update` (`fix-inquisidor-career-wfrp4e-array-mutation`).

## [Version 1.1.4](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.4) (2026-05-04)

- *Fixed* **Inquisidor school picker** trigger: the packaged career item is named **`Initiate`**; the handler now matches **`Initiate`** first (legacy titles **Estalian Inquisidor** / **Estalian Inquisitor** still trigger). OpenSpec **`estalian-inquisidor-school-selection`** updated (`update-inquisidor-career-trigger-name-initiate`).

## [Version 1.1.3](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.3) (2026-05-04)

- *Added* New career (**Estalian Inquisidor**).
- *Added* **Estalian Inquisidor school picker**: when that career is added to a sheet, the owner chooses **San Ioan**, **San Mattheus**, or **Santa Esther**; three talents and two skills are appended to the embedded **career** item (`scripts/inquisidor-school-handler.js`), not as separate owned skill/talent items on the actor.
- *Added* Nations of Mankind PDF to the repository (base file used for authoring).
- *Changed* All careers images.
- *Changed* OpenSpec **`estalian-inquisidor-school-selection`**: documents that school packages update only the career item’s talent/skill lists (aligned with `clarify-inquisidor-school-targets-career-only`).

## [Version 1.1.2](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.2) (2026-05-03)
- *Added* New career (Ninja).

## [Version 1.1.0.1](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.1.0.1) (2026-04-24)

- *Fixed* **Foundry in-app updates**: corrected `module.json` **`manifest`** URL to GitHub’s supported latest-release asset route (**`/releases/latest/download/module.json`**).
- *Fixed* **Journals pack text**: small wording correction in the journals compendium content.
- *Changed* **`module.json`**: version **1.1.0.1**; **`download`** URL for **v1.1.0.1**.

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
