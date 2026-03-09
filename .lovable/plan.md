

## Problemas Identificados

1. **Chat não respeita limites da página**: O `AppLayout` usa `overflow-auto` no `<main>`, mas o Chat usa `h-full` sem restrição real de altura. O conteúdo cresce infinitamente em vez de ficar contido na viewport.

2. **Mensagens sem horário organizado**: As mensagens do history sync já têm `createdAt` sendo gerado no backend (linhas 210-218), mas se o `messageTimestamp` for 0 ou ausente, `createdAt` fica `undefined` e o banco usa `now()` como default, fazendo todas parecerem do mesmo momento.

## Alterações

### 1. Fix layout do Chat (`src/pages/Chat.tsx`)
- Mudar o container de `h-full` para `h-[calc(100vh-3rem)]` (descontando o header de 48px) para forçar a altura fixa e impedir o scroll da página inteira.

### 2. Fix layout do AppLayout (`src/components/AppLayout.tsx`)
- Mudar `<main>` de `overflow-auto` para `overflow-hidden` para que o Chat controle seu próprio scroll internamente.

### 3. Auto-scroll para o final (`src/components/conversations/ChatPanel.tsx`)
- O `useEffect` de scroll já existe, mas precisa garantir que rode após as mensagens renderizarem. Adicionar um pequeno `setTimeout` ou usar `scrollIntoView` com behavior smooth.

### 4. Mensagens sem timestamp (`server/src/baileys-manager.ts`)
- Quando `createdAt` é `undefined`, definir um fallback para `new Date().toISOString()` em vez de deixar o banco usar o default. Isso garante que mensagens do history sync sem timestamp pelo menos tenham uma data aproximada.
- Mais importante: verificar se o campo `created_at` está sendo passado no insert. Se não estiver sendo incluído quando `createdAt` é undefined, o banco usa `now()` e todas as mensagens históricas ficam com a mesma data.

