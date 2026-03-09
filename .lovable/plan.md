

## Investigação e Nova Abordagem

### Problema 1: LID → Telefone Real

Pesquisando issues no repositório oficial do Baileys, o problema de LID é **bem documentado** e tem soluções específicas:

- No Baileys v6+, o WhatsApp migrou para LIDs (Local Identifiers) em vez de números de telefone
- A abordagem atual de manter um `lidMap` manual alimentado por `contacts.update` e `messaging-history.set` **não funciona** porque esses eventos frequentemente não entregam o campo `lid` junto com o `id`
- A solução correta é usar **`socket.signalRepository.lidMapping.getPNForLID()`** — uma API interna do Baileys que consulta o mapeamento LID↔PN armazenado nas credenciais da sessão

### Problema 2: Mensagens em tempo real não aparecem

Issues abertas no GitHub (#2382, #2363, #1936) documentam que `messages.upsert` pode parar de disparar quando há alto tráfego de status/newsletters. A solução recomendada:

- Adicionar **`shouldIgnoreJid`** no socket para filtrar `status@broadcast` e `@newsletter`, liberando o event loop
- Adicionar **`emitOwnEvents: true`** e **`fireInitQueries: true`** para garantir que eventos próprios sejam emitidos

---

## Alterações Propostas

### `server/src/baileys-manager.ts`

**1. Configuração do socket** — adicionar opções que previnem travamento do event loop:
```typescript
const socket = makeWASocket({
  // ... existente ...
  shouldIgnoreJid: (jid) => jid === "status@broadcast" || jid.includes("@newsletter"),
  emitOwnEvents: true,
  fireInitQueries: true,
});
```

**2. Resolução de LID** — substituir o `lidMap` manual pela API nativa do Baileys:
```typescript
// Em vez de manter lidMap manual:
if (chatType === "private" && isLid) {
  const lidJid = remoteJid; // ex: "123456@lid"
  try {
    // API nativa do Baileys para resolver LID → PN
    const pn = await socket.signalRepository.lidMapping.getPNForLID(lidJid);
    if (pn) {
      identifier = pn.replace(/@.*$/, "");
    } else {
      // Fallback: tentar onWhatsApp
      identifier = lidNumber;
    }
  } catch {
    identifier = lidNumber;
  }
}
```

**3. Remover `lidMaps`** — eliminar toda a infraestrutura manual de mapeamento (o Map, os listeners de `contacts.update` e `messaging-history.set` para mapping) já que a API nativa substitui tudo isso.

**4. Adicionar log completo de debug** para mensagens em tempo real:
```typescript
socket.ev.on("messages.upsert", async ({ messages, type }) => {
  this.logger.info(`messages.upsert: ${messages.length} msgs, type: ${type}`);
  for (const msg of messages) {
    // Log raw keys para debug
    this.logger.info(`MSG RAW: jid=${msg.key.remoteJid}, id=${msg.key.id}, fromMe=${msg.key.fromMe}, keys=${Object.keys(msg.message || {}).join(",")}`);
    await processMessage(msg, type !== "notify");
  }
});
```

---

## Resumo

| Mudança | Motivo |
|---|---|
| Adicionar `shouldIgnoreJid` | Prevenir bloqueio do event loop por status/newsletters |
| Usar `signalRepository.lidMapping.getPNForLID()` | Resolução nativa de LID, comprovada nas docs oficiais |
| Remover `lidMaps` manual | Abordagem manual não funciona, API nativa é mais confiável |
| Adicionar `emitOwnEvents` + `fireInitQueries` | Garantir que todos os eventos sejam emitidos |
| Log detalhado no `messages.upsert` | Visibilidade completa para debug |

