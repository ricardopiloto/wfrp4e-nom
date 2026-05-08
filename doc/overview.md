# WFRP4e - Nations of Mankind (wfrp4e-nom)

**Versão:** 1.1.2  
**Autor:** Ricardo Sobral (ac.ricardosobral@gmail.com)  
**Compatibilidade Foundry VTT:** mínimo v13, verificado v14  
**Dependências:** `wfrp4e-core`, `wfrp4e-more-subspecies`

---

## O que é este módulo?

Este módulo implementa o suplemento não-oficial *Nations of Mankind* para Warhammer Fantasy Roleplay 4th Edition no Foundry VTT. Adiciona novas carreiras, talentos, itens, journals e automações de regras especiais oriundas de nações do Velho Mundo e além (Nippon, Norsca, Kislev, Araby, Catai, Estália, Bretonnia, etc.).

---

## Estrutura do Repositório

```
wfrp4e-nom/
├── module.json                        # Manifesto do módulo Foundry
├── scripts/                           # Módulos JavaScript (carregados em runtime)
│   ├── talent-option-picker-app.js    # UI de seleção de talentos (radio picker)
│   ├── career-talent-registration.js  # Integração com carreiras
│   ├── talent-specialization-handler.js # Handler centralizado de substituição de talentos
│   └── knightly-virtue.js             # Mecânicas especiais de Virtudes Cavaleirescas
├── templates/
│   └── nom-talent-radio-options.hbs   # Template Handlebars do picker de talentos
├── effects/                           # Scripts de Active Effects (referência, não carregados)
│   ├── path-of-iron-novice.*
│   ├── path-of-iron-apprentice.*
│   └── path-of-death.*
├── packs-src/                         # Fonte dos compêndios (JSON, versionado em Git)
│   ├── nom-items/ …                   # Um ficheiro .json por documento Foundry
│   ├── nom-journals/ …
│   └── nom-tables/ …
├── packs/                             # Compêndios LevelDB (gerados localmente ou na CI; ver .gitignore)
├── icons/                             # Assets (ícones de carreiras, talentos, magias, etc.)
├── doc/                               # Documentação técnica
│   ├── overview.md                    # Este arquivo
│   ├── wfrp4e/                        # Documentação de efeitos WFRP4e
│   └── daily/                         # Logs diários de desenvolvimento
└── openspec/                          # Sistema de especificações de mudança
```

---

## Compêndios

| Pack            | Tipo         | Conteúdo                                                    |
|-----------------|--------------|-------------------------------------------------------------|
| `nom-items`     | Item         | Talentos, armas, armaduras, equipamentos e habilidades      |
| `nom-journals`  | JournalEntry | Materiais de referência e descrições de regras              |
| `nom-tables`    | RollTable    | Tabelas de rolagem para geração de conteúdo                 |

---

## Módulos JavaScript em Runtime

Apenas estes quatro arquivos são carregados pelo Foundry em tempo de execução:

### `scripts/talent-option-picker-app.js`

Fornece a classe `NomTalentRadioPicker` (ApplicationV2 + HandlebarsApplicationMixin) e a função utilitária `enrichTalentOptionsByName`.

**Responsabilidades:**
- Renderizar o dialog de seleção com botões de radio, ícone, nome e descrição de cada opção
- Enriquecer descritores de talentos buscando ícones e descrições nos itens do mundo e nos compêndios
- Suportar campo de entrada manual opcional
- Emitir o valor selecionado via Promise para o chamador

**API pública:**
- `enrichTalentOptionsByName(descriptors)` — retorna array de descritores enriquecidos com `img` e `description`
- `NomTalentRadioPicker` — ApplicationV2 parametrizado por `{ title, intro, radioName, options, showManualInput, manualLabel, manualPlaceholder }`

---

### `scripts/career-talent-registration.js`

Utilitários para integrar talentos escolhidos com a carreira ativa do ator.

**Responsabilidades:**
- Marcar item de talento com `system.advances.force = true` (Force Advancement)
- Adicionar o nome do talento à lista de talentos da carreira atual via `careers.talents.add()`

**API pública:**
- `applyForceAdvancementToTalentItemData(itemData)` — modifica `itemData` in-place
- `appendTalentNameToCurrentCareer(actor, talentName)` — busca a carreira atual do ator e adiciona o talento

---

### `scripts/talent-specialization-handler.js`

