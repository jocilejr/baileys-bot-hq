

## Diagnóstico Final

Os logs revelam a **causa raiz real**: o `getMessage` callback não está implementado.

```text
Fluxo quando decriptação falha:
1. messages.upsert chega com body vazio (keys="")
2. Baileys detecta falha de decriptação
3. Baileys envia "retry receipt" ao remetente pedindo reenvio
4. Remetente reenvia a mensagem
5. Baileys precisa do getMessage() para completar a decriptação do retry
6. getMessage NÃO EXISTE → retry falha → mensagem perdida permanentemente
```

O log confirma isso:
- `"sent retry receipt"` aparece nos logs
- `"No session found to decrypt message"` aparece para grupos
- Mensagens chegam com `keys=""` (vazio) e nunca são preenchidas

A solução é usar o `makeInMemoryStore` do Baileys, que armazena mensagens em memória e permite que o `getMessage` funcione para retries de decriptação.

---

## Reformulação do baileys-manager.ts

### Mudanças principais:

**1. Adicionar `makeInMemoryStore`**
- Importar e criar um store em memória por sessão
- Bindar o store aos eventos do socket (`store.bind(socket.ev)`)
- O store automaticamente armazena mensagens recebidas

**2. Implementar `getMessage` callback**
```typescript
const store = makeInMemoryStore({ logger });
store.bind(socket.ev);

const socket = makeWASocket({
  // ...config
  getMessage: async (key) => {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid!, key.id!);
      return msg?.message || undefined;
    }
    return proto.Message.fromObject({});
  },
});
```

**3. Desabilitar `syncFullHistory`**
- Mudar para `syncFullHistory: false`
- Remover `shouldSyncHistoryMessage: () => true`
- Isso elimina o "AwaitingInitialSync" timeout e o flood de history sync
- Mensagens históricas serão carregadas sob demanda (scroll-back)

**4. Adicionar configs de retry**
```typescript
retryRequestDelayMs: 600,
maxMsgRetryCount: 3,
defaultQueryTimeoutMs: 60_000,
transactionOpts: { maxCommitRetries: 5, delayBetweenTriesMs: 1500 },
```

**5. Simplificar event listeners**
- Remover o `messaging-history.set` (não mais necessário sem syncFullHistory)
- Manter `messages.upsert` como handler principal
- Manter `messages.update` para conteúdo atrasado
- O store cuida do buffering internamente

### Arquivo afetado:
- `server/src/baileys-manager.ts` — reescrita dos handlers de evento e config do socket

