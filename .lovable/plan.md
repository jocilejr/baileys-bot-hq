

## Diagnóstico

Os logs mostram que `processMessage` **é chamado** (aparece o log `processMessage: jid=...`), mas as mensagens não chegam ao banco. O problema está na **extração de conteúdo** (linhas 239-253): o Baileys v6 frequentemente encapsula mensagens em wrappers como `ephemeralMessage`, `viewOnceMessage`, etc. Quando isso acontece, `msg.message?.conversation` e todos os campos diretos retornam `undefined`, resultando em `content=""` e `mediaType=null`, e a mensagem é **descartada silenciosamente** na linha 253 (`if (!content && !mediaType) return`).

## Alterações em `server/src/baileys-manager.ts`

### 1. Adicionar função `unwrapMessage` antes de `processMessage`

Função que "desembrulha" recursivamente os wrappers do Baileys v6:
- `ephemeralMessage.message`
- `viewOnceMessage.message`
- `viewOnceMessageV2.message`
- `viewOnceMessageV2Extension.message`
- `documentWithCaptionMessage.message`
- `editedMessage.message`
- `peerDataOperationRequestResponseMessage` (ignorar)

### 2. Usar mensagem desembrulhada na extração de conteúdo

Substituir `msg.message?.conversation` etc. por `unwrapped?.conversation`, onde `unwrapped = unwrapMessage(msg.message)`.

### 3. Adicionar log de debug quando mensagem é descartada

Na linha 253, antes do `return`, adicionar:
```
logger.warn(`Discarding message ${externalId}: no content/media. Keys: ${Object.keys(msg.message || {}).join(', ')}`);
```

Isso permitirá identificar imediatamente se há wrappers não tratados.

### Após deploy

```bash
cd /root/baileys-bot-hq && git pull && cd server && npm run build && pm2 restart zapmanager-api
```

Enviar mensagem de teste e verificar logs com `pm2 logs zapmanager-api --lines 20`.

