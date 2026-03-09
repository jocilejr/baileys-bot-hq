

## Diagnóstico dos Logs

Os logs mostram dois problemas claros:

1. **Primeiro restart**: `"History sync is disabled by config"` — O Baileys v6 requer configuração explícita via `shouldSyncHistoryMessage` callback para habilitar o sync. Apenas `syncFullHistory: true` não é suficiente.

2. **Segundo restart**: `"History sync is enabled, awaiting notification with a 20s timeout"` → `"Timeout in AwaitingInitialSync"` — O sync habilitou mas expirou porque **a sessão já existia** (não é primeira conexão). O histórico completo só é enviado pelo WhatsApp na **primeira conexão** (QR scan). Em reconexões, ele envia apenas mensagens offline pendentes.

3. **Mensagens em tempo real não aparecem**: Os logs mostram apenas erros de decriptação de mensagens de **grupo** (`@g.us`), mas nenhum log de processamento de mensagens privadas. Isso sugere que mensagens privadas novas **não estão chegando** ou estão sendo processadas sem log.

## Plano de Correções

### Arquivo: `server/src/baileys-manager.ts`

**1. Adicionar `shouldSyncHistoryMessage` ao `makeWASocket`** para aceitar notificações de histórico:
```typescript
shouldSyncHistoryMessage: () => true,
```

**2. Adicionar logs de debug** no `messages.upsert` e `messaging-history.set` para diagnosticar se mensagens chegam:
```typescript
// No messages.upsert:
this.logger.info(`messages.upsert: ${messages.length} msgs, type: ${type}`);

// No messaging-history.set (já tem log)
```

**3. Processar também `type !== "notify"`** no `messages.upsert` — mensagens offline pendentes chegam com tipo diferente de `notify`. Mudar o filtro para processar todos os tipos, marcando como histórico quando não é `notify`.

**4. Para forçar sync histórico completo**: O usuário precisará **deletar a sessão** e reconectar via QR:
```bash
rm -rf /root/baileys-bot-hq/server/sessions/25deaef7-bc2e-4d4a-8985-3e1094c25a16
pm2 restart zapmanager-api
```
Depois escanear o QR novamente na interface.

### Resumo das alterações no código:
- Linha ~74: Adicionar `shouldSyncHistoryMessage: () => true` nas opções do socket
- Linha ~304: Remover `if (type !== "notify") return` e adicionar log de debug
- Adicionar logs em pontos estratégicos para rastrear o fluxo de mensagens

