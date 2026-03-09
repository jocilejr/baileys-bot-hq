

## Plano: Reestruturar Baileys como transporte puro

### Conceito

O Baileys passa a ser **apenas um gateway** — recebe e envia mensagens via WhatsApp. Toda a lógica de persistência (contatos, conversas, mensagens) fica na rota da API Express (`messages.ts`). O `baileys-manager.ts` emite eventos quando mensagens chegam, e a rota salva no banco.

### Arquitetura nova

```text
WhatsApp ←→ Baileys (transporte) ←→ Express API (persistência) ←→ Supabase DB ←→ Frontend
```

### Mudanças

**1. `server/src/baileys-manager.ts` — simplificar radicalmente**

- Remover import do `makeInMemoryStore` (resolve o erro de build)
- Remover toda a função `processMessage` (~200 linhas) — Baileys não salva mais nada
- Remover helpers `getChatType`, `unwrapMessage` do manager
- Adicionar um sistema de **event emitter** (Node.js `EventEmitter`) para emitir eventos `message.received` com os dados brutos parseados
- O `messages.upsert` e `messages.update` apenas extraem o conteúdo e emitem o evento
- Manter: connection management, QR code, reconnect, sendMessage, creds
- `getMessage` callback retorna `proto.Message.fromObject({})` (fallback simples, sem store)
- Session interface fica apenas `{ socket, instanceId, retryCount }` — sem store

**2. `server/src/index.ts` — registrar listener de eventos**

- Importar o EventEmitter do manager
- Registrar um listener `message.received` que chama a lógica de persistência
- A lógica de persistência (find/create contact, find/create conversation, insert message, update preview) vai para um novo arquivo ou diretamente no index

**3. `server/src/message-handler.ts` — novo arquivo**

- Contém toda a lógica de persistência extraída do `processMessage`:
  - `unwrapMessage` helper
  - `getChatType` helper
  - Resolução de LID
  - Find/create contact
  - Find/create conversation
  - Insert message (com dedup por external_id)
  - Update conversation preview
- Exporta uma função `handleIncomingMessage(supabase, data)` que recebe os dados já parseados

**4. `server/src/routes/messages.ts` — sem mudanças significativas**

- A rota POST `/messages/send` continua igual (Baileys envia, rota salva no DB)

### Estrutura final do `baileys-manager.ts`

```typescript
import { EventEmitter } from "events";

export class BaileysManager extends EventEmitter {
  // emit("message.received", { instanceId, remoteJid, fromMe, content, mediaType, senderName, externalId, timestamp, pushName })
  
  // startSession: connection, QR, reconnect, creds
  // messages.upsert → parse → this.emit("message.received", parsed)
  // messages.update → parse → this.emit("message.received", parsed)
  // sendMessage: sem mudanças
  // stopSession: sem mudanças
}
```

### Arquivos afetados
- `server/src/baileys-manager.ts` — reescrita (remover persistência, adicionar EventEmitter)
- `server/src/message-handler.ts` — novo (lógica de persistência extraída)
- `server/src/index.ts` — registrar listener do EventEmitter

### O que NÃO muda
- Frontend (hooks, componentes) — continua lendo do Supabase via realtime
- Rota de envio (`messages/send`) — continua igual
- Schema do banco — sem alterações
- Rota de instâncias — sem alterações

