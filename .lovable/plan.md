

# Plano: Redesign do Agrupamento estilo Chat Bubble

## Problema atual
O GroupNode atual é um container genérico com borda tracejada. A imagem de referência mostra um design completamente diferente: um card escuro vertical onde os steps aparecem como balões de chat empilhados, com indicadores de delay ("3s · digitando...") entre eles.

## O que será feito

### 1. Redesign do GroupNode
Transformar de container genérico para card escuro vertical estilo chat:
- Fundo escuro arredondado com header "Grupo" (ícone + título editável + botões)
- Handles de entrada (topo) e saída (base) no próprio grupo
- Renderizar os dados dos filhos diretamente como bubbles empilhados (em vez de depender do render padrão do React Flow para filhos)

### 2. Novo visual dos steps dentro do grupo
Cada step filho será renderizado como:
- Balão de mensagem com o preview do conteúdo (texto formatado, mídia, etc.)
- Entre cada step, um indicador de delay verde: `"Xs · digitando..."` baseado no delayMs do nó seguinte ou um default

### 3. Lógica no FlowEditor
- Ao agrupar, os nós filhos devem ter `hidden: true` no React Flow (não renderizar como nós separados) — o GroupNode renderiza seus dados internamente
- O GroupNode recebe via data a lista ordenada dos steps filhos
- Ao desagrupar, restaurar os nós como independentes e visíveis
- Ajustar o `onNodeDragStop` para passar os dados dos filhos ao grupo ao dockar

### 4. Interações
- Clicar em um bubble dentro do grupo seleciona aquele step (abre PropertiesPanel)
- Drag de reordenação vertical dentro do grupo
- Botão + entre steps para adicionar novo nó
- Arrastar step para fora do grupo o remove

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `GroupNode.tsx` | Reescrever com visual de card escuro + bubbles empilhados |
| `FlowEditor.tsx` | Ajustar docking para popular `data.steps` no grupo e ocultar filhos |
| `StepNode.tsx` | Sem mudanças significativas |
| `types/chatbot.ts` | Adicionar `steps?: FlowNodeData[]` e `defaultDelay?: number` ao FlowNodeData |

