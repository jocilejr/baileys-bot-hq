

## Problema

O Baileys atual só processa mensagens com `type === "notify"` (linha 165), que são mensagens **novas em tempo real**. Mensagens históricas chegam via o evento `messages.upsert` com `type === "append"` (sincronização inicial do WhatsApp) — mas estão sendo ignoradas pelo filtro.

Além disso, mensagens enviadas por você (`msg.key.fromMe === true`) também são ignoradas (linha 168), então suas próprias mensagens históricas nunca são salvas.

## Solução

Modificar o `baileys-manager.ts` para:

1. **Aceitar mensagens históricas** — remover o filtro `if (type !== "notify") return` e processar também `type === "append"` (sync histórico)
2. **Salvar mensagens enviadas** — remover `if (msg.key.fromMe) continue` e em vez disso marcar `direction: "outbound"` quando `fromMe === true`
3. **Evitar duplicatas** — usar o `external_id` (msg.key.id) para fazer upsert, verificando se a mensagem já existe antes de inserir
4. **Tratar timestamp histórico** — usar `msg.messageTimestamp` para definir o `created_at` correto das mensagens históricas, mantendo a ordem cronológica

### Alterações no arquivo `server/src/baileys-manager.ts`

No handler `messages.upsert`:
- Remover `if (type !== "notify") return`
- Processar mensagens `fromMe` como `direction: "outbound"`
- Antes de inserir, verificar se `external_id` já existe no banco
- Usar `msg.messageTimestamp` convertido para ISO string como `created_at`

Essas mudanças farão com que, ao conectar, o WhatsApp sincronize o histórico recente e todas essas mensagens sejam salvas no banco de dados e apareçam no chat.

