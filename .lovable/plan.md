

## Plano: Separar Conversas Privadas e Grupos no Chat

### Objetivo
Em vez de rejeitar mensagens de grupo, aceitar **todas** as mensagens e separar visualmente no chat entre "Conversas" (privadas) e "Grupos".

### 1. Migração no Banco de Dados

Adicionar coluna `chat_type` na tabela `conversations` para distinguir o tipo:

```sql
ALTER TABLE conversations ADD COLUMN chat_type text NOT NULL DEFAULT 'private';
-- valores: 'private' | 'group'
```

### 2. Backend: `server/src/baileys-manager.ts`

- **Remover o filtro `isPrivateChat`** que descarta mensagens de grupo
- **Determinar o tipo de chat** baseado no JID:
  - `@g.us` → `chat_type = 'group'`
  - Qualquer outro → `chat_type = 'private'`
- **Aceitar JIDs `@lid`** para conversas privadas (Baileys v6)
- **Extrair telefone/ID** com `remoteJid.replace(/@.*$/, "")` para funcionar com qualquer formato
- **Passar `chat_type`** ao criar a conversa no insert
- **Adicionar logs de erro** em todas as operações Supabase para diagnosticar falhas silenciosas
- Para **grupos**: usar o JID do grupo como identificador do contato (em vez de telefone individual), e o `pushName` ou subject do grupo como nome

### 3. Frontend: Abas na Lista de Conversas

**`src/components/conversations/ConversationList.tsx`**:
- Adicionar tabs "Conversas" e "Grupos" no topo da lista
- Filtrar por `chat_type === 'private'` ou `chat_type === 'group'`
- Para grupos, mostrar ícone diferente (Users em vez de avatar individual)

**`src/hooks/useConversations.ts`**:
- Aceitar parâmetro `chatType` opcional para filtrar por tipo

**`src/components/conversations/ConversationList.tsx` (tipo)**:
- Adicionar `chat_type` ao `ConversationItem` interface

### 4. Passos pós-deploy na VPS
1. Aplicar a migração SQL no Supabase self-hosted
2. `cd /root/baileys-bot-hq/server && npm run build`
3. `rm -rf sessions/25deaef7-*`
4. `pm2 restart zapmanager-api`
5. Escanear QR novamente

