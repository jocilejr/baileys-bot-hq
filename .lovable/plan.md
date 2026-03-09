

## Correção do Loop Infinito do Baileys

### Diagnóstico Confirmado

Os logs mostram claramente o padrão de loop:
```
Session already active, stopping first...  ← startSession chamado
connection closed                          ← stopSession dispara close event
Reconnecting in 2000ms                     ← close event agenda novo startSession
Session already active, stopping first...  ← novo startSession chega, loop reinicia
```

O problema é que `stopSession()` dispara o evento `connection.close`, que agenda outro `startSession()`, criando um loop infinito.

### Solução

#### 1. Backend: Adicionar controle de estado (`server/src/baileys-manager.ts`)

- Adicionar Set `startingInstances` para rastrear sessões em processo de inicialização (mutex)
- Adicionar Map `reconnectTimers` para rastrear e cancelar timers pendentes
- Adicionar flag `intentionalStop` para evitar reconexão quando a sessão foi parada intencionalmente
- Só agendar reconexão se a desconexão não foi intencional

Mudanças específicas:
- Verificar se já está iniciando antes de chamar `startSession`
- Cancelar timer de reconexão pendente ao iniciar nova sessão
- Não disparar reconexão automática quando `stopSession` é chamado explicitamente
- Adicionar logs mais detalhados para debug

#### 2. Frontend: Simplificar UX do QR (`src/pages/Configuracoes.tsx`)

- Remover auto-open do diálogo QR (causa confusão)
- Adicionar estados visuais claros: "Gerando QR...", "QR Pronto", "Conectado"
- Botão "Conectar" para instâncias desconectadas
- Botão "Ver QR" apenas quando QR existe
- Feedback visual de loading durante operações

#### 3. Frontend: Desabilitar botão reconnect enquanto conectando

- Prevenir cliques múltiplos no botão de reconexão
- Desabilitar botão quando status é `connecting` ou `qr_pending`

### Arquivos Modificados
- `server/src/baileys-manager.ts` - Fix do loop infinito com mutex e controle de estado
- `src/pages/Configuracoes.tsx` - UX melhorada com estados claros

### Comando para deploy na VPS após aprovação
```bash
cd /root/baileys-bot-hq/server && npx tsc && pm2 restart zapmanager-api --update-env
cd /root/baileys-bot-hq && npm run build
```

