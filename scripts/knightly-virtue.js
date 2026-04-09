/**
 * Knightly Virtue Handler
 * Detecta quando o talento "Knightly Virtue" é adicionado e permite ao jogador escolher entre 14 virtudes
 */

// Flag para rastrear itens que já estão sendo processados
const processingItems = new Set();

/**
 * Actor que fala em uma ChatMessage (Foundry v14: ChatMessage#speakerActor).
 * @param {ChatMessage} message
 * @returns {Actor|null}
 */
function getMessageSpeakerActor(message) {
  const direct = message.speakerActor;
  if (direct) return direct;
  const id = message.speaker?.actor;
  if (!id) return null;
  return game.actors.get(id) ?? null;
}

/**
 * Primeira rolagem anexada à mensagem (v13+ pode usar apenas ChatMessage#rolls).
 * @param {ChatMessage} message
 * @returns {Roll|null}
 */
function getMessagePrimaryRoll(message) {
  if (message.roll) return message.roll;
  const rolls = message.rolls;
  if (rolls?.length) return rolls[0];
  return null;
}

Hooks.once("ready", () => {
  console.log("WFRP4e-NoM | Knightly Virtue handler initialized");
  console.log("WFRP4e-NoM | Module loaded successfully");
  
  // Expõe função de teste global para debug
  window.testKnightlyVirtue = async function() {
    const actor = canvas.tokens?.controlled?.[0]?.actor
      || game.user?.character
      || game.actors?.find(a => a.isOwner && a.hasPlayerOwner);
    if (!actor) {
      console.error("WFRP4e-NoM | Nenhum actor encontrado para teste");
      ui.notifications.error("Nenhum actor encontrado. Selecione um token ou abra uma ficha.");
      return;
    }
    
    const knightlyVirtue = actor.items.find(i => i.name === "Knightly Virtue" && (i.type === "talent" || i.type === "skill" || i.type === "trait"));
    if (!knightlyVirtue) {
      console.error("WFRP4e-NoM | Talento Knightly Virtue não encontrado no actor:", actor.name);
      ui.notifications.error(`Talento "Knightly Virtue" não encontrado na ficha de ${actor.name}`);
      return;
    }
    
    console.log("WFRP4e-NoM | Testando com actor:", actor.name, "Item:", knightlyVirtue.name);
    await showKnightlyVirtueDialog(actor, knightlyVirtue);
  };
  
  console.log("WFRP4e-NoM | Função de teste disponível: testKnightlyVirtue()");
});

/**
 * Verifica se um actor tem a Virtue of Stoicism
 * @param {Actor} actor - O actor a verificar
 * @returns {boolean} True se o actor tem Stoicism
 */
function hasStoicismVirtue(actor) {
  if (!actor) return false;
  
  return actor.items.some(item => {
    // Verifica pelo nome do item
    if (item.name?.includes("Knightly Virtue (Virtue of Stoicism)")) {
      return true;
    }
    // Verifica pelos efeitos
    if (item.effects && item.effects.size > 0) {
      return Array.from(item.effects).some(effect => 
        effect.flags?.["wfrp4e-nom"]?.stoicism === true
      );
    }
    return false;
  });
}

/**
 * Verifica se um actor tem a Virtue of the Penitent
 * @param {Actor} actor - O actor a verificar
 * @returns {boolean} True se o actor tem Penitent
 */
function hasPenitentVirtue(actor) {
  if (!actor) return false;
  
  return actor.items.some(item => {
    // Verifica pelo nome do item
    if (item.name?.includes("Knightly Virtue (Virtue of the Penitent)")) {
      return true;
    }
    // Verifica pelos efeitos
    if (item.effects && item.effects.size > 0) {
      return Array.from(item.effects).some(effect => 
        effect.flags?.["wfrp4e-nom"]?.penitent === true
      );
    }
    return false;
  });
}

/**
 * Hook para interceptar mensagens de chat de rolagens e verificar testes de Fear
 */
