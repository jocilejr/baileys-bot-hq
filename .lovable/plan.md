

# Plano: Duas Saídas nos Finalizadores + Timeout de Ausência

## O que muda

Os nós `waitMessage` e `waitClick` passam a ter **duas saídas** (como o nó de condição):
- **Respondeu** (verde) — o contato respondeu/clicou
- **Não respondeu** (vermelho) — timeout expirou

Nas propriedades do nó, o usuário configura o **tempo de espera** com valor numérico + unidade (segundos, minutos, horas).

## Arquivos e mudanças

### 1. `src/types/chatbot.ts`
- Adicionar campos `timeoutValue?: number` e `timeoutUnit?: "seconds" | "minutes" | "hours"` em `FlowNodeData`
- Atualizar `getDefaultNodeData` para `waitMessage` e `waitClick` com defaults (`timeoutValue: 5, timeoutUnit: "minutes"`)

### 2. `src/components/chatbot/StepNode.tsx`
- Nos cases `waitMessage` e `waitClick`, renderizar **dois handles de saída** à direita (igual ao nó de condição):
  - `id="responded"` — label "Respondeu" (verde)
  - `id="timeout"` — label "Não respondeu" (vermelho)
- Atualizar o `NodePreview` para exibir o tempo configurado (ex: "Timeout: 5 min")
- Adicionar `BLOCK_FINISHERS` à lógica de handles (tratar como caso especial junto com `isCondition`)

### 3. `src/components/chatbot/PropertiesPanel.tsx`
- Adicionar seção para `waitMessage` e `waitClick`:
  - Input numérico para o valor do timeout
  - Select para a unidade (Segundos / Minutos / Horas)

### 4. `src/components/chatbot/GroupNode.tsx`
- O handle de saída do **grupo selado** também deve ter duas saídas (respondeu/timeout) para que as conexões do grupo reflitam as saídas do finalizador interno

