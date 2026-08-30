# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Unreleased

## [Version 1.5.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.5.0) (2026-08-30)

### Compendiums

- *Added* Bretonnian career **Grail Damsel** (Maiden / Damsel / Prophetess / Enchantress, Academic) in `nom-items` with Careers journal page **Bretonnian Grail Damsel**. Bretonnian Noble roll **03** is now **Grail Damsel** (replaces Core **Wizard** on that table only). Bestiary creature **Grail Damsel** is unchanged.
- *Changed* **Bretonnian Grail Damsel** Careers page: career portrait, Core **Attractive** link, published flavour (keep Lore of the Grail / Troth paragraph). Rank items use Core **Wizard** icons (01–04). Bretonnian Lowborn roll **85** is now **Grail Damsel** (replaces Core **Witch** on that table only).
- *Fixed* Grail Damsel career ranks now use unique Foundry 16-character item ids (journal `@UUID`s no longer resolved as `null`).
- *Added* **Lore of the Grail** (ten CN spells and three Troth talents: Wisdom / Virtue / Protection) and **Divine Lore of Bretonnia** (Lady blessings and strictures) in Lores & Faith. Grail Damsel career text and Nation Rules Bretonnia point at those pages. Extra lore after Grail mastery is Beasts, Heavens, or Life only.
- *Added* Two-handed weapons **Maximilian**, **Norseman’s Axe**, and **White Wolf Hammer** (`nom-items`); Armory melee listing rebuilt from catalog.
- *Added* Bestiary creatures **Empire Pistolier**, **Empire Outrider**, **Battle Pilgrim** (distinct from **Grail Pilgrim**), **Birdmen of Catrazza**, and **Bronzino’s Galloper Guns** (typical fighters; unit hire in biography). Bestiary Index and Dogs of War Rules now `@UUID`-link those names.
- *Added* Human chargen nationalities **Southlander** and **Strigany** (`scripts/nom-subspecies-registry.js`) with full 1–100 career tables. **Witch Doktor** and **Zunu** remain on the **Arabyan** table as well as Southlander.
- *Changed* Catalog names **Chain and Sickle** and **Marksmen of Miragliano** (stable document ids).

## [Version 1.4.0](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.4.0) (2026-08-25)

### Compendiums

- *Added* Actor pack **`nom-bestiary`** (label **Nations of Mankind - Bestiary**) in **`module.json`** / **`packFolders`**; JSON source is **`packs-src/nom-bestiary/`** (**91** creatures). Player ownership is **NONE** (GM-only), matching Core Bestiary.
- *Removed* duplicate **Demigryph War Mount** actor (`uhiKIqYjgLud2ACk`); canonical id **`O7WMkJcCYM0CaTcI`**.
- *Changed* **Lustrian Luchador** on nationality tables: roll **95** on **Estalian** and **Tilean** (`Pit Fighter` slot swapped); migrate aliases for short name **Luchador**.

### Items / journals

