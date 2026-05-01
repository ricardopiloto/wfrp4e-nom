# WFRP4e - Nations of Mankind (Rev.2)

A Foundry VTT module for Warhammer Fantasy Roleplay 4th Edition that implements content from the unofficial "Nations of Mankind" supplement by BigBoss.

## About

This module brings the rich content from the Nations of Mankind homebrew supplement to Foundry VTT, providing new character options, items, journals, and gameplay mechanics for the WFRP4e system. The module includes assets and content adapted from the original Foundry VTT implementation by Cpt-Igloo, while being based on the original homebrew work by BigBoss.

## Features

- **Items Pack**: A collection of new items, weapons, armor, and trappings from various nations
- **Journals Pack**: Reference materials and documentation for the Nations of Mankind content
- **Knightly Virtue System**: **ApplicationV2** picker (shared with Martial Artist, Grail Virtue, Mark of the Gods, and Kenjutsu (Style)) so the sheet owner chooses one of **14** knightly virtues when **Knightly Virtue** is added
- **Grail Virtue**: same shared picker for **14** Bretonnian-style **Grail Virtue of …** talents when the generic **Grail Virtue** talent is added
- **Martial Artist paths**: Same shared **ApplicationV2** picker for **eight** paths when **Martial Artist** is added (cancel leaves the generic talent). **Authoring — Path of Iron (WFRP4e effects):** maintainer doc **`doc/wfrp4e/path-of-iron-novice-active-effects.md`**; copy-paste script bodies under **`effects/path-of-iron-novice.*.js`** and **`effects/path-of-iron-apprentice.*.js`** (not loaded at runtime; paste into the talent’s Active Effect in Foundry).
- **Path of the Flame (automation — deferred)**: There is **no** NoM runtime automation for this path in the current build (the optional script **`scripts/martial-artist-path-flame.js`** is **not** loaded from **`module.json`**). Use WFRP4e and table rules as normal; a future release may re-enable loading.
- **Kenjutsu (Style)**: Same shared picker for **eight** Ways when **Kenjutsu (Style)** is added (Way-only item name after confirm; same lookup, Force Advancement, and career registration pattern as the other handlers)
- **Mark of the Gods**: Same shared picker for **five** Chaos marks when **Mark of the Gods** is added (mark-only item name after confirm; same lookup/effects pattern as the other handlers)
- **Assets**: Comprehensive icon library including:
  - Career icons
  - Talent icons
  - Spell and prayer icons
  - Weapon and armor trappings
  - Siege weapon icons

## Career Implementation Status

The following checklist tracks the progress of implementing careers from the Nations of Mankind supplement:

### Completed Careers
- [x] Bretonnian Knight
- [x] Kislev Kossar
- [x] Kislev Winged Lancer
- [x] Norscan Mercenary
- [x] Arabyan Janissary
- [x] Ind Ahadi
- [x] Cathayan Dragon Monk
- [x] Nippon Samurai
- [x] Vimto Monks
- [x] Ninja

### Pending Careers
- [ ] Estalian Almogavar
- [ ] Estalian Inquisidor
- [ ] Tilean Condottieri
- [ ] Albionese Highlander

## Requirements

This module requires the following dependencies:

- **Foundry VTT**: Version 13 or higher
- **WFRP4e System**: Core system module (`wfrp4e-core`)
- **WFRP4e Up in Arms**: Expansion module (`wfrp4e-up-in-arms`)
- **WFRP4e More Subspecies**: Additional subspecies module (`wfrp4e-more-subspecies`)

## Installation

1. Install this module through the Foundry VTT module browser, or manually by adding the manifest URL
2. Ensure all required dependencies are installed and enabled
3. Activate the module in your world's module settings
4. The content packs will be available in your compendiums

## Knightly Virtue System

When a character gains the **Knightly Virtue** or **Virtue of Knighthood** talent (generic name only), an **ApplicationV2** window opens (shared **Handlebars** template with Martial Artist, Grail Virtue, Mark of the Gods, and Kenjutsu (Style)) so the sheet owner can choose from 14 different virtues:

1. Virtue of Audacity
2. Virtue of Confidence
3. Virtue of Discipline
4. Virtue of Duty
5. Virtue of Empathy
6. Virtue of Heroism
7. Virtue of Ideal
8. Virtue of Impetuous Knight
9. Virtue of the Joust
10. Virtue of Knight Temper
11. Virtue of Noble Disdain
12. Virtue of the Penitent
13. Virtue of Purity
14. Virtue of Stoicism

After confirmation, the generic talent is replaced by an item whose **name is exactly the chosen virtue** (for example **Virtue of Stoicism**), with no `Knightly Virtue (...)` prefix—same idea as **Mark of the Gods** mark names. Older sheets may still show the legacy pattern `Knightly Virtue (Virtue of …)`; module behaviour (for example Stoicism fear handling and Penitent hooks) supports both that legacy name and the plain virtue name.

## Martial Artist System

