# Configuração do Talento Knightly Virtue

Este módulo implementa um sistema automático que detecta quando o talento "Knightly Virtue" é adicionado à ficha de um jogador e exibe um diálogo para escolher entre 14 virtudes diferentes.

## Como Funciona

1. Quando o talento "Knightly Virtue" é adicionado à ficha de um personagem
2. Um diálogo é exibido automaticamente com 14 opções de virtude
3. O jogador escolhe uma das virtudes
4. O talento "Knightly Virtue" é removido e substituído pelo talento escolhido

## Virtudes Disponíveis

O sistema está configurado com as seguintes 14 virtudes:

1. **Virtue of Audacity**
2. **Virtue of Confidence**
3. **Virtue of Discipline**
4. **Virtue of Duty**
5. **Virtue of Empathy**
6. **Virtue of Heroism**
7. **Virtue of Ideal**
8. **Virtue of Impetuous Knight**
9. **Virtue of the Joust**
10. **Virtue of Knight Temper**
11. **Virtue of Noble Disdain**
12. **Virtue of the Penitent**
13. **Virtue of Purity**
14. **Virtue of Stoicism**

## Configuração

As virtudes já estão configuradas no arquivo `scripts/knightly-virtue.js`. Se você precisar modificar os nomes das virtudes (por exemplo, se os nomes dos talentos no Foundry forem diferentes), edite o array `options` na função `showKnightlyVirtueDialog`.

### Localizar as opções

As opções estão definidas no arquivo `scripts/knightly-virtue.js` (aproximadamente linha 51):

```javascript
const options = [
  {
    id: "audacity",
    name: "Virtue of Audacity"
  },
  // ... outras virtudes
];
```

### Modificar nomes (se necessário)

Se os nomes dos talentos no seu Foundry VTT forem diferentes dos nomes padrão, você pode editá-los no array `options`. Os nomes devem corresponder **exatamente** aos nomes dos talentos no seu mundo ou compendium.

## Requisitos

- Os talentos que substituirão o "Knightly Virtue" devem existir no mundo do Foundry VTT ou em um compendium
- Os nomes dos talentos devem corresponder **exatamente** aos nomes configurados no script
- Os talentos devem ser do tipo "talent" no sistema WFRP4e

## Testando

1. Certifique-se de que os talentos de substituição existem no seu mundo
2. Adicione o talento "Knightly Virtue" à ficha de um personagem
3. O diálogo deve aparecer automaticamente
4. Escolha uma opção e verifique se o talento foi substituído corretamente

## Solução de Problemas

### O diálogo não aparece

- Verifique se o nome do talento é exatamente "Knightly Virtue" (case-sensitive)
- Verifique se o talento é do tipo "talent"
- Verifique o console do navegador (F12) para mensagens de erro

### Talento não encontrado

- Verifique se o nome configurado no script corresponde exatamente ao nome do talento no Foundry
- Certifique-se de que o talento existe no mundo ou em um compendium
- Verifique se o talento é do tipo "talent"

### Erro ao substituir

- Verifique o console do navegador para mensagens de erro detalhadas
- Certifique-se de que você tem permissões para modificar o actor