- *Changed* Empire **Medals & Honors** catalog portraits (and Wave 1 effect icons) from the shared medal placeholder to the WFRP system default **`systems/wfrp4e/icons/blank.png`** (Talent and Trapping); generator/templates updated; placeholder asset removed.
- *Added* Empire **Medals & Honors** playable catalog (**18** `nom-items`): **15** wearable Imperial Honor trappings + **3** Kill Count talents (Hunter / Killer / Reaper); Empire journal page links; Wave 1 skill Active Effects (Pure Soul, White Dove, Platinum Owl, Artillerist’s Honors, Hunter). Tooling: **`scripts/generate-medals-honors-items.mjs`**, id map **`reports/medals-honors-id-map.md`**. OpenSpec: **`add-medals-honors-items`**.
- *Added* Journal **Nations of Mankind - Armory** (`n0mArmory0000001`): Empire attachments (PDF 78–80), New Qualities, Melee / Ranged / Armour / Siege tables linked to `nom-items`, Mounts linked to `nom-bestiary`; hub **Start Here** link. Tooling: **`npm run journals:armory[:write]`**.
- *Added* Missing PDF Armory gear in **`nom-items`**: Tonfa, Glaive, Air Rifle, Triple-Barrel Repeater Pistol, Chakram, Kunai, Shuriken, Throwing Hammer, special arrows / Pellets, Reiksplate Bracers, Horo Cloak, Skull Trophies; deduped Tiger Claws / Poleaxe. Tooling: **`scripts/fix-todo-nom-items.mjs`**.
- *Changed* Synced PDF careers **Sartosan Pirate**, **Skald**, **Swordsaint**, **Vampire Hunter**, **Whaler**, **Witch Doktor**, **Zunu** (tier stats + journals + nationality tables); created **Zunu Militiaman** L1; journal career icons from **`icons/careers/`**; README careers checklist **47/47**.
- *Changed* `careers:normalize` **ICON_PAGE_ALIAS** for **Cathayan Swordsaint** → `cathay-sword-saint.webp`; removed NoM careers from **`remap-nom-career-rows-to-core`** REMAP.
- *Removed* Packaged **Core — Class and Careers** journal copy; nationality tables and NoM journals now link **`Compendium.wfrp4e-core.journals.JournalEntry.wczCPcuHT4VQDLpL`**.
- *Changed* **Sprint B** journal IA: split **Additional Rules** into **Start Here**, **Peoples** (13), **The Empire** (4+TOC), **Regiments of Renown**, **Dogs of War**, **Nation Rules**, **Bestiary Index** (5+TOC), **Talents**; rename **Lores & Faith**; link official Core **Class and Careers** (do not ship a copy); remove empty **Prayers**. Tooling: **`npm run journals:sprint-b[:write]`** (`reports/sprint-b-journal-map.json`).
- *Changed* Nation Rules dedupe: Kislev / Ind / Araby / Nippon lore blocks → pointers into **Lores & Faith**.
- *Changed* **Lores & Faith** Divine Lore pages (**Araby**, **Ind**, **Kislev**, **Nippon**): blessings as `<ul>` of `@UUID` links; strictures in `<blockquote class="sidebar">` (replaces combined table + list).
- *Changed* Sprint A link migration: all remaining **`@Compendium`** in **`packs-src`** (journals, bestiary nested items, NoM spells/prayers/talents) → **`@UUID`**; legacy **`bestiary-nom`** → **`nom-bestiary.Actor.*`** (5 missing creatures left as plain text). Tooling: **`npm run links:sprint-a[:write]`**.
- *Changed* **Summon Djinn** / **Form of the Frostfiend** religados aos Actors Djinn / Frostfiend (e variantes elementais).
- *Changed* Nested Bretonnian virtue icons on bestiary actors: **`nations-of-mankind-wfrp4e`…png** → **`wfrp4e-nom`…webp**.
- *Changed* New **`nom-items`** trappings, armor, siege weapons, talents, and Grail Virtues: icon paths from legacy **`nations-of-mankind-wfrp4e`** **`.png`** → **`wfrp4e-nom`** **`.webp`**; **`@Compendium`** / entity-links → **`@UUID`** (`wfrp4e-core.items.Item.*`).
- *Added* Talent **Surgical Precision** (`bgJAtvDV67bnUe6G`) — clears Corsair missing-talent report.
- *Changed* Journals (legacy **Additional Rules**, **Class and Careers**, **Careers**, **Lores**): migrate legacy core **`@Compendium`** links; Empire knightly orders page; bare **`JournalEntry`** UUIDs → full Compendium paths; refresh **`compendiumSource`** metadata.
- *Changed* **Warhammer Nations** (now under **Peoples**): **361** skill/talent/trait links → core **`items.Item`** UUIDs; repaired labels **Prejudice (Bretonnians)**, **Strider (Snow)**; **Careers** label **Fearless (Beastmen or Greenskins)**; Class and Careers bare journal UUIDs completed.
- *Changed* **Talents** master list (own journal): all **`nom-items`** talents (**89**) as alphabetical `@UUID` links.
- *Changed* Journal readability pass: remove spacer paragraphs; unify field labels and `Item.` UUIDs; strip wiki/ChatGPT markup; center Advance Scheme / Empire section titles; clearer XP progressions.

## [Version 1.3.2](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.3.2) (2026-08-24)

### Packaging

- *Changed* **Release zip** (`.github/workflows/release.yml`): after staging, keeps only **`module.json` `esmodules`** under **`scripts/`** (runtime); strips maintainer tooling (`.mjs`) and deferred handlers (e.g. **`martial-artist-path-flame.js`**, **`mark-of-the-gods.js`**).
- *Changed* Release zip also excludes **`pdf/`** (authoring source; not needed in installers).

### Assets