When a character gains the **Martial Artist** talent (exact name, with no path suffix yet), the same **ApplicationV2** picker as the other talent flows opens for the **sheet owner** so they can choose **one** of eight paths. Cancelling leaves the generic **Martial Artist** talent unchanged. Confirming replaces it with the **path name only** on the sheet (for example **Path of the Flame**), using the same replacement pattern as Knightly Virtue and Mark of the Gods (world or compendium talent when a matching item exists, otherwise a renamed copy of the base item). Older sheets may still show the legacy compound name **`Martial Artist (Path of …)`**; those items do not re-open the picker. The replacement talent is created with WFRP4e **Force Advancement** enabled (`system.advances.force`), matching the Details-tab option on an owned talent. If the actor has a **current career** item on the sheet, the module also appends that talent **name** to the career’s talent list (WFRP4e `system.talents`), matching the behaviour of dragging the talent onto the career.

The eight paths are:

1. Path of the Flame  
2. Path of Iron  
3. Path of Shadows  
4. Path of the Beast  
5. Path of the Heavens  
6. Path of Light  
7. Path of Life  
8. Path of Death  

## Path's automation

Martial path effects for every path will be automated in a future update. For now, only Path of Iron and Path of Death have automated, tested effect handling. Other paths still rely on manual play until that work ships.

## Kenjutsu (Style)

When a character gains the **Kenjutsu (Style)** talent (exact name `Kenjutsu (Style)` only), the shared **ApplicationV2** + **Handlebars** picker opens for the **sheet owner** so they can choose **one** of eight Ways. Cancelling leaves the generic talent unchanged. Confirming replaces it with the **Way name only** on the sheet (for example **Way of the Crane**), using the same replacement pattern as Martial Artist and Mark of the Gods (world or compendium talent when a matching item exists, otherwise a renamed copy of the base item). Older sheets may still show the legacy compound name **`Kenjutsu (Style) (Way of …)`**; those items do not re-open the picker. The replacement talent is created with WFRP4e **Force Advancement** enabled (`system.advances.force`). If the actor has a **current career** item, the module appends that talent **name** to the career’s talent list.

The eight Ways are:

1. Way of the Tortoise  
2. Way of the Crane  
3. Way of the Dragon  
4. Way of the Tiger  
5. Way of the Naga  
6. Way of the Snake  
7. Way of the Stag  
8. Way of the Nio

## Kenjutsu automation

Kenjutsu effects for every style will be automated in a future update.


## Mark of the Gods

When a character gains the **Mark of the Gods** talent (exact name `Mark of the Gods`, with no mark suffix yet), the shared **ApplicationV2** + **Handlebars** picker opens for the **sheet owner** so they can choose **one** of five marks. Cancelling leaves the generic talent unchanged. Confirming replaces it with the **mark name only** on the sheet (for example **The Crow (Nurgle)**), using the same replacement pattern as Knightly Virtue, Grail Virtue, and Martial Artist for lookup and effects (world or compendium talent when a matching item exists, otherwise a renamed copy of the base item). The replacement talent is created with WFRP4e **Force Advancement** enabled (`system.advances.force`). If the actor has a **current career** item, the chosen mark name is also added to that career’s talent list.

The five marks are:

1. The Hound (Khorne)  
2. The Crow (Nurgle)  
3. The Serpent (Slaanesh)  
4. The Eagle (Tzeentch)  
5. The Eight-Pointed Star (Undivided)  

## Mark of the Gods automation

Mark of the Gods effects for every will be automated in a future update.

## Grail Virtue

When a character gains the **Grail Virtue** talent (exact name `Grail Virtue` only), the shared **ApplicationV2** + **Handlebars** picker opens for the **sheet owner** so they can choose **one** of fourteen Grail virtues. Cancelling leaves the generic talent unchanged. Confirming replaces it with an item whose **name is exactly** the chosen option (for example **Grail Virtue of Stoicism**), using the same lookup and **ActiveEffect** merge pattern as **Mark of the Gods** (world or compendium talent when a matching item exists, otherwise a renamed copy of the base item). Optional manual entry matches the **Knightly Virtue** flow.

The fourteen options are:

1. Grail Virtue of Audacity  
2. Grail Virtue of Confidence  
3. Grail Virtue of Discipline  
4. Grail Virtue of Duty  
5. Grail Virtue of Empathy  
6. Grail Virtue of Heroism  
7. Grail Virtue of Ideal  
8. Grail Virtue of the Impetuous Knight  
9. Grail Virtue of the Joust  
10. Grail Virtue of Knightly Temper  
11. Grail Virtue of Noble Disdain  
12. Grail Virtue of the Penitent  
13. Grail Virtue of Purity  
14. Grail Virtue of Stoicism  

## Credits and Acknowledgments

This module is based on the **Nations of Mankind** unofficial supplement created by **BigBoss**. Deepest gratitude to BigBoss for creating this comprehensive homebrew content that expands the Warhammer Fantasy Roleplay experience.

Additionally, this module incorporates assets and content from the Foundry VTT implementation by **Cpt-Igloo** ([nations-of-mankind-wfrp4e](https://github.com/Cpt-Igloo/nations-of-mankind-wfrp4e)). We thank Cpt-Igloo for their work in adapting the original content to Foundry VTT.

### Original Work
- **Author**: BigBoss
- **Rules Development**: BigBoss
- **Original Foundry Implementation**: Cpt-Igloo

## License

This module is provided as a community resource. Please respect the original creators' work and any licensing terms associated with the original Nations of Mankind supplement.

## Support

For issues, suggestions, or contributions, please refer to the module's repository or contact the module author.

---

**Note**: This is an unofficial module for Foundry VTT. Warhammer Fantasy Roleplay is a trademark of Games Workshop Limited. This module is not affiliated with or endorsed by Games Workshop Limited.

