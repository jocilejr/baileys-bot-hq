

# Plano: Funções de Finalização de Bloco

## Conceito
Adicionar dois novos tipos de nó — `waitMessage` (Esperar Mensagem) e `waitClick` (Aguardar Clique no Link) — que funcionam como **finalizadores de bloco**. Quando um deles é o último step de um grupo, o botão "Adicionar passo" desaparece e não é possível dockar novos nós nesse grupo.

## Implementação

### 1. `src/types/chatbot.ts`
- Adicionar `"waitMessage"` e `"waitClick"` ao `FlowNodeType`
- Adicionar configs em `nodeTypeConfig` (categoria `"logic"`, ícones `MessageCircle` e `MousePointerClick`)
- Adicionar constante `BLOCK_FINISHERS: FlowNodeType[] = ["waitMessage", "waitClick"]` exportada
- Adicionar cases em `getDefaultNodeData`
- Adicionar `"logic"` ao `categoryLabels` (já existe)

### 2. `src/components/chatbot/GroupNode.tsx`
- Importar `BLOCK_FINISHERS`
- Computar `isSealed = steps.length > 0 && BLOCK_FINISHERS.includes(steps[steps.length - 1].type)`
- Se `isSealed`: ocultar botão "Adicionar passo"
- Renderizar o step finalizador com visual diferenciado (borda tracejada, cor distinta) para indicar que é terminal

### 3. `src/components/chatbot/FlowEditor.tsx`
- No `onNodeDragStop`, ao tentar dockar em um grupo: verificar se o último step é finalizador — se sim, rejeitar o dock (nó permanece independente)
- No listener `group-add-step`: mesma verificação antes de adicionar

### 4. `src/components/chatbot/StepNode.tsx`
- Adicionar os novos ícones (`MessageCircle`, `MousePointerClick`) ao `iconMap`
- Preview text para os novos tipos

### 5. `src/components/chatbot/NodePalette.tsx`
- Os novos tipos já aparecerão automaticamente via `nodeTypeConfig`

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `types/chatbot.ts` | Novos tipos + `BLOCK_FINISHERS` |
| `GroupNode.tsx` | Lógica de sealed + visual do finalizador |
| `FlowEditor.tsx` | Bloquear dock/add em grupos selados |
| `StepNode.tsx` | Ícones e preview dos novos tipos |