- *Changed* Module icons under **`icons/`** converted from **PNG** / **JPEG** to **WebP**; filenames normalised to **kebab-case** (`_` → `-`); **`packs-src`** module icon paths updated (`wfrp4e-nom` + legacy **`nations-of-mankind-wfrp4e`**).
- *Added* Maintainer npm scripts **`icons:webp`** / **`icons:webp:write`** (`scripts/convert-icons-to-webp.mjs`); README documents the conversion workflow.
- *Changed* **`scripts/normalize-career-content.mjs`**: resolves career icons from **`.webp`** only; forces kebab-case **`.webp`** `src` on journal pages; core skill/talent links prefer **`wfrp4e-core.items.Item.{id}`**; tier chess-symbol spacing fixed (`✠ @UUID…`).

### Careers (PDF sync)

- *Changed* **Kislev Kossar** aligned to PDF (page **Kislev Kossar** name kept): **Kossar Recruit** → **Kossar** → **Streltsi** → **Streltsi Captain**; status **Silver 1/3/4**, **Gold 1**; skills/talents/trappings restored (e.g. Outdoor Survival, Marksman/Sharpshooter, Carouser/Reaction Strike).
- *Changed* **Kislev Winged Lancer** aligned to PDF (page name kept): **Lancer Recruit** → **Winged Lancer** → **Winged Lancer Officer** → **Gryphon Legion**; advance scheme **WP ♜** / **Fel ♛**; Field Dressing / Fearless (Chaos) / Hardy package restored.

### Career content

- *Changed* Full careers journal normalize pass: **36** pages updated for core **`.Item.`** UUID form, icon paths, and tier header spacing; nationality tables re-migrated.
- *Changed* New career art wired into journal pages where assets exist (e.g. Black Cap, Chekist, Marine, Seer, Paymaster, Reaver, Ronin, Highwayman, Mamluk, Free Company Militiaman, Lustrian Luchador, …).

### Known gaps (unchanged)

- *Note* Nationality tables: unmatched **Sartosan Pirate**; **Lustrian Luchador** still has no nationality table row.

## [Version 1.3.1](https://github.com/ricardopiloto/wfrp4e-nom/releases/tag/v1.3.1) (2026-08-24)


### Careers (PDF sync)

- *Changed* Career tiers aligned to the Nations of Mankind PDF (journal + **`nom-items`**): **Marine**, **Norscan Seer**, **Paymaster**, **Norscan Reaver**, **Nippon Ronin**, **Bretonnian Knight of the Realm**, **Nippon Vimto Monks**, **Bretonnian Grail Pilgrim**, **Estalian Inquisidor**, plus earlier same-day syncs already noted under **1.3.0** where overlapping.
- *Changed* **Nippon Vimto Monks**: tier I renamed **Vimto Novice Monk** → **Militant Priest**; Champion standing **Silver 4**; skills/talents/trappings restored to PDF (e.g. **Martial Artist**, **Strike to Stun**, **Melee (Brawling)**).
- *Changed* **Estalian Inquisidor**: career progression order restored to PDF (**Initiate** → **Inquisidor** → **Juramentado** → **Evocador**); characteristics **WS/S/WP** (not T); Evocador **Gold 1**; journal school starting-skill blocks removed so they no longer contradict the PDF Initiate package.
- *Changed* **Bretonnian Grail Pilgrim**: status ranks (**Brass 2/5**, **Silver 2/4**), cumulative skills, **Hardy**, trapping spellings (**Mail Armor**, **Reliquae**), and **Melee (Polearm)** *or* **Melee (Two-Handed)** journal links.
- *Changed* Choice talents/skills in journals use paired **`@UUID`** links with *or* where the PDF offers alternatives (e.g. Knight Errant Etiquette, Grail Knight Ride, Reaver Lore/Shieldsman, Inquisidor Melee/Languages).

### Career content / art

- *Changed* **`npm run careers:normalize:write`**: prepended career icons for **Estalian Conquistador**, **Estalian Diestro**, **Executioner**, **Cathayan Jinyiwei**, and **Bretonnian Man-At-Arms** from new **`icons/careers/`** assets.
- *Changed* **`npm run career-tables:migrate:write`**: refreshed nationality table journal **`@UUID`** paths; unmatched backlog remains **Sartosan Pirate** (no journal page) and **Lustrian Luchador** (no nationality table row).

### Known gaps (unchanged)

- *Note* Missing NoM talent item **Surgical Precision** (`bgJAtvDV67bnUe6G`) still referenced by **Arabyan Corsair** (`reports/nom-career-missing-talents.txt`).
- *Note* Several career journal pages still lack icons until matching **`icons/careers/*.png`** files exist (e.g. Marine, Paymaster, Norscan Seer/Reaver, Nippon Ronin, Highwayman, …).

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
