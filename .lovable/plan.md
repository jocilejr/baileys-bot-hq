

# Plano: Nós Funcionais Completos + Agrupamento de Nós

## Resumo
Tornar todos os 15 tipos de nós do builder visuais e interativos, com previews ricos no canvas, e adicionar a funcionalidade de **agrupamento** (arrastar um nó para perto de outro cria um grupo visual que os contém).

---

## 1. Melhorar StepNode com previews ricos por tipo

O `StepNode.tsx` atual mostra apenas texto genérico. Cada tipo de nó terá um preview contextual:

- **trigger**: Mostra o tipo (keyword/first_message/schedule/webhook) + valor
- **sendText**: Preview do texto com formatação WhatsApp (*negrito*, _itálico_)
- **sendImage/Video/Document**: Thumbnail ou ícone de mídia + caption
- **sendAudio**: Ícone de áudio com indicador visual
- **sendButtons**: Preview dos botões como chips clicáveis
- **sendList**: Preview das seções/itens da lista
- **condition**: Mostra campo + operador + valor (ex: "mensagem contém 'oi'")
- **delay**: Mostra tempo formatado (ex: "Aguardar 3s")
- **assignAgent**: Mostra departamento
- **closeChat**: Ícone de encerramento
- **setTag**: Mostra nome da tag como badge
- **httpRequest**: Mostra método + URL resumida
- **aiResponse**: Mostra modelo + início do prompt

Adicionar handles múltiplos para nó **condition** (saída "Sim" e "Não") e **sendButtons** (uma saída por botão).

## 2. Melhorar PropertiesPanel

- **sendList**: Editor completo de seções com adição/remoção de seções e rows
- **delay**: Slider visual com labels (segundos/minutos) em vez de input numérico em ms
- **condition**: Adicionar opções de campo extras (phone, email, custom_field)
- **httpRequest**: Adicionar campo de headers, teste de requisição
- **aiResponse**: Adicionar campo de temperatura, max tokens

## 3. Sistema de Agrupamento (GroupNode)

Implementar um novo tipo de nó `groupNode` no React Flow:

- **Criação**: Quando o usuário arrasta um nó para perto de outro (dentro de ~50px), aparece um indicador visual de "dock". Ao soltar, ambos são envolvidos por um `groupNode` pai.
- **GroupNode visual**: Container com borda tracejada, título editável, cor de fundo sutil. Os nós filhos ficam empilhados verticalmente dentro do grupo.
- **Implementação técnica**: Usa `parentId` do React Flow para aninhar nós. O `groupNode` tem `style: { width, height }` calculado automaticamente baseado nos filhos. Filhos usam posição relativa ao pai.
- **Interações**: Arrastar o grupo move todos os filhos. Remover um nó do grupo (arrastar para fora) o desaninhar. Botão para dissolver grupo.
- **Paleta**: Adicionar item "Grupo" na categoria "Lógica" para criar grupo vazio e arrastar nós para dentro.

### Arquivos a criar/modificar:

| Arquivo | Acao |
|---------|------|
| `src/types/chatbot.ts` | Adicionar tipo `group`, interface GroupNodeData, config |
| `src/components/chatbot/StepNode.tsx` | Reescrever com previews ricos por tipo + handles condicionais |
| `src/components/chatbot/GroupNode.tsx` | Novo componente de grupo com resize e filhos |
| `src/components/chatbot/PropertiesPanel.tsx` | Expandir editores (list sections, delay slider, etc.) |
| `src/components/chatbot/NodePalette.tsx` | Adicionar item "Grupo" |
| `src/components/chatbot/FlowEditor.tsx` | Adicionar lógica de docking (onNodeDragStop), registrar groupNode nos nodeTypes, lógica de ungroup |

### Lógica de docking no FlowEditor:
```text
onNodeDragStop:
  1. Checar se nó arrastado está próximo (~80px) de outro nó
  2. Se sim e nenhum dos dois é grupo:
     - Criar groupNode pai na posição média
     - Setar parentId dos dois nós
     - Recalcular posições relativas
  3. Se nó arrastado está próximo de um grupo existente:
     - Setar parentId do nó para o grupo
     - Recalcular posição relativa
  4. Se nó filho foi arrastado para longe do grupo:
     - Remover parentId
     - Converter posição para absoluta
```

## Estimativa
- ~6 arquivos modificados/criados
- Componente mais complexo: FlowEditor (lógica de docking) e StepNode (previews)