Hooks.on("createChatMessage", async (message, options, userId) => {
  // Verifica se é uma mensagem de rolagem
  if (!message.isRoll) return;
  const roll = getMessagePrimaryRoll(message);
  if (!roll) return;
  
  // Verifica se é um teste de Fear
  const content = message.content?.toLowerCase() || "";
  const isFearTest = content.includes("fear") || content.includes("terror") || 
                     message.flags?.wfrp4e?.skill?.name?.toLowerCase()?.includes("fear");
  
  if (!isFearTest) return;
  
  const actor = getMessageSpeakerActor(message);
  if (!actor) return;
  
  // Verifica se o actor tem Stoicism
  if (!hasStoicismVirtue(actor)) return;
  
  // Verifica se a rolagem falhou
  const isFailure = roll.isFailure || (roll.total && roll.terms && 
    roll.terms.some(term => term.total && term.total > (roll.target || 0)));
  
  if (!isFailure) return;
  
  console.log("WFRP4e-NoM | Fear test failed for actor with Stoicism");
  
  // Aguarda um pouco para a mensagem ser processada
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Oferece opção de rerolagem ou reversão
  const action = await new Promise((resolve) => {
    new Dialog({
      title: "Virtue of Stoicism",
      content: `
        <div style="padding: 10px;">
          <p style="margin-bottom: 10px;"><strong>Your Fear test failed.</strong></p>
          <p style="margin-bottom: 15px;">As a result of your Stoic Resolve, you may:</p>
          <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Reroll</strong> the test</li>
            <li><strong>Reverse</strong> the result (treat failure as success)</li>
            <li><strong>Accept</strong> the failure</li>
          </ul>
        </div>
      `,
      buttons: {
        reroll: {
          icon: '<i class="fas fa-dice"></i>',
          label: "Reroll",
          callback: () => resolve("reroll")
        },
        reverse: {
          icon: '<i class="fas fa-exchange-alt"></i>',
          label: "Reverse Result",
          callback: () => resolve("reverse")
        },
        accept: {
          icon: '<i class="fas fa-check"></i>',
          label: "Accept Failure",
          callback: () => resolve("accept")
        }
      },
      default: "reroll"
    }).render(true);
  });
  
  if (action === "reroll") {
    ui.notifications.info("Rerolling Fear test...");
    // Nota: A rerolagem real precisaria ser implementada através da API do WFRP4e
    // Por enquanto, o jogador pode rerolar manualmente
  } else if (action === "reverse") {
    // Cria uma nova mensagem indicando que o resultado foi revertido
    const reversedMessage = await ChatMessage.create({
      content: `<div class="wfrp4e chat-card">
        <div class="chat-content">
          <h3>Virtue of Stoicism - Result Reversed</h3>
          <p>The Fear test result has been reversed and is now treated as a <strong>success</strong>.</p>
        </div>
      </div>`,
      speaker: message.speaker,
      flags: {
        "wfrp4e-nom": {
          stoicismReversed: true,
          originalMessageId: message.id
        }
      }
    });
    
    ui.notifications.info("Fear test result reversed - treated as success!");
  }
});

/**
 * Hook para interceptar acertos críticos e aplicar redução da Virtue of the Penitent
 */
