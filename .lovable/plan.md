

# Plano: Editor Visual de Fluxos estilo "simplificandoconversas"

## O que foi observado no repositório de referência

O projeto usa **@xyflow/react** (React Flow) como base do editor visual, com:
- **StepNode**: no individual (trigger, sendText, sendAudio, condition, etc.) com handles de conexao e preview do conteudo
- **GroupNode**: agrupamento de steps por proximidade (dock), com drag-and-drop interno, reordenacao e audio/PDF preview
- **PropertiesPanel**: painel lateral direito para editar propriedades do no selecionado
- **NodePalette**: paleta lateral de componentes arrasta-e-solta (categorias: Gatilhos, Mensagens, Logica, Acoes, IA)
- **FlowHistoryPanel**: historico de versoes com snapshots
- **TextFormatToolbar**: formatacao WhatsApp (negrito, italico, riscado)
- **MediaUpload**: upload de audio/video/imagem/PDF
- Tipos em `types/chatbot.ts` com FlowNodeType, FlowNodeData, nodeTypeConfig, defaultNodeData
- Autosave com debounce, context menu no canvas, duplicacao de nos/steps

## O que sera implementado

### 1. Migrar schema do banco
- Adicionar colunas `nodes JSONB` e `edges JSONB` a tabela `automation_flows` (para armazenar o grafo React Flow)
- Adicionar coluna `instance_names TEXT[]` para vincular fluxos a instancias por nome
- Manter colunas existentes (blocks, trigger_type, etc.) para compatibilidade

### 2. Instalar dependencia
- Adicionar `@xyflow/react` ao projeto

### 3. Criar tipos (`src/types/chatbot.ts`)
- FlowNodeType, FlowNodeData, FlowNode, FlowEdge
- nodeTypeConfig (cores, icones, descricoes)
- defaultNodeData
- parseWhatsAppFormatting

### 4. Criar componentes do editor
- **`src/components/chatbot/StepNode.tsx`** -- no individual com icone, cor, descricao, handles in/out, toolbar (duplicar/excluir)
- **`src/components/chatbot/GroupNode.tsx`** -- grupo de steps empilhados com drag interno, add step, dock indicator
- **`src/components/chatbot/PropertiesPanel.tsx`** -- painel lateral para editar cada tipo de no (trigger, sendText, condition, etc.)
- **`src/components/chatbot/NodePalette.tsx`** -- paleta arrastavel de componentes (opcional, o ref usa popover)
- **`src/components/chatbot/FlowEditor.tsx`** -- editor principal com ReactFlow, autosave, drag-drop, dock, context menu

### 5. Atualizar pagina Automacoes
- Adicionar estado `editingFlowId` para alternar entre lista e editor
- Clicar em um fluxo abre o FlowEditor
- Botao "Novo Fluxo" cria registro e abre editor
- Botao voltar retorna a lista

### 6. Atualizar hook useAutomations
- Adicionar mutation para update completo (name, nodes, edges, instance_names)
- Adicionar mutation para delete

### Complexidade
Este e um componente grande (~2500+ linhas no total entre os arquivos). Sera adaptado do repositorio de referencia, removendo dependencias externas nao disponiveis (pdfjs-dist) e simplificando onde necessario, mantendo a mesma UX.

