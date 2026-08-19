# WFRP4e — Nations of Mankind (Rev.2)

Foundry VTT module for **Warhammer Fantasy Roleplay 4th Edition**: compendium content and helpers for the unofficial **Nations of Mankind** supplement (BigBoss).

---

## What this module is for

It gives you **Items**, **Journals**, **Roll Tables**, and **career / talent** packs so you can run Nations of Mankind material in Foundry.  
A few **automatic helpers** run when specific talents or careers are added (see below). Everything else is played with normal WFRP4e rules and GM judgment.

---

## Requirements

| Dependency | Notes |
|------------|--------|
| **Foundry** | v13+ (v14 verified in `module.json`) |
| **System** | WFRP4e (`wfrp4e-core`) |

Install and **enable** these, then enable **WFRP4e — Nations of Mankind (Rev.2)** for your world.  
Human nationalities (**Albionite**, **Tilean**, **Westerland / Marienburg**, etc.), their starter skills/talents, and matching **nationality career RollTables** are merged from this module (**[Adding Species](https://moo-man.github.io/WFRP4e-FoundryVTT/pages/advanced/species.html)**). If you still use the optional fan module **`wfrp4e-more-subspecies`** (Imperial dukes, extra regional entries), enable it separately; it is **not** required by NoM anymore.

---

## Installation

1. Enable the **requirements** listed above (system + prerequisite modules).
2. **Recommended (in Foundry Setup):** open **Install Module**, then either search for the module name or paste the **manifest** URL from `module.json`:
   https://github.com/ricardopiloto/wfrp4e-nom/releases/latest/download/module.json  
   After install, turn the module **on** in **Manage Modules** for your world.
3. **Manual ZIP:** download **`wfrp4e-nom.zip`** from the [latest GitHub Release](https://github.com/ricardopiloto/wfrp4e-nom/releases/latest) (or use the **`download`** URL from the release **`module.json`**).

   Unzip into your Foundry **`Data/modules/`** folder so the folder **`wfrp4e-nom`** contains **`module.json`**, then enable the module in your world.

If the ZIP link fails, confirm that a matching GitHub **Release** exists; the canonical **`download`** URL is set when the release workflow runs (see **Cutting a release** below).

---

### Cutting a release (maintainers)

1. Update **`CHANGELOG.md`** and bump the version you intend to ship.
2. Commit and push; create and publish a GitHub **Release** with tag **`vX.Y.Z`** (e.g. **`v1.2.1`**).
3. The **Release assets** workflow (`.github/workflows/release.yml`) checks out that tag, substitutes **`${version}`**, **`${url}`**, **`${manifest}`**, and **`${download}`** in **`module.json`**, runs **`npm run packs:build`**, zips the module, and uploads **`wfrp4e-nom.zip`** + **`module.json`** to the release.

You do **not** need to hand-edit install URLs in the tracked **`module.json`** on the default branch — those fields are CI placeholders filled at release time (same model as [wfrp4e-homebrew-qol](https://github.com/ricardopiloto/wfrp4e-homebrew-qol)).

---

### Maintainers: compendium sources

Human-editable documents live under **`packs-src/<pack-name>/`** (one JSON file per Foundry document). LevelDB **`packs/`** folders are **not committed** (see `.gitignore`); regenerate them locally with **`npm install`** then **`npm run packs:build`**. GitHub **Releases** run the same compile before zipping, so installers always receive **`packs/...`** in the canonical Foundry LevelDB layout. To capture edits made inside Foundry instead, copy the LevelDB folders into the repo temporarily and run **`npm run packs:extract`**, review diffs under `packs-src/`, commit JSON, discard temp LevelDB copies if needed.

**Nationality career roll tables** (`packs-src/nom-tables/Career___Human__*.json`) should use **Core Rulebook** career **`results.name`** strings (see packaged **Class and Careers** journal under **`nom-journals`**). After importing rolls that still use supplement-style labels, run **`npm run career-tables:remap-core-names`** then **`npm run career-tables:migrate`** (dry-run + **`reports/`**) or **`npm run career-tables:migrate:write`**, then **`npm run packs:build`**. **`reports/career-rolltable-unmatched.txt`** should list **no** unmatched rows when remap + migrate are current.

### Maintainer QA checklist (human subspecies + career tables)

Use a throwaway world or player test: enable **WFRP4e** + **`wfrp4e-core`** + **`wfrp4e-nom`** only (no **`wfrp4e-more-subspecies`** required).

1. Start **Character Creation** as **Human** and pick each NoM subspecies in turn (examples: **Tilean**, **Arabyan**, **Bretonnian Lowborn**, **Bretonnian Noble**, **Wastelander / Marienburger**, **Norscan**, …).
2. On the **career** roll step, confirm randomisation uses the **`nom-tables`** document whose title matches **`Career - Human (...)`** for that nationality (**`flags.wfrp4e.column`** is **`human-<…>-nom`**; see **`scripts/nom-subspecies-registry.js`** + table JSON).
3. If a rolled label errors or never links to the packaged **Class and Careers** journal, see **`reports/career-rolltable-unmatched.txt`**, run **`npm run career-tables:remap-core-names`** then **`career-tables:migrate:write`** again; maintainer map is archived under **`openspec/changes/archive/2026-05-09-remap-nom-career-rows-core-catalog/`**.

---

## What you get (content)

- **Compendiums**: Items, Journals, Tables (Nations of Mankind).
- **Assets**: Icons for careers, talents, spells, gear, etc.
- **Careers in this build** (implemented as pack items):  
  Bretonnian Knight · Kislev Kossar · Kislev Winged Lancer · Norscan Mercenary · Arabyan Janissary · Ind Ahadi · Cathayan Dragon Monk · Nippon Samurai · Vimto Monks · Ninja · Estalian Almogavar · **Estalian Inquisidor** · Tilean Condottieri · Albionese Highlander  

---

## Automation (what the module does for you)

These run **only** when the matching item is added to a character (sheet **owner** flows).

| Feature | What happens |
|--------|----------------|
| **Knightly Virtue** / **Virtue of Knighthood** (generic) | Picker → replace with one of **14** virtues; extra rules for **Stoicism** / **Penitent** are handled in script. |
| **Grail Virtue** (generic) | Picker → replace with one of **14** “Grail Virtue of …” talents. |
| **Martial Artist** (generic, no path suffix) | Picker → replace with one of **eight** paths. **Path of the Flame** has **no** built-in runtime automation in this module (see below). |
| **Kenjutsu (Style)** (generic) | Picker → replace with one of **eight** Ways. |
| **Mark of the Gods** (generic) | Picker → replace with one of **five** marks. |
| **Estalian Inquisidor — Initiate** career | Picker (**San Ioan** / **San Mattheus** / **Santa Esther**) → appends **3 talents** and **2 skills** to the **embedded career item** lists (`system.talents`, `system.skills`). It does **not** create separate **skill** items on the actor; Grouped & Advanced may still show those lines as “untrained” until the player adds skills the normal WFRP4e way. |

**Replacement pattern (shared):** Cancelling leaves the generic talent. Confirming swaps to the named variant when a matching compendium/world item exists, otherwise renames a copy. **Force Advancement** (`system.advances.force`) is applied where relevant, and **current career** talent lists can be updated to match dragging a talent onto the career sheet.

Implementation is centred on `scripts/talent-specialization-handler.js`, plus `scripts/knightly-virtue.js` (pickers mechanics), `scripts/inquisidor-school-handler.js`, and small shared helpers (`talent-option-picker-app.js`, `career-talent-registration.js`).

---

## Not automated (or manual / deferred)

| Topic | Status |
|--------|--------|
| **Path of the Flame** | **`scripts/martial-artist-path-flame.js`** is **not** loaded from `module.json`. No module runtime for this path. |
| **Other Martial Artist paths** (except optional paste below) | No general “path abilities” automation in shipped JS — use rules + item effects manually. |
| **Kenjutsu / Mark of the Gods mechanical effects** | Picker + item swap only — not full rules automation per style/mark. |
| **Inquisidor school skills on the main sheet** | Only names on the **career** item; **no** auto–owned skill items from this module. |
| **`effects/*.js` (Path of Iron, Path of Death, etc.)** | **Reference only** — not executed by the module. Copy scripts into Active Effects on the matching talents in Foundry (see **`doc/wfrp4e/path-of-iron-novice-active-effects.md`** and repository **`effects/`**). Path of Death has a known limitation on weapon card display (see `CHANGELOG`). |

Future releases may extend automation; rules always trump the module if something differs at your table.

---

## Maintainer note (Path of Iron)

Authoring guide: **`doc/wfrp4e/path-of-iron-novice-active-effects.md`**  
Example script bodies: **`effects/path-of-iron-novice.*.js`**, **`effects/path-of-iron-apprentice.*.js`** (paste into talent effects yourself).

---

## Credits

- **Supplement**: Nations of Mankind — **BigBoss**  
- Earlier Foundry adaptation: **Cpt-Igloo** ([nations-of-mankind-wfrp4e](https://github.com/Cpt-Igloo/nations-of-mankind-wfrp4e))  
- This fork / maintenance: module author listed in `module.json`

Community resource — respect upstream licensing and goodwill of the original authors.

---

## Legal

Unofficial Foundry module. **Warhammer Fantasy Roleplay** is a trademark of Games Workshop Limited. Not affiliated with or endorsed by Games Workshop.

For bugs or contributions, use the repository linked in `module.json`.