Hooks.on("createChatMessage", async (message, options, userId) => {
  // Verifica se é uma mensagem de dano/crítico
  if (!message.content) return;
  
  const content = message.content?.toLowerCase() || "";
  const isCriticalHit = content.includes("critical") || content.includes("crítico") || 
                       message.flags?.wfrp4e?.critical || 
                       message.flags?.wfrp4e?.damage?.critical;
  
  if (!isCriticalHit) return;
  
  let targetActor = null;
  const flagTarget = message.flags?.wfrp4e?.target;
  if (flagTarget) targetActor = game.actors.get(flagTarget);
  if (!targetActor) targetActor = getMessageSpeakerActor(message);
  if (!targetActor) return;
  
  // Verifica se o alvo tem Virtue of the Penitent
  if (!hasPenitentVirtue(targetActor)) return;
  
  console.log("WFRP4e-NoM | Critical hit detected against actor with Penitent virtue");
  
  // Tenta extrair o resultado crítico da mensagem
  let criticalResult = null;
  
  // Tenta encontrar o número do resultado crítico no conteúdo
  const criticalMatch = message.content.match(/(?:critical|crítico).*?(\d+)/i);
  if (criticalMatch) {
    criticalResult = parseInt(criticalMatch[1]);
  }
  
  // Se não encontrou no conteúdo, tenta nos flags
  if (!criticalResult && message.flags?.wfrp4e?.criticalResult) {
    criticalResult = parseInt(message.flags.wfrp4e.criticalResult);
  }
  
  if (criticalResult !== null) {
    // Reduz o resultado crítico em -20
    const reducedResult = Math.max(0, criticalResult - 20);
    
    // Se o resultado reduzido for 0, anula o crítico
    if (reducedResult === 0) {
      // Cria uma mensagem indicando que o crítico foi anulado
      await ChatMessage.create({
        content: `<div class="wfrp4e chat-card">
          <div class="chat-content">
            <h3>Virtue of the Penitent - Critical Negated</h3>
            <p>The critical hit result was reduced to <strong>0</strong> and has <strong>no effect</strong>.</p>
            <p><em>Original critical result: ${criticalResult} → Reduced to: 0</em></p>
          </div>
        </div>`,
        speaker: message.speaker,
        flags: {
          "wfrp4e-nom": {
            penitentNegated: true,
            originalCritical: criticalResult,
            originalMessageId: message.id
          }
        }
      });
      
      ui.notifications.info("Critical hit negated by Virtue of the Penitent!");
    } else {
      // Cria uma mensagem indicando que o crítico foi reduzido
      await ChatMessage.create({
        content: `<div class="wfrp4e chat-card">
          <div class="chat-content">
            <h3>Virtue of the Penitent - Critical Reduced</h3>
            <p>The critical hit result was reduced by <strong>-20</strong>.</p>
            <p><em>Original: ${criticalResult} → Reduced: ${reducedResult}</em></p>
          </div>
        </div>`,
        speaker: message.speaker,
        flags: {
          "wfrp4e-nom": {
            penitentReduced: true,
            originalCritical: criticalResult,
            reducedCritical: reducedResult,
            originalMessageId: message.id
          }
        }
      });
      
      ui.notifications.info(`Critical hit reduced from ${criticalResult} to ${reducedResult} by Virtue of the Penitent!`);
    }
  }
});

/**
 * Hook para tornar todas as armas mágicas para personagens com Virtue of the Penitent
 * Intercepta quando armas são usadas e marca como mágicas
 */
Hooks.on("wfrp4e.preRollWeapon", async (roll, weapon, actor, options) => {
  if (!actor || !weapon) return;
  
  // Verifica se o actor tem Virtue of the Penitent
  if (!hasPenitentVirtue(actor)) return;
  
  // Marca a arma como mágica temporariamente
  if (weapon.system) {
    weapon.system.properties = weapon.system.properties || {};
    weapon.system.properties.magical = true;
  }
  
  console.log("WFRP4e-NoM | Weapon marked as magical for Penitent virtue");
});

/**
 * Hook alternativo para garantir que armas sejam tratadas como mágicas
 * Intercepta quando itens de arma são consultados
 */
Hooks.on("wfrp4e.getWeaponProperties", (weapon, actor, properties) => {
  if (!actor || !weapon) return;
  
  // Verifica se o actor tem Virtue of the Penitent
  if (!hasPenitentVirtue(actor)) return;
  
  // Adiciona propriedade mágica
  if (properties && !properties.includes("magical")) {
    properties.push("magical");
    console.log("WFRP4e-NoM | Added magical property to weapon for Penitent virtue");
  }
});

// Hook alternativo usando preCreateEmbeddedDocuments para capturar antes da criação
Hooks.on("preCreateEmbeddedDocuments", async (documents, result, options, userId) => {
  console.log("WFRP4e-NoM | preCreateEmbeddedDocuments hook triggered", documents);
  
  if (!documents || documents.length === 0) return;
  
  const firstDoc = documents[0];
  if (firstDoc?.documentName !== "Item") return;
  
  for (const doc of documents) {
    const data = doc.toObject ? doc.toObject() : doc;
    // IMPORTANTE: Verifica apenas o nome exato "Knightly Virtue" para evitar loop
    if ((data.type === "talent" || data.type === "skill" || data.type === "trait") && 
        data.name === "Knightly Virtue") {
      console.log("WFRP4e-NoM | preCreateEmbeddedDocuments: Knightly Virtue detected", data);
    }
  }
});

