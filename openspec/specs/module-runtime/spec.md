# module-runtime Specification

## Purpose

Comportamento de runtime do módulo wfrp4e-nom alinhado à API pública do Foundry VTT (mensagens de chat, atores, manifest).
## Requirements
### Requirement: Resolução de ator a partir de ChatMessage

O módulo SHALL obter o personagem associado a uma mensagem de chat usando a API pública do Foundry quando disponível (`ChatMessage#speakerActor`), com fallback para `game.actors.get` com o id em `speaker.actor`.

#### Scenario: Mensagem com speakerActor

- **WHEN** uma mensagem de chat expõe `speakerActor` não nulo
- **THEN** o módulo usa esse documento `Actor` para lógica que depende do autor da rolagem

#### Scenario: Mensagem apenas com id em speaker

- **WHEN** `speakerActor` não está disponível mas `speaker.actor` contém um id válido
- **THEN** o módulo resolve o ator via `game.actors.get(id)`

### Requirement: Rolagem principal em mensagens de chat

O módulo SHALL tratar mensagens com uma ou mais rolagens: usar `message.roll` quando existir; caso contrário usar o primeiro elemento de `message.rolls` quando presente.

#### Scenario: Mensagem com rolls[]

- **WHEN** `message.roll` é indefinido mas `message.rolls` tem pelo menos uma rolagem
- **THEN** o módulo usa a primeira rolagem para verificação de falha e metadados dependentes de `Roll`

### Requirement: Helper de teste sem ownedTokens na coleção Actors

O módulo SHALL resolver um ator para `testKnightlyVirtue` usando token controlado, personagem atribuído ao usuário (`game.user.character`), ou um ator possuído pelo usuário, sem depender de `game.actors.ownedTokens`.

#### Scenario: Jogador com personagem atribuído

- **WHEN** não há token selecionado mas `game.user.character` aponta para um ator
- **THEN** o helper de teste usa esse ator

### Requirement: Declaração de compatibilidade Foundry

O manifest do módulo SHALL declarar `compatibility.minimum` compatível com a linha 13 e `compatibility.verified` alinhada à API documentada em [foundryvtt.com/api](https://foundryvtt.com/api/) (v14 no ciclo atual).

#### Scenario: Manifest

- **WHEN** um usuário ou ferramenta lê `module.json`
- **THEN** `verified` reflete a versão do Foundry usada para validar o módulo (14) e `minimum` permanece 13 salvo decisão de quebra intencional

