

# Refinamento Profissional dos Handles de Conexão e Design do Flow Editor

## Problemas Identificados
- Handles (bolinhas) com posicionamento inconsistente usando `!top-1/2` e porcentagens arbitrárias
- Handles grandes demais (12px) e com bordas grossas, parecem amadores
- Labels "Sim"/"Não" do nó de condição mal posicionados com `absolute` quebrado
- Edges verdes com `animated: true` (tracejado animado) como na screenshot — pouco profissional
- Sem curvatura suave nas conexões (default do React Flow)
- Nós sem sombra refinada e sem transições suaves

## Plano de Implementação

### 1. StepNode.tsx — Redesign completo dos handles e card
**Handles:**
- Reduzir para `!w-2 !h-2` (8px) — discretos e elegantes
- Usar cores sutis: entrada cinza `!bg-muted-foreground/60`, saída com cor do nó
- Remover `!border-2 !border-background` grosso — usar `!border !border-background/50`
- Manter `Position.Left` (target) e `Position.Right` (source)
- Para condição: labels "Sim"/"Não" alinhados ao lado dos handles usando `flex` em vez de `absolute` com offsets manuais
- Para botões: calcular posições com padding proporcional real baseado na altura do content

**Card:**
- Adicionar `shadow-sm` default e `shadow-md` no hover/selected
- Border mais sutil: `border-border/40` normal, `border-primary/50` selected
- Cabeçalho colorido com opacidade menor, mais elegante

### 2. GroupNode.tsx — Handles laterais refinados
- Mesma estética dos handles do StepNode
- Handle esquerdo centralizado, handle direito centralizado
- Tamanho `!w-2 !h-2`

### 3. FlowEditor.tsx — Edges profissionais
- `defaultEdgeOptions`: remover `animated: true`, usar `type: 'smoothstep'` para curvas suaves
- Cor do edge mais sutil: `stroke: "hsl(142 60% 45% / 0.5)"` com `strokeWidth: 1.5`
- `connectionLineStyle` com mesma estética
- Fundo com dots menores e mais sutis (`size={0.5}`, `gap={24}`)

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `StepNode.tsx` | Handles menores, cores sutis, labels alinhados, card refinado |
| `GroupNode.tsx` | Handles com mesma estética profissional |
| `FlowEditor.tsx` | Edges smoothstep, sem animação, cores sutis |