// Hook que monitora quando itens são criados - versão alternativa
Hooks.on("createItem", async (item, options, userId) => {
  console.log("WFRP4e-NoM | createItem hook triggered", item);
  
  if (!item || !item.parent) return;
  
  const actor = item.parent;
  const isTalent = item.type === "talent" || item.type === "skill" || item.type === "trait";
  // IMPORTANTE: Verifica apenas o nome exato "Knightly Virtue" para evitar loop com "Knightly Virtue (NomeDaVirtude)"
  const isKnightlyVirtue = item.name === "Knightly Virtue";
  
  // Verifica se já está processando este item
  const itemKey = `${actor.id}-${item.id}`;
  if (processingItems.has(itemKey)) {
    console.log("WFRP4e-NoM | Item already being processed, skipping");
    return;
  }
  
  console.log("WFRP4e-NoM | createItem check:", {
    name: item.name,
    type: item.type,
    isTalent,
    isKnightlyVirtue,
    actor: actor?.name,
    isOwner: actor?.isOwner
  });
  
  if (isTalent && isKnightlyVirtue && actor?.isOwner) {
    processingItems.add(itemKey);
    console.log("WFRP4e-NoM | createItem: Knightly Virtue detected, showing dialog");
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await showKnightlyVirtueDialog(actor, item);
    } finally {
      // Remove da flag após processar (com delay para garantir que a substituição foi feita)
      setTimeout(() => processingItems.delete(itemKey), 1000);
    }
  }
});

/**
 * Hook para detectar quando um item embedded é criado em um actor
 * Usa o hook createEmbeddedDocuments que é disparado quando itens são adicionados a um actor
 */
Hooks.on("createEmbeddedDocuments", async (documents, result, options, userId) => {
  console.log("WFRP4e-NoM | createEmbeddedDocuments hook triggered", documents, result);
  
  // Verifica se são itens
  if (!documents || documents.length === 0) {
    return;
  }
  
  const firstDoc = documents[0];
  console.log("WFRP4e-NoM | First document:", {
    documentName: firstDoc?.documentName,
    type: firstDoc?.type,
    name: firstDoc?.name,
    constructor: firstDoc?.constructor?.name,
    document: firstDoc
  });
  
  // Verifica se é um Item (pode ser Item ou o nome da classe)
  const isItem = firstDoc?.documentName === "Item" || 
                 firstDoc?.constructor?.name === "Item" ||
                 (firstDoc?.type && firstDoc?.parent);
  
  if (!isItem) {
    console.log("WFRP4e-NoM | Not an Item, skipping");
    return;
  }

  // Aguarda um pouco mais para garantir que o item foi completamente criado
  await new Promise(resolve => setTimeout(resolve, 300));

  for (const doc of documents) {
    // Tenta obter o actor do documento ou do resultado
    let actor = doc.parent;
    let itemId = doc.id;
    
    // Se não tem parent, tenta buscar pelo resultado
    if (!actor && result && result.length > 0) {
      itemId = result[0]?.id || doc.id;
      // Tenta encontrar o actor que possui este item
      for (const a of game.actors) {
        const foundItem = a.items.find(i => i.id === itemId);
        if (foundItem) {
          actor = a;
          break;
        }
      }
    }
    
    console.log("WFRP4e-NoM | Checking document:", {
      type: doc.type,
      name: doc.name,
      documentName: doc.documentName,
      itemId: itemId,
      actor: actor?.name
    });
    
    // Verifica se é o talento "Knightly Virtue" (verifica tanto "talent" quanto outros tipos possíveis)
    // IMPORTANTE: Verifica apenas o nome exato "Knightly Virtue" para evitar loop com "Knightly Virtue (NomeDaVirtude)"
    const isTalent = doc.type === "talent" || doc.type === "skill" || doc.type === "trait";
    const isKnightlyVirtue = doc.name === "Knightly Virtue";
    
    // Verifica se já está processando este item
    const itemKey = `${actor?.id}-${itemId}`;
    if (processingItems.has(itemKey)) {
      console.log("WFRP4e-NoM | Item already being processed, skipping");
      continue;
    }
    
    console.log("WFRP4e-NoM | Is talent type?", isTalent, "Is Knightly Virtue?", isKnightlyVirtue);
    
    if (isTalent && isKnightlyVirtue && actor) {
      console.log("WFRP4e-NoM | Actor found:", actor?.name, "Is owner?", actor?.isOwner);
      
      // Verifica se o actor existe e se o usuário atual é o dono
      if (!actor.isOwner) {
        console.log("WFRP4e-NoM | User is not owner, skipping");
        continue;
      }

      // Busca o item criado no actor
      const item = actor.items.find(i => i.id === itemId);
      console.log("WFRP4e-NoM | Item found in actor:", item?.name, item?.id);
      
      if (item) {
        processingItems.add(itemKey);
        console.log("WFRP4e-NoM | Showing dialog for:", item.name);
        try {
          // Exibe o diálogo de seleção
          await showKnightlyVirtueDialog(actor, item);
        } finally {
          // Remove da flag após processar (com delay para garantir que a substituição foi feita)
          setTimeout(() => processingItems.delete(itemKey), 1000);
        }
      } else {
        console.warn("WFRP4e-NoM | Item not found in actor after creation, trying again...");
        // Tenta novamente após mais um delay
        await new Promise(resolve => setTimeout(resolve, 200));
        const retryItem = actor.items.find(i => i.id === itemId || i.name === "Knightly Virtue");
        if (retryItem) {
          console.log("WFRP4e-NoM | Item found on retry, showing dialog");
          await showKnightlyVirtueDialog(actor, retryItem);
        }
      }
      break; // Processa apenas o primeiro Knightly Virtue encontrado
    }
  }
});

