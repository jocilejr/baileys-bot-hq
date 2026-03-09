

## Problemas Identificados

Analisando o código e os prints:

### 1. Números `@lid` sendo salvos como telefone
O Baileys v6 usa identificadores `@lid` (ex: `80178499813629`) em vez de `@s.whatsapp.net` para alguns contatos. O código atual faz `remoteJid.replace(/@.*$/, "")` e salva esse LID como `phone` no contato — por isso o "Detalhes do Contato" mostra `80178499813629` em vez do número real.

### 2. Conversas duplicadas (múltiplas "Meire Rosana")
O mesmo contato pode enviar mensagens via JID `@s.whatsapp.net` E `@lid`. Como o lookup de contato usa `phone = identifier`, cada formato cria um contato separado e uma conversa separada — gerando duplicatas.

### 3. Mensagens não chegando
Mensagens recebidas via `@lid` criam um contato novo (com LID como phone). O contato original (com phone real) não recebe essas mensagens. Além disso, se o Baileys envia o JID em formato diferente do esperado, a mensagem pode ser processada mas vinculada a um contato "fantasma".

## Alterações Propostas

### 1. Backend: Resolver LID para número real (`server/src/baileys-manager.ts`)

- Usar `socket.store` ou `socket.user` para tentar resolver `@lid` para o número real
- Para mensagens recebidas (inbound), extrair o número do `participant` ou `remoteJid` conforme o formato:
  - `@s.whatsapp.net` → usar o número diretamente
  - `@lid` → tentar usar `msg.key.participant` (que geralmente tem o formato `@s.whatsapp.net`), ou manter o LID como fallback
- Para grupos, o `remoteJid` é o JID do grupo — manter como está

### 2. Backend: Melhorar lookup de contato

- Ao criar/buscar contato, se o identifier for um LID, verificar se já existe um contato com o `pushName` na mesma instância antes de criar duplicata
- Adicionar log detalhado do JID recebido para debug

### 3. Frontend: `formatPhone` mais resiliente (`src/components/conversations/RightPanel.tsx`)

- Detectar se o valor é um LID (não começa com código de país válido) e exibir apenas o nome do contato nesses casos
- Não tentar formatar LIDs como números de telefone

### 4. Limpeza de dados

- Fornecer comando SQL para o usuário limpar contatos/conversas duplicadas criadas com LIDs na VPS

## Detalhes Técnicos

**`server/src/baileys-manager.ts` - processMessage:**
```text
// Antes:
identifier = remoteJid.replace(/@.*$/, "")

// Depois:
- Se chatType === "private" e remoteJid contém "@lid":
  - Tentar extrair número de msg.key.participant (se disponível)
  - Logar warning: "LID JID detected, participant: ..."
  - Usar participant como identifier se disponível, senão manter LID
- Se chatType === "private" e remoteJid contém "@s.whatsapp.net":
  - Usar número normalmente
```

**`src/components/conversations/RightPanel.tsx` - formatPhone:**
```text
// Adicionar detecção de LID
- Se phone.length > 13 ou não começa com dígitos válidos de país
  → retornar phone sem formatação
```

