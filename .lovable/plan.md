

## Como o Baileys Recebe Mensagens

### Arquitetura de Eventos

O Baileys funciona como um **cliente WebSocket** que se conecta aos servidores do WhatsApp. Ao conectar, dois fluxos de mensagens acontecem:

```text
┌─────────────────────────────────────────────────┐
│              CONEXÃO ESTABELECIDA                │
│                                                  │
│  1. messaging-history.set  (sync inicial)        │
│     → Dispara N vezes com lotes de mensagens     │
│     → Pode conter milhares de mensagens          │
│     → Processado SEQUENCIALMENTE no código atual │
│                                                  │
│  2. messages.upsert (tempo real)                 │
│     → type: "notify" = mensagem nova             │
│     → type: "append" = mensagem de histórico     │
│     → Deveria disparar para CADA nova mensagem   │
└─────────────────────────────────────────────────┘
```

### O Problema Real: Event Loop Bloqueado

Analisando o código atual e os issues do Baileys (#2363, #2382, #1879), identifiquei a **causa raiz**:

O `messaging-history.set` recebe centenas/milhares de mensagens na conexão. O código atual processa **cada mensagem sequencialmente** com `await`, e cada mensagem faz **4-5 queries ao banco** (dedup check, find contact, find conversation, insert message, update conversation). Exemplo:

```text
messaging-history.set: 500 mensagens
  → Cada msg: 4-5 queries Supabase (~50-100ms cada)
  → Total: 500 × 5 × 75ms = ~3 minutos de processamento
  → Durante esses 3 minutos, o event loop do Node.js está BLOQUEADO
  → messages.upsert (notify) dispara mas os eventos são perdidos/atrasados
```

**É por isso que mensagens só aparecem na conexão** — o history sync funciona, mas enquanto ele processa, o event loop não consegue processar os eventos `messages.upsert` de mensagens novas em tempo real.

### Sobre o LID

O `signalRepository.lidMapping.getPNForLID()` provavelmente não existe na v6.7.17 (é uma API mais recente). Os fallbacks (`participant`, `onWhatsApp`) também podem falhar porque `onWhatsApp` espera um número de telefone real, não um LID.

---

## Solução Proposta

### 1. Não bloquear o event loop com history sync

Processar history sync em **background** sem `await`, para que `messages.upsert` continue funcionando:

```typescript
socket.ev.on("messaging-history.set", async ({ messages, contacts, isLatest }) => {
  this.logger.info(`History sync: ${messages.length} messages`);
  
  // Processar em background SEM bloquear o event loop
  // Usar setTimeout para cada lote, liberando o event loop entre eles
  const BATCH_SIZE = 10;
  const processBatch = async (startIndex: number) => {
    const end = Math.min(startIndex + BATCH_SIZE, messages.length);
    for (let i = startIndex; i < end; i++) {
      await processMessage(messages[i], true);
    }
    if (end < messages.length) {
      // Liberar event loop antes do próximo lote
      setTimeout(() => processBatch(end), 100);
    }
  };
  processBatch(0);  // NÃO usar await aqui
});
```

### 2. Adicionar log explícito no messages.upsert para confirmar se o evento dispara

Adicionar um log **antes** de qualquer processamento para saber se o evento chega:

```typescript
socket.ev.on("messages.upsert", async ({ messages, type }) => {
  this.logger.info(`>>> UPSERT EVENT: ${messages.length} msgs, type=${type}`);
  // ...
});
```

### 3. Para o LID: usar `participant` como fonte primária e `store` como fallback

Em vez de depender de APIs que podem não existir, usar uma abordagem pragmática:
- Mensagens `@lid` em chat privado: verificar `msg.key.participant` primeiro
- Se não disponível: usar `store.contacts` do Baileys (se disponível)
- Último fallback: armazenar com o LID mesmo, mas marcar para resolução posterior

### 4. Adicionar `keepAliveIntervalMs` para evitar timeout durante processamento pesado

```typescript
const socket = makeWASocket({
  // ... existente ...
  keepAliveIntervalMs: 30000,
});
```

---

## Resumo de Alterações

| Arquivo | Alteração |
|---|---|
| `server/src/baileys-manager.ts` | Processar history sync em lotes com `setTimeout` (não-bloqueante) |
| `server/src/baileys-manager.ts` | Adicionar `keepAliveIntervalMs: 30000` |
| `server/src/baileys-manager.ts` | Simplificar resolução LID (participant → pushName → LID raw) |
| `server/src/baileys-manager.ts` | Adicionar logs explícitos no `messages.upsert` |