/**
 * Cria efeitos específicos para cada virtude
 * @param {string} virtueName - Nome da virtude
 * @returns {Array} Array de objetos de efeito
 */
function getVirtueSpecificEffects(virtueName) {
  const effects = [];
  
  // Virtue of the Joust: +20 bonus to Melee (Calvary) when using Lance or Half-Lance
  if (virtueName === "Virtue of the Joust") {
    effects.push({
      label: "Jousting Bonus",
      icon: "icons/svg/upgrade.svg",
      origin: null, // Será definido quando o efeito for criado
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [
        {
          key: "system.skills.melee.calvary.modifier",
          mode: 2, // ADD mode (2 = ADD, 5 = OVERRIDE, etc.)
          value: "20",
          priority: 20
        }
      ],
      transfer: false,
      flags: {
        wfrp4e: {
          description: "Bonus of +20 to Melee (Calvary) when using Lance or Half-Lance"
        }
      }
    });
  }
  
  // Virtue of Stoicism: Reroll or reverse Fear test results on failure
  if (virtueName === "Virtue of Stoicism") {
    effects.push({
      label: "Stoic Resolve",
      icon: "icons/svg/shield.svg",
      origin: null, // Será definido quando o efeito for criado
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [],
      transfer: false,
      flags: {
        wfrp4e: {
          description: "When failing a Fear test, you may reroll or reverse the result"
        },
        "wfrp4e-nom": {
          stoicism: true
        }
      }
    });
  }
  
  // Virtue of the Penitent: All weapons count as magical, critical hits against the character are reduced by -20
  if (virtueName === "Virtue of the Penitent") {
    effects.push({
      label: "Penitent's Blessing",
      icon: "icons/svg/holy-symbol.svg",
      origin: null, // Será definido quando o efeito for criado
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null
      },
      disabled: false,
      changes: [], // As armas serão marcadas como mágicas via hook
      transfer: false,
      flags: {
        wfrp4e: {
          description: "All weapons count as magical. Critical hits against this character are reduced by -20. Critical hits with result 0 have no effect."
        },
        "wfrp4e-nom": {
          penitent: true,
          weaponsMagical: true
        }
      }
    });
  }
  
  return effects;
}

/**
 * Exibe o diálogo para o jogador escolher entre as 14 virtudes disponíveis
 * @param {Actor} actor - O actor que possui o talento
 * @param {Item} knightlyVirtueItem - O item "Knightly Virtue" que será substituído
 */
