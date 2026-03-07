

# Plano: Replicar Layout Exato do Repositório de Referência

Após análise detalhada, as diferenças entre nosso código atual e o repositório `simplificandoconversas` são significativas em 6 áreas. O plano é substituir nossos componentes pelos equivalentes exatos do repositório.

---

## 1. `src/types/chatbot.ts` — Alinhar tipos e configs

**Mudanças:**
- `triggerType`: adicionar `"any_message"` e `"event"` (remover `"first_message"`, `"schedule"`, `"webhook"`)
- `triggerValue` → `triggerKeyword`
- `conditionOperator`: trocar `"startsWith"` por `"starts_with"`
- `actionType`: trocar `"assignAgent"/"closeChat"/"setTag"/"removeTag"/"httpRequest"` por `"add_tag"/"remove_tag"/"add_to_list"/"set_variable"`
- `delayPresenceType`: trocar `"typing"/"recording"` por `"composing"/"recording"`
- Adicionar campos `clickPreviewTitle`, `clickPreviewDescription`, `clickPreviewImage`
- `aiModel`: usar `"gpt-4o"/"gpt-4o-mini"/"gpt-4-turbo"` (em vez dos modelos Lovable)
- Remover `sendButtons`, `sendList` dos tipos (não existem no repo de referência)
- `nodeTypeConfig`: usar cores hex (`#22c55e`, `#3b82f6`, etc.) em vez de HSL; trocar ícones (`Timer` em vez de `Clock`, `Settings` em vez de `Cog`, `BrainCircuit` em vez de `Sparkles`, `Link` em vez de `MousePointerClick`); atualizar labels/descriptions
- `defaultNodeData`: exportar como objeto `Record<FlowNodeType, Partial<FlowNodeData>>` (em vez de função `getDefaultNodeData`)
- Remover exports não usados no repo: `categoryLabels`, `formatDelay`, `triggerTypeLabels`, `operatorLabels`, `actionTypeLabels`

## 2. `src/components/chatbot/GroupNode.tsx` — Reescrever completamente

Substituir pelo componente do repositório que inclui:
- `PdfThumbnail` com `pdfjs-dist` (dependência nova a instalar)
- `AudioPreviewPlayer` com waveform bars, play/pause, seek, timer
- `StepDuplicateButton` flutuante com copy icon
- `DragHandle` com `GripVertical` (HTML5 drag nativo)
- `StepRow` com renderização condicional completa:
  - `sendText` com conteúdo: bubble direta `bg-secondary/50`
  - `sendImage/sendVideo`: preview rico com media
  - `sendAudio`: waveform player inline
  - `sendFile`: PDF thumbnail + nome
  - `waitDelay`: pill centralizada com linhas laterais
  - `waitForClick`: card estilizado azul sky
  - `condition`: card vermelho com pills de regra
  - `action`: card laranja com badge de tipo
  - Fallback genérico com ícone e label
- Grupo com floating toolbar (Duplicar/Apagar)
- Handles `!w-3.5 !h-3.5 !border-2 !border-card`
- Popover de "Adicionar ação" com lista de tipos
- Saídas duais quando tem finalizer: `"Continuou ✓"` (emerald) e `"Se não respondeu/clicou ⏱"` (orange)
- Suporte a inter-group drag & drop
- Suporte a extract-step (arrastar step para fora do grupo)
- Node type: `"groupBlock"` (em vez de `"groupNode"`)

## 3. `src/components/chatbot/StepNode.tsx` — Reescrever completamente

Substituir pelo componente do repositório:
- Trigger: gradient card com `background: linear-gradient(135deg, color, colordd)`
- Regular: card com `borderTop: 3px solid color`, corpo com preview por tipo
- Floating toolbar: Duplicar + Apagar (via custom events `node-duplicate`, `node-delete`)
- Condition: pills de regra com `has_tag` support
- Action: badge com tipo + valor
- Dual outputs para `waitForReply`/`waitForClick` com timeout > 0
- Handles maiores com accent color
- `isDockTarget` highlight
- Node type: `"step"` (em vez de `"stepNode"`)

## 4. `src/components/chatbot/FlowEditor.tsx` — Reescrever completamente

Substituir pelo FlowEditor do repositório que usa `ReactFlowProvider` wrapper:
- `nodeTypes = { step: StepNode, groupBlock: GroupNode }`
- Autosave com debounce (1.5s) em vez de botão manual
- Status indicator (Salvando.../Salvo)
- Seletor de instâncias WhatsApp (Popover com Checkboxes)
- Painel de histórico com `FlowHistoryPanel`
- Right-click context menu para adicionar nós
- Edge context menu para remover conexões
- Proximity docking com `isDockTarget` visual feedback durante drag
- Estilo de edges: animated, dashed, cor diferente para `output-1`
- Todos os event listeners: `group-reorder-step`, `group-add-step`, `group-extract-step`, `group-receive-step`, `group-delete`, `node-duplicate`, `node-delete`, `group-duplicate-step`
- Props: `onSave(name, nodes, edges, instanceNames)`

## 5. `src/components/chatbot/PropertiesPanel.tsx` — Reescrever completamente

Substituir pelo painel do repositório:
- `StepFields` como componente interno
- Suporte a grupos: lista de steps clicáveis → editor de step individual
- Campos adaptados: `triggerKeyword`, `TextFormatToolbar`, `MediaUpload`
- Condition com `has_tag` operator
- Action com `add_tag/remove_tag/add_to_list/set_variable`
- WaitDelay com modo aleatório e simulação de presença (composing/recording)
- WaitForClick com link preview fields
- AI Agent com media checkboxes
- Botão "Desagrupar Step" para remover step do grupo

## 6. `src/components/chatbot/NodePalette.tsx` — Alinhar

- Usar `icons` do lucide-react (dinâmico) em vez de iconMap estático
- Categorias: incluir `sendFile`, remover `sendButtons`/`sendList`
- Receber `onDragStart` prop

## 7. Novos arquivos a criar

- `src/components/chatbot/TextFormatToolbar.tsx` — Toolbar de formatação (Bold, Italic, Strikethrough) + inserção de variáveis (saudação, nome, etc.)
- `src/hooks/useFlowHistory.ts` — Hook para salvar/restaurar snapshots do fluxo
- `src/components/chatbot/FlowHistoryPanel.tsx` — Sheet lateral com histórico de versões

## 8. `src/pages/Automacoes.tsx` — Adaptar

- Atualizar `onSave` para aceitar `instanceNames`
- Atualizar imports para novos nomes de funções/tipos

## 9. Dependência nova

- `pdfjs-dist` para thumbnail de PDFs no GroupNode

---

## Nota sobre compatibilidade

- Dados existentes no banco que usam tipos antigos (`sendButtons`, `sendList`, etc.) precisarão de migração de nó (o FlowEditor do repo já faz migration de `"block"` → `"step"`)
- O node type muda de `"stepNode"` → `"step"` e `"groupNode"` → `"groupBlock"`