Handler centralizado que captura a criação de talentos genéricos e os substitui pela versão especializada escolhida pelo jogador.

**Talentos gerenciados:**

| Talento genérico       | Opções disponíveis | Force Adv. | Career Reg. |
|------------------------|--------------------|:----------:|:-----------:|
| Knightly Virtue        | 14 virtudes        | Não        | Não         |
| Grail Virtue           | 14 virtudes        | Não        | Não         |
| Martial Artist         | 8 caminhos         | Sim        | Sim         |
| Mark of the Gods       | 5 marcas do Caos   | Sim        | Sim         |
| Kenjutsu (Style)       | 8 estilos          | Sim        | Sim         |

**Fluxo de substituição:**
1. Hook `createItem` / `createEmbeddedDocuments` detecta talento genérico
2. Após 300ms (debounce), `NomTalentRadioPicker` é exibido
3. Jogador seleciona a opção
4. Item genérico é deletado do ator
5. Item de substituição é criado (via compêndio ou clone)
6. Active Effects são mesclados (base + substituto + efeitos específicos de virtude)
7. Force Advancement e registro na carreira são aplicados conforme configuração
8. Notificação de sucesso é exibida

**Controle de processamento:**
- `Set` chamado `processing` previne execução duplicada por debounce de 300ms
- Timeout de 1000ms após conclusão limpa o controle

**Efeitos específicos de Virtudes Cavaleirescas:**
- `Joust` — +10 em testes de arma montada (`riding` quality) via Active Effect
- `Stoicism` — flag `wfrp4e-nom.stoicism` para mecânica de rolar novamente testes de Medo
- `Penitent` — flag `wfrp4e-nom.penitent` para redução de resultados críticos e armas mágicas

---

### `scripts/knightly-virtue.js`

Implementa as mecânicas especiais das virtudes Stoicism e Penitent. A seleção e substituição da virtude é feita pelo `talent-specialization-handler.js`; este arquivo cuida apenas das regras de jogo.

**Virtue of Stoicism:**
- Escuta o hook `createChatMessage` por falhas em testes de Medo
- Exibe menu com três opções: Rolar novamente / Reverter (tratar como sucesso) / Aceitar
- Registra a reversão em mensagem de chat subsequente

**Virtue of the Penitent:**
- Intercepta acertos críticos contra portadores da virtude via hook de dano oposto
- Reduz o resultado crítico em −20 (ou o nega se for 0)
- Marca todas as armas do portador como mágicas via hook `wfrp4e.preRollWeapon`
- Posta mensagens de chat com os detalhes da redução

**Detecção de virtude:**
- Verifica item com nome moderno (`"Virtue of Stoicism"`) **ou** nome legado (`"Knightly Virtue (Virtue of Stoicism)"`)
- Também aceita flag `wfrp4e-nom.stoicism` / `wfrp4e-nom.penitent` em Active Effects

---

## Template Handlebars

### `templates/nom-talent-radio-options.hbs`

Template compartilhado por todos os pickers de radio.

**Estrutura:**
- Parágrafo de introdução configurável
- Grid de opções com scroll (altura máxima 450px): radio button, ícone 36×36px, nome, descrição (max 200 chars)
- Campo de entrada manual opcional (desseleciona radio automaticamente)
- Botões Cancel e Submit no rodapé

**Variáveis de contexto esperadas:**

| Variável          | Tipo      | Descrição                                             |
|-------------------|-----------|-------------------------------------------------------|
| `intro`           | string    | Texto de introdução do dialog                         |
| `radioName`       | string    | Atributo `name` dos inputs radio                      |
| `options`         | array     | `[{ value, label, img, description }]`                |
| `showManualInput` | boolean   | Exibe campo de texto manual                           |
| `manualLabel`     | string    | Label do campo manual                                 |
| `manualPlaceholder` | string  | Placeholder do campo manual                           |

---

## Scripts de Active Effects (Referência)

Os arquivos em `effects/` **não são carregados** em runtime. São corpos de script para copiar nos campos de Active Effects do Foundry. Documentados em [doc/wfrp4e/path-of-iron-active-effects.md](wfrp4e/path-of-iron-active-effects.md).

### Path of Iron — Novice (Aprendiz)

