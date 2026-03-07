

# Plano: Replicar o Flow Builder do repositório de referência

O builder atual diverge significativamente do repositório `simplificandoconversas`. A seguir, as mudanças necessárias para alinhar exatamente.

---

## Resumo das diferenças-chave

O repositório de referência usa:
- **Tipos diferentes**: `waitDelay`, `waitForReply`, `waitForClick`, `action`, `randomizer`, `sendFile`, `aiAgent`, `groupBlock` (vs. nossos `delay`, `waitMessage`, `waitClick`, `assignAgent`, `closeChat`, `setTag`, `httpRequest`, `aiResponse`, `sendDocument`, `sendButtons`, `sendList`)
- **Estrutura de dados diferente**: `FlowStepData` com `{ id, data }` (vs. nosso flat `FlowNodeData[]`)
- **GroupNode completamente diferente**: usa `StepRow` com drag-and-drop nativo (HTML5 draggable), `DragHandle` com `GripVertical`, `Popover` para adicionar ações, toolbar flutuante com Duplicar/Apagar, step-specific rendering (sendText como bubble direta, waitDelay como pill centralizada, condition/action/waitForClick como cards estilizados)
- **StepNode diferente**: trigger com gradient card, regular nodes com `borderTop` colorido, toolbar flutuante, dual outputs via `output-0`/`output-1` IDs
- **Handles maiores**: `!w-3.5 !h-3.5 !border-2 !border-card !rounded-full` com cor do accentColor
- **Saídas do grupo com finalizer**: `"Continuou ✓"` (verde) e `"Se não respondeu ⏱"` (laranja) na borda inferior do grupo, usando `output-0` e `output-1`
- **Audio player inline** no GroupNode
- **PDF thumbnail** com `pdfjs-dist`

---

## Arquivos e mudanças

### 1. `src/types/chatbot.ts` — Reescrever completamente
- Substituir tipos por `waitDelay`, `waitForReply`, `waitForClick`, `action`, `randomizer`, `sendFile`, `aiAgent`, `groupBlock`
- Adicionar `FlowStepData` com `{ id: string; data: FlowNodeData }`
- Campos: `textContent` (não `text`), `audioUrl`, `simulateRecording`, `fileUrl`, `fileName`, `replyVariable`, `replyTimeout`, `replyTimeoutUnit`, `replyFallback`, `actionType`, `actionValue`, `clickUrl`, `clickTimeout`, `clickTimeoutUnit`, `delaySeconds`, `delayRandomMode`, `delayMinSeconds`, `delayMaxSeconds`, `simulateTyping`, `delayPresenceType`, `conditionOperator` com `has_tag`, `paths` (randomizer), `aiSystemPrompt`, `aiModel`, `aiAcceptedMedia`, `aiResponseVariable`, `aiAutoSend`, `aiHistoryCount`, `isDockTarget`
- Exportar `parseWhatsAppFormatting`, `defaultNodeData`, `nodeTypeConfig` com as cores/ícones do repo
- Remover `BLOCK_FINISHERS`, `categoryLabels`, `formatDelay`, `operatorLabels`, `triggerTypeLabels`, `getDefaultNodeData`

### 2. `src/components/chatbot/GroupNode.tsx` — Reescrever completamente
Replicar exatamente o componente do repositório:
- `AudioPreviewPlayer` inline (mini player com waveform bars)
- `StepDuplicateButton` (botão flutuante de cópia)
- `DragHandle` (drag & drop nativo com `GripVertical`)
- `StepRow` — renderização condicional por tipo:
  - `sendText` com conteúdo: bubble direta `bg-secondary/50`
  - `sendImage/sendVideo/sendAudio/sendFile`: card com preview rico
  - `waitDelay`: pill centralizada com delay value
  - `waitForClick`: card estilizado azul com URL
  - `condition`: card vermelho com regra em pills
  - `action`: card laranja com badge de tipo
  - Demais: card genérico com ícone e descrição
- Popover para adicionar ação (bloqueando finishers duplicados)
- Seção de saídas duais quando tem finalizer: `"Continuou ✓"` (verde, `output-0`) e `"Se não respondeu/clicou ⏱"` (laranja, `output-1`)
- Toolbar flutuante com Duplicar e Apagar
- Handles grandes `!w-3.5 !h-3.5` com cor do accent
- Suporte a inter-group drag & drop

### 3. `src/components/chatbot/StepNode.tsx` — Reescrever completamente
- Trigger: gradient card especial
- Regular: card com `borderTop` colorido, toolbar flutuante, body com preview por tipo
- Condition: pills de regra (igual GroupNode inline)
- Action: badge com tipo + valor
- Dual outputs para `waitForReply`/`waitForClick` com timeout > 0
- Handles `!w-3.5 !h-3.5 !border-2 !border-card` com accentColor
- `isDockTarget` highlight azul

### 4. `src/components/chatbot/PropertiesPanel.tsx` — Reescrever completamente
Adaptar aos novos tipos e campos:
- `sendText`: `textContent` com `TextFormatToolbar`
- `sendAudio`: `audioUrl`, `simulateRecording` switch
- `sendFile`: `fileUrl`, `fileName`
- `waitDelay`: `delaySeconds`, `delayRandomMode`, `delayMinSeconds/MaxSeconds`, `simulateTyping`, `delayPresenceType`
- `waitForReply`: `replyVariable`, `replyTimeout`, `replyTimeoutUnit`, `replyFallback`
- `waitForClick`: `clickUrl`, `clickTimeout`, `clickTimeoutUnit`, `clickMessage`
- `action`: `actionType` select, `actionValue`
- `condition`: incluir operador `has_tag`
- `randomizer`: `paths` slider
- `aiAgent`: prompt, modelo, media aceita, temperatura, tokens, histórico
- Suporte a `selectedStepId` e `onUpdateStep` para edição de steps dentro de grupos

### 5. `src/components/chatbot/FlowEditor.tsx` — Adaptar
- Atualizar imports para novos tipos (`FlowStepData`, `defaultNodeData`, `FINALIZER_TYPES`)
- Atualizar lógica de docking para usar `FlowStepData` com `{ id, data }`
- Adicionar listeners para eventos: `group-duplicate-step`, `group-add-step` (com popover type), `node-duplicate`, `node-delete`, `group-delete`, `group-receive-step`, `group-extract-step`, `group-reorder-step`
- Passar `selectedStepId` e `onUpdateStep` ao PropertiesPanel

### 6. `src/components/chatbot/NodePalette.tsx` — Atualizar
- Refletir os novos tipos de nó na paleta

### 7. Dependência nova: `pdfjs-dist`
- Necessário para o `PdfThumbnail` no GroupNode

---

## Notas técnicas

- Os IDs de handles mudam de `responded`/`timeout` para `output-0`/`output-1` (padrão do repo)
- A estrutura de steps em grupos muda de `FlowNodeData[]` flat para `FlowStepData[]` com `{ id, data }`
- Os eventos customizados mudam (ex: `group-add-step` agora passa `stepType`)
- O `isDockTarget` é um campo em `FlowNodeData` para highlight visual durante drag