async function showKnightlyVirtueDialog(actor, knightlyVirtueItem) {
  console.log("WFRP4e-NoM | showKnightlyVirtueDialog called", actor?.name, knightlyVirtueItem?.name);
  
  // Define as 14 virtudes disponíveis
  const options = [
    {
      id: "audacity",
      name: "Virtue of Audacity"
    },
    {
      id: "confidence",
      name: "Virtue of Confidence"
    },
    {
      id: "discipline",
      name: "Virtue of Discipline"
    },
    {
      id: "duty",
      name: "Virtue of Duty"
    },
    {
      id: "empathy",
      name: "Virtue of Empathy"
    },
    {
      id: "heroism",
      name: "Virtue of Heroism"
    },
    {
      id: "ideal",
      name: "Virtue of Ideal"
    },
    {
      id: "impetuous-knight",
      name: "Virtue of Impetuous Knight"
    },
    {
      id: "joust",
      name: "Virtue of the Joust"
    },
    {
      id: "knight-temper",
      name: "Virtue of Knight Temper"
    },
    {
      id: "noble-disdain",
      name: "Virtue of Noble Disdain"
    },
    {
      id: "penitent",
      name: "Virtue of the Penitent"
    },
    {
      id: "purity",
      name: "Virtue of Purity"
    },
    {
      id: "stoicism",
      name: "Virtue of Stoicism"
    }
  ];

  // Busca os ícones e descrições dos talentos
  const optionsWithIcons = await Promise.all(options.map(async (opt) => {
    let icon = "icons/svg/item-bag.svg"; // Ícone padrão
    let description = ""; // Descrição padrão
    
    // Busca o talento no mundo
    let talent = game.items.find(i => i.name === opt.name && i.type === "talent");
    
    // Se não encontrou, busca nos compendiums
    if (!talent) {
      for (const pack of game.packs) {
        if (pack.documentName === "Item" && pack.indexed) {
          const index = pack.index;
          const entry = index.find(e => e.name === opt.name);
          if (entry) {
            const item = await pack.getDocument(entry._id);
            if (item && item.type === "talent") {
              talent = item;
              break;
            }
          }
        }
      }
    }
    
    if (talent) {
      if (talent.img) {
        icon = talent.img;
      }
      
      // Busca a descrição (pode estar em diferentes locais dependendo do sistema)
      if (talent.system?.description?.value) {
        description = talent.system.description.value;
      } else if (talent.system?.description) {
        description = typeof talent.system.description === 'string' 
          ? talent.system.description 
          : talent.system.description.value || "";
      } else if (talent.description) {
        description = typeof talent.description === 'string' 
          ? talent.description 
          : talent.description.value || "";
      }
      
      // Limpa HTML tags se houver e limita o tamanho
      if (description) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        description = tempDiv.textContent || tempDiv.innerText || '';
        // Limita a descrição a 200 caracteres
        if (description.length > 200) {
          description = description.substring(0, 197) + '...';
        }
      }
    }
    
    return {
      ...opt,
      icon: icon,
      description: description
    };
  }));

  // Cria o conteúdo HTML do diálogo com a nova interface
  const content = `
    <form style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Texto de instrução no topo -->
      <div style="margin-bottom: 0;">
        <p style="margin: 0; color: #666; font-size: 0.95em; line-height: 1.4;">
          Select Virtue, if no selection is made, enter one manually.
        </p>
      </div>
      
      <!-- Caixa de opções no meio -->
      <div style="flex: 1; display: flex; flex-direction: column;">
        <div style="max-height: 450px; overflow-y: auto; border: 1px solid #ccc; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.02);">
          ${optionsWithIcons.map((opt, index) => `
            <div class="virtue-option" 
                 data-virtue-id="${opt.id}"
                 data-virtue-name="${opt.name}"
                 style="display: flex; align-items: flex-start; padding: 10px; margin-bottom: 4px; border-radius: 3px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent;"
                 onmouseover="this.style.background='rgba(0,0,0,0.08)'; this.style.borderColor='rgba(66,153,225,0.5)'" 
                 onmouseout="if(!this.classList.contains('selected')) { this.style.background='transparent'; this.style.borderColor='transparent'; }">
              <input type="radio" id="virtue-${opt.id}" name="virtue" value="${opt.id}" 
                     style="margin-right: 12px; cursor: pointer; display: none;">
              <img src="${opt.icon}" 
                   style="width: 36px; height: 36px; margin-right: 12px; border: none; flex-shrink: 0; margin-top: 2px;"
                   onerror="this.src='icons/svg/item-bag.svg'">
              <div style="flex: 1; display: flex; flex-direction: column;">
                <label for="virtue-${opt.id}" 
                       style="font-weight: 500; cursor: pointer; user-select: none; margin: 0 0 4px 0; font-size: 0.95em;">
                  ${opt.name}
                </label>
                ${opt.description ? `
                  <p style="margin: 0; color: #666; font-size: 0.85em; line-height: 1.3; font-style: italic;">
                    ${opt.description}
                  </p>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Campo manual no final -->
      <div style="margin-top: 0; border-top: 1px solid #ddd; padding-top: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9em;">
          Or enter manually:
        </label>
        <input type="text" id="manual-virtue-input" 
               placeholder="Enter virtue name manually..."
               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 0.9em; box-sizing: border-box;">
      </div>
    </form>
    <style>
      .virtue-option.selected {
        background: rgba(66,153,225,0.15) !important;
        border-color: rgba(66,153,225,0.8) !important;
      }
      .virtue-option label {
        pointer-events: none;
      }
    </style>
    <script>
      (function() {
        const options = document.querySelectorAll('.virtue-option');
        const manualInput = document.getElementById('manual-virtue-input');
        
        options.forEach(option => {
          option.addEventListener('click', function() {
            // Remove seleção anterior
            options.forEach(opt => {
              opt.classList.remove('selected');
              opt.style.background = 'transparent';
              opt.style.borderColor = 'transparent';
            });
            
            // Seleciona esta opção
            this.classList.add('selected');
            this.style.background = 'rgba(66,153,225,0.15)';
            this.style.borderColor = 'rgba(66,153,225,0.8)';
            
            // Marca o radio button
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            
            // Limpa o input manual
            if (manualInput) manualInput.value = '';
          });
        });
        
        // Quando digitar no input manual, desmarca as opções
        if (manualInput) {
          manualInput.addEventListener('input', function() {
            if (this.value.trim()) {
              options.forEach(opt => {
                opt.classList.remove('selected');
                opt.style.background = 'transparent';
                opt.style.borderColor = 'transparent';
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
              });
            }
          });
        }
      })();
    </script>
  `;

  // Cria e exibe o diálogo com a nova interface
  new Dialog({
    title: "Choice of Virtue",
    content: content,
    width: 550,
    buttons: {
      submit: {
        icon: '<i class="fas fa-check"></i>',
        label: "Submit",
        callback: async (html) => {
          const selectedId = html.find('input[name="virtue"]:checked').val();
          const manualInput = html.find('#manual-virtue-input').val()?.trim();
          
          let selectedVirtueName = null;
          
          // Verifica se uma opção foi selecionada
          if (selectedId) {
            const selectedOption = options.find(opt => opt.id === selectedId);
            if (selectedOption) {
              selectedVirtueName = selectedOption.name;
            }
          }
          
          // Se não selecionou, usa o input manual
          if (!selectedVirtueName && manualInput) {
            selectedVirtueName = manualInput;
          }
          
          // Se ainda não tem seleção, retorna erro
          if (!selectedVirtueName) {
            ui.notifications.warn("Please select a virtue or enter one manually.");
            return false;
          }

          try {
            // Busca o talento correspondente à opção selecionada
            // Primeiro tenta encontrar no mundo, depois nos compendiums
            let replacementTalent = null;
            
            // Busca no mundo primeiro
            replacementTalent = game.items.find(i => 
              i.name === selectedVirtueName && 
              i.type === "talent"
            );
            
            // Se não encontrou no mundo, busca nos compendiums
            if (!replacementTalent) {
              for (const pack of game.packs) {
                if (pack.documentName === "Item" && pack.indexed) {
                  const index = pack.index;
                  const entry = index.find(e => e.name === selectedVirtueName);
                  if (entry) {
                    const item = await pack.getDocument(entry._id);
                    if (item && item.type === "talent") {
                      replacementTalent = item;
                      break;
                    }
                  }
                }
              }
            }

            // Se não encontrou o talento, cria um novo com o nome fornecido
            if (!replacementTalent) {
              console.log("WFRP4e-NoM | Talent not found, creating new one with name:", selectedVirtueName);
              
              // Cria um novo talento baseado no Knightly Virtue
              const baseData = knightlyVirtueItem.toObject();
              baseData.name = `Knightly Virtue (${selectedVirtueName})`;
              
              // Remove efeitos do objeto (serão copiados depois se existirem)
              if (baseData.effects) {
                delete baseData.effects;
              }
              
              // Remove o Knightly Virtue original
              await actor.deleteEmbeddedDocuments("Item", [knightlyVirtueItem.id]);
              
              // Adiciona o novo talento
              const createdItems = await actor.createEmbeddedDocuments("Item", [baseData]);
              
              // Copia os efeitos do Knightly Virtue original se existirem
              if (createdItems.length > 0 && knightlyVirtueItem.effects && knightlyVirtueItem.effects.size > 0) {
                const createdItem = createdItems[0];
                const effectsToCreate = knightlyVirtueItem.effects.map(effect => {
                  const effectData = effect.toObject();
                  delete effectData._id;
                  if (effectData.flags) {
                    effectData.flags = foundry.utils.deepClone(effectData.flags);
                  }
                  return effectData;
                });
                
                if (effectsToCreate.length > 0) {
                  try {
                    await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
                    console.log(`WFRP4e-NoM | Copied ${effectsToCreate.length} effects from Knightly Virtue`);
                  } catch (effectError) {
                    console.warn("WFRP4e-NoM | Error copying effects:", effectError);
                  }
                }
              }
              
              ui.notifications.info(`Virtue "${selectedVirtueName}" added successfully!`);
              return true;
            }

            // Remove o talento "Knightly Virtue"
            await actor.deleteEmbeddedDocuments("Item", [knightlyVirtueItem.id]);

            // Adiciona o talento escolhido com o nome modificado
            const talentData = replacementTalent.toObject();
            // Renomeia o talento para "Knightly Virtue (NomeDaVirtude)"
            talentData.name = `Knightly Virtue (${selectedVirtueName})`;
            
            // Remove efeitos do objeto (serão adicionados depois como embedded documents)
            if (talentData.effects) {
              delete talentData.effects;
            }
            
            // Cria o item no actor
            const createdItems = await actor.createEmbeddedDocuments("Item", [talentData]);
            
            // Copia os efeitos do talento original após criar o item
            if (createdItems.length > 0) {
              const createdItem = createdItems[0];
              const effectsToCreate = [];
              
              // Verifica se o talento original tem efeitos embedded
              if (replacementTalent.effects && replacementTalent.effects.size > 0) {
                replacementTalent.effects.forEach(effect => {
                  const effectData = effect.toObject();
                  // Remove o ID do efeito para criar um novo
                  delete effectData._id;
                  // Remove flags que podem causar problemas
                  if (effectData.flags) {
                    effectData.flags = foundry.utils.deepClone(effectData.flags);
                  }
                  effectsToCreate.push(effectData);
                });
              }
              
              // Adiciona efeitos específicos da virtude
              const virtueSpecificEffects = getVirtueSpecificEffects(selectedVirtueName);
              virtueSpecificEffects.forEach(effect => {
                const effectData = {
                  ...effect,
                  origin: createdItem.uuid // Define a origem como o item criado
                };
                effectsToCreate.push(effectData);
              });
              
              if (effectsToCreate.length > 0) {
                try {
                  await createdItem.createEmbeddedDocuments("ActiveEffect", effectsToCreate);
                  console.log(`WFRP4e-NoM | Added ${effectsToCreate.length} effects to ${selectedVirtueName}`);
                } catch (effectError) {
                  console.warn("WFRP4e-NoM | Error adding effects:", effectError);
                  // Continua mesmo se houver erro ao adicionar efeitos
                }
              }
            }

            ui.notifications.info(`Virtue "${selectedVirtueName}" added successfully!`);
            
          } catch (error) {
            console.error("WFRP4e-NoM | Erro ao substituir Knightly Virtue:", error);
            ui.notifications.error("Error replacing the talent. Check the console for details.");
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
        callback: async () => {
          // Não remove o Knightly Virtue se o usuário cancelar - deixa ele na ficha
          ui.notifications.info("Selection cancelled. The Knightly Virtue talent remains on the sheet.");
        }
      }
    },
    default: "submit",
    close: async (html) => {
      // Não remove o Knightly Virtue se o diálogo for fechado - deixa ele na ficha
      // O jogador pode tentar novamente depois
    }
  }).render(true);
}

