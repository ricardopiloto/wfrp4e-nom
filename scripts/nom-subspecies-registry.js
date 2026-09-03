/**
 * Registers Nations of Mankind Human subspecies into game.wfrp4e.config.
 * Career tables: bundled RollTables use flags.wfrp4e.column "human-<id>-nom";
 * chargen resolves random careers via GameWFRP4e.ChargenCareerChooser.addCareerChoice
 * (species "human", subspecies key "<id>-nom") → rollTable("career", {}, "human-<id>-nom").
 *
 * Every key below MUST end with "-nom". That suffix drives the NOM source tag in Character
 * Creation (styles/nom-chargen-subspecies.css) — new nationalities need no per-entry CSS.
 */
(() => {
  const NOM_HUMAN_SUBSPECIES = {
    "albionite-nom": {
      name: "Albionite",
      skills: [
        "Athletics",
        "Climb",
        "Cool",
        "Endurance",
        "Intimidate",
        "Language (Albionese)",
        "Lore (Albion)",
        "Melee (Basic)",
        "Melee (Polearm)",
        "Outdoor Survival",
        "Perception",
        "Ranged (Bow)",
        "Ranged (Thrown)",
        "Stealth (Rural)"
      ],
      talents: [
        "Resistance (Mutation)",
        "Stone Soup",
        "Strider (Marshes)",
        "Warrior Born",
        "Very Strong, Very Resilient"
      ]
    },
    "arabyan-nom": {
      name: "Arabyan",
      skills: [
        "Charm",
        "Cool",
        "Evaluate",
        "Gossip",
        "Haggle",
        "Language (Arabyc)",
        "Language (Any)",
        "Language (Bretonnian)",
        "Leadership",
        "Lore (Araby)",
        "Melee (Basic)",
        "Pray",
        "Ranged (Blackpowder)",
        "Ride (Horse)"
      ],
      talents: ["Resistance (Heat)", "Savvy, Suave", "Read/Write, Deal Maker"],
      randomTalents: { talents: 2 }
    },
    "breton-lowborn-nom": {
      name: "Bretonnian Lowborn",
      skills: [
        "Animal Care",
        "Animal Charm",
        "Charm",
        "Cool",
        "Gossip",
        "Haggle",
        "Language (Bretonnian)",
        "Lore (Bretonnia)",
        "Lore (Weather)",
        "Melee (Basic)",
        "Ranged (Bow)",
        "Ride (Horse)",
        "Trade (Farming)"
      ],
      talents: ["Nimble Fingered, Very Resilient", "Stone Soup", "Strong Back", "Dukedom Trait (Any)"]
    },
    "breton-noble-nom": {
      name: "Bretonnian Noble",
      skills: [
        "Charm Animal",
        "Charm",
        "Cool",
        "Gossip",
        "Haggle",
        "Language (Bretonnian)",
        "Language (Any)",
        "Leadership",
        "Lore (Bretonnia)",
        "Lore (Politics)",
        "Melee (Basic)",
        "Pray",
        "Ride (Horse)"
      ],
      talents: ["Noble Blood", "Read/Write", "Suave, Warrior Born", "Dukedom Trait (Any)"]
    },
    "cathayan-nom": {
      name: "Cathayan",
      skills: [
        "Animal Care",
        "Charm Animal",
        "Charm",
        "Climb",
        "Cool",
        "Evaluate",
        "Gossip",
        "Haggle",
        "Language (Any)",
        "Language (Cathayan)",
        "Leadership",
        "Lore (Cathay)",
        "Melee (Basic)",
        "Ranged (Bow)",
        "Ride (Horse)"
      ],
      talents: ["Coolheaded, Savvy", "Read/Write, Linguistics", "Strider (Mountains)"],
      randomTalents: { talents: 2 }
    },
    "estalian-nom": {
      name: "Estalian",
      skills: [
        "Animal Charm",
        "Athletics",
        "Bribery",
        "Charm",
        "Cool",
        "Consume Alcohol",
        "Entertain (Storytelling)",
        "Gossip",
        "Language (Estalian)",
        "Language (Tilean)",
        "Language (Arabyc)",
        "Lore (Estalia)",
        "Sleight of Hand"
      ],
      talents: ["Nose for Trouble", "Savvy, Suave", "Region Trait (Any)"]
    },
    "indan-nom": {
      name: "Indan",
      skills: [
        "Charm",
        "Climb",
        "Cool",
        "Evaluate",
        "Gossip",
        "Haggle",
        "Language (Arabyc)",
        "Language (Cathayan)",
        "Language (Indish)",
        "Leadership",
        "Lore (Ind)",
        "Melee (Basic)",
        "Ranged (Blackpowder)",
        "Ranged (Bow)",
        "Ride (Horse)"
      ],
      talents: ["Lightning Reflexes, Warrior Born", "Pure Soul", "Resistance (Heat)"],
      randomTalents: { talents: 2 }
    },
    "gospodar-nom": {
      name: "Gospodar",
      skills: [
        "Animal Charm",
        "Charm",
        "Cool",
        "Evaluate",
        "Gossip",
        "Haggle",
        "Language (Gospodar)",
        "Language (Ungol)",
        "Leadership",
        "Lore (Kislev)",
        "Melee (Basic)",
        "Ride (Horse)"
      ],
      talents: ["Resistance (Cold)", "Suave, Savvy", "Very Resilient", "Provincial Bonus (Any)"]
    },
    "ungol-nom": {
      name: "Ungol",
      skills: [
        "Animal Charm",
        "Cool",
        "Gossip",
        "Intimidate",
        "Language (Gospodar)",
        "Language (Norse)",
        "Language (Ungol)",
        "Lore (Kislev)",
        "Melee (Basic)",
        "Outdoor Survival",
        "Ranged (Bow)",
        "Ride (Horse)"
      ],
      talents: ["Hardy", "Resistance (Cold)", "Warrior Born, Very Strong", "Provincial Bonus"]
    },
    "nipponese-nom": {
      name: "Nipponese",
      skills: [
        "Charm",
        "Climb",
        "Cool",
        "Evaluate",
        "Gossip",
        "Haggle",
        "Language (Any)",
        "Language (Wastelander)",
        "Language (Nipponese)",
        "Leadership",
        "Lore (Nippon)",
        "Lore (Politics)",
        "Melee (Basic)",
        "Ranged (Bow)",
        "Sail"
      ],
      talents: ["Sea Legs", "Sixth Sense", "Warrior Born, Sharp"],
      randomTalents: { talents: 2 }
    },
    "norscan-nom": {
      name: "Norscan",
      skills: [
        "Athletics",
        "Climb",
        "Consume Alcohol",
        "Cool",
        "Endurance",
        "Intimidate",
        "Language (Norse)",
        "Language (Gospodar)",
        "Language (Ungol)",
        "Lore (Norsca)",
        "Melee (Basic)",
        "Outdoor Survival",
        "Perception",
        "Ranged (Thrown)",
        "Sail",
        "Swim"
      ],
      talents: ["Big", "Hardy", "Night Vision", "Resistance (Cold)", "Very Resilient, Very Strong"]
    },
    "southlander-nom": {
      name: "Southlander",
      skills: [
        "Animal Care",
        "Athletics",
        "Climb",
        "Cool",
        "Endurance",
        "Gossip",
        "Language (Arabyc)",
        "Language (Cathayan)",
        "Melee (Polearm)",
        "Navigation",
        "Outdoor Survival",
        "Perception",
        "Ranged (Thrown)"
      ],
      talents: ["Lightning Reflexes, Sprinter", "Strong Legs", "Tribe Trait (Any)"]
    },
    "strigany-nom": {
      name: "Strigany",
      skills: [
        "Animal Care",
        "Charm Animal",
        "Charm",
        "Entertain (Singing)",
        "Entertain (Storytelling)",
        "Gossip",
        "Haggle",
        "Language (Any)",
        "Lore (Local)",
        "Lore (Spirits)",
        "Perform (Any)",
        "Play (Any)",
        "Ride (Horse)"
      ],
      talents: ["Animal Affinity, Perfect Pitch", "Seasoned Traveller", "Sharp, Suave"],
      randomTalents: { talents: 2 }
    },
    "tilean-nom": {
      name: "Tilean",
      skills: [
        "Art (Any)",
        "Bribery",
        "Charm",
        "Cool",
        "Consume Alcohol",
        "Entertain (Storytelling)",
        "Gossip",
        "Language (Estalian)",
        "Language (Tilean)",
        "Language (Bretonnian)",
        "Lore (Politics)",
        "Lore (Tilea)",
        "Sail",
        "Sleight of Hand"
      ],
      talents: ["Gregarious", "Read/Write", "Sharp, Suave", "City State Trait (Any)"]
    },
    "westerlander-nom": {
      name: "Wastelander / Marienburger",
      skills: [
        "Bribery",
        "Charm",
        "Cool",
        "Gossip",
        "Haggle",
        "Language (Arabyc)",
        "Language (Bretonnian)",
        "Language (Cathayan)",
        "Language (Nipponese)",
        "Language (Estalian)",
        "Language (Tilean)",
        "Language (Wastelander)",
        "Lore (Westerland)",
        "Row",
        "Sail",
        "Sleight of Hand",
        "Trade (Any)"
      ],
      talents: ["Deal Maker", "Read/Write, Sixth Sense", "Savvy, Suave"],
      randomTalents: { talents: 2 }
    }
  };

  /**
   * Legacy nations-of-mankind-wfrp4e overwrites the same *-nom keys on setup with
   * @Compendium[…journalentries-nom…]{…Trait (Any)} strings that break chargen
   * findTalent. Strip those to the brace label after all setup hooks finish.
   */
  const LEGACY_REGIONAL_TRAIT_LABELS = [
    "Dukedom Trait (Any)",
    "City State Trait (Any)",
    "City-State Trait (Any)",
    "Provincial Trait (Any)",
    "Region Trait (Any)",
    "Kingdom Trait (Any)",
    "Clan Trait (Any)",
    "Tribe Trait (Any)"
  ];

  const LEGACY_TRAIT_COMPENDIUM_RE = new RegExp(
    String.raw`@Compendium\[nations-of-mankind-wfrp4e\.journalentries-nom\.[^\]]+\]\{(${LEGACY_REGIONAL_TRAIT_LABELS.map(
      (l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ).join("|")})\}`,
    "g"
  );

  function sanitizeLegacyRegionalTraitTalentStrings() {
    const human = game.wfrp4e?.config?.subspecies?.human;
    if (!human) return;
    for (const entry of Object.values(human)) {
      if (!entry || !Array.isArray(entry.talents)) continue;
      entry.talents = entry.talents.map((t) => {
        if (typeof t !== "string") return t;
        return t.replace(LEGACY_TRAIT_COMPENDIUM_RE, "$1");
      });
    }
  }

  Hooks.once("init", () => {
    if (game.system?.id !== "wfrp4e") return;
    try {
      if (!game.wfrp4e?.config?.subspecies) return;
      game.wfrp4e.config.subspecies.human ??= {};
      foundry.utils.mergeObject(game.wfrp4e.config.subspecies.human, NOM_HUMAN_SUBSPECIES);
    } catch (e) {
      console.error("wfrp4e-nom | nom-subspecies-registry failed", e);
    }
  });

  Hooks.once("ready", () => {
    if (game.system?.id !== "wfrp4e") return;
    try {
      sanitizeLegacyRegionalTraitTalentStrings();
    } catch (e) {
      console.error("wfrp4e-nom | legacy Trait string sanitize failed", e);
    }
  });
})();