| Script                              | Gatilho             | O que faz                                                         |
|-------------------------------------|---------------------|-------------------------------------------------------------------|
| `path-of-iron-novice.enable.js`     | Enable condition    | Ativa se o talento tiver ≥1 avanço                                |
| `path-of-iron-novice.prepareItem.js`| `prepareItem` hook  | Adiciona qualidade `pummel` a armas desarmadas/brawling            |
| `path-of-iron-novice.preRollWeaponTest.js` | `preRollWeaponTest` | Garante que Pummel e Undamaging apareçam no cartão de teste  |

### Path of Iron — Apprentice (Intermediário)

| Script                                    | Gatilho             | O que faz                                                         |
|-------------------------------------------|---------------------|-------------------------------------------------------------------|
| `path-of-iron-apprentice.enable.js`       | Enable condition    | Ativa se o talento tiver ≥2 avanços                               |
| `path-of-iron-apprentice.prepareItem.js`  | `prepareItem` hook  | Gerencia bônus de dano +1 sem duplicação                          |
| `path-of-iron-apprentice.preRollWeaponTest.js` | `preRollWeaponTest` | Previne double-apply de SB, limita a SB+6                   |

### Path of Death — Unarmed vs Undead

| Script                                              | Gatilho                  | O que faz                                          |
|-----------------------------------------------------|--------------------------|----------------------------------------------------|
| `path-of-death.unarmed-vs-undead.calculateOpposedDamage.js` | `calculateOpposedDamage` | Aplica `Damaging` contra mortos-vivos              |
| `path-of-death.unarmed-vs-undead.preRollWeaponTest.js`      | `preRollWeaponTest`      | Tenta mostrar Damaging no cartão (parcialmente funcional) |

---

## Opções de Talento por Tipo

### Knightly Virtue / Grail Virtue (14 virtudes cada)

Audacity · Confidence · Discipline · Duty · Empathy · Heroism · Ideal · Impetuous Knight · Joust · Knight Temper · Noble Disdain · Penitent · Purity · Stoicism

### Martial Artist (8 caminhos)

Path of the Flame · Path of Iron · Path of Shadows · Path of the Beast · Path of the Heavens · Path of Light · Path of Life · Path of Death

### Mark of the Gods (5 marcas)

The Hound (Khorne) · The Crow (Nurgle) · The Serpent (Slaanesh) · The Eagle (Tzeentch) · The Eight-Pointed Star (Undivided)

### Kenjutsu (Style) (8 estilos)

Way of the Tortoise · Way of the Crane · Way of the Dragon · Way of the Tiger · Way of the Naga · Way of the Snake · Way of the Stag · Way of the Nio

---

## Carreiras Implementadas

| Status | Carreira                  |
|:------:|---------------------------|
| ✅     | Arabyan Janissary         |
| ✅     | Cathayan Dragon Monk      |
| ✅     | Estalian Almogavar        |
| ✅     | Kislev Kossar             |
| ✅     | Kislev Winged Lancer      |
| ✅     | Nippon Ninja              |
| ✅     | Nippon Samurai            |
| ✅     | Norscan Mercenary         |
| ✅     | Vimto Monks               |
| ✅     | Bretonnian Knight         |
| ✅     | Grail Knight              |

---

## Assets (Ícones)

```
icons/
├── careers/      # Ícones de carreira por nação
├── talents/      # Ícones de talentos específicos do módulo
├── spells/       # Magias (Desert Magic, Ice Magic)
├── prayers/      # Orações (Araby, Ind, Kislev, Nippon)
├── trappings/    # Equipamentos (armor/, weapons/, siege-weapons/)
└── pages/        # Imagens de páginas de journal
```

---

## Build & Deploy

O módulo usa GitHub Actions. Ao publicar uma release:
1. O workflow cria um ZIP excluindo `doc/`, `effects/`, `.git`, `node_modules` e arquivos de desenvolvimento
2. Anexa `{id}.zip` e `module.json` à release
3. O manifest aponta para `/releases/latest/download/module.json`

---

## OpenSpec

O diretório `openspec/` implementa um sistema de propostas orientadas a especificações para controlar mudanças de forma estruturada. Ver [openspec/AGENTS.md](../openspec/AGENTS.md) para instruções completas.

**Estrutura:**
- `openspec/specs/` — capacidades já deployadas (fonte da verdade)
- `openspec/changes/` — propostas em andamento
- `openspec/changes/archive/` — mudanças concluídas

Cada capacidade em `specs/` descreve seus requisitos com cenários no formato **WHEN / THEN**.
