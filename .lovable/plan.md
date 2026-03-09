

## Problemas Identificados

1. **Mensagens históricas não chegam**: O Baileys v6 usa o evento `messaging-history.set` para sincronização de histórico — **não** `messages.upsert` com `type: "append"`. O código atual não escuta esse evento, então mensagens antigas nunca são processadas.

2. **Conversas de grupo aparecendo**: O filtro `@g.us` existe no `messages.upsert`, mas o `messaging-history.set` (quando implementado) também precisa filtrar grupos. Além disso, pode ser que mensagens de grupo estejam chegando via `notify` com JIDs que não terminam em `@g.us` (ex: mensagens de newsletter `@newsletter`).

3. **`syncFullHistory` não está habilitado**: O `makeWASocket` não tem a opção `syncFullHistory: true`, então mesmo com o evento correto, o WhatsApp pode não enviar todo o histórico.

## Plano de Alterações

### Arquivo: `server/src/baileys-manager.ts`

**1. Adicionar `syncFullHistory: true` ao `makeWASocket`** (linha ~73):
```typescript
const socket = makeWASocket({
  ...
  syncFullHistory: true,
});
```

**2. Adicionar handler para `messaging-history.set`** (após o handler `messages.upsert`):
Escutar o evento que traz chats, contatos e mensagens históricas. Para cada mensagem:
- Filtrar grupos (`@g.us`) e newsletters (`@newsletter`)
- Usar `external_id` para deduplicação
- Usar o timestamp original da mensagem como `created_at`
- Criar contato e conversa se necessário

**3. Reforçar filtro de grupo no `messages.upsert`**:
- Adicionar filtro para `@newsletter` e `@lid` além de `@g.us`

**4. Remover o check de `type === "append"`** no `messages.upsert`, pois o histórico agora vem via `messaging-history.set`.

### Após deploy na VPS
- Rebuild: `cd /root/baileys-bot-hq/server && npm run build`
- Restart: `pm2 restart zapmanager-api`
- Para forçar o sync histórico, pode ser necessário **reconectar a instância** (deletar sessão e escanear QR novamente), pois o `messaging-history.set` só dispara na primeira conexão.

