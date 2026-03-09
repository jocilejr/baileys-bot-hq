

## Implementação: Correções no Pipeline de Mensagens

Três alterações no arquivo `server/src/baileys-manager.ts`:

### 1. `shouldIgnoreJid` null-safe (linha 88)

```typescript
// De:
shouldIgnoreJid: (jid: string) => jid === "status@broadcast" || jid.includes("@newsletter"),

// Para:
shouldIgnoreJid: (jid: string | undefined | null) => !jid || jid === "status@broadcast" || jid.includes("@newsletter"),
```

Previne o `TypeError: Cannot read properties of undefined` que crashava o pipeline de recibos.

### 2. Log level ajustado para mensagens vazias (linhas 248-252)

```typescript
// De:
if (!content && !mediaType) {
  const msgKeys = Object.keys(msg.message || {}).join(", ");
  this.logger.warn(`Discarding message ${msg.key.id}: no content/media. Raw keys: [${msgKeys}]`);
  return;
}

// Para:
if (!content && !mediaType) {
  const msgKeys = Object.keys(msg.message || {}).join(", ");
  this.logger.debug(`Skipping message ${msg.key.id}: awaiting content via update. Raw keys: [${msgKeys}]`);
  return;
}
```

### 3. Adicionar listener `messages.update` (após linha 400, antes do history sync)

```typescript
// Capture decrypted content that arrives after initial empty upsert
socket.ev.on("messages.update", async (updates) => {
  for (const { key, update } of updates) {
    if (!key.remoteJid || !update.message) continue;
    
    this.logger.info(`MSG UPDATE: jid=${key.remoteJid}, id=${key.id}, hasMessage=${!!update.message}, keys=${Object.keys(update.message || {}).join(",")}`);
    
    const fullMsg: proto.IWebMessageInfo = {
      key,
      message: update.message,
      messageTimestamp: update.messageTimestamp || Math.floor(Date.now() / 1000),
      pushName: update.pushName || undefined,
    };
    
    await processMessage(fullMsg, false);
  }
});
```

Este listener captura o conteúdo decriptado que chega na segunda fase, após o `messages.upsert` inicial vazio.

