/**
 * Shared ApplicationV2 + Handlebars picker for fixed talent option lists (NoM).
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export const NOM_TALENT_RADIO_TEMPLATE = "modules/wfrp4e-nom/templates/nom-talent-radio-options.hbs";

/**
 * @param {Array<{ id: string, name: string }>} descriptors
 * @returns {Promise<Array<{ id: string, name: string, icon: string, description: string }>>}
 */
export async function enrichTalentOptionsByName(descriptors) {
  return Promise.all(
    (descriptors || []).map(async (opt) => {
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
      } else if (talent?.description) {
        description =
          typeof talent.description === "string" ? talent.description : talent.description.value || "";
      }
      if (description) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description;
        description = tempDiv.textContent || tempDiv.innerText || "";
        if (description.length > 200) description = description.substring(0, 197) + "...";
      }
      return { id: opt.id, name: opt.name, icon, description };
    })
  );
}

/**
 * Radio-list talent picker (ApplicationV2).
 */
export class NomTalentRadioPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "wfrp4e-nom-talent-picker",
    tag: "form",
    classes: ["nom-talent-radio-picker"],
    position: { width: 520 },
    window: {
      title: "Select",
      icon: "fas fa-list",
      contentClasses: ["standard-form"]
    },
    form: {
      handler: NomTalentRadioPicker.prototype._onFormSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: {
      template: NOM_TALENT_RADIO_TEMPLATE,
      root: true
    }
  };

  /**
   * @param {object} options
   * @param {string} options.title
   * @param {string} [options.intro]
   * @param {string} [options.radioName]
   * @param {Array<{ id: string, name: string }>} options.descriptors
   * @param {boolean} [options.showManualInput]
   * @param {string} [options.manualLabel]
   * @param {string} [options.manualPlaceholder]
   * @param {number} [options.width]
   * @param {string} [options.windowIcon]
   * @param {Actor} options.actor
   * @param {Item} options.item
   * @param {(selectedName: string) => Promise<void>} options.onSubmit
   * @param {string | null} [options.cancelNotification]
   * @param {string} [options.emptySelectionWarning]
   */
  constructor(options = {}) {
    const {
      title = "Select",
      intro = "",
      radioName = "nomTalentPick",
      descriptors = [],
      showManualInput = false,
      manualLabel,
      manualPlaceholder,
      actor,
      item,
      onSubmit,
      cancelNotification = null,
      emptySelectionWarning = "Please select an option or enter a value manually.",
      width = 520,
      windowIcon = "fas fa-list"
    } = options;
    super({
      id: `wfrp4e-nom-pick-${foundry.utils.randomID()}`,
      position: { width },
      window: { title, icon: windowIcon, contentClasses: ["standard-form"] },
      radioName,
      intro,
      descriptors,
      showManualInput,
      manualLabel,
      manualPlaceholder,
      actor,
      item,
      onSubmit,
      cancelNotification,
      emptySelectionWarning
    });
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.intro = this.options.intro;
    context.radioName = this.options.radioName;
    context.showManualInput = this.options.showManualInput;
    context.manualLabel = this.options.manualLabel ?? "Or enter manually:";
    context.manualPlaceholder = this.options.manualPlaceholder ?? "";
    context.talentRows = await enrichTalentOptionsByName(this.options.descriptors);
    return context;
  }

  /** @inheritdoc */
  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    if (!el) return;

    const rowSelector = ".nom-talent-option";
    el.querySelectorAll(rowSelector).forEach((row) => {
      row.addEventListener("click", () => {
        el.querySelectorAll(rowSelector).forEach((r) => {
          r.classList.remove("selected");
          r.style.background = "transparent";
          r.style.borderColor = "transparent";
        });
        row.classList.add("selected");
        row.style.background = "rgba(66,153,225,0.15)";
        row.style.borderColor = "rgba(66,153,225,0.8)";
        const radio = row.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        const manual = el.querySelector("#nom-manual-input");
        if (manual) manual.value = "";
      });
      row.addEventListener("mouseenter", () => {
        if (!row.classList.contains("selected")) {
          row.style.background = "rgba(0,0,0,0.08)";
          row.style.borderColor = "rgba(66,153,225,0.5)";
        }
      });
      row.addEventListener("mouseleave", () => {
        if (!row.classList.contains("selected")) {
          row.style.background = "transparent";
          row.style.borderColor = "transparent";
        }
      });
    });

    const manualInput = el.querySelector("#nom-manual-input");
    if (manualInput) {
      manualInput.addEventListener("input", function () {
        if (this.value.trim()) {
          el.querySelectorAll(rowSelector).forEach((opt) => {
            opt.classList.remove("selected");
            opt.style.background = "transparent";
            opt.style.borderColor = "transparent";
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
          });
        }
      });
    }

    el.querySelector('[data-action="nom-picker-cancel"]')?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const msg = this.options.cancelNotification;
      if (msg) ui.notifications.info(msg);
      void this.close();
    });
  }

  /**
   * @param {Event} event
   * @param {HTMLFormElement} form
   */
  async _onFormSubmit(event, form) {
    event.preventDefault();
    const radioName = this.options.radioName;
    const selectedId = form.querySelector(`input[name="${radioName}"]:checked`)?.value;
    const manual = form.querySelector("#nom-manual-input")?.value?.trim() ?? "";

    let selectedName = null;
    if (selectedId) {
      const row = (this.options.descriptors || []).find((d) => d.id === selectedId);
      if (row) selectedName = row.name;
    }
    if (!selectedName && manual) selectedName = manual;

    if (!selectedName) {
      ui.notifications.warn(this.options.emptySelectionWarning);
      return;
    }

    const fn = this.options.onSubmit;
    if (typeof fn !== "function") {
      console.error("WFRP4e-NoM | NomTalentRadioPicker: missing onSubmit");
      return;
    }
    await fn(selectedName);
    await this.close();
  }
}
