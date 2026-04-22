/**
 * Martial Artist handler
 * When a generic Martial Artist talent is added to a sheet (`Martial Artist` or `Martial Artist (Path)`), the owner picks one of eight paths.
 */

const martialArtistProcessing = new Set();

/**
 * @param {string} [name]
 * @returns {boolean}
 */
function isGenericMartialArtistName(name) {
  return name === "Martial Artist" || name === "Martial Artist (Path)";
}

const MARTIAL_PATHS = [
  { id: "flame", name: "Path of the Flame" },
  { id: "iron", name: "Path of Iron" },
  { id: "shadows", name: "Path of Shadows" },
  { id: "beast", name: "Path of the Beast" },
  { id: "heavens", name: "Path of the Heavens" },
  { id: "light", name: "Path of Light" },
  { id: "life", name: "Path of Life" },
  { id: "death", name: "Path of Death" }
];

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Martial Artist handler initialized");
});

/**
 * @param {Actor} actor
 * @param {Item} martialArtistItem
 */
async function showMartialArtistDialog(actor, martialArtistItem) {
  const optionsWithIcons = await Promise.all(
    MARTIAL_PATHS.map(async (opt) => {
      let icon = "icons/svg/item-bag.svg";
      let description = "";
      let talent = game.items.find((i) => i.name === opt.name && i.type === "talent");
      if (!talent) {
        for (const pack of game.packs) {
          if (pack.documentName === "Item" && pack.indexed) {
            const entry = pack.index.find((e) => e.name === opt.name);
            if (entry) {
              const doc = await pack.getDocument(entry._id);
              if (doc?.type === "talent") {
                talent = doc;
                break;
              }
            }
          }
        }
      }
      if (talent?.img) icon = talent.img;
      if (talent?.system?.description?.value) {
        description = talent.system.description.value;
      } else if (talent?.system?.description) {
        description =
          typeof talent.system.description === "string"
            ? talent.system.description
            : talent.system.description.value || "";
      }
      if (description) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description;
        description = tempDiv.textContent || tempDiv.innerText || "";
        if (description.length > 200) description = description.substring(0, 197) + "...";
      }
      return { ...opt, icon, description };
    })
  );

  const content = `
    <form style="display: flex; flex-direction: column; gap: 20px;">
      <div style="margin-bottom: 0;">
        <p style="margin: 0; color: #666; font-size: 0.95em; line-height: 1.4;">
          Select a martial path for Martial Artist.
        </p>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column;">
        <div style="max-height: 450px; overflow-y: auto; border: 1px solid #ccc; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.02);">
          ${optionsWithIcons
            .map(
              (opt) => `
            <div class="ma-path-option"
                 data-path-id="${opt.id}"
                 style="display: flex; align-items: flex-start; padding: 10px; margin-bottom: 4px; border-radius: 3px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent;"
                 onmouseover="this.style.background='rgba(0,0,0,0.08)'; this.style.borderColor='rgba(66,153,225,0.5)'"
                 onmouseout="if(!this.classList.contains('selected')) { this.style.background='transparent'; this.style.borderColor='transparent'; }">
              <input type="radio" id="ma-path-${opt.id}" name="maPath" value="${opt.id}"
                     style="margin-right: 12px; cursor: pointer; display: none;">
              <img src="${opt.icon}" style="width: 36px; height: 36px; margin-right: 12px; border: none; flex-shrink: 0; margin-top: 2px;"
                   onerror="this.src='icons/svg/item-bag.svg'">
              <div style="flex: 1; display: flex; flex-direction: column;">
                <label for="ma-path-${opt.id}" style="font-weight: 500; cursor: pointer; user-select: none; margin: 0 0 4px 0; font-size: 0.95em;">
                  ${opt.name}
                </label>
                ${
                  opt.description
                    ? `<p style="margin: 0; color: #666; font-size: 0.85em; line-height: 1.3; font-style: italic;">${opt.description}</p>`
                    : ""
                }
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </form>
    <style>
      .ma-path-option.selected {
        background: rgba(66,153,225,0.15) !important;
        border-color: rgba(66,153,225,0.8) !important;
      }
      .ma-path-option label { pointer-events: none; }
    </style>
    <script>
      (function() {
        const opts = document.querySelectorAll('.ma-path-option');
        opts.forEach(option => {
          option.addEventListener('click', function() {
            opts.forEach(opt => {
              opt.classList.remove('selected');
              opt.style.background = 'transparent';
              opt.style.borderColor = 'transparent';
            });
            this.classList.add('selected');
            this.style.background = 'rgba(66,153,225,0.15)';
            this.style.borderColor = 'rgba(66,153,225,0.8)';
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
          });
        });
      })();
    </script>
  `;

  new Dialog({
    title: "Choice of Martial Path",
    content,
    width: 520,
    buttons: {
      submit: {
        icon: '<i class="fas fa-check"></i>',
        label: "Submit",
        callback: async (html) => {
          const selectedId = html.find('input[name="maPath"]:checked').val();
          if (!selectedId) {
            ui.notifications.warn("Please select a martial path.");
            return false;
          }
          const selected = MARTIAL_PATHS.find((p) => p.id === selectedId);
          if (!selected) {
            ui.notifications.warn("Invalid selection.");
            return false;
          }
          const pathName = selected.name;

          try {
            let replacementTalent = game.items.find((i) => i.name === pathName && i.type === "talent");
            if (!replacementTalent) {
              for (const pack of game.packs) {
                if (pack.documentName === "Item" && pack.indexed) {
                  const entry = pack.index.find((e) => e.name === pathName);
                  if (entry) {
                    const item = await pack.getDocument(entry._id);
                    if (item?.type === "talent") {
                      replacementTalent = item;
                      break;
                    }
                  }
                }
              }
            }

            if (!replacementTalent) {
              const baseData = martialArtistItem.toObject();
              baseData.name = `Martial Artist (${pathName})`;
              if (baseData.effects) delete baseData.effects;
              await actor.deleteEmbeddedDocuments("Item", [martialArtistItem.id]);
              const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
              if (createdItems.length > 0 && martialArtistItem.effects?.size > 0) {
                const createdItem = createdItems[0];
                const effectsToCreate = martialArtistItem.effects.map((effect) => {
                  const effectData = effect.toObject();
                  delete effectData._id;
                  if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
                  return effectData;
                });
                try {
                  await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
                } catch (e) {
                  console.warn("WFRP4e-NoM | Martial Artist: error copying effects", e);
                }
              }
              ui.notifications.info(`Martial path "${pathName}" added.`);
              return true;
            }

            await actor.deleteEmbeddedDocuments("Item", [martialArtistItem.id]);
            const talentData = replacementTalent.toObject();
            talentData.name = `Martial Artist (${pathName})`;
            if (talentData.effects) delete talentData.effects;
            const createdItems = await actor.createEmbeddedDocuments("Item", [talentData]);
            if (createdItems.length > 0) {
              const createdItem = createdItems[0];
              const effectsToCreate = [];
              if (replacementTalent.effects?.size > 0) {
                replacementTalent.effects.forEach((effect) => {
                  const effectData = effect.toObject();
                  delete effectData._id;
                  if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
                  effectsToCreate.push(effectData);
                });
              }
              if (martialArtistItem.effects?.size > 0) {
                martialArtistItem.effects.forEach((effect) => {
                  const effectData = effect.toObject();
                  delete effectData._id;
                  if (effectData.flags) effectData.flags = foundry.utils.deepClone(effectData.flags);
                  effectsToCreate.push(effectData);
                });
              }
              if (effectsToCreate.length > 0) {
                try {
                  await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
                } catch (e) {
                  console.warn("WFRP4e-NoM | Martial Artist: error adding effects", e);
                }
              }
            }
            ui.notifications.info(`Martial path "${pathName}" added successfully!`);
          } catch (error) {
            console.error("WFRP4e-NoM | Martial Artist replacement error:", error);
            ui.notifications.error("Error replacing Martial Artist. See console.");
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: () => {
          ui.notifications.info("Selection cancelled. Martial Artist remains on the sheet.");
        }
      }
    },
    default: "submit"
  }).render(true);
}

Hooks.on("createItem", async (item, options, userId) => {
  if (!item?.parent) return;
  const actor = item.parent;
  const isTalentType = item.type === "talent" || item.type === "skill" || item.type === "trait";
  const isMartialArtist = isGenericMartialArtistName(item.name);
  const itemKey = `${actor.id}-${item.id}`;
  if (martialArtistProcessing.has(itemKey)) return;
  if (isTalentType && isMartialArtist && actor.isOwner) {
    martialArtistProcessing.add(itemKey);
    await new Promise((r) => setTimeout(r, 300));
    try {
      await showMartialArtistDialog(actor, item);
    } finally {
      setTimeout(() => martialArtistProcessing.delete(itemKey), 1000);
    }
  }
});

Hooks.on("createEmbeddedDocuments", async (documents, result, options, userId) => {
  if (!documents?.length) return;
  const firstDoc = documents[0];
  const isItem =
    firstDoc?.documentName === "Item" ||
    firstDoc?.constructor?.name === "Item" ||
    (firstDoc?.type && firstDoc?.parent);
  if (!isItem) return;

  await new Promise((r) => setTimeout(r, 300));

  for (const doc of documents) {
    let actor = doc.parent;
    let itemId = doc.id;
    if (!actor && result?.length > 0) {
      itemId = result[0]?.id || doc.id;
      for (const a of game.actors) {
        if (a.items.find((i) => i.id === itemId)) {
          actor = a;
          break;
        }
      }
    }
    const isTalentType = doc.type === "talent" || doc.type === "skill" || doc.type === "trait";
    const isMartialArtist = isGenericMartialArtistName(doc.name);
    const itemKey = `${actor?.id}-${itemId}`;
    if (martialArtistProcessing.has(itemKey)) continue;
    if (isTalentType && isMartialArtist && actor) {
      if (!actor.isOwner) continue;
      const item = actor.items.find((i) => i.id === itemId);
      if (item) {
        martialArtistProcessing.add(itemKey);
        try {
          await showMartialArtistDialog(actor, item);
        } finally {
          setTimeout(() => martialArtistProcessing.delete(itemKey), 1000);
        }
      } else {
        await new Promise((r) => setTimeout(r, 200));
        const retryItem = actor.items.find((i) => i.id === itemId || isGenericMartialArtistName(i.name));
        if (retryItem) await showMartialArtistDialog(actor, retryItem);
      }
      break;
    }
  }
});
