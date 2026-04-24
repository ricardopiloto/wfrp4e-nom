/**
 * Knightly Virtue mechanics (Stoicism / Penitent).
 *
 * Note: The "generic Knightly Virtue -> picker -> sheet replacement" selection flow
 * is handled by the shared specialization handler (`scripts/talent-specialization-handler.js`).
 */

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
  console.log("WFRP4e-NoM | Knightly Virtue mechanics initialized");
});

/**
 * Verifica se um actor tem a Virtue of Stoicism
 * @param {Actor} actor - O actor a verificar
 * @returns {boolean} True se o actor tem Stoicism
 */
function hasStoicismVirtue(actor) {
  if (!actor) return false;
  
  return actor.items.some(item => {
    const n = item.name;
    if (n === "Virtue of Stoicism" || n?.includes("Knightly Virtue (Virtue of Stoicism)")) {
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
    const n = item.name;
    if (n === "Virtue of the Penitent" || n?.includes("Knightly Virtue (Virtue of the Penitent)")) {
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
