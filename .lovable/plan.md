

# Plano: Refinamento Visual — Layout Profissional e Predominantemente Escuro

O objetivo e tornar o flow builder mais polido e profissional, com foco em tons escuros consistentes, contraste sutil e acabamento premium.

---

## Mudancas

### 1. `src/index.css` — Ajustar variaveis do tema escuro
- Escurecer `--background` para tons mais profundos (ex: `220 16% 4%`)
- Escurecer `--card` para `220 16% 7%`
- Ajustar `--border` para mais sutil (`220 12% 12%`)
- Escurecer `--secondary` e `--muted` para manter hierarquia visual
- Sidebar mais escura (`220 18% 3%`)
- Manter primary verde como acento

### 2. `src/components/chatbot/FlowEditor.tsx` — Canvas e toolbar
- Fundo do canvas: `!bg-[#0a0a0f]` (quase preto)
- Background dots mais sutis: `size={0.5}`, `gap={24}`, cor `#1a1a2e`
- Controls e MiniMap com fundo escuro `!bg-[#111118]`
- Toolbar superior com backdrop-blur e fundo semi-transparente escuro
- Edges com stroke mais sutil e elegante
- Context menu com fundo escuro e borda sutil

### 3. `src/components/chatbot/GroupNode.tsx` — Cards de grupo refinados
- Fundo do card: `bg-[#111118]` com borda `border-[#1e1e2e]`
- Header do grupo com fundo levemente mais claro `bg-[#161620]`
- Steps internos (sendText bubble): fundo `bg-[#1a1a28]`
- waitDelay pill: fundo `bg-[#16161e]` com bordas mais sutis
- Popover de adicionar acao: fundo escuro consistente
- Sombras com tom azulado sutil (`shadow-[0_4px_24px_rgba(0,0,0,0.4)]`)
- Handles com borda `!border-[#111118]` para integrar com o card

### 4. `src/components/chatbot/StepNode.tsx` — Cards standalone refinados
- Trigger: gradiente mais suave com overlay escuro
- Cards regulares: fundo `bg-[#111118]`, borda `border-[#1e1e2e]`
- Toolbar flutuante: fundo `bg-[#161620]` com borda sutil
- Hover: borda com glow sutil (`hover:border-[#2a2a3e]`)
- Sombras profundas e suaves

### 5. `src/components/chatbot/NodePalette.tsx` — Sidebar da paleta
- Fundo `bg-[#0d0d14]` com borda `border-[#1a1a28]`
- Items com hover `hover:bg-[#1a1a28]`
- Titulo de categoria mais sutil
- Icones com fundo mais integrado ao tema escuro

### 6. `src/components/chatbot/PropertiesPanel.tsx` — Painel de propriedades
- Fundo `bg-[#0d0d14]` com borda lateral
- Inputs com fundo `bg-[#111118]` e borda `border-[#1e1e2e]`
- Labels com cor mais suave
- Separadores e secoes com fundo consistente

### 7. `src/components/chatbot/FlowHistoryPanel.tsx` — Painel de historico
- Alinhar ao tema escuro com fundo e bordas consistentes

---

## Resumo tecnico

- Predominantemente uso de cores fixas escuras (`#0a0a0f`, `#111118`, `#161620`, `#1e1e2e`) para consistencia visual no builder
- Variaveis CSS do tema escuro ajustadas para que todo o app fique mais sombrio
- Acentos coloridos (verde, azul, etc.) mantidos nos handles e icones para contraste funcional
- Sombras com rgba escuro para profundidade
- Tipografia e espacamento mantidos, apenas refinamento de cores

